import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'eco' | 'ocean' | 'earth' | 'danger' | 'warning' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'eco',
  size = 'md',
  icon,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-colors';
  
  const variants = {
    eco: 'bg-eco-100 dark:bg-eco-900/30 text-eco-700 dark:text-eco-400',
    ocean: 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400',
    earth: 'bg-earth-100 dark:bg-earth-900/30 text-earth-700 dark:text-earth-400',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    neutral: 'bg-slate-100 dark:bg-surface-800 text-slate-700 dark:text-slate-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {icon && <span className="flex items-center shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
