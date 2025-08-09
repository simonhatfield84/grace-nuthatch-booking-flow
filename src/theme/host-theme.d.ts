
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

declare const HOST_TOKENS: HostTokens;

export { HOST_TOKENS };
