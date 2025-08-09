
// Host-only theme — do not import outside /host routes

export interface HostTokens {
  colors: {
    background: string;
    card: string;
    surface: string;
    border: string;
    accent: string;
    accentContrast: string;
    text: string;
    muted: string;
    success: string;
    warning: string;
    danger: string;
    sidebar: string;
    hover: string;
  };
  typography: {
    fontFamilies: {
      heading: string;
      body: string;
      mono: string;
    };
    sizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    weights: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeights: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };
  layout: {
    containerPadding: string;
    sidebarWidth: {
      collapsed: string;
      expanded: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
    };
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export const HOST_TOKENS: HostTokens = {
  colors: {
    background: '#111315',      // host-blackest-dark
    card: '#292C2D',           // host-dark-gray
    surface: '#292C2D',        // same as card
    border: '#676767',         // host-mid-gray
    accent: '#D87C5A',         // grace primary
    accentContrast: '#FFFFFF', // white
    text: '#FFFFFF',           // white
    muted: '#676767',          // host-mid-gray
    success: '#CCF0DB',        // host-mint
    warning: '#E9A036',        // grace accent
    danger: '#E47272',         // host-status-error
    sidebar: '#111315',        // same as background
    hover: '#292C2D',          // host-dark-gray
  },
  typography: {
    fontFamilies: {
      heading: "'Playfair Display', serif",
      body: "'Karla', sans-serif",
      mono: "'Inter', monospace",
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  layout: {
    containerPadding: '1rem',
    sidebarWidth: {
      collapsed: '4rem',    // 64px
      expanded: '16rem',    // 256px
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};
