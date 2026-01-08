import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 100,
  delay = 1000,
  className = '',
  onComplete
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const startTyping = () => {
      setIsTyping(true);
      setCurrentIndex(0);
      setDisplayText('');
    };

    // Start typing after delay
    const delayTimer = setTimeout(startTyping, delay);

    return () => clearTimeout(delayTimer);
  }, [delay, text]);

  useEffect(() => {
    if (!isTyping || currentIndex >= text.length) {
      if (currentIndex >= text.length && isTyping) {
        setIsTyping(false);
        onComplete?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText(prev => prev + text[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, isTyping, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {isTyping && <span className="animate-pulse">|</span>}
    </span>
  );
};

export default TypewriterText;