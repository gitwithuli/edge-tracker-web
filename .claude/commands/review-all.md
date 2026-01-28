---
description: Run comprehensive code review (full-stack, frontend, security)
---

Run three parallel code reviews from senior specialists. Launch all three simultaneously using the Task tool:

## 1. Senior Full-Stack Developer Review

Focus areas:
- Architecture & code organization
- State management patterns (Zustand, React Query, etc.)
- API routes - error handling, auth verification
- Database queries - N+1, indexes, RLS policies
- Code quality - TypeScript usage, duplication
- Performance - memoization, lazy loading

Key files to review:
- Main state management hooks
- API routes (especially payments, webhooks)
- Middleware
- Database migrations

Output: Summary table with status (GOOD/NEEDS ATTENTION/CRITICAL) and file:line recommendations.

## 2. Senior Frontend Specialist Review

Focus areas:
- Component architecture - decomposition, prop drilling
- Responsive design - breakpoints, mobile issues
- Accessibility (a11y) - ARIA labels, keyboard nav, focus states, color contrast
- UX patterns - loading states, error states, empty states
- CSS/Tailwind consistency
- React best practices - hooks, keys, cleanup

Key files to review:
- Main UI components (dialogs, forms)
- Dashboard and detail pages
- Shared component library

Output: Specific recommendations with file:line references, prioritized by severity.

## 3. Senior Security Expert Review

Focus areas:
- Authentication & authorization flows
- Input validation (Zod schemas, sanitization)
- Secrets & environment variables
- Webhook security (signature verification, replay prevention)
- RLS policies and data isolation
- OWASP Top 10 assessment

Key files to review:
- API routes (especially webhooks, payments)
- Middleware
- Supabase admin client
- All database migrations

Output: Risk assessment with severity levels (LOW/MEDIUM/HIGH/CRITICAL) and remediation steps.

---

After all reviews complete, provide a consolidated summary with:
1. Top priority fixes table
2. Quick wins (< 30 min each)
3. Overall production-readiness assessment
