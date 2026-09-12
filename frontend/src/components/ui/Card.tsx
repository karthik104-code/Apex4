import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = true,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const cardStyle = glass 
    ? 'glass-panel border border-slate-800' 
    : 'bg-surface border border-slate-800';
  
  const hoverStyle = hoverEffect 
    ? 'hover:border-primary-500/40 hover:scale-[1.01] transition-all cursor-pointer' 
    : '';

  return (
    <div className={`p-6 rounded-3xl ${cardStyle} ${hoverStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};
