// Grace OS Reservations Design System Tokens
// Extracted from src/index.css and tailwind.config.ts

export const GRACE_TOKENS = {
  colors: {
    // Grace OS Brand Colors
    primary: '#D87C5A',      // Warm Terracotta
    secondary: '#005F56',    // Deep Teal  
    accent: '#E9A036',       // Muted Gold
    background: '#F4EAE0',   // Soft Sand
    dark: '#2E2E2E',         // Charcoal Grey
    light: '#FFFFFF',        // Pure White

    // Semantic Colors (Light Theme)
    lightTheme: {
      background: 'hsl(32, 27%, 94%)',         // #F4EAE0
      foreground: 'hsl(0, 0%, 18%)',          // #2E2E2E
      card: 'hsl(0, 0%, 100%)',               // #FFFFFF
      cardForeground: 'hsl(0, 0%, 18%)',      // #2E2E2E
      popover: 'hsl(0, 0%, 100%)',            // #FFFFFF
      popoverForeground: 'hsl(0, 0%, 18%)',   // #2E2E2E
      primary: 'hsl(16, 53%, 60%)',           // #D87C5A
      primaryForeground: 'hsl(0, 0%, 100%)',  // #FFFFFF
      secondary: 'hsl(43, 75%, 56%)',         // #E9A036
      secondaryForeground: 'hsl(0, 0%, 18%)', // #2E2E2E
      muted: 'hsl(31, 39%, 85%)',             // #E6D5C7
      mutedForeground: 'hsl(0, 0%, 45%)',     // #737373
      accent: 'hsl(16, 53%, 60%)',            // #D87C5A
      accentForeground: 'hsl(0, 0%, 100%)',   // #FFFFFF
      destructive: 'hsl(0, 84%, 60%)',        // #DC2626
      destructiveForeground: 'hsl(0, 0%, 100%)', // #FFFFFF
      border: 'hsl(33, 20%, 77%)',            // #D1C4B8
      input: 'hsl(33, 20%, 77%)',             // #D1C4B8
      ring: 'hsl(16, 53%, 60%)',              // #D87C5A
    },

    // Dark Theme (Host Interface)
    darkTheme: {
      background: 'hsl(214, 13%, 8%)',        // #111315
      foreground: 'hsl(0, 0%, 100%)',         // #FFFFFF
      card: 'hsl(214, 6%, 16%)',              // #292C2D
      cardForeground: 'hsl(0, 0%, 100%)',     // #FFFFFF
      popover: 'hsl(214, 6%, 16%)',           // #292C2D
      popoverForeground: 'hsl(0, 0%, 100%)',  // #FFFFFF
      primary: 'hsl(16, 53%, 60%)',           // #D87C5A
      primaryForeground: 'hsl(0, 0%, 100%)',  // #FFFFFF
      secondary: 'hsl(43, 75%, 56%)',         // #E9A036
      secondaryForeground: 'hsl(0, 0%, 100%)', // #FFFFFF
      muted: 'hsl(214, 6%, 16%)',             // #292C2D
      mutedForeground: 'hsl(0, 0%, 40%)',     // #676767
      accent: 'hsl(214, 6%, 16%)',            // #292C2D
      accentForeground: 'hsl(0, 0%, 100%)',   // #FFFFFF
      destructive: 'hsl(0, 84%, 60%)',        // #DC2626
      destructiveForeground: 'hsl(0, 0%, 100%)', // #FFFFFF
      border: 'hsl(0, 0%, 40%)',              // #676767
      input: 'hsl(214, 6%, 16%)',             // #292C2D
      ring: 'hsl(16, 53%, 60%)',              // #D87C5A
    },

    // Sidebar Colors
    sidebar: {
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(0, 0%, 18%)',
      primary: 'hsl(16, 53%, 60%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      accent: 'hsl(0, 0%, 94%)',
      accentForeground: 'hsl(0, 0%, 18%)',
      border: 'hsl(33, 20%, 77%)',
      ring: 'hsl(16, 53%, 60%)',
    }
  },

  typography: {
    fontFamilies: {
      heading: ['Playfair Display', 'serif'],
      body: ['Karla', 'sans-serif'],
      subheading: ['Poppins', 'sans-serif'],
      accent: ['Markazi Text', 'serif'],
      modern: ['Inter', 'sans-serif'],
      elegant: ['Lato', 'sans-serif'],
    },
    
    fontSizes: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px  
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
      '7xl': '4.5rem',   // 72px
      '8xl': '6rem',     // 96px
      '9xl': '8rem',     // 128px
    },

    fontWeights: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },

    lineHeights: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },

    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    }
  },

  spacing: {
    px: '1px',
    0: '0px',
    0.5: '0.125rem',   // 2px
    1: '0.25rem',      // 4px
    1.5: '0.375rem',   // 6px
    2: '0.5rem',       // 8px
    2.5: '0.625rem',   // 10px
    3: '0.75rem',      // 12px
    3.5: '0.875rem',   // 14px
    4: '1rem',         // 16px
    5: '1.25rem',      // 20px
    6: '1.5rem',       // 24px
    7: '1.75rem',      // 28px
    8: '2rem',         // 32px
    9: '2.25rem',      // 36px
    10: '2.5rem',      // 40px
    11: '2.75rem',     // 44px
    12: '3rem',        // 48px
    14: '3.5rem',      // 56px
    16: '4rem',        // 64px
    20: '5rem',        // 80px
    24: '6rem',        // 96px
    28: '7rem',        // 112px
    32: '8rem',        // 128px
    36: '9rem',        // 144px
    40: '10rem',       // 160px
    44: '11rem',       // 176px
    48: '12rem',       // 192px
    52: '13rem',       // 208px
    56: '14rem',       // 224px
    60: '15rem',       // 240px
    64: '16rem',       // 256px
    72: '18rem',       // 288px
    80: '20rem',       // 320px
    96: '24rem',       // 384px
  },

  borderRadius: {
    none: '0px',
    sm: 'calc(0.5rem - 4px)',
    md: 'calc(0.5rem - 2px)', 
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  animation: {
    'accordion-down': 'accordion-down 0.2s ease-out',
    'accordion-up': 'accordion-up 0.2s ease-out',
  },

  keyframes: {
    'accordion-down': {
      from: { height: '0' },
      to: { height: 'var(--radix-accordion-content-height)' }
    },
    'accordion-up': {
      from: { height: 'var(--radix-accordion-content-height)' },
      to: { height: '0' }
    }
  },

  container: {
    center: true,
    padding: '2rem',
    screens: {
      '2xl': '1400px'
    }
  }
} as const;

export type GraceTokens = typeof GRACE_TOKENS;
