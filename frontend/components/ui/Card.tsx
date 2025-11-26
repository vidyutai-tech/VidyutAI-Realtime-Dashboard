
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', titleClassName = '', onClick }) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 md:p-6 ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {title && <h3 className={`text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 ${titleClassName}`}>{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
