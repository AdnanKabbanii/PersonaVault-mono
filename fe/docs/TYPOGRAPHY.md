# Typography System

This document outlines the typography system for PersonaVault, following [web.dev font best practices](https://web.dev/articles/font-best-practices) for optimal performance and maintainability.

## Font Stack

### Primary Fonts
- **Inter** - Primary body text font (system font fallback)
- **Poppins** - Display font for headings and large text
- **JetBrains Mono** - Monospace font for code and technical content

### Font Loading Strategy
- **Preload**: Critical fonts (Inter, Poppins) are preloaded for performance
- **Display**: `font-display: swap` for optimal loading experience
- **Subsets**: Latin subset only to reduce file size
- **Variable fonts**: Using CSS custom properties for easy theming

## Typography Scale

### Display Styles
- `display-1`: 60px (3.75rem) - Hero headlines
- `display-2`: 48px (3rem) - Large section headers
- `display-3`: 36px (2.25rem) - Section headers

### Heading Styles
- `heading-1`: 30px (1.875rem) - Page titles
- `heading-2`: 24px (1.5rem) - Section titles
- `heading-3`: 20px (1.25rem) - Subsection titles
- `heading-4`: 18px (1.125rem) - Card titles

### Body Styles
- `body`: 16px (1rem) - Default body text
- `body-small`: 14px (0.875rem) - Secondary text
- `body-large`: 18px (1.125rem) - Emphasized text

### UI Styles
- `caption`: 12px (0.75rem) - Captions and metadata
- `button-text`: 14px (0.875rem) - Button text

### Code Styles
- `code`: 14px (0.875rem) - Inline code
- `code-large`: 16px (1rem) - Code blocks

## Usage

### CSS Classes
```css
/* Display text */
<h1 class="display-1">Hero Title</h1>
<h2 class="display-2">Section Header</h2>

/* Body text */
<p class="body">Regular paragraph text</p>
<p class="body-small">Smaller text for captions</p>

/* Code */
<code class="code">inline code</code>
<pre class="code-large">code block</pre>
```

### React Components
```tsx
import { Typography } from "@/components/ui/typography";

// Display components
<Typography.Display1>Hero Title</Typography.Display1>
<Typography.Display2>Section Header</Typography.Display2>

// Heading components
<Typography.H1>Page Title</Typography.H1>
<Typography.H2>Section Title</Typography.H2>

// Body components
<Typography.Body>Regular paragraph text</Typography.Body>
<Typography.BodySmall>Smaller text</Typography.BodySmall>

// Code components
<Typography.Code>inline code</Typography.Code>
```

### Tailwind Classes
```tsx
// Font families
<div className="font-sans">Inter font</div>
<div className="font-display">Poppins font</div>
<div className="font-mono">Monospace font</div>
```

## Responsive Behavior

The typography system includes responsive breakpoints:

- **Desktop**: Full font sizes
- **Tablet (768px)**: Reduced sizes for better readability
- **Mobile (480px)**: Further reduced sizes for mobile optimization

## Performance Optimizations

1. **Font Loading**: Critical fonts preloaded with `font-display: swap`
2. **Subsets**: Only Latin characters loaded to reduce file size
3. **Variable Fonts**: CSS custom properties for easy theming
4. **System Font Fallback**: Graceful degradation to system fonts
5. **Preconnect**: Early connection setup for external font providers

## Best Practices

### When to Use Each Style
- **Display**: Hero sections, large marketing text
- **Headings**: Page structure and hierarchy
- **Body**: Main content and readable text
- **UI**: Interface elements and interactive components
- **Code**: Technical content and code snippets

### Accessibility
- **Color Contrast**: Ensure sufficient contrast ratios
- **Line Height**: Adequate spacing for readability
- **Font Size**: Minimum 12px for body text
- **Responsive**: Text scales appropriately on mobile

### Performance
- **Preload**: Critical fonts only
- **Subsets**: Load only needed character sets
- **Optimization**: Use WOFF2 format when possible
- **Caching**: Leverage browser caching for fonts

## Customization

### Adding New Fonts
1. Add font to `src/lib/fonts.ts`
2. Update font families in Tailwind config
3. Add CSS classes to `src/lib/typography.css`
4. Create React components in `src/components/ui/typography.tsx`

### Modifying Existing Styles
1. Update the typography scale in `src/lib/fonts.ts`
2. Modify CSS classes in `src/lib/typography.css`
3. Update Tailwind configuration if needed
4. Test across different screen sizes

## File Structure
```
src/
├── lib/
│   ├── fonts.ts          # Font configuration
│   └── typography.css    # Typography CSS classes
├── components/
│   └── ui/
│       └── typography.tsx # Typography React components
└── app/
    └── layout.tsx        # Font loading in layout
```

This typography system provides a scalable, performant, and maintainable approach to typography across the entire PersonaVault application. 