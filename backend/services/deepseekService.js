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
              content: "You are an expert in analyzing product reviews and providing competitive insights."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
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

    return `Analyze the following product reviews for ${metadata.product_name} by ${metadata.brand} in the ${metadata.category} category.

Reviews:
${reviewTexts}

Please provide a comprehensive analysis including:
1. Overall sentiment analysis (score between 0 and 1)
2. Key themes and topics mentioned in reviews
3. Top positive aspects of the product
4. Top negative aspects or areas for improvement
5. Word frequency analysis for significant terms
6. Competitive insights based on mentions of other brands/products
7. Opportunities for improvement
8. Ratings trend analysis over time

Format the response as a JSON object with the following structure:
{
  "sentiment_score": number,
  "key_themes": string[],
  "top_positives": string[],
  "top_negatives": string[],
  "word_map": Object,
  "competitive_insights": string[],
  "opportunities": string[],
  "ratings_over_time": Object,
  "trending": string
}`;
  }

  /**
   * Process and structure the DeepSeek API response
   * @param {Object} responseData - Raw API response
   * @returns {Object} Structured analysis data
   */
  processResponse(responseData) {
    try {
      // Extract the JSON string from the response content
      let content = responseData.choices[0].message.content;
      
      // Remove markdown formatting if present
      if (content.includes('```json')) {
        content = content.replace(/```json\n|\n```/g, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\n|\n```/g, '');
      }
      
      // Parse the JSON string into an object
      const analysis = JSON.parse(content.trim());

      // Validate required fields
      const requiredFields = [
        'sentiment_score',
        'key_themes',
        'top_positives',
        'top_negatives',
        'word_map',
        'competitive_insights',
        'opportunities',
        'ratings_over_time',
        'trending'
      ];

      for (const field of requiredFields) {
        if (!analysis[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return analysis;
    } catch (error) {
      logger.error('Error processing DeepSeek response:', error);
      throw new Error(`Failed to process DeepSeek response: ${error.message}`);
    }
  }
}

module.exports = DeepSeekService; 