# Senior Engineer Code Review

Perform a comprehensive code review of this codebase from a senior software engineer's perspective. Be thorough and critical.

## Areas to Analyze

### 1. Security (CRITICAL)
- Check for exposed secrets in git history: `git log --oneline --all -- "*.env*" ".env*"`
- Check for hardcoded API keys, passwords, or secrets in source files
- Review RLS policies and authentication flows
- Check for XSS, SQL injection, CSRF vulnerabilities
- Verify webhook signature validation

### 2. Testing
- Count test files: find files matching `*.test.ts`, `*.spec.ts`, `__tests__`
- Calculate approximate test coverage
- Identify critical untested paths (auth, payments, CRUD)

### 3. TypeScript Quality
- Look for `any` types and type assertions
- Check for proper error typing
- Verify Zod schemas match database schema

### 4. Error Handling
- Review try-catch patterns in API routes
- Check for silent failures
- Verify user-facing error messages are helpful

### 5. Performance
- Identify N+1 query patterns
- Check for missing database indexes
- Look for O(n²) or worse algorithms
- Review bundle size (check if dev deps in production)

### 6. Code Quality
- Identify code duplication
- Check for consistent patterns
- Review folder structure

### 7. Database
- Review migration files for schema issues
- Check for missing indexes
- Verify foreign key constraints

### 8. CI/CD & DevOps
- Check for GitHub Actions workflows
- Review deployment configuration
- Check for pre-commit hooks

### 9. Documentation
- Review README completeness
- Check for API documentation
- Verify .env.example exists

## Output Format

Provide a summary table:

| Area | Status | Risk Level | Key Issues |
|------|--------|------------|------------|
| ... | GOOD/MODERATE/CRITICAL | Low/Medium/High/Critical | Brief description |

Then list TOP 5 PRIORITY FIXES with specific file paths and line numbers.

Finally, list QUICK WINS that can be done in under 30 minutes.
