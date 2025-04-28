/**
 * Mock data generator for analysis visualizations
 * This helps with development and testing of the analysis dashboard
 * In production, this would be replaced with data from the Supabase backend
 */

export interface SentimentTrendDataPoint {
  name: string;
  positive: number;
  neutral: number;
  negative: number;
  overall: number;
  [key: string]: number | string;
}

export interface FeatureComparisonDataPoint {
  name: string;
  value: number;
  comparison: number;
  difference: number;
}

export interface KeywordDataPoint {
  text: string;
  value: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ReviewData {
  id: string;
  reviewer: {
    name: string;
    initials: string;
    avatarColor: string;
  };
  date: string;
  rating: number;
  text: string;
  tags: {
    text: string;
    type: 'positive' | 'negative' | 'neutral';
  }[];
}

// Generate mock sentiment trend data (weekly for 6 months)
export function generateSentimentTrendData(): SentimentTrendDataPoint[] {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 
                'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12',
                'Week 13', 'Week 14', 'Week 15', 'Week 16', 'Week 17', 'Week 18',
                'Week 19', 'Week 20', 'Week 21', 'Week 22', 'Week 23', 'Week 24'];
  
  // Start with base values
  let positive = 60;
  let neutral = 25;
  let negative = 15;
  
  return weeks.map(week => {
    // Simulate some variance in the trend
    positive += Math.floor(Math.random() * 5) - 2;
    neutral += Math.floor(Math.random() * 3) - 1;
    negative += Math.floor(Math.random() * 3) - 1;
    
    // Ensure values stay in reasonable ranges
    positive = Math.max(40, Math.min(75, positive));
    neutral = Math.max(15, Math.min(35, neutral));
    negative = Math.max(5, Math.min(25, negative));
    
    // Ensure they sum to 100
    const total = positive + neutral + negative;
    positive = Math.round((positive / total) * 100);
    neutral = Math.round((neutral / total) * 100);
    negative = 100 - positive - neutral;
    
    // Overall score is a weighted calculation
    const overall = Math.round((positive * 1 + neutral * 0.5) / (positive + neutral + negative) * 10);
    
    return {
      name: week,
      positive,
      neutral,
      negative,
      overall: overall
    };
  });
}

// Generate feature comparison data
export function generateFeatureComparisonData(): FeatureComparisonDataPoint[] {
  const features = [
    { name: 'Taste', value: 8.7, comparison: 7.4 },
    { name: 'Energy Effect', value: 8.2, comparison: 8.5 },
    { name: 'Ingredient Quality', value: 9.3, comparison: 7.1 },
    { name: 'Value for Money', value: 6.4, comparison: 7.8 },
    { name: 'Packaging', value: 7.1, comparison: 7.9 },
    { name: 'Side Effects', value: 8.9, comparison: 7.2 }
  ];
  
  return features.map(feature => {
    return {
      name: feature.name,
      value: feature.value,
      comparison: feature.comparison,
      difference: Math.round((feature.value - feature.comparison) * 10) / 10
    };
  });
}

// Generate keyword data for word cloud
export function generateKeywordData(): KeywordDataPoint[] {
  return [
    { text: 'natural', value: 64, sentiment: 'positive' },
    { text: 'energy', value: 57, sentiment: 'positive' },
    { text: 'clean', value: 49, sentiment: 'positive' },
    { text: 'taste', value: 42, sentiment: 'positive' },
    { text: 'refreshing', value: 38, sentiment: 'positive' },
    { text: 'ingredients', value: 35, sentiment: 'positive' },
    { text: 'boost', value: 32, sentiment: 'positive' },
    { text: 'healthy', value: 30, sentiment: 'positive' },
    { text: 'focus', value: 28, sentiment: 'positive' },
    { text: 'sustained', value: 27, sentiment: 'positive' },
    { text: 'organic', value: 26, sentiment: 'positive' },
    { text: 'vitamins', value: 24, sentiment: 'positive' },
    { text: 'smooth', value: 23, sentiment: 'positive' },
    { text: 'no-crash', value: 22, sentiment: 'positive' },
    { text: 'delicious', value: 21, sentiment: 'positive' },
    { text: 'expensive', value: 45, sentiment: 'negative' },
    { text: 'price', value: 42, sentiment: 'negative' },
    { text: 'dented', value: 28, sentiment: 'negative' },
    { text: 'packaging', value: 26, sentiment: 'negative' },
    { text: 'shipping', value: 22, sentiment: 'negative' },
    { text: 'flavors', value: 34, sentiment: 'neutral' },
    { text: 'varieties', value: 26, sentiment: 'neutral' }
  ];
}

// Generate recent review data
export function generateReviewData(): ReviewData[] {
  return [
    {
      id: '1',
      reviewer: {
        name: 'John D.',
        initials: 'JD',
        avatarColor: 'bg-blue-100 text-blue-600'
      },
      date: 'April 18, 2025',
      rating: 5,
      text: '"Love this energy drink! The natural ingredients give me a clean boost without the jitters I get from other brands. Great taste too - not too sweet. Only downside is the price, but quality costs more I guess."',
      tags: [
        { text: 'Natural', type: 'positive' },
        { text: 'Clean Energy', type: 'positive' },
        { text: 'Price', type: 'negative' }
      ]
    },
    {
      id: '2',
      reviewer: {
        name: 'Sarah M.',
        initials: 'SM',
        avatarColor: 'bg-pink-100 text-pink-600'
      },
      date: 'April 15, 2025',
      rating: 4,
      text: '"This has become my go-to energy drink for workouts. The sustained energy is fantastic and I love that it\'s made with natural ingredients. Would like to see more flavor options though!"',
      tags: [
        { text: 'Workouts', type: 'positive' },
        { text: 'Sustained Energy', type: 'positive' },
        { text: 'Flavor Options', type: 'neutral' }
      ]
    },
    {
      id: '3',
      reviewer: {
        name: 'Robert B.',
        initials: 'RB',
        avatarColor: 'bg-gray-100 text-gray-600'
      },
      date: 'April 12, 2025',
      rating: 3,
      text: '"Decent product but way overpriced for what you get. Also, several cans in my last shipment arrived dented. The taste is good and I appreciate the natural ingredients, but they need to work on their packaging."',
      tags: [
        { text: 'Price', type: 'negative' },
        { text: 'Packaging', type: 'negative' },
        { text: 'Taste', type: 'positive' }
      ]
    }
  ];
}
