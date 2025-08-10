import { GRACE_TOKENS } from '@/theme/exports/tokens';

export interface BundleFile {
  path: string;
  content: string;
  type: 'text' | 'json' | 'css' | 'typescript';
}

export class DesignSystemBundleService {
  static async createBundle(): Promise<BundleFile[]> {
    const files: BundleFile[] = [];

    // Add tokens.ts file
    const tokensContent = await fetch('/src/theme/exports/tokens.ts').then(r => r.text()).catch(() => `
// Grace OS Reservations Design System Tokens
// Auto-generated bundle

export const GRACE_TOKENS = ${JSON.stringify(GRACE_TOKENS, null, 2)} as const;

export type GraceTokens = typeof GRACE_TOKENS;
`);

    files.push({
      path: 'theme/tokens.ts',
      content: tokensContent,
      type: 'typescript'
    });

    // Add tokens.json file
    files.push({
      path: 'tokens.json',
      content: JSON.stringify(GRACE_TOKENS, null, 2),
      type: 'json'
    });

    // Add grace-theme.css
    const graceThemeCSS = await fetch('/src/theme/exports/grace-theme.css').then(r => r.text()).catch(() => `
/* Grace OS Design System - CSS Variables */
/* Import this file into your project's main CSS file */

@layer base {
  :root {
    /* Grace OS Brand Colors */
    --grace-primary: 16 53% 60%; /* #D87C5A */
    --grace-secondary: 172 100% 19%; /* #005F56 */
    --grace-accent: 43 75% 56%; /* #E9A036 */
    --grace-background: 32 27% 94%; /* #F4EAE0 */
    --grace-foreground: 0 0% 18%; /* #2E2E2E */
    
    /* Semantic Colors */
    --background: 32 27% 94%;
    --foreground: 0 0% 18%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 18%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 18%;
    --primary: 16 53% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 43 75% 56%;
    --secondary-foreground: 0 0% 18%;
    --muted: 31 39% 85%;
    --muted-foreground: 0 0% 45%;
    --accent: 16 53% 60%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 33 20% 77%;
    --input: 33 20% 77%;
    --ring: 16 53% 60%;
    --radius: 0.5rem;
  }
}

/* Grace OS Typography Classes */
.font-playfair { font-family: 'Playfair Display', serif; }
.font-karla { font-family: 'Karla', sans-serif; }
.font-poppins { font-family: 'Poppins', sans-serif; }
.font-markazi { font-family: 'Markazi Text', serif; }
.grace-logo { font-family: 'Markazi Text', serif; }
`);

    files.push({
      path: 'theme/grace-theme.css',
      content: graceThemeCSS,
      type: 'css'
    });

    // Add fonts.css
    const fontsCSS = await fetch('/src/theme/exports/fonts.css').then(r => r.text()).catch(() => `
/* Grace OS Design System - Font Imports */
/* Add this to your project to load Grace OS fonts */

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,200..800;1,200..800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Markazi+Text:wght@400..700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
`);

    files.push({
      path: 'theme/fonts.css',
      content: fontsCSS,
      type: 'css'
    });

    // Add tailwind.extend.json
    const tailwindExtend = await fetch('/src/theme/exports/tailwind.extend.json').then(r => r.text()).catch(() => JSON.stringify({
      theme: {
        extend: {
          colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
              DEFAULT: "hsl(var(--primary))",
              foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
              DEFAULT: "hsl(var(--secondary))",
              foreground: "hsl(var(--secondary-foreground))",
            },
            destructive: {
              DEFAULT: "hsl(var(--destructive))",
              foreground: "hsl(var(--destructive-foreground))",
            },
            muted: {
              DEFAULT: "hsl(var(--muted))",
              foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
              DEFAULT: "hsl(var(--accent))",
              foreground: "hsl(var(--accent-foreground))",
            },
            popover: {
              DEFAULT: "hsl(var(--popover))",
              foreground: "hsl(var(--popover-foreground))",
            },
            card: {
              DEFAULT: "hsl(var(--card))",
              foreground: "hsl(var(--card-foreground))",
            },
          },
          fontFamily: {
            playfair: ['Playfair Display', 'serif'],
            karla: ['Karla', 'sans-serif'],
            poppins: ['Poppins', 'sans-serif'],
            markazi: ['Markazi Text', 'serif'],
            inter: ['Inter', 'sans-serif'],
            lato: ['Lato', 'sans-serif'],
          },
          borderRadius: {
            lg: "var(--radius)",
            md: "calc(var(--radius) - 2px)",
            sm: "calc(var(--radius) - 4px)",
          },
        },
      },
    }, null, 2));

    files.push({
      path: 'tailwind.extend.json',
      content: tailwindExtend,
      type: 'json'
    });

    // Add README.md
    files.push({
      path: 'README.md',
      content: `# Grace OS Design System Bundle

This bundle contains the complete Grace OS design system extracted from the reservations platform.

## Contents

- \`theme/tokens.ts\` - TypeScript design tokens
- \`theme/grace-theme.css\` - CSS variables and utility classes
- \`theme/fonts.css\` - Font imports
- \`tokens.json\` - JSON format design tokens
- \`tailwind.extend.json\` - Tailwind CSS configuration
- \`INTEGRATION.md\` - Detailed integration guide

## Quick Start

1. Upload all files to your Lovable project
2. Import \`theme/fonts.css\` and \`theme/grace-theme.css\` in your main CSS file
3. Merge \`tailwind.extend.json\` into your \`tailwind.config.ts\`
4. Import and use \`GRACE_TOKENS\` from \`theme/tokens.ts\`

## Support

This design system provides the exact styling from Grace OS Reservations platform, including colors, typography, spacing, and component styles.
`,
      type: 'text'
    });

    // Add INTEGRATION.md
    files.push({
      path: 'INTEGRATION.md',
      content: `# Grace OS Design System Integration Guide

## Step 1: Upload Files

Upload all bundle files to your Lovable project:
- Place \`theme/\` folder in \`src/theme/\`
- Place \`tokens.json\` in project root
- Place \`tailwind.extend.json\` in project root

## Step 2: CSS Integration

Add to your main CSS file (\`src/index.css\`):

\`\`\`css
@import './theme/fonts.css';
@import './theme/grace-theme.css';
\`\`\`

## Step 3: Tailwind Configuration

Merge \`tailwind.extend.json\` into your \`tailwind.config.ts\`:

\`\`\`typescript
import type { Config } from "tailwindcss"
import graceExtend from "./tailwind.extend.json"

const config = {
  // ... existing config
  theme: {
    extend: {
      ...graceExtend.theme.extend,
      // ... your existing extends
    }
  }
} satisfies Config

export default config
\`\`\`

## Step 4: TypeScript Integration

Import and use design tokens:

\`\`\`typescript
import { GRACE_TOKENS } from '@/theme/tokens';

// Use in components
const MyComponent = () => (
  <div style={{ backgroundColor: GRACE_TOKENS.colors.primary }}>
    Grace OS Styled Component
  </div>
);
\`\`\`

## Step 5: Component Usage

Use Tailwind classes with Grace OS styling:

\`\`\`tsx
<div className="bg-background text-foreground font-karla">
  <h1 className="text-primary font-playfair text-4xl">Grace OS</h1>
  <p className="text-muted-foreground">Styled with Grace OS design system</p>
</div>
\`\`\`

## Available Font Classes

- \`font-playfair\` - Headings and elegant text
- \`font-karla\` - Body text
- \`font-poppins\` - Subheadings and UI text
- \`font-markazi\` - Brand/logo text (\`grace-logo\` class)
- \`font-inter\` - Modern utility font
- \`font-lato\` - Elegant alternative font

## Color System

All colors are available as Tailwind utilities:
- \`bg-primary\`, \`text-primary\`
- \`bg-secondary\`, \`text-secondary\`
- \`bg-accent\`, \`text-accent\`
- \`bg-background\`, \`text-foreground\`
- \`bg-muted\`, \`text-muted-foreground\`

## Design Tokens Access

Access the complete token system programmatically:

\`\`\`typescript
import { GRACE_TOKENS } from '@/theme/tokens';

// Colors
const primaryColor = GRACE_TOKENS.colors.primary;

// Typography
const headingFont = GRACE_TOKENS.typography.fontFamilies.heading;

// Spacing
const mediumSpacing = GRACE_TOKENS.spacing[4];
\`\`\`

This integration provides the complete Grace OS aesthetic and functionality.
`,
      type: 'text'
    });

    return files;
  }

  static async downloadBundle(files: BundleFile[]): Promise<void> {
    // Create ZIP-like structure as a single downloadable file
    const bundleContent = {
      manifest: {
        name: 'Grace OS Design System',
        version: '1.0.0',
        created: new Date().toISOString(),
        files: files.map(f => ({ path: f.path, type: f.type }))
      },
      files: files.reduce((acc, file) => {
        acc[file.path] = file.content;
        return acc;
      }, {} as Record<string, string>)
    };

    const blob = new Blob([JSON.stringify(bundleContent, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'grace-os-design-system-bundle.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
