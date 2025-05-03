import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const LoadingAnimation = ({ 
  type = 'default', 
  text = 'Loading...', 
  progress = null,
  message = '',
  stage = '',
  onCancel = null
}) => {
  const { isDarkMode } = useAppContext();
  const [progressValue, setProgressValue] = useState(progress || 0);
  
  // Simulate progress if not provided explicitly
  useEffect(() => {
    let interval;
    
    if (progress === null && type !== 'quick') {
      interval = setInterval(() => {
        setProgressValue(prev => {
          const increment = Math.random() * 2;
          const newValue = prev + increment;
          return newValue > 95 ? 95 : newValue;
        });
      }, 800);
    } else if (progress !== null) {
      setProgressValue(progress);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [progress, type]);
  
  // Loading messages to display randomly
  const loadingMessages = {
    image: [
      "Analyzing visual elements...",
      "Identifying text in your image...",
      "Processing image data...",
      "Extracting information from your image..."
    ],
    questions: [
      "Finding questions in the text...",
      "Identifying key questions...",
      "Processing text for questions...",
      "Extracting questions from content..."
    ],
    answers: [
      "Generating thoughtful answers...",
      "Researching the best response...",
      "Creating comprehensive answers...",
      "Processing answer for your question..."
    ],
    default: [
      "Just a moment please...",
      "Almost there...",
      "Working on it...",
      "Processing your request..."
    ]
  };

  // Get random message based on type
  const getRandomMessage = () => {
    const messageType = type in loadingMessages ? type : 'default';
    const messages = loadingMessages[messageType];
    return message || messages[Math.floor(Math.random() * messages.length)];
  };
  
  const renderCirclesAnimation = () => {
    return (
      <div className="loading-icon">
        <div className="loading-circle loading-circle-outer"></div>
        <div className="loading-circle loading-circle-middle"></div>
        <div className="loading-circle loading-circle-inner"></div>
      </div>
    );
  };
  
  const renderAnimation = () => {
    switch (type) {
      case 'pulse':
        return (
          <div className="pulse-loader">
            <div className="pulse-dot"></div>
            <div className="pulse-dot"></div>
            <div className="pulse-dot"></div>
          </div>
        );
        
      case 'spinner':
        return (
          <div className="spinner-loader">
            <div className="spinner"></div>
          </div>
        );
        
      case 'thinking':
        return (
          <div className="thinking-loader">
            <div className="thinking-icon">
              <i className="fas fa-brain"></i>
            </div>
            <div className="thinking-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        );
        
      case 'quick':
        return null;
        
      default:
        return renderCirclesAnimation();
    }
  };
  
  return (
    <div className={`loading-animation ${isDarkMode ? 'dark' : ''}`}>
      {renderAnimation()}
      {text && <p className="loading-text">{text}</p>}
      
      {type !== 'quick' && (
        <>
          <p className="loading-message">{getRandomMessage()}</p>
          
          <div className="loading-progress-container">
            <div className="loading-progress-bar">
              <div 
                className="loading-progress-fill" 
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
            
            {stage && (
              <div className="loading-stage">
                <i className="loading-stage-icon fas fa-cog fa-spin"></i>
                <span>{stage}</span>
              </div>
            )}
          </div>
          
          {onCancel && (
            <button className="cancel-loading-btn" onClick={onCancel}>
              <i className="fas fa-times"></i> Cancel
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default LoadingAnimation;