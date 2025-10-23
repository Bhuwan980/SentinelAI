// src/config/theme.js
// 🎨 SENTINEL.AI - COMPLETE DESIGN SYSTEM
// Flat UI + Subtle 3D Depth + Glassmorphism + AI Aesthetic

export const theme = {
  // 🎨 COLOR ARCHITECTURE
  colors: {
    // Primary - Trust Blue
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#2563EB', // Main Primary Blue
      600: '#1D4ED8',
      700: '#1E40AF',
      800: '#1E3A8A',
      900: '#1E3A70',
    },
    
    // Accent - Cyan (AI/Tech Highlight)
    accent: {
      50: '#ECFEFF',
      100: '#CFFAFE',
      200: '#A5F3FC',
      300: '#67E8F9',
      400: '#22D3EE', // Main Accent Cyan
      500: '#06B6D4',
      600: '#0891B2',
      700: '#0E7490',
      800: '#155E75',
      900: '#164E63',
    },
    


    // Backgrounds
    background: {
      offWhite: '#F9FAFB',      // Main light background
      light: '#FFFFFF',          // Pure white
      dark: '#0F172A',           // Slate Dark (hero, dark sections)
      darkAlt: '#1E293B',        // Neural Gray (secondary panels)
      graphite: '#111827',       // Graphite Black (text, headers)
    },
    
    // Text
    text: {
      primary: '#111827',        // Graphite Black
      secondary: '#6B7280',      // Muted gray
      tertiary: '#9CA3AF',       // Light gray
      inverse: '#F9FAFB',        // Light text on dark
      white: '#FFFFFF',
      muted: 'rgba(255, 255, 255, 0.6)',
    },
    
    // Status Colors
    success: {
      light: '#D1FAE5',
      DEFAULT: '#10B981',        // Signal Green
      dark: '#047857',
    },
    error: {
      light: '#FEE2E2',
      DEFAULT: '#EF4444',        // Alert Red
      dark: '#DC2626',
    },
    warning: {
      light: '#FEF3C7',
      DEFAULT: '#F59E0B',
      dark: '#D97706',
    },
    info: {
      light: '#DBEAFE',
      DEFAULT: '#2563EB',
      dark: '#1D4ED8',
    },
    
    // Glassmorphism
    glass: {
      white: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.1)',
      backdrop: 'rgba(15, 23, 42, 0.8)',
    },
  },

  // 📐 SPACING SYSTEM (8px base grid)
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '3rem',      // 48px
    '2xl': '4rem',   // 64px
    '3xl': '6rem',   // 96px
  },

  // 🔤 TYPOGRAPHY
  typography: {
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: '"Space Grotesk", "Inter", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
      '7xl': '4.5rem',    // 72px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // 📦 BORDER RADIUS (12px global)
  borderRadius: {
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px - STANDARD
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },

  // 🌑 SHADOWS (2-layer soft shadows)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(37, 99, 235, 0.3)',        // Blue glow
    glowCyan: '0 0 20px rgba(34, 211, 238, 0.3)',   // Cyan glow
    card: '0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
  },

  // 🎬 ANIMATIONS (Micro-animations only)
  animations: {
    transition: {
      fast: '150ms',
      DEFAULT: '200ms',
      slow: '300ms',
    },
    easing: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // 📱 BREAKPOINTS
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // 🎨 GRADIENT PRESETS
  gradients: {
    // Hero gradient (deep blue to black)
    hero: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
    heroAlt: 'linear-gradient(180deg, #0F172A 0%, #1E40AF 100%)',
    
    // Primary gradients
    primary: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    primaryHover: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
    
    // Accent gradients (Blue → Cyan)
    accent: 'linear-gradient(135deg, #2563EB 0%, #22D3EE 100%)',
    accentAlt: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
    
    // Data visualization (Blue → Cyan → Teal)
    data: 'linear-gradient(90deg, #2563EB 0%, #22D3EE 50%, #14B8A6 100%)',
    
    // Glass panel
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    
    // Text gradient
    text: 'linear-gradient(135deg, #2563EB 0%, #22D3EE 100%)',
  },

  // 🎯 COMPONENT VARIANTS
  components: {
    button: {
      base: 'px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
      sizes: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
      },
      variants: {
        primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-glow hover:from-blue-700 hover:to-blue-800 shadow-md',
        accent: 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-glowCyan hover:from-blue-700 hover:to-cyan-600 shadow-md',
        secondary: 'bg-slate-800/50 border border-white/10 text-white hover:bg-slate-700/50 backdrop-blur-sm',
        danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md',
        ghost: 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10',
      }
    },
    
    card: {
      base: 'bg-white rounded-xl border border-gray-200 p-6 shadow-card',
      glass: 'bg-white/10 backdrop-blur-md rounded-xl border border-white/10 p-6',
      dark: 'bg-slate-800/50 backdrop-blur-md rounded-xl border border-white/5 p-6',
      hover: 'hover:shadow-xl transition-all duration-200',
    },
    
    input: {
      base: 'w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition',
      dark: 'w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition backdrop-blur-sm',
    },
    
    badge: {
      base: 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold',
      variants: {
        success: 'bg-green-100 text-green-800 border border-green-200',
        error: 'bg-red-100 text-red-800 border border-red-200',
        warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        info: 'bg-blue-100 text-blue-800 border border-blue-200',
        primary: 'bg-blue-600 text-white',
      }
    },
    
    // Glassmorphism panel
    glassPanel: {
      base: 'backdrop-filter backdrop-blur-xl bg-white/10 border border-white/10 rounded-xl',
      dark: 'backdrop-filter backdrop-blur-xl bg-slate-900/50 border border-white/5 rounded-xl',
    },
  },

  // 🎭 ICONS & EMOJIS
  icons: {
    brand: '👁️',
    security: '🔒',
    ai: '🧠',
    monitoring: '📊',
    alert: '🚨',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    upload: '📤',
    download: '📥',
    report: '📄',
    user: '👤',
    email: '📧',
    phone: '📱',
    settings: '⚙️',
  },

  // 🎨 GLASSMORPHISM
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.1)',
      blur: 'blur(12px)',
    },
    dark: {
      background: 'rgba(15, 23, 42, 0.5)',
      border: 'rgba(255, 255, 255, 0.05)',
      blur: 'blur(12px)',
    },
  },
};

// 🔧 UTILITY FUNCTIONS
export const getColor = (path) => {
  const keys = path.split('.');
  let value = theme.colors;
  for (const key of keys) {
    value = value[key];
    if (!value) return null;
  }
  return value;
};

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// 🎨 CSS-in-JS helpers
export const gradient = (type) => theme.gradients[type] || theme.gradients.primary;
export const shadow = (type) => theme.shadows[type] || theme.shadows.DEFAULT;

export default theme;