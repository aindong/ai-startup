export const colors = {
  // Base colors
  dark1: '#0A0A0B',  // Main background
  dark2: '#121214',  // Elevated background
  dark3: '#18181B',  // Card background
  dark4: '#1E1E22',  // Input background
  dark5: '#27272B',  // Hover states

  // Accent colors
  accent1: '#6D28D9',  // Primary purple
  accent2: '#7C3AED',  // Hover state
  accent3: '#8B5CF6',  // Active state
  accent4: '#A78BFA',  // Disabled state

  // Semantic colors
  success1: '#059669',  // Success dark
  success2: '#10B981',  // Success light
  warning1: '#D97706',  // Warning dark
  warning2: '#F59E0B',  // Warning light
  error1: '#DC2626',    // Error dark
  error2: '#EF4444',    // Error light
  info1: '#2563EB',     // Info dark
  info2: '#3B82F6',     // Info light

  // Text colors
  text1: '#FFFFFF',     // Primary text
  text2: '#E4E4E7',     // Secondary text
  text3: '#A1A1AA',     // Tertiary text
  text4: '#71717A',     // Disabled text

  // Border colors
  border1: '#27272A',   // Primary border
  border2: '#3F3F46',   // Secondary border
  border3: '#52525B',   // Focus border

  // Special purpose
  overlay: 'rgba(0, 0, 0, 0.5)',  // Modal overlay
  shadow: 'rgba(0, 0, 0, 0.2)',   // Box shadows
  glow: 'rgba(109, 40, 217, 0.2)', // Accent glow
} as const;

// Semantic theme tokens
export const tokens = {
  background: {
    app: '#0A0A0B', // Dark background for main app
    hover: '#141416', // Slightly lighter for hover states
    elevated: '#1C1C1F', // For elevated surfaces
    card: '#26262B', // For cards and containers
  },
  text: {
    primary: '#F2F2F7', // High contrast text
    secondary: '#AEAEB2', // Medium contrast text
    tertiary: '#8E8E93', // Low contrast text
  },
  border: {
    primary: '#2C2C2E', // Default borders
    secondary: '#3A3A3C', // Emphasized borders
    focus: '#0A84FF', // Focus state borders
  },
  accent: {
    primary: '#0A84FF', // Primary accent color (iOS blue)
    hover: '#409CFF', // Lighter version for hover states
  },
  status: {
    success: '#32D74B', // Success states
    warning: '#FF9F0A', // Warning states
    error: '#FF453A', // Error states
    info: '#5856D6', // Info states
  },
  effects: {
    shadow: 'rgba(0, 0, 0, 0.3)', // Shadows
    glow: 'rgba(10, 132, 255, 0.3)', // Accent color glow
  },
} as const; 