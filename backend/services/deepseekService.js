const axios = require('axios');
const logger = require('../utils/logger');

class DeepSeekService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.deepseek.com/v1';  // Replace with actual DeepSeek API URL
  }

  /**
   * Analyze reviews using DeepSeek API
   * @param {Array} reviews - Array of review objects
   * @param {Object} metadata - Product metadata
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeReviews(reviews, metadata) {
    try {
      logger.info(`Starting DeepSeek analysis for ${reviews.length} reviews`);

      // Prepare the prompt with review data and context
      const prompt = this.constructPrompt(reviews, metadata);

      // Make API call to DeepSeek
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are an expert in analyzing product reviews and providing detailed insights about customer sentiment, product features, and improvement opportunities."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Process and structure the response
      const analysis = this.processResponse(response.data);
      logger.info('DeepSeek analysis completed successfully');
      
      return analysis;
    } catch (error) {
      logger.error('Error in DeepSeek analysis:', error);
      throw new Error(`DeepSeek analysis failed: ${error.message}`);
    }
  }

  /**
   * Construct the prompt for DeepSeek API
   * @param {Array} reviews - Array of review objects
   * @param {Object} metadata - Product metadata
   * @returns {string} Constructed prompt
   */
  constructPrompt(reviews, metadata) {
    const reviewTexts = reviews.map(review => 
      `Rating: ${review.review_rating}\nDate: ${review.review_date}\nText: ${review.review_text}`
    ).join('\n\n');

    const reviewCount = reviews.length;
    const ratings = reviews.map(review => parseFloat(review.review_rating) || 0);
    const averageRating = (ratings.reduce((sum, rating) => sum + rating, 0) / reviewCount).toFixed(1);

    return `Analyze the following ${reviewCount} product reviews for "${metadata.product_name}" by ${metadata.brand || 'Unknown Brand'} in the ${metadata.category || 'Unknown'} category.

Product Overview:
- Product Name: ${metadata.product_name}
- Brand: ${metadata.brand || 'Unknown Brand'}
- Category: ${metadata.category || 'Unknown'}
- ASIN/Product ID: ${metadata.asin || 'N/A'}
- Average Rating: ${averageRating} (from ${reviewCount} reviews)
- Product Type: ${metadata.is_competitor_product ? 'Competitor Product' : 'Own Product'}

Reviews:
${reviewTexts}

Please provide a comprehensive analysis including:

1. Overall review metrics and sentiment breakdown
2. Key themes and topics mentioned in reviews
3. Keywords with their frequency and sentiment
4. Product features mentioned with sentiment breakdown
5. Trends in ratings and sentiment over time
6. Representative review examples for each sentiment category
7. Key insights derived from reviews
8. Specific improvement opportunities based on review feedback
9. A concise, readable display name for the product (maximum 5 words)
${metadata.is_competitor_product ? '10. Competitive analysis comparing this product to our own offerings' : ''}

The display name should be a simplified version of the product name that captures the essence of what the product is. Remove any unnecessary words like "premium", "authentic", "professional" etc. Avoid including brand names, sizes, counts, or measurements in the display name.

Format the response as a JSON object with the following structure:
{
  "display_name": string,                     // A concise, readable product name (max 5 words)
  "sentiment_score": number,                  // Overall sentiment score (0-100 scale)
  "sentiment_distribution": {                 // Percentage breakdown of sentiment
    "positive": number,                       // Percentage of positive sentiment (0-100)
    "neutral": number,                        // Percentage of neutral sentiment (0-100)
    "negative": number                        // Percentage of negative sentiment (0-100)
  },
  "keywords": [                               // Array of important keywords from reviews
    {
      "text": string,                         // Keyword text
      "value": number,                        // Frequency or importance value
      "sentiment": "positive"|"neutral"|"negative" // Sentiment association
    }
  ],
  "product_features": [                       // Product features mentioned in reviews
    {
      "feature": string,                      // Feature name
      "mention_count": number,                // How often feature is mentioned
      "positive_count": number,               // Count of positive mentions
      "negative_count": number,               // Count of negative mentions
      "neutral_count": number                 // Count of neutral mentions
    }
  ],
  "ratings_over_time": [                      // Time series data (group by month)
    {
      "date": string,                         // Format: YYYY-MM-DD
      "average_rating": number,               // Average rating for period
      "review_count": number,                 // Number of reviews in period
      "sentiment_positive": number,           // Percentage of positive reviews
      "sentiment_neutral": number,            // Percentage of neutral reviews
      "sentiment_negative": number            // Percentage of negative reviews
    }
  ],
  "rating_distribution": {                    // Distribution of star ratings
    "1_star": number,                         // Count of 1-star reviews
    "2_star": number,                         // Count of 2-star reviews
    "3_star": number,                         // Count of 3-star reviews
    "4_star": number,                         // Count of 4-star reviews
    "5_star": number                          // Count of 5-star reviews
  },
  "key_insights": string[],                   // Array of key insights from reviews
  "improvement_opportunities": string[],      // Array of specific improvement suggestions
  "review_text_sample": string[],             // Representative review excerpts (5-8)
  "top_positives": string[],                  // Top positive aspects mentioned
  "top_negatives": string[],                  // Top negative aspects mentioned
  ${metadata.is_competitor_product ? '"competitive_advantages": string[], // Advantages compared to our products\n  "competitive_disadvantages": string[], // Disadvantages compared to our products' : ''}
}

IMPORTANT: Every field in the above structure is required. Do not omit any fields. If there is not enough data to populate a field, use minimal valid values (empty arrays for arrays, 0 for numbers, empty objects for objects) but include all fields.`;
  }

  /**
   * Process the API response and validate its structure
   * @param {Object} response - The API response object
   * @returns {Object} - Processed data
   */
  processResponse(response) {
    // Check if the response content is a valid JSON string
    let data;
    let jsonData = response.data;
    
    if (typeof jsonData === 'string') {
      try {
        data = JSON.parse(jsonData);
      } catch (error) {
        console.error("Failed to parse JSON from API response:", error);
        throw new Error("Invalid JSON response from API");
      }
    } else if (typeof jsonData === 'object') {
      data = jsonData;
    } else {
      throw new Error("Unexpected response format");
    }
    
    // Define required fields - these must be present or we throw an error
    const requiredFields = [
      'display_name',
      'sentiment_score',
      'sentiment_distribution',
      'keywords',
      'product_features',
      'key_insights',
      'improvement_opportunities',
      'review_text_sample',
      'top_positives',
      'top_negatives'
    ];
    
    // Check for required fields
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        throw new Error(`Required field "${field}" missing from API response`);
      }
    }
    
    // Truncate large arrays to avoid database size issues
    if (data.keywords && data.keywords.length > 100) {
      data.keywords = data.keywords.slice(0, 100);
    }
    
    if (data.product_features && data.product_features.length > 30) {
      data.product_features = data.product_features.slice(0, 30);
    }
    
    if (data.key_insights && data.key_insights.length > 15) {
      data.key_insights = data.key_insights.slice(0, 15);
    }
    
    if (data.improvement_opportunities && data.improvement_opportunities.length > 15) {
      data.improvement_opportunities = data.improvement_opportunities.slice(0, 15);
    }
    
    if (data.review_text_sample && data.review_text_sample.length > 10) {
      data.review_text_sample = data.review_text_sample.slice(0, 10);
    }
    
    // Handle legacy fields for backward compatibility
    if (!data.average_rating && data.average_score) {
      data.average_rating = data.average_score;
    }
    
    return data;
  }
}

module.exports = DeepSeekService; 