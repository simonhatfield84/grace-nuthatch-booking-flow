
# Grace OS Reservations Design System Export

This directory contains a complete, portable design system bundle extracted from the Grace OS Reservations application. These files allow you to integrate the exact Grace OS look and feel into any project.

## 📦 What's Included

### Core Files

- **`tokens.ts`** - TypeScript constants containing all design tokens
- **`grace-theme.css`** - CSS variables and base styling for immediate use
- **`fonts.css`** - Font loading and typography system
- **`tailwind.extend.json`** - Tailwind CSS configuration for easy integration
- **`tokens.json`** - Machine-readable JSON version of all tokens
- **`README.md`** - This documentation file

## 🚀 Quick Start

### Option 1: CSS Variables (Easiest)

Import the CSS files in your main stylesheet or HTML:

```html
<!-- In your HTML head -->
<link rel="stylesheet" href="path/to/fonts.css">
<link rel="stylesheet" href="path/to/grace-theme.css">
```

```css
/* Or in your CSS */
@import url('./theme/fonts.css');
@import url('./theme/grace-theme.css');
```

Now use the CSS variables:

```css
.my-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
  font-family: var(--font-grace-body);
}
```

### Option 2: Tailwind CSS Integration

Merge the `tailwind.extend.json` into your `tailwind.config.js`:

```javascript
// tailwind.config.js
const graceTheme = require('./path/to/tailwind.extend.json');

module.exports = {
  // ... your existing config
  theme: {
    extend: {
      ...graceTheme,
      // ... your other extensions
    }
  }
}
```

Import the fonts and CSS variables:

```css
/* In your main CSS file */
@import url('./theme/fonts.css');
@import url('./theme/grace-theme.css');
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Option 3: JavaScript/TypeScript Integration

Import and use the design tokens programmatically:

```typescript
import { GRACE_TOKENS } from './theme/tokens';

// Use in styled-components, emotion, or any CSS-in-JS
const StyledButton = styled.button`
  background-color: ${GRACE_TOKENS.colors.primary};
  font-family: ${GRACE_TOKENS.typography.fontFamilies.body.join(', ')};
  border-radius: ${GRACE_TOKENS.borderRadius.lg};
`;

// Or in React inline styles
const buttonStyle = {
  backgroundColor: GRACE_TOKENS.colors.primary,
  color: GRACE_TOKENS.colors.light,
  fontFamily: GRACE_TOKENS.typography.fontFamilies.body.join(', ')
};
```

## 🎨 Design System Overview

### Brand Colors

- **Primary**: #D87C5A (Warm Terracotta) - Main brand color
- **Secondary**: #005F56 (Deep Teal) - Supporting brand color  
- **Accent**: #E9A036 (Muted Gold) - Highlight color
- **Background**: #F4EAE0 (Soft Sand) - Main background
- **Dark**: #2E2E2E (Charcoal Grey) - Dark text
- **Light**: #FFFFFF (Pure White) - Light backgrounds

### Typography

- **Headings**: Playfair Display (serif) - Elegant, readable headings
- **Body**: Karla (sans-serif) - Clean, modern body text
- **Subheadings**: Poppins (sans-serif) - Friendly, approachable
- **Brand**: Markazi Text (serif) - Distinctive brand text
- **Modern**: Inter (sans-serif) - Technical/modern contexts
- **Elegant**: Lato (sans-serif) - Refined alternative body text

### Spacing Scale

Uses a consistent spacing scale from 0.125rem (2px) to 24rem (384px) based on Tailwind's default scale.

### Border Radius

- **sm**: calc(0.5rem - 4px)
- **md**: calc(0.5rem - 2px)  
- **lg**: 0.5rem (default)
- **full**: 9999px (rounded)

## 🌙 Dark Theme Support

The system includes a complete dark theme optimized for host interfaces:

```css
/* Automatically applied when .dark class is present */
.dark {
  --background: 214 13% 8%;    /* Dark background */
  --foreground: 0 0% 100%;     /* White text */
  --card: 214 6% 16%;          /* Dark cards */
  /* ... complete dark palette */
}
```

## 📱 Responsive Considerations

The design system is mobile-first and includes:

- Responsive container with center alignment
- Scalable typography system
- Touch-friendly interactive elements
- Optimized font loading for performance

## 🔧 Customization

### Override CSS Variables

Create your own theme by overriding the CSS variables:

```css
:root {
  --primary: 200 50% 60%;  /* Custom primary color */
  --border-radius: 1rem;    /* Larger border radius */
}
```

### Extend Typography

Add your own font families while maintaining the existing system:

```css
:root {
  --font-grace-custom: 'Your Font', var(--font-grace-body);
}

.font-custom {
  font-family: var(--font-grace-custom);
}
```

## 🚨 Important Notes

### Font Loading

The `fonts.css` file uses Google Fonts with `font-display: swap` for optimal performance. Ensure fonts are loaded before applying the design system to avoid layout shift.

### CSS Variable Format

All colors use HSL format without the `hsl()` wrapper to work with Tailwind's opacity modifiers:

```css
/* Correct */
background-color: hsl(var(--primary) / 0.5);  /* 50% opacity */

/* Incorrect */
background-color: var(--primary);  /* Won't work with opacity */
```

### Host Theme Separation

This export is specifically for the Reservations/Admin interface. Host interface styling is separate and should not be mixed with this system.

## 🧪 Testing Your Integration

1. **Visual Check**: Compare components with the Grace OS interface
2. **Typography**: Verify font loading and hierarchy
3. **Colors**: Ensure brand colors match exactly
4. **Responsive**: Test across different screen sizes
5. **Dark Mode**: Verify dark theme switching (if applicable)

## 📄 File Sizes

- `grace-theme.css`: ~3KB (minified)
- `fonts.css`: ~1KB (minified) 
- `tokens.ts`: ~8KB (source)
- `tailwind.extend.json`: ~2KB

## 🤝 Support

This design system was extracted from Grace OS Reservations (lovable.dev project). For questions about implementation or customization, refer to the original application or create an issue in your project repository.

---

**Generated from Grace OS Reservations Design System**  
*Last updated: 2025-08-10*
