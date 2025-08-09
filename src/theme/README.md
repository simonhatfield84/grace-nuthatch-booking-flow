
# Host Theme System

> **⚠️ Host-only theme — do not import outside /host routes**

This directory contains the isolated theme system for the Host interface (`/host` routes). It ensures that the Host UI remains visually consistent and cannot be affected by global theme changes or other component styling.

## Architecture

### Theme Files

- **`host-tokens.ts`** - TypeScript constants with exact color, typography, and layout values
- **`host-theme.css`** - Scoped CSS variables under `.host-app` selector
- **`host-theme.d.ts`** - TypeScript definitions for token shape

### Key Principles

1. **Isolation**: Only applies to `/host` routes, zero impact on other parts of the app
2. **Scoped**: All styles are contained under `.host-app` CSS class
3. **Token-based**: Uses semantic design tokens rather than hardcoded values
4. **Immutable**: Protected from global theme changes

## Usage

### In Host Components

```typescript
// Import tokens for programmatic usage
import { HOST_TOKENS } from '@/theme/host-tokens';

// Use in styles
<div style={{ backgroundColor: HOST_TOKENS.colors.background }}>
  Content
</div>

// Or use CSS variables
<div className="host-bg host-text">
  Content
</div>
```

### CSS Variables Available

```css
/* Colors */
--host-bg: #111315
--host-card: #292C2D
--host-text: #FFFFFF
--host-muted: #676767
--host-border: #676767
--host-accent: #D87C5A

/* Layout */
--host-sidebar-collapsed: 4rem
--host-sidebar-expanded: 16rem
--host-container-padding: 1rem
```

## Editing Guidelines

### When to edit `HOST_TOKENS`
- Changing color values, font sizes, or spacing
- Adding new semantic tokens
- Updating layout dimensions

### When to edit `host-theme.css`
- Adding new CSS variables
- Creating new utility classes
- Adding component-specific overrides

### Never edit if:
- Working on non-Host components
- Making changes to booking widget, WiFi pages, admin tools
- The change affects global styling

## Testing

### Visual Regression Testing

Visit `/host/style-preview` to see all Host UI components and verify styling:

- Typography scale (H1-H6, body text)
- Color palette swatches
- Form elements and buttons
- Alert components
- Design token values

### Automated Testing

Run the theme validation script:

```bash
node scripts/assert-host-theme.js
```

This checks for:
- Required CSS variables exist and have values
- Token structure is valid
- No missing essential color definitions

### Manual Testing Checklist

- [ ] Desktop: Full Host interface renders correctly
- [ ] iPad: Sidebar collapsed by default, proper spacing
- [ ] Mobile: Responsive layout, readable text sizes
- [ ] Dark theme enforced regardless of global settings
- [ ] No visual changes to non-Host pages

## File Structure

```
src/theme/
├── host-tokens.ts      # Design token constants
├── host-theme.css      # Scoped CSS variables
├── host-theme.d.ts     # TypeScript definitions
└── README.md           # This file

src/components/layouts/
└── HostLayout.tsx      # Imports and applies theme

scripts/
└── assert-host-theme.js # Build-time validation
```

## Color Palette

| Token | Value | Usage |
|-------|--------|-------|
| `background` | `#111315` | Main background color |
| `card` | `#292C2D` | Card and surface backgrounds |
| `text` | `#FFFFFF` | Primary text color |
| `muted` | `#676767` | Secondary text and borders |
| `accent` | `#D87C5A` | Brand accent color |

## Integration Points

- **HostLayout.tsx**: Applies `.host-app` wrapper and imports theme CSS
- **AdminSidebar.tsx**: Detects host mode and uses host tokens
- **Tailwind**: Utility classes available via plugin configuration
- **Build**: Validation runs during build process

## Troubleshooting

### Theme not applying
1. Check that component is rendered within `/host` route
2. Verify `.host-app` class is present on wrapper element
3. Ensure `host-theme.css` is imported in `HostLayout.tsx`

### Colors look wrong
1. Check browser dev tools for CSS variable values
2. Run `node scripts/assert-host-theme.js` to validate tokens
3. Visit `/host/style-preview` to compare against reference

### Breaking changes
1. Never remove existing tokens without updating all consumers
2. Always test on all supported devices (desktop, iPad, mobile)
3. Verify non-Host pages remain unaffected

---

**Remember**: This theme system only applies to `/host` routes. Changes here should never affect the booking widget, WiFi portal, admin dashboard, or public-facing pages.
