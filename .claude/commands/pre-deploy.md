# Pre-Deploy Checklist

Run through this checklist before deploying to production.

## Quick Checks

1. **Build passes**: `npm run build`
2. **TypeScript compiles**: `npx tsc --noEmit`
3. **Lint passes**: `npm run lint`
4. **No console.logs in production code** (search for them)
5. **Git status clean**: `git status`
6. **On correct branch**: `git branch --show-current`

## Review Recent Changes

1. Show recent commits: `git log --oneline -10`
2. Show changed files: `git diff --stat HEAD~5`
3. Any database migrations need to be run?
4. Any new environment variables needed?

## Environment Checks

1. All required env vars set in production?
2. API keys are production keys (not test)?
3. Database connection string is production?

## Sanity Checks

1. Test the main user flows mentally:
   - Can users log in?
   - Can users create/edit/delete their data?
   - Are payments working?

2. Check for breaking changes:
   - API contract changes?
   - Database schema changes?
   - Environment variable changes?

## Post-Deploy Verification

1. [ ] Site loads without errors
2. [ ] Can log in
3. [ ] Core feature works
4. [ ] No console errors in browser
5. [ ] Check error monitoring (if any)

## Output

Provide a GO / NO-GO recommendation with reasoning.
