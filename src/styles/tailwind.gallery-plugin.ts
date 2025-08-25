import plugin from 'tailwindcss/plugin'

/**
 * Tailwind CSS plugin for gallery theme-aware utilities
 * Provides ergonomic classes that map to CSS variables
 */
export const galleryPlugin = plugin(function({ addUtilities, addComponents }) {
  // Color utilities using CSS variables
  addUtilities({
    // Text colors
    '.text-fg': { color: 'var(--foreground)' },
    '.text-muted': { color: 'var(--muted-foreground)' },
    '.text-primary': { color: 'var(--primary)' },
    '.text-secondary': { color: 'var(--secondary)' },
    '.text-accent': { color: 'var(--accent)' },
    '.text-destructive': { color: 'var(--destructive)' },
    '.text-success': { color: 'var(--success)' },
    '.text-warning': { color: 'var(--warning)' },

    // Background colors
    '.bg-background': { backgroundColor: 'var(--background)' },
    '.bg-card': { backgroundColor: 'var(--card)' },
    '.bg-muted': { backgroundColor: 'var(--muted)' },
    '.bg-primary': { backgroundColor: 'var(--primary)' },
    '.bg-secondary': { backgroundColor: 'var(--secondary)' },
    '.bg-accent': { backgroundColor: 'var(--accent)' },
    '.bg-destructive': { backgroundColor: 'var(--destructive)' },
    '.bg-success': { backgroundColor: 'var(--success)' },
    '.bg-warning': { backgroundColor: 'var(--warning)' },

    // Border colors
    '.border-border': { borderColor: 'var(--border)' },
    '.border-input': { borderColor: 'var(--input)' },
    '.border-primary': { borderColor: 'var(--primary)' },
    '.border-secondary': { borderColor: 'var(--secondary)' },
    '.border-accent': { borderColor: 'var(--accent)' },
    '.border-destructive': { borderColor: 'var(--destructive)' },
    '.border-success': { borderColor: 'var(--success)' },
    '.border-warning': { borderColor: 'var(--warning)' },

    // Ring colors
    '.ring-ring': { '--tw-ring-color': 'var(--ring)' },
    '.ring-primary': { '--tw-ring-color': 'var(--primary)' },
    '.ring-secondary': { '--tw-ring-color': 'var(--secondary)' },
    '.ring-accent': { '--tw-ring-color': 'var(--accent)' },
    '.ring-destructive': { '--tw-ring-color': 'var(--destructive)' },
    '.ring-success': { '--tw-ring-color': 'var(--success)' },
    '.ring-warning': { '--tw-ring-color': 'var(--warning)' },

    // Shadow utilities
    '.shadow-themed': { 
      boxShadow: '0 1px 3px 0 var(--shadow), 0 1px 2px -1px var(--shadow)'
    },
    '.shadow-themed-md': {
      boxShadow: '0 4px 6px -1px var(--shadow), 0 2px 4px -2px var(--shadow)'
    },
    '.shadow-themed-lg': {
      boxShadow: '0 10px 15px -3px var(--shadow), 0 4px 6px -4px var(--shadow)'
    },
    '.shadow-themed-xl': {
      boxShadow: '0 20px 25px -5px var(--shadow), 0 8px 10px -6px var(--shadow)'
    },

    // Radius utilities
    '.rounded-themed': { borderRadius: 'var(--radius)' },
    '.rounded-themed-sm': { borderRadius: 'var(--radius-sm)' },
    '.rounded-themed-lg': { borderRadius: 'var(--radius-lg)' },
  })

  // Typography components using font CSS variables
  addComponents({
    '.gallery-heading': {
      fontFamily: 'var(--font-serif, ui-serif, Georgia, serif)',
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
      color: 'var(--foreground)',
    },
    '.gallery-heading-1': {
      fontSize: '2.25rem', // text-4xl
      '@screen md': {
        fontSize: '3.75rem', // md:text-6xl
      },
    },
    '.gallery-heading-2': {
      fontSize: '1.875rem', // text-3xl
      '@screen md': {
        fontSize: '3rem', // md:text-5xl
      },
    },
    '.gallery-heading-3': {
      fontSize: '1.5rem', // text-2xl
      '@screen md': {
        fontSize: '2.25rem', // md:text-4xl
      },
    },
    '.gallery-text': {
      fontFamily: 'var(--font-sans, ui-sans-serif, system-ui)',
      color: 'var(--foreground)',
      lineHeight: '1.6',
    },
    '.gallery-text-muted': {
      fontFamily: 'var(--font-sans, ui-sans-serif, system-ui)',
      color: 'var(--muted-foreground)',
      lineHeight: '1.6',
    },
    '.gallery-caption': {
      fontFamily: 'var(--font-serif, ui-serif, Georgia, serif)',
      fontSize: '1rem',
      fontStyle: 'italic',
      color: 'var(--muted-foreground)',
      lineHeight: '1.5',
    },
  })
})

export default galleryPlugin