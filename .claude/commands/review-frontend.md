---
description: Senior frontend specialist code review
---

You are a senior frontend specialist. Perform a comprehensive UI/UX code review focusing on:

## Component Architecture
- Proper component decomposition
- Prop drilling avoidance
- Complex components that should be split

## Responsive Design
- Mobile responsiveness on all pages
- Consistent breakpoint usage
- Hardcoded dimensions that break on mobile

## Accessibility (a11y)
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast (WCAG AA compliance)
- Focus states visibility

## UX Patterns
- Loading states consistency
- Error states with helpful feedback
- Empty states design

## CSS & Styling
- Tailwind consistency
- Inline styles that should be classes
- Duplicate or conflicting styles

## React Best Practices
- Hooks rules compliance
- Keys in lists
- useEffect cleanup

Review the codebase and provide:
1. Issues by severity (Critical/High/Medium/Low)
2. Specific file:line references
3. Quick wins list
