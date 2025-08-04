import React from 'react';
import { Button } from "@/components/ui/button";
import { Quote } from 'lucide-react';

interface FeedbackButtonProps {
  onClick: () => void;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      className="w-full bg-[#643ae5] hover:bg-[#7a4fff] text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 border-none"
      aria-label="Give Feedback"
    >
      <Quote size={20} />
      <span>Give Testimonial</span>
    </Button>
  );
};

export default FeedbackButton; 