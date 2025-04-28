"use client";

import { MessageSquare, Star, MoreHorizontal } from 'lucide-react';

type ReviewProps = {
  reviewer: string;
  date: string;
  rating: number;
  comment: string;
  sentiment: 'positive' | 'negative' | 'neutral';
};

const Review = ({ reviewer, date, rating, comment, sentiment }: ReviewProps) => {
  const sentimentColor = 
    sentiment === 'positive' ? 'bg-green-100 text-green-800' :
    sentiment === 'negative' ? 'bg-red-100 text-red-800' : 
    'bg-gray-100 text-gray-800';
  
  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-medium text-[#1F2937]">{reviewer}</div>
          <div className="text-gray-500 text-xs">{date}</div>
        </div>
        <div className="flex items-center">
          <div className="flex mr-3">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-3.5 w-3.5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
              />
            ))}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${sentimentColor}`}>
            {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
          </span>
        </div>
      </div>
      <p className="text-gray-700 text-sm">{comment}</p>
    </div>
  );
};

export default function RecentReviews() {
  const reviews = [
    {
      reviewer: "Sarah T.",
      date: "Oct 12, 2023",
      rating: 5,
      comment: "Amazing product! The flavor is perfect and I love how it mixes so easily. Will definitely purchase again.",
      sentiment: "positive"
    },
    {
      reviewer: "Mike D.",
      date: "Oct 10, 2023",
      rating: 2,
      comment: "The can arrived dented and the powder was clumped together. Taste is okay but not worth the premium price.",
      sentiment: "negative"
    },
    {
      reviewer: "Jennifer K.",
      date: "Oct 8, 2023",
      rating: 4,
      comment: "Good product overall. I enjoy the taste but wish there were more flavor options available.",
      sentiment: "neutral"
    }
  ] as const;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1F2937]">
          <MessageSquare className="inline-block text-[#2DD4BF] mr-2 h-5 w-5" />
          Recent Reviews
        </h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <Review
            key={index}
            reviewer={review.reviewer}
            date={review.date}
            rating={review.rating}
            comment={review.comment}
            sentiment={review.sentiment}
          />
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <button className="text-[#2DD4BF] hover:text-[#0D9488] text-sm font-medium">
          View All Reviews
        </button>
      </div>
    </div>
  );
} 