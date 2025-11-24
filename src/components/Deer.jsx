import React, { useState, useEffect } from 'react';
import './Deer.css';

const Deer = () => {
  const [position, setPosition] = useState({ x: 10, y: 10 }); // Start at top left
  const [direction, setDirection] = useState('right'); // 'left' or 'right'
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      wander();
    }, 4000); // Move every 4 seconds

    return () => clearInterval(moveInterval);
  }, [position]);

  const wander = () => {
    setIsMoving(true);
    
    // Wander strictly within top 25% of the container
    // Keep X between 5% and 95%
    const newX = Math.random() * 90 + 5; 
    // Keep Y between 2% and 25% (Top area only)
    const newY = Math.random() * 23 + 2;  

    setDirection(newX > position.x ? 'right' : 'left');
    setPosition({ x: newX, y: newY });

    // Stop "moving" animation after transition (approx 2s)
    setTimeout(() => {
      setIsMoving(false);
    }, 2000);
  };

  return (
    <div 
      className={`deer-container ${isMoving ? 'moving' : ''}`}
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scaleX(${direction === 'right' ? 1 : -1})`
      }}
    >
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <path d="M30 60 Q40 55 60 55 Q75 55 80 65 L80 85 L75 85 L75 70 L65 70 L65 85 L60 85 L60 70 L40 70 L40 85 L35 85 L35 65 Q30 65 30 60 Z" fill="currentColor" />
        {/* Neck & Head */}
        <path d="M60 55 Q65 40 60 30 Q55 25 65 20 Q70 18 75 22 Q78 25 75 30 Q72 35 65 35 L65 55" fill="currentColor" />
        {/* Antlers */}
        <path d="M65 20 L60 5 M60 15 L55 10 M65 20 L75 5 M70 15 L80 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Tail */}
        <path d="M30 60 Q25 55 30 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        {/* Eye */}
        <circle cx="68" cy="25" r="1.5" fill="white" />
      </svg>
    </div>
  );
};

export default Deer;
