// src/components/ui/Spinner.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../config/theme';

export default function Spinner({
  size = 'md',
  text = '',
  fullScreen = false,
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-20 h-20 border-4',
  };

  const spinner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('text-center', className)}
      {...props}
    >
      <div className="relative mx-auto" style={{ width: 'fit-content' }}>
        <div className={cn(
          'rounded-full border-gray-200',
          sizeClasses[size] || sizeClasses.md
        )}></div>
        <div className={cn(
          'absolute inset-0 rounded-full border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin',
          sizeClasses[size] || sizeClasses.md
        )}></div>
      </div>
      {text && (
        <p className="text-gray-900 text-lg font-medium mt-4">{text}</p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function PageSpinner({ text = 'Loading...', ...props }) {
  return <Spinner size="xl" text={text} fullScreen {...props} />;
}

export function ButtonSpinner({ ...props }) {
  return (
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" {...props}></div>
  );
}