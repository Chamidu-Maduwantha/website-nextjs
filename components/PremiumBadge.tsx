import { SparklesIcon } from '@heroicons/react/24/solid';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function PremiumBadge({ 
  size = 'md', 
  showIcon = true, 
  className = '' 
}: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <span className={`
      inline-flex items-center space-x-1 
      bg-gradient-to-r from-yellow-400 to-yellow-600 
      text-black font-bold rounded-full
      ${sizeClasses[size]}
      ${className}
    `}>
      {showIcon && <SparklesIcon className={iconSizes[size]} />}
      <span>PREMIUM</span>
    </span>
  );
}
