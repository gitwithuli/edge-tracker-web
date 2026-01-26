# Quick Security Audit

Run a focused security audit on this codebase. Be fast but thorough on security issues.

## Checks to Perform

1. **Secrets in Git**
   - Run: `git log --oneline --all -- "*.env*" ".env*"`
   - Search for hardcoded keys: `grep -r "sk_live\|sk_test\|api_key\|secret\|password" --include="*.ts" --include="*.tsx" --include="*.js" src/`

2. **Environment Files**
   - Verify .env* files are in .gitignore
   - Check if .env.example exists (it should)
   - Look for hardcoded URLs or emails in source

3. **Authentication**
   - Review auth callback routes
   - Check session handling
   - Verify RLS policies exist

4. **API Security**
   - Check for rate limiting
   - Verify webhook signature validation
   - Look for missing auth checks on protected routes

5. **Input Validation**
   - Check Zod schemas are used on all inputs
   - Look for raw JSON.parse without validation

## Output

Rate overall security: CRITICAL / NEEDS WORK / ACCEPTABLE / GOOD

List issues found with severity (CRITICAL/HIGH/MEDIUM/LOW) and file paths.
