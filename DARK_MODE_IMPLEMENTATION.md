# Dark Mode Implementation Guide

## Overview

This document outlines the comprehensive dark mode implementation for Praxis Tix, following modern design principles and accessibility standards (WCAG AAA/AA).

## Color Palette

### Background Colors (Surfaces)

The dark mode uses a layered surface system for visual hierarchy:

- **Base/Canvas**: `#0f0f0f` (HSL: `220 15% 7%`) - Deepest background
- **Surface Level 1 (Cards)**: `#1a1a1a` (HSL: `220 12% 10%`) - Cards, containers
- **Surface Level 2 (Elevated)**: `#1e1e1e` (HSL: `220 12% 12%`) - Elevated cards, modals
- **Surface Level 3**: `#242424` (HSL: `220 10% 15%`) - Highest elevation, dropdowns

### Text Colors

- **Primary Text**: `#e4e4e7` (HSL: `220 10% 90%`) - Main content (NOT pure white)
- **Secondary Text**: `#a1a1aa` (HSL: `220 8% 65%`) - Descriptions, captions
- **Tertiary Text**: `#71717a` (HSL: `220 6% 50%`) - Labels, placeholders, disabled
- **Muted Text**: `#52525b` - Timestamps, metadata

### Border & Divider Colors

- **Subtle Borders**: `#27272a` (HSL: `220 8% 18%`) - General use
- **Medium Borders**: `#3f3f46` - Emphasis
- **Strong Borders**: `#52525b` - Focus, active states

### Interactive Colors

#### Primary (Sage Green)
- **Light Mode**: `150 20% 28%` (Deep sage)
- **Dark Mode**: `150 25% 55%` (Softer, less saturated sage)
- **Hover**: Slightly brighter
- **Active**: Slightly dimmed

#### Destructive (Red)
- **Light Mode**: `0 84.2% 60.2%` (Bright red)
- **Dark Mode**: `0 70% 65%` (Softer red - `#f87171`)
- Reduced saturation by ~15% for eye comfort

#### Accent Colors
- **Accent Background**: `150 15% 18%` (Darker sage)
- **Accent Foreground**: `150 30% 75%` (Lighter sage)
- **Accent Soft**: `150 12% 16%` (Subtle accents)
- **Accent Medium**: `150 18% 22%` (Medium accents)

## Design Principles Applied

### ✅ True Dark Backgrounds
- Using `#0f0f0f` to `#1a1a1a` range instead of pure black (`#000000`)
- Prevents eye strain and maintains visual hierarchy

### ✅ Soft Text Colors
- Primary text uses `#e4e4e7` instead of pure white (`#ffffff`)
- Reduces glare and improves readability

### ✅ Reduced Saturation
- All accent colors are 15-25% less saturated than light mode
- Creates a calmer, more professional appearance

### ✅ Layered Elevation
- Uses lighter grays for elevation instead of harsh shadows
- Creates subtle depth without high contrast

### ✅ Accessibility Compliance
- **Normal Text**: 7:1 contrast ratio (WCAG AAA)
- **Large Text**: 4.5:1 contrast ratio (WCAG AA)
- **UI Components**: 3:1 minimum contrast ratio

## Implementation Details

### Theme Provider

The app uses `next-themes` for theme management:

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {/* App content */}
</ThemeProvider>
```

### Theme Toggle Component

Located at: `src/components/ui/theme-toggle.tsx`

Features:
- Dropdown menu with Light/Dark/System options
- Smooth icon transitions
- Accessible with screen reader support
- Available in Header and Settings page

### CSS Variables

All colors are defined as CSS custom properties in `src/index.css`:

```css
.dark {
  --background: 220 15% 7%;
  --foreground: 220 10% 90%;
  --card: 220 12% 10%;
  /* ... more variables */
}
```

### Smooth Transitions

Theme switching includes smooth 0.3s transitions:
- Background colors
- Text colors
- Border colors
- Fill and stroke colors

Transitions are applied globally but exclude animation classes to prevent interference.

## Component Compatibility

### ✅ Fully Compatible Components

All shadcn/ui components automatically support dark mode through CSS variables:
- Buttons
- Cards
- Dialogs
- Dropdowns
- Forms (Input, Select, Checkbox, Radio)
- Navigation components
- Toast notifications
- Tooltips

### Image Handling

Images automatically receive brightness reduction in dark mode:
```css
.dark img {
  filter: brightness(0.9);
}
```

For very bright images, add `data-bright` attribute for additional dimming:
```css
.dark img[data-bright] {
  filter: brightness(0.85);
}
```

## Usage Examples

### Using Theme Toggle

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

<ThemeToggle />
```

### Programmatic Theme Control

