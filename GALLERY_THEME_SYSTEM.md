# Gallery Theme System Implementation

## Overview

The gallery theme system provides isolated theming for gallery pages (`/gallery/[slug]`) that operates independently from the main application's theme system. This allows galleries to have custom visual styling, fonts, and color schemes without affecting the rest of the application.

## Architecture

### Dual Theme System

The application uses two separate theming systems:

1. **Main App Theme System**
   - Uses `globals.css` 
   - Powered by `next-themes` ThemeProvider
   - Applies to dashboard, auth pages, and other non-gallery routes
   - Supports light/dark mode switching

2. **Gallery Theme System** 
   - Completely isolated from main app theming
   - Custom CSS injection via `GalleryThemeProvider`
   - Theme-specific fonts, colors, and styling
   - No inheritance from `globals.css`

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with main app theming
│   └── gallery/
│       └── [slug]/
│           ├── layout.tsx            # Gallery-specific layout with GalleryThemeProvider
│           └── page.tsx              # Gallery page content
├── components/
│   ├── gallery-theme-provider.tsx   # Core theme injection system
│   ├── gallery-theme-manager.tsx    # Theme selection UI (used in dashboard)
│   └── gallery/
│       └── gallery-view.tsx         # Main gallery component with theme-aware styling
├── lib/
│   └── gallery-themes.ts            # Theme definitions and configuration
└── styles/
    └── globals.css                  # Main app styles (NOT used by gallery)
```

## Core Components

### 1. Gallery Theme Provider (`/src/components/gallery-theme-provider.tsx`)

**Purpose**: Injects dynamic CSS and theme variables for gallery pages.

**Key Features**:
- Creates dynamic `<style>` element in document head
- Applies theme-specific CSS variables to `.gallery-app` container
- Provides font classes (`.gallery-serif`, `.gallery-sans`) with proper inheritance
- Integrates with `next-themes` for light/dark mode detection
- Cleans up styles when component unmounts

**CSS Injection Structure**:
```css
.gallery-app {
  /* Theme variables from gallery-themes.ts */
  --background: oklch(...);
  --foreground: oklch(...);
  --font-serif: "Lora", Georgia, serif;
  /* ... other theme variables */
  
  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
}

.gallery-app .gallery-serif {
  font-family: var(--font-serif, ui-serif, Georgia, serif) !important;
}

.gallery-app .gallery-sans {
  font-family: var(--font-sans, ui-sans-serif, system-ui) !important;
}
```

### 2. Gallery Layout (`/src/app/gallery/[slug]/layout.tsx`)

**Purpose**: Provides theme context for gallery pages.

**Functionality**:
- Fetches event data to determine `themeId`
- Wraps content in `.gallery-app` container
- Passes `themeId` to `GalleryThemeProvider`
- Operates within normal Next.js layout hierarchy (still shows header)

### 3. Gallery Themes Configuration (`/src/lib/gallery-themes.ts`)

**Purpose**: Defines available themes and their properties.

**Theme Structure**:
```typescript
interface GalleryTheme {
  id: string
  name: string
  description: string
  preview: {
    primary: string
    background: string
    accent: string
  }
  lightMode: Record<string, string>
  darkMode: Record<string, string>
}
```

**Available Themes**:

#### Default Theme ("Classic Wedding")
- **ID**: `default`
- **Colors**: Rose and cream tones
- **Font**: `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`
- **Use Case**: Traditional wedding styling

#### Custom Purple Theme ("Custom Purple")
- **ID**: `custom`
- **Colors**: Purple and lavender palette
- **Font**: `"Lora", Georgia, serif` (Google Font)
- **Use Case**: Modern, elegant styling with custom typography

### 4. Gallery Theme Manager (`/src/components/gallery-theme-manager.tsx`)

**Purpose**: Provides UI for theme selection in the dashboard.

**Features**:
- Theme preview cards with mini hero sections
- Live preview showing couple names and date
- Theme switching functionality
- Visual feedback for current and selected themes

**Usage**: Embedded in event dashboard pages for event owners to customize their gallery appearance.

### 5. Gallery View Component (`/src/components/gallery/gallery-view.tsx`)

**Purpose**: Main gallery interface with theme-aware styling.

**Theme Integration**:
- Uses `.gallery-serif` class for couple names and dates
- Inherits all theme colors via CSS variables
- Responsive design with theme-specific styling
- Hero section adapts to theme fonts and colors

## Theme Application Flow

1. **Page Load**: Gallery layout fetches event data including `themeId`
2. **Theme Provider Initialization**: `GalleryThemeProvider` receives `themeId`
3. **Theme Resolution**: Provider looks up theme in `GALLERY_THEMES` configuration
4. **Light/Dark Detection**: Integrates with `next-themes` to determine mode
5. **CSS Injection**: Dynamic `<style>` element created with theme variables
6. **Component Styling**: Gallery components use CSS classes to inherit theme properties

## Font System

### Implementation Strategy

The font system uses CSS classes instead of inline styles to ensure proper inheritance:

**CSS Classes**:
- `.gallery-serif`: Applies `var(--font-serif)` with fallbacks
- `.gallery-sans`: Applies `var(--font-sans)` with fallbacks

**Usage in Components**:
```jsx
<h1 className="text-4xl font-bold gallery-serif">
  {coupleNames}
