import React from "react";
import Image from "next/image";
import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex text-[#2DD4BF]">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 fill-current" />
      ))}
      {halfStar && <StarHalf key="half" className="w-4 h-4 fill-current" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" /> // Or use an empty star icon
      ))}
    </div>
  );
};

interface TestimonialCardProps {
  name: string;
  title: string;
  imageUrl: string;
  quote: string;
  rating: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ name, title, imageUrl, quote, rating }) => (
  <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
    <div className="flex items-center mb-4">
      <Image
        src={imageUrl}
        alt={name}
        width={56} // w-14
        height={56} // h-14
        className="rounded-full mr-4"
      />
      <div>
        <h4 className="font-bold text-[#1F2937]">{name}</h4>
        <p className="text-gray-600 text-sm">{title}</p>
      </div>
    </div>
    <p className="text-gray-700 italic mb-4">{quote}</p>
    <StarRating rating={rating} />
  </div>
);

const Testimonials: React.FC = () => {
  const testimonialsData = [
    {
      name: "Michael Thompson",
      title: "Product Manager, NatureSnacks",
      imageUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
      quote: "RivalRecon has completely changed how we approach product development. We identified a major gap in our competitor's offering... and launched a new product line that's now our best seller.",
      rating: 5,
    },
    {
      name: "Sarah Jensen",
      title: "Marketing Director, PureHydrate",
      imageUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",
      quote: "The insights we get from RivalRecon have informed our entire marketing strategy... it's significantly improved our conversion rates.",
      rating: 4.5,
    },
    {
      name: "David Chen",
      title: "CEO, OrganicEssentials",
      imageUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg",
      quote: "As a smaller brand competing with industry giants, RivalRecon has been our secret weapon... We've been able to capitalize on niche opportunities.",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="bg-[#F7FAFC] py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[#2DD4BF] font-medium">TESTIMONIALS</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1F2937] mt-2 mb-4">What Our Customers Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from CPG professionals who have transformed their competitive strategy with RivalRecon.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsData.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 