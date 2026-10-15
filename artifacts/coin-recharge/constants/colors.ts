/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#0a0a0a',
    tint: '#ef4059',

    // Core surfaces
    background: '#f7f6f4',
    foreground: '#19191d',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#19191d',

    // Primary action color (buttons, links, active states)
    primary: '#ef4059',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#f0eeed',
    secondaryForeground: '#343238',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#f3f1ef',
    mutedForeground: '#77747a',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#fff4d8',
    accentForeground: '#8b6414',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e9e6e4',
    input: '#e9e6e4',

    // App-specific semantic colors
    coin: '#f3b638',
    coinSoft: '#fff4d8',
    success: '#29b765',
    successSoft: '#eaf8ef',
    info: '#eaf4ff',
    infoForeground: '#386493',
    processingCyan: '#18c6d2',
    scrim: 'rgba(18, 17, 20, 0.58)',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 16,
};

export default colors;