</h1>
```

**Theme-Specific Fonts**:
- **Custom theme**: `--font-serif: "Lora", Georgia, serif`
- **Default theme**: `--font-serif: ui-serif, Georgia, Cambria, ...`

### Font Loading

Fonts are loaded through the theme system rather than Next.js font optimization to allow dynamic switching.

## Database Integration

### Theme Storage

Themes are stored in the database as part of the event record:

```sql
-- events table
themeId VARCHAR DEFAULT 'default'
```

### Theme Updates

Theme changes are handled through server actions:

```typescript
// /src/app/actions/update-theme.ts
export async function updateEventTheme(eventId: string, themeId: string)
```

## CSS Isolation

### Scope Strategy

Gallery themes are scoped to `.gallery-app` container to prevent conflicts:

```css
.gallery-app {
  /* All theme variables scoped here */
}

.gallery-app .gallery-serif {
  /* Font classes scoped to gallery only */
}
```

### Main App Protection

Main application continues using `globals.css` without interference:
- Dashboard pages use standard Tailwind classes
- Authentication pages use default styling
- Gallery-specific styles don't leak to other routes

## Performance Considerations

### Dynamic CSS Injection

- Single `<style>` element per theme
- CSS is updated, not appended
- Automatic cleanup on component unmount
- Minimal performance impact

### Theme Switching

- Instant theme updates without page reload
- CSS variables enable smooth transitions
- No flash of unstyled content

## Browser Support

### CSS Features Used

- CSS Custom Properties (CSS Variables)
- Modern CSS selectors (`:has()` where supported)
- OKLCH color space for advanced color definitions

### Fallbacks

- Fallback fonts in all font stacks
- Color fallbacks for unsupported formats
- Graceful degradation for older browsers

## Future Extensibility

### Adding New Themes

1. Add theme object to `GALLERY_THEMES` in `gallery-themes.ts`
2. Define `lightMode` and `darkMode` CSS variables
3. Set preview colors for theme manager
4. Theme becomes immediately available in dashboard

### Custom Font Integration

1. Add font loading to theme configuration
2. Update `--font-serif` or `--font-sans` variables
3. Font applies automatically to all gallery text

### Advanced Styling

The system supports any CSS property through the theme variables:
- Custom animations
- Advanced gradients  
- Layout modifications
- Typography scales

## Development Guidelines

### Adding Theme-Aware Components

1. Use CSS classes (`.gallery-serif`, `.gallery-sans`) for fonts
2. Reference CSS variables for colors: `var(--primary)`, `var(--background)`
3. Scope all custom styles to `.gallery-app`
4. Test with both available themes

### Debugging Theme Issues

1. Check browser DevTools for injected `<style id="gallery-theme-styles">`
2. Verify CSS variables are applied to `.gallery-app`
3. Ensure components use theme classes, not inline styles
4. Check `data-gallery-theme` attribute on document root

### Testing

- Test theme switching in dashboard
- Verify font changes in gallery hero section
- Check both light and dark modes
- Ensure no conflicts with main app styling

## Known Limitations

1. **Browser Support**: CSS `:has()` selector has limited support in older browsers
2. **Font Loading**: Fonts load on theme application, not pre-optimized
3. **Theme Persistence**: Themes are event-specific, not user-specific

## Troubleshooting

### Font Not Updating

**Symptoms**: Gallery still shows default fonts after theme change
**Solution**: 
- Check that components use `.gallery-serif` class
- Verify `--font-serif` in injected CSS
- Clear browser cache

### Theme Not Applying

**Symptoms**: Gallery uses default colors despite theme selection
**Solution**:
- Check `themeId` in database
- Verify `GalleryThemeProvider` receives correct `themeId`
- Check browser console for CSS injection errors

### Main App Affected

**Symptoms**: Dashboard or other pages show gallery theme colors
**Solution**:
- Ensure all gallery styles are scoped to `.gallery-app`
- Check for CSS leakage in browser DevTools
- Verify cleanup functions in `GalleryThemeProvider`