// src/components/ui/Button.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { theme, cn } from '../../config/theme';

/**
 * Button Component - New Minimal Design System
 * Blue primary, subtle glow on hover, clean and professional
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  children,
  onClick,
  className = '',
  animate = true,
  type = 'button',
  ...props
}) {
  const baseClasses = theme.components.button.base;
  const sizeClasses = theme.components.button.sizes[size] || theme.components.button.sizes.md;
  const variantClasses = theme.components.button.variants[variant] || theme.components.button.variants.primary;

  const combinedClassName = cn(
    baseClasses,
    sizeClasses,
    variantClasses,
    className
  );

  const isDisabled = disabled || loading;

  const buttonContent = (
    <>
      {loading && (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
      )}
      {!loading && icon && <span>{icon}</span>}
      {children}
    </>
  );

  if (animate) {
    return (
      <motion.button
        whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={cn(combinedClassName, 'flex items-center justify-center gap-2')}
        {...props}
      >
        {buttonContent}
      </motion.button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(combinedClassName, 'flex items-center justify-center gap-2')}
      {...props}
    >
      {buttonContent}
    </button>
  );
}

// Specialized button variants
export function PrimaryButton(props) {
  return <Button variant="primary" {...props} />;
}

export function AccentButton(props) {
  return <Button variant="accent" {...props} />;
}

export function SecondaryButton(props) {
  return <Button variant="secondary" {...props} />;
}

export function DangerButton(props) {
  return <Button variant="danger" {...props} />;
}

export function GhostButton(props) {
  return <Button variant="ghost" {...props} />;
}