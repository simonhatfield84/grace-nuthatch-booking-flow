
#!/usr/bin/env node
// Host-only theme — do not import outside /host routes

const fs = require('fs');
const path = require('path');

const TOKENS_PATH = path.join(__dirname, '../src/theme/host-tokens.ts');
const OUTPUT_DIR = path.join(__dirname, '../public');

function generateDesignTokens() {
  console.log('🎨 Generating design token exports...');

  try {
    // Read tokens file
    const tokensContent = fs.readFileSync(TOKENS_PATH, 'utf8');

    // Extract HOST_TOKENS object (simple regex approach)
    const tokensMatch = tokensContent.match(/export const HOST_TOKENS[^=]*=\s*({[\s\S]*?});/);
    if (!tokensMatch) {
      throw new Error('Could not find HOST_TOKENS export in tokens file');
    }

    // Parse the tokens structure manually (since it's TypeScript)
    const designTokens = {
      metadata: {
        name: "Grace OS Host Interface",
        version: "1.0.0",
        generated: new Date().toISOString(),
        description: "Design tokens for the Host interface component of Grace OS venue management system"
      },
      colors: {
        background: "#111315",
        card: "#292C2D", 
        surface: "#292C2D",
        border: "#676767",
        accent: "#D87C5A",
        accentContrast: "#FFFFFF",
        text: "#FFFFFF",
        muted: "#676767",
        success: "#CCF0DB",
        warning: "#E9A036",
        danger: "#E47272",
        sidebar: "#111315",
        hover: "#292C2D"
      },
      typography: {
        fontFamilies: {
          heading: "'Playfair Display', serif",
          body: "'Karla', sans-serif",
          mono: "'Inter', monospace"
        },
        sizes: {
          xs: "0.75rem",
          sm: "0.875rem", 
          base: "1rem",
          lg: "1.125rem",
          xl: "1.25rem",
          "2xl": "1.5rem"
        },
        weights: {
          normal: "400",
          medium: "500", 
          semibold: "600",
          bold: "700"
        },
        lineHeights: {
          tight: "1.25",
          normal: "1.5", 
          relaxed: "1.75"
        }
      },
      layout: {
        containerPadding: "1rem",
        sidebarWidth: {
          collapsed: "4rem",
          expanded: "16rem"
        },
        spacing: {
          xs: "0.25rem",
          sm: "0.5rem",
          md: "1rem", 
          lg: "1.5rem",
          xl: "2rem"
        },
        borderRadius: {
          sm: "0.25rem",
          md: "0.375rem",
          lg: "0.5rem"
        }
      },
      breakpoints: {
        sm: "640px",
        md: "768px",
        lg: "1024px", 
        xl: "1280px"
      }
    };

    // Generate typography scale specifically
    const typographyScale = {
      metadata: {
        name: "Host Interface Typography Scale",
        version: "1.0.0",
        generated: new Date().toISOString()
      },
      scale: {
        "heading-1": {
          fontSize: "2.25rem", // 36px
          fontWeight: "700",
          lineHeight: "1.25",
          fontFamily: "'Playfair Display', serif"
        },
        "heading-2": {
          fontSize: "1.875rem", // 30px
          fontWeight: "600", 
          lineHeight: "1.25",
          fontFamily: "'Playfair Display', serif"
        },
        "heading-3": {
          fontSize: "1.5rem", // 24px
          fontWeight: "600",
          lineHeight: "1.25", 
          fontFamily: "'Playfair Display', serif"
        },
        "heading-4": {
          fontSize: "1.25rem", // 20px
          fontWeight: "500",
          lineHeight: "1.5",
          fontFamily: "'Playfair Display', serif"
        },
        "heading-5": {
          fontSize: "1.125rem", // 18px
          fontWeight: "500",
          lineHeight: "1.5",
          fontFamily: "'Playfair Display', serif"
        },
        "heading-6": {
          fontSize: "1rem", // 16px
          fontWeight: "500", 
          lineHeight: "1.5",
          fontFamily: "'Playfair Display', serif"
        },
        "body-large": {
          fontSize: "1.125rem", // 18px
          fontWeight: "400",
          lineHeight: "1.75",
          fontFamily: "'Karla', sans-serif"
        },
        "body-base": {
          fontSize: "1rem", // 16px
          fontWeight: "400",
          lineHeight: "1.5", 
          fontFamily: "'Karla', sans-serif"
        },
        "body-small": {
          fontSize: "0.875rem", // 14px
          fontWeight: "400",
          lineHeight: "1.5",
          fontFamily: "'Karla', sans-serif"
        },
        "caption": {
          fontSize: "0.75rem", // 12px
          fontWeight: "400",
          lineHeight: "1.25",
          fontFamily: "'Karla', sans-serif"
        }
      },
      usage: {
        "heading-1": "Page titles, primary headings",
        "heading-2": "Section headings, card titles",
        "heading-3": "Subsection headings",
        "heading-4": "Component headings",
        "heading-5": "List headings, labels",
        "heading-6": "Form labels, small headings",
        "body-large": "Lead paragraphs, important text",
        "body-base": "Standard body text, descriptions",
        "body-small": "Secondary text, metadata",
        "caption": "Fine print, timestamps, hints"
      }
    };

    // Add CSS custom properties mapping
    const cssProperties = {
      metadata: {
        name: "Host Interface CSS Custom Properties",
        description: "CSS variables that can be used in stylesheets",
        generated: new Date().toISOString()
      },
      properties: {
        // Colors
        "--host-bg": designTokens.colors.background,
        "--host-card": designTokens.colors.card,
        "--host-surface": designTokens.colors.surface,
        "--host-border": designTokens.colors.border,
        "--host-accent": designTokens.colors.accent,
        "--host-accent-contrast": designTokens.colors.accentContrast,
        "--host-text": designTokens.colors.text,
        "--host-muted": designTokens.colors.muted,
        "--host-success": designTokens.colors.success,
        "--host-warning": designTokens.colors.warning,
        "--host-danger": designTokens.colors.danger,
        "--host-sidebar": designTokens.colors.sidebar,
        "--host-hover": designTokens.colors.hover,
        
        // Typography
        "--host-font-heading": designTokens.typography.fontFamilies.heading,
        "--host-font-body": designTokens.typography.fontFamilies.body,
        "--host-font-mono": designTokens.typography.fontFamilies.mono,
        
        // Layout
        "--host-container-padding": designTokens.layout.containerPadding,
        "--host-sidebar-collapsed": designTokens.layout.sidebarWidth.collapsed,
        "--host-sidebar-expanded": designTokens.layout.sidebarWidth.expanded,
        "--host-spacing-xs": designTokens.layout.spacing.xs,
        "--host-spacing-sm": designTokens.layout.spacing.sm,
        "--host-spacing-md": designTokens.layout.spacing.md,
        "--host-spacing-lg": designTokens.layout.spacing.lg,
        "--host-spacing-xl": designTokens.layout.spacing.xl,
        "--host-border-radius-sm": designTokens.layout.borderRadius.sm,
        "--host-border-radius-md": designTokens.layout.borderRadius.md,
        "--host-border-radius-lg": designTokens.layout.borderRadius.lg
      }
    };

    // Write output files
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'host-design-tokens.json'),
      JSON.stringify({ ...designTokens, cssProperties }, null, 2)
    );

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'host-typography-scale.json'),
      JSON.stringify(typographyScale, null, 2)
    );

    console.log('✅ Design tokens exported successfully:');
    console.log('  📄 public/host-design-tokens.json');
    console.log('  📄 public/host-typography-scale.json');
    console.log(`  🎨 ${Object.keys(designTokens.colors).length} color tokens`);
    console.log(`  📝 ${Object.keys(typographyScale.scale).length} typography scales`);
    console.log(`  🔧 ${Object.keys(cssProperties.properties).length} CSS properties`);

    return true;
  } catch (error) {
    console.error('❌ Failed to generate design tokens:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  generateDesignTokens();
}

module.exports = { generateDesignTokens };
