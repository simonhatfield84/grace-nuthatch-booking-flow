/**
 * Nuthatch theme tokens for UI-only booking widget
 * Matches the visual design of the current booking widget
 */

export const nuthatchTheme = {
  colors: {
    dark: '#2B3840',
    white: '#FFFFFF',
    green: '#384140',
    light: '#F8F9FA',
    border: '#E9ECEF',
    muted: '#6C757D',
  },
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'Lato', sans-serif",
    ui: "'Karla', sans-serif",
  },
  spacing: {
    card: '1.5rem', // p-6
    gap: '1rem',    // space-y-4
  },
} as const;

export type NuthatchTheme = typeof nuthatchTheme;
