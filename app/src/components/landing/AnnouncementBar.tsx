"use client";

import React, { useState } from "react";

const AnnouncementBar: React.FC = () => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="bg-[#1E3A8A] text-white py-3 px-4 text-center relative">
      <p className="text-sm md:text-base">
        Get 20% off your first month with code <span className="font-bold">WELCOME20</span>
        <span className="underline ml-1 font-medium cursor-pointer">Start now &rsaquo;</span>
      </p>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2"
        aria-label="Close announcement"
        onClick={() => setVisible(false)}
      >
        <span className="text-white text-xl">&times;</span>
      </button>
    </div>
  );
};

export default AnnouncementBar; 