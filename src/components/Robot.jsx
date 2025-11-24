import React from 'react';
import './Robot.css';

const Robot = ({ mode = 'idle' }) => {
  // mode: 'idle', 'thinking', 'success', 'speaking'
  
  return (
    <div className={`robot-container ${mode}`}>
      <div className="robot-body">
        <div className="robot-head">
          <div className="robot-antenna">
            <div className="antenna-ball"></div>
          </div>
          <div className="robot-face">
            <div className="robot-eyes">
              <div className="eye left"></div>
              <div className="eye right"></div>
            </div>
            <div className="robot-mouth">
              {mode === 'speaking' && (
                <div className="speaking-wave">
                  <span></span><span></span><span></span><span></span>
                </div>
              )}
            </div>
          </div>
          <div className="robot-ears">
            <div className="ear left"></div>
            <div className="ear right"></div>
          </div>
        </div>
        
        <div className="robot-torso">
          <div className="robot-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="robot-arms">
          <div className="arm left"></div>
          <div className="arm right"></div>
        </div>

        {/* Book Element - Visible only in 'thinking' mode */}
        <div className="robot-book">
          <div className="book-cover"></div>
          <div className="book-pages"></div>
          <div className="book-page-flip"></div> {/* New page flip element */}
        </div>
      </div>

      <div className="robot-shadow"></div>
      
      {/* Success Bubble - Visible only in 'success' mode */}
      <div className="success-bubble">
        <span>Buldum!</span>
      </div>
    </div>
  );
};

export default Robot;
