import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'glass', hoverable = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl overflow-hidden';
    
    const variants = {
      default: 'bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800',
      glass: 'bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-glass',
      elevated: 'bg-white dark:bg-surface-850 shadow-lg border border-slate-100 dark:border-slate-800/50',
    };

    const hoverStyles = hoverable 
      ? 'transition-all duration-300 hover:shadow-card-hover hover:border-eco-500/20 hover:-translate-y-0.5' 
      : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
