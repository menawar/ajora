# UI Components

Ajora uses a custom component library built with Tailwind CSS, Lucide icons, and Framer Motion for micro-animations.

## Core Design Principles
- **Glassmorphism**: Translucent backdrop blur effects (`bg-bg-primary/95 backdrop-blur-md`).
- **Micro-interactions**: Interactive elements spring-scale on hover and active click states via `framer-motion`.
- **Accessibility**: Standard ARIA attributes, semantic HTML elements, and keyboard focus state indicator rings (`focus-visible:ring-celo-green`).

## Primitive Components

### `Button`
Extends Framer Motion's `motion.button` props with custom variants and loading states.
- **Props**: `variant` ("primary" | "secondary" | "outline" | "danger" | "ghost"), `size` ("sm" | "md" | "lg"), `isLoading` (boolean), `iconPosition` ("left" | "right").
- **Accessibility**: Automatically disables focus interactions when `isLoading` or `disabled`.

### `Input`
Custom form input with integrated clear actions and error states.
- **Props**: `error` (string), `prefixNode` (ReactNode), `suffixNode` (ReactNode), `loading` (boolean), `onClear` (() => void).

### `OnboardingModal`
Interactive onboarding carousel with touch swipe gestures and sound effect triggers (`useSFX`).
- **Features**: Drag-to-swipe navigation via `framer-motion`, dot progress indicator, sound cues.

### `Card` & `GlassCard`
Container cards with customizable hover tilt/scale micro-animations and border glow styling.

### `ErrorAlert` & Error Utilities
Standardized error boundary wrappers and helper functions in `app/lib/errors.ts` for safe error message parsing.

