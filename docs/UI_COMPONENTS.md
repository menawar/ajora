# UI Components

Ajora uses a custom component library built with Tailwind CSS and Framer Motion for animations.

## Principles
- **Glassmorphism**: We use translucent panels (`glass-panel`) for a modern feel.
- **Micro-interactions**: Components like buttons and cards scale on hover/tap.
- **Accessibility**: All interactive elements have focus rings and ARIA attributes.

## Button
The `Button` component supports variants (default, outline, ghost) and sizes.
It includes built-in hover and tap animations using framer-motion.

## Card
The `Card` component supports `variant` (default, glass, border) and an `interactive` flag.
When interactive, it scales on hover and tap, and receives keyboard focus rings.

## EmptyState
Used for zero-data states (e.g. no stats yet).
Features an icon, title, description, and an optional action component (like a link or button).
