import React from 'react';

const GlassCard = ({ children, className = "", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white/70 
        backdrop-blur-md 
        border border-white/40 
        shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] 
        rounded-3xl 
        p-6 
        transition-all 
        duration-300 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;