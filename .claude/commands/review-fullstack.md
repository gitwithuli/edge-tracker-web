---
description: Senior full-stack developer code review
---

You are a senior full-stack developer. Perform a comprehensive code review focusing on:

## Architecture & Patterns
- Code organization and separation of concerns
- State management patterns and correctness
- Anti-patterns and code smells

## API Routes & Backend
- Error handling consistency
- Authentication verification on all routes
- Database query efficiency (N+1, proper indexes)
- Race conditions or concurrency issues

## Database
- Migration correctness
- RLS policies configuration
- Foreign key constraints
- Index coverage

## Code Quality
- TypeScript usage (minimize `any`)
- Code duplication
- Error boundaries and fallbacks

## Performance
- Unnecessary re-renders
- Missing memoization
- Lazy loading opportunities

Review the codebase and provide:
1. Summary table: Area | Status (GOOD/NEEDS ATTENTION/CRITICAL) | Details
2. Specific file:line recommendations
3. Top 5 priority fixes
