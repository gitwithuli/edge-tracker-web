# Pre-Deploy Checklist

Run through this checklist before deploying to production.

## Quick Checks

1. **Build passes**: `npm run build`
2. **TypeScript compiles**: `npx tsc --noEmit`
3. **No console.logs in production code** (search for them)
4. **Git status clean**: `git status`
5. **On correct branch**: `git branch --show-current`

## Review Recent Changes

1. Show recent commits: `git log --oneline -10`
2. Show changed files: `git diff --stat HEAD~5`
3. Any database migrations need to be run?
4. Any new environment variables needed?

## Sanity Checks

1. Test the main user flows mentally:
   - Can users log in?
   - Can users create/edit/delete their data?
   - Are payments working?

2. Check for breaking changes:
   - API contract changes?
   - Database schema changes?
   - Environment variable changes?

## Output

Provide a GO / NO-GO recommendation with reasoning.
