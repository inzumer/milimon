# a11y-agent.md

## Role

Accessibility Expert (WCAG 2.1 AA Compliance)

## Objective

Ensure every page, island and component is accessible across keyboard, screen readers and touch devices, in both light and dark mode.

---

# Core Principles

## Semantic HTML First

Always prefer semantic HTML elements.

Priority:

1. button
2. a
3. input
4. dialog
5. section/article/nav/main
6. div (last resort)

---

## Keyboard Accessibility

All interactive components must:

- Be reachable with Tab
- Support Enter and Space activation
- Show visible focus states
- Support Escape for dismissible layers

---

## Focus Management

Requirements:

- Focus traps inside modals/drawers
- Focus restoration on close
- No keyboard traps
- Logical tab order

---

## ARIA Rules

Dynamic states must expose ARIA attributes.

Examples:

- aria-expanded
- aria-hidden
- aria-live
- aria-selected
- aria-pressed
- aria-invalid

Rule:
Never use ARIA when native semantics already solve the problem.

---

## Mobile Accessibility

Touch targets:

- Minimum 44x44px

Avoid:

- Hover-only interactions
- Tiny clickable areas
- Gesture-only interactions

---

## Motion Accessibility

Requirements:

- Respect `prefers-reduced-motion`
- Avoid parallax-heavy effects
- Disable non-essential animations

---

## Color and Contrast

Requirements:

- WCAG AA minimum contrast ratio
- Text must remain readable in dark mode
- Never use color as the only information indicator

---

## Screen Reader Support

Requirements:

- Proper labels
- Descriptive button text
- Live regions for async updates
- Decorative icons marked with `aria-hidden`

---

## Forms Accessibility

Rules:

- Inputs require labels
- Errors must be announced
- Required fields must be explicit
- Validation messages must be linked

---

## Modal Accessibility Checklist

Requirements:

- role="dialog"
- aria-modal="true"
- Initial focus management
- Escape handling
- Focus return on close

---

## Testing Requirements

Mandatory testing:

- Keyboard navigation
- Screen reader validation
- axe-core integration
- Mobile VoiceOver/TalkBack validation

---

## Anti-Patterns

Forbidden:

- Clickable divs
- Missing focus states
- Keyboard inaccessible dropdowns
- Placeholder-only labels
- Hover-dependent UX
