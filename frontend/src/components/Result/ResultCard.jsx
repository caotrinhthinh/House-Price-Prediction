import React, { useEffect, useState } from 'react';
import { Home } from 'lucide-react';
import './ResultCard.css';

// Animated Counter component
const AnimatedCounter = ({ value }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!value) return;
    
    let start = 0;
    const end = parseInt(value.toString().replace(/[^0-9]/g, ''));
    if (start === end) return;
    
    let totalDuration = 1500;
    let incrementTime = 30; // ms
    let steps = Math.max(1, Math.floor(totalDuration / incrementTime));
    let increment = (end - start) / steps;
    
    let timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>${count.toLocaleString()}</span>;
};

export const ResultCard = ({ result }) => {
  if (!result) {
    return (
      <div className="glass-panel result-container animate-fade-in delay-2">
        <div className="placeholder-state">
          <Home size={64} opacity={0.5} />
          <p>Fill out the property details to see the AI estimation.</p>
        </div>
      </div>
    );
  }

  const { price, details } = result || {};

  return (
    <div className="glass-panel result-container animate-fade-in">
      <div className="result-content">
        <h3 className="result-label">Estimated Market Value</h3>
        <div className="price-display">
          <AnimatedCounter value={price} />
        </div>
        
        {details && (
          <div className="details-box">
            <div className="detail-row">
              <span className="detail-label">Algorithm</span>
              <span className="detail-value">{details.ensemble_weight || "XGBoost + LightGBM"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">XGBoost Base</span>
              <span className="detail-value">${details.xgboost_prediction?.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">LightGBM Base</span>
              <span className="detail-value">${details.lightgbm_prediction?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
