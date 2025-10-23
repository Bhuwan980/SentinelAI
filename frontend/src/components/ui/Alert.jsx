// src/components/ui/Alert.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../config/theme';

/**
 * Alert Component - Clean, Color-Coded Status Messages
 */
export default function Alert({
  variant = 'info',
  children,
  title,
  show = true,
  onClose,
  className = '',
  ...props
}) {
  const variantStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '✅',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '❌',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ️',
    },
  };

  const styles = variantStyles[variant] || variantStyles.info;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'p-4 rounded-xl border',
            styles.bg,
            styles.border,
            className
          )}
          {...props}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{styles.icon}</span>
            <div className="flex-1">
              {title && (
                <h4 className={cn('font-semibold mb-1', styles.text)}>
                  {title}
                </h4>
              )}
              <p className={cn('text-sm', styles.text)}>
                {children}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className={cn(
                  'flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition',
                  styles.text
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Specialized alert variants
export function SuccessAlert({ children, ...props }) {
  return <Alert variant="success" {...props}>{children}</Alert>;
}

export function ErrorAlert({ children, ...props }) {
  return <Alert variant="error" {...props}>{children}</Alert>;
}

export function WarningAlert({ children, ...props }) {
  return <Alert variant="warning" {...props}>{children}</Alert>;
}

export function InfoAlert({ children, ...props }) {
  return <Alert variant="info" {...props}>{children}</Alert>;
}