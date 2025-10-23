// src/components/ui/Card.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { theme, cn } from '../../config/theme';

/**
 * Card Component - Glassmorphism + Clean Design
 */
export default function Card({
  children,
  className = '',
  variant = 'light',
  hover = false,
  animate = true,
  onClick,
  style,
  ...props
}) {
  const variantClasses = {
    light: theme.components.card.base,
    glass: theme.components.card.glass,
    dark: theme.components.card.dark,
  };

  const baseClasses = variantClasses[variant] || variantClasses.light;
  const hoverClasses = hover ? theme.components.card.hover : '';

  const combinedClassName = cn(
    baseClasses,
    hoverClasses,
    onClick ? 'cursor-pointer' : '',
    className
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hover ? { scale: 1.02, y: -4 } : {}}
        className={combinedClassName}
        onClick={onClick}
        style={style}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={combinedClassName}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

// Glass Panel Component
export function GlassCard({ children, className = '', ...props }) {
  return (
    <Card variant="glass" className={className} {...props}>
      {children}
    </Card>
  );
}

// Feature Card for Marketing
export function FeatureCard({ icon, title, description, className = '', ...props }) {
  return (
    <Card hover animate className={cn('group', className)} {...props}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center text-4xl border border-blue-500/20 group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
        <h3 className="font-bold text-xl mb-3 text-gray-900">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </Card>
  );
}

// Stats Card for Dashboard
export function StatsCard({ label, value, icon, gradient = 'from-blue-600 to-blue-700', ...props }) {
  return (
    <Card hover animate className="group relative overflow-hidden" {...props}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <span className="text-3xl">{icon}</span>
        </div>
        <p className="text-5xl font-bold text-gray-900 mb-3">{value}</p>
        <div className={cn('h-1.5 rounded-full bg-gradient-to-r', gradient, 'shadow-md')}></div>
      </div>
    </Card>
  );
}

// Dark Card for Dashboard Panels
export function DarkCard({ children, className = '', ...props }) {
  return (
    <Card variant="dark" className={className} {...props}>
      {children}
    </Card>
  );
}