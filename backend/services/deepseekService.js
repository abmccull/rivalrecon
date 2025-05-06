const axios = require('axios');
const logger = require('../utils/logger');

/**
 * DeepSeek API service for analyzing product reviews
 * Handles communication with DeepSeek AI API using secure credentials
 */
class DeepSeekService {
  /**
   * Initialize the DeepSeek service
   * @param {string} apiKey - DeepSeek API key from environment variables
   */
  constructor(apiKey) {
    if (!apiKey) {
      const error = 'DeepSeek API key not provided. Check environment variables.';
      logger.error(error);
      throw new Error(error);
    }
    
    // Store API key securely and validate format
    this.apiKey = apiKey;
    
    // Set API base URL from environment or use default
    this.baseUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
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

    return `You are an AI assistant tasked with analyzing product reviews to generate structured insights for RivalRecon, a competitive intelligence platform. Your goal is to process the following ${reviewCount} product reviews, aggregate the data, and extract meaningful insights that drive actionable intelligence.

Product Overview:
- Product Name: ${metadata.product_name}
- Brand: ${metadata.brand || 'Unknown Brand'}
- Category: ${metadata.category || 'Unknown'}
- ASIN/Product ID: ${metadata.asin || 'N/A'}
- Average Rating: ${averageRating} (from ${reviewCount} reviews)
- Product Type: ${metadata.is_competitor_product ? 'Competitor Product' : 'Own Product'}

Reviews:
${reviewTexts}

Please provide a complete analysis with ALL fields formatted EXACTLY as specified below. This is CRITICAL for our database structure and frontend display.

## REQUIRED OUTPUT FORMAT

### Essential Fields (MUST be included with proper formatting)

1. rating_distribution: JSON object with star ratings as keys and exact review counts as values
   Format: {"1": n, "2": n, "3": n, "4": n, "5": n}
   IMPORTANT: Use simple numeric keys ("1", "2", etc.) NOT "1_star" or other formats

2. review_count: Integer representing total number of reviews analyzed
   Format: 75
   IMPORTANT: Must equal the sum of values in rating_distribution

3. average_rating: Decimal number (to 1 decimal place) representing average rating
   Format: 4.2
   IMPORTANT: Calculate as (sum of all star ratings) / review_count

4. sentiment_score: Decimal between 0-1, with 1 being most positive
   Format: 0.82
   IMPORTANT: Compute based on review text sentiment and star distribution

### Content Analysis Fields

5. top_positives: JSON array of strongest positive points, ordered by frequency/importance
   Format: ["Excellent hydration benefits", "Great taste", "Convenient packaging"]

6. top_negatives: JSON array of most mentioned complaints/issues
   Format: ["Dissolves slowly", "Expensive for quantity", "Inconsistent flavor"]

7. word_map: JSON object with keywords and their frequency counts
   Format: {"hydration": 45, "flavor": 30, "price": 25}

8. trending: Brief summary of rating patterns and key issues
   Format: "Ratings improved in recent months with better feedback on taste and packaging."

9. opportunities: JSON array of actionable improvement suggestions
   Format: ["Improve dissolution speed", "Offer bulk discounts", "Enhance flavor"]

10. competitive_insights: JSON array of comparisons to competitors
    Format: ["Users prefer our hydration benefits over Brand X", "Competitor Y has better pricing"]

11. key_themes: JSON array of main topics discussed in reviews
    Format: ["hydration", "flavor", "price", "packaging"]

12. display_name: Concise product title under 100 characters
    Format: "Nuun Electrolyte Tablets - Hydration Supplements"

## CRITICAL FORMAT REQUIREMENTS

1. ALL numeric fields must be native numbers, not strings
2. ALL JSON fields must use valid JSON syntax with double quotes for keys and string values
3. rating_distribution MUST use the format {"1": n, "2": n, "3": n, "4": n, "5": n} with simple numeric keys
4. review_count MUST match the sum of all values in rating_distribution
5. Include ALL fields in your response, even with minimal data (empty arrays, zeros) if necessary
6. Do not omit any fields or change their names/formats

The complete response should be a valid JSON object matching this structure:
{
  "display_name": string,                  // Concise product title under 100 chars
  "sentiment_score": number,               // Overall sentiment (0-1 scale)
  "word_map": object,                      // Keywords with frequency counts
  "top_positives": string[],               // Array of positive aspects
  "top_negatives": string[],               // Array of negative aspects
  "trending": string,                      // Brief trend summary
  "opportunities": string[],               // Improvement suggestions
  "competitive_insights": string[],        // Competitor comparisons
  "key_themes": string[],                  // Main topics discussed
  "review_count": number,                  // EXACT total reviews analyzed
  "average_rating": number,                // Average star rating (1 decimal)
  "rating_distribution": {                 // Distribution of star ratings
    "1": number,                           // Count of 1-star reviews
    "2": number,                           // Count of 2-star reviews
    "3": number,                           // Count of 3-star reviews
    "4": number,                           // Count of 4-star reviews
    "5": number                            // Count of 5-star reviews
  }
}`;
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
      'word_map',
      'key_themes',
      'key_insights',
      'improvement_opportunities',
      'top_positives',
      'top_negatives',
      'rating_distribution',
      'review_count',
      'average_rating'
    ];
    
    // Check for required fields
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        throw new Error(`Required field "${field}" missing from API response`);
      }
    }
    
    // Validate and format insight fields to ensure they're proper arrays of strings
    // These fields are critical for both report pages and dashboard insights
    const insightFields = ['top_positives', 'top_negatives', 'key_insights', 'improvement_opportunities'];
    
    insightFields.forEach(field => {
      // Check if field exists but is not in the right format
      if (data[field] !== undefined) {
        // If it's a JSON string, parse it
        if (typeof data[field] === 'string') {
          try {
            data[field] = JSON.parse(data[field]);
          } catch (error) {
            // If parsing fails, wrap the string in an array
            data[field] = [data[field]];
            console.log(`Converted string ${field} to array:`, data[field]);
          }
        }
        
        // If it's not an array at this point, convert it to one
        if (!Array.isArray(data[field])) {
          // Special handling for objects - use values or convert to array of strings
          if (typeof data[field] === 'object' && data[field] !== null) {
            data[field] = Object.values(data[field]);
          } else {
            data[field] = [String(data[field])];
          }
          console.log(`Converted non-array ${field} to array:`, data[field]);
        }
        
        // Ensure each item in the array is a string
        data[field] = data[field].map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            // If it's an object with a text/content property, use that
            if (item.text) return item.text;
            if (item.content) return item.content;
            // Otherwise stringify it
            return JSON.stringify(item);
          }
          return String(item);
        });
        
        // Trim the array to a reasonable size
        const maxItems = 15;
        if (data[field].length > maxItems) {
          data[field] = data[field].slice(0, maxItems);
        }
        
        // Log sample of the processed field for debugging
        console.log(`Processed ${field} (first item):`, 
          data[field].length > 0 ? data[field][0] : 'No items');
      }
    });
    
    // Validate rating_distribution format
    if (data.rating_distribution) {
      // Convert 1_star format to simple numeric keys if needed
      const newDistribution = {};
      const originalKeys = Object.keys(data.rating_distribution);
      
      originalKeys.forEach(key => {
        // Extract the numeric part if key is in format like '1_star'
        const numericKey = key.match(/^(\d+)/) ? key.match(/^(\d+)/)[1] : key;
        // Use the numericKey (1, 2, etc.) as the new key
        newDistribution[numericKey] = data.rating_distribution[key];
      });
      
      data.rating_distribution = newDistribution;
      console.log('Processed rating_distribution:', data.rating_distribution);
    }
    
    // Ensure review_count is a number
    if (data.review_count !== undefined) {
      data.review_count = Number(data.review_count);
      // Verify it's not NaN
      if (isNaN(data.review_count)) data.review_count = 0;
    }
    
    // Ensure average_rating is a number with one decimal
    if (data.average_rating !== undefined) {
      data.average_rating = Number(parseFloat(data.average_rating).toFixed(1));
      // Verify it's not NaN
      if (isNaN(data.average_rating)) data.average_rating = 0.0;
    }
    
    // Handle word_map format - ensure it's an object with string keys and number values
    if (typeof data.word_map === 'object' && data.word_map !== null) {
      const formattedWordMap = {};
      Object.entries(data.word_map).forEach(([key, value]) => {
        formattedWordMap[String(key)] = Number(value) || 0;
      });
      data.word_map = formattedWordMap;
    }
    
    // Truncate other large arrays to avoid database size issues
    if (data.keywords && data.keywords.length > 100) {
      data.keywords = data.keywords.slice(0, 100);
    }
    
    if (data.product_features && data.product_features.length > 30) {
      data.product_features = data.product_features.slice(0, 30);
    }
    
    if (data.review_text_sample && data.review_text_sample.length > 10) {
      data.review_text_sample = data.review_text_sample.slice(0, 10);
    }
    
    // Handle legacy fields for backward compatibility
    if (!data.average_rating && data.average_score) {
      data.average_rating = data.average_score;
    }
    
    // Log overall processing results for key fields
    console.log('DeepSeek response processed successfully');
    console.log('Fields processed: top_positives, top_negatives, key_insights, rating_distribution, etc.');
    
    return data;
  }
}

module.exports = DeepSeekService; 