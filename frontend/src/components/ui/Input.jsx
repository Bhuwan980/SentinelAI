// src/components/ui/Input.jsx
import React from 'react';
import { theme, cn } from '../../config/theme';

/**
 * Input Component - Clean, Minimal, Professional
 */
export default function Input({
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  className = '',
  textarea = false,
  rows = 4,
  id,
  variant = 'light',
  ...props
}) {
  const baseClasses = variant === 'dark' ? theme.components.input.dark : theme.components.input.base;
  const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  const combinedClassName = cn(
    baseClasses,
    error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : '',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "block text-sm font-medium mb-2 flex items-center gap-2",
            variant === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}
        >
          {icon && <span>{icon}</span>}
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {textarea ? (
        <textarea
          id={inputId}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={cn(combinedClassName, 'resize-none')}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={combinedClassName}
          {...props}
        />
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

// Specialized input variants
export function EmailInput(props) {
  return <Input type="email" icon="📧" {...props} />;
}

export function PasswordInput(props) {
  return <Input type="password" icon="🔒" {...props} />;
}

export function PhoneInput(props) {
  return <Input type="tel" icon="📱" {...props} />;
}

export function TextArea(props) {
  return <Input textarea icon="📝" {...props} />;
}