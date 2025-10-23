// src/components/ui/Badge.jsx
import React from 'react';
import { theme, cn } from '../../config/theme';

/**
 * Badge Component - Clean, Minimal Status Indicators
 */
export default function Badge({
  variant = 'info',
  children,
  icon,
  className = '',
  pulse = false,
  ...props
}) {
  const baseClasses = theme.components.badge.base;
  const variantClasses = theme.components.badge.variants[variant] || theme.components.badge.variants.info;

  const combinedClassName = cn(
    baseClasses,
    variantClasses,
    className
  );

  return (
    <span className={combinedClassName} {...props}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}

// Specialized badge variants
export function SuccessBadge({ children, ...props }) {
  return (
    <Badge variant="success" icon="✅" {...props}>
      {children}
    </Badge>
  );
}

export function ErrorBadge({ children, ...props }) {
  return (
    <Badge variant="error" icon="❌" {...props}>
      {children}
    </Badge>
  );
}

export function WarningBadge({ children, ...props }) {
  return (
    <Badge variant="warning" icon="⚠️" {...props}>
      {children}
    </Badge>
  );
}

export function InfoBadge({ children, ...props }) {
  return (
    <Badge variant="info" icon="ℹ️" {...props}>
      {children}
    </Badge>
  );
}

export function PrimaryBadge({ children, ...props }) {
  return (
    <Badge variant="primary" {...props}>
      {children}
    </Badge>
  );
}

// Status-specific badges
export function StatusBadge({ status, ...props }) {
  const statusMap = {
    pending: { variant: 'warning', icon: '⏳', text: 'Pending' },
    approved: { variant: 'success', icon: '✅', text: 'Approved' },
    confirmed: { variant: 'success', icon: '✓', text: 'Confirmed' },
    rejected: { variant: 'error', icon: '✕', text: 'Rejected' },
    active: { variant: 'primary', icon: '●', text: 'Active', pulse: true },
  };

  const config = statusMap[status?.toLowerCase()] || {
    variant: 'info',
    text: status || 'Unknown'
  };

  return (
    <Badge variant={config.variant} icon={config.icon} pulse={config.pulse} {...props}>
      {config.text}
    </Badge>
  );
}