
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', titleClassName = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 md:p-6 ${className}`}>
      {title && <h3 className={`text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 ${titleClassName}`}>{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