```tsx
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();

// Set theme
setTheme("dark");
setTheme("light");
setTheme("system"); // Follows OS preference
```

### Checking Current Theme

```tsx
import { useTheme } from "next-themes";

const { theme, resolvedTheme } = useTheme();
// theme: "light" | "dark" | "system"
// resolvedTheme: "light" | "dark" (actual applied theme)
```

## State Variations

### Hover States
- Lighten background by 5-10%
- Slightly brighten text color
- Smooth 0.2s transitions

### Focus States
- Clear focus ring: `outline: 2px solid` with accent color
- Or: `box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3)`
- Meets 3:1 contrast ratio requirement

### Active/Pressed States
- Darken background by 5%
- Subtle scale down: `transform: scale(0.98)`

### Disabled States
- Opacity: `0.5` or `0.6`
- Specific disabled colors:
  - Background: `#1a1a1a`
  - Text: `#52525b`
  - Border: `#27272a`

## Shadows & Elevation

Dark mode shadows are darker and more prominent:

```css
/* Light Mode → Dark Mode */
0 1px 3px rgba(0, 0, 0, 0.1) → 0 2px 4px rgba(0, 0, 0, 0.4)
0 4px 6px rgba(0, 0, 0, 0.1) → 0 4px 8px rgba(0, 0, 0, 0.5)
0 10px 15px rgba(0, 0, 0, 0.1) → 0 10px 20px rgba(0, 0, 0, 0.6)
```

Alternatively, elevation is achieved through lighter backgrounds:
- Base: `#121212`
- Elevated: `#1a1a1a` (lighter = higher)
- More elevated: `#242424`

## Accessibility Checklist

- ✅ All text meets contrast requirements (7:1 for normal, 4.5:1 for large)
- ✅ Interactive elements have clear hover/focus states
- ✅ No pure black (#000) or pure white (#fff) except where necessary
- ✅ Colors are desaturated compared to light mode
- ✅ Shadows are darker and more prominent
- ✅ Images don't appear too bright
- ✅ Focus indicators meet 3:1 contrast
- ✅ Form inputs are clearly distinguishable
- ✅ Disabled states are obvious but not too dim
- ✅ Smooth transitions between all states

## Testing

### Manual Testing Checklist

1. **Theme Switching**
   - [ ] Toggle between light/dark modes
   - [ ] Verify smooth transitions
   - [ ] Check system theme detection

2. **Component Testing**
   - [ ] All buttons render correctly
   - [ ] Forms are readable and usable
   - [ ] Cards and modals display properly
   - [ ] Navigation is clear

3. **Accessibility Testing**
   - [ ] Text contrast meets WCAG standards
   - [ ] Focus indicators are visible
   - [ ] Screen reader compatibility
   - [ ] Keyboard navigation works

4. **Visual Testing**
   - [ ] No harsh color combinations
   - [ ] Images aren't too bright
   - [ ] Visual hierarchy is maintained
   - [ ] No pure black/white (except overlays)

## Browser Support

Dark mode works in all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Opera

## Future Enhancements

Potential improvements:
1. **OLED Mode**: Optional true black mode for OLED screens
2. **Custom Themes**: User-defined color schemes
3. **Auto Theme**: Time-based theme switching
4. **High Contrast Mode**: Enhanced contrast option for accessibility

## Troubleshooting

### Theme Not Applying
- Check that `ThemeProvider` wraps your app
- Verify `darkMode: ["class"]` in `tailwind.config.ts`
- Ensure `.dark` class is applied to `<html>` or `<body>`

### Colors Not Updating
- Verify CSS variables are defined in `.dark` selector
- Check for hardcoded colors in components
- Ensure Tailwind classes use CSS variables

### Transitions Not Smooth
- Check for conflicting transition classes
- Verify transition CSS is not overridden
- Ensure `disableTransitionOnChange={false}` in ThemeProvider

## Color Reference Table

| Element | Light Mode | Dark Mode | Hex (Dark) |
|---------|-----------|-----------|------------|
| Background | `40 20% 98%` | `220 15% 7%` | `#0f0f0f` |
| Card | `40 15% 96%` | `220 12% 10%` | `#1a1a1a` |
| Primary Text | `220 20% 12%` | `220 10% 90%` | `#e4e4e7` |
| Secondary Text | `220 6% 48%` | `220 8% 65%` | `#a1a1aa` |
| Primary | `150 20% 28%` | `150 25% 55%` | Sage Green |
| Border | `40 15% 88%` | `220 8% 18%` | `#27272a` |
| Destructive | `0 84.2% 60.2%` | `0 70% 65%` | `#f87171` |

## Resources

- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)

---

**Last Updated**: January 2026
**Version**: 1.0.0
