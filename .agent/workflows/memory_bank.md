---
description: Memory Bank Workflow for managing project context and features
---
# Memory Bank Workflow

**You are in Coding Mode.** Your memory reset—you remember nothing. This document is your entire brain. Read it completely before every session.

## Pre-Flight Ritual (MANDATORY)

Use tools in exact order. **STOP if any step fails.**

1. **Confirm working directory**
   ```bash
   pwd
   ```

2. **Read ALL Memory Bank context files**
   - `.memory-bank/projectbrief.md`
   - `.memory-bank/productContext.md`
   - `.memory-bank/systemPatterns.md`
   - `.memory-bank/techContext.md`
   - `.memory-bank/activeContext.md`
   - `.memory-bank/progress.md`

3. **Read feature list (THE SINGLE SOURCE OF TRUTH)**
   - `.memory-bank/feature-list.json`

4. **Review recent git history**
   ```bash
   git log --oneline -20
   git status
   ```

5. **Start environment**
   ```bash
   ./init.sh
   ```

**Health Check (Required):** Verify the app starts correctly:
```bash
curl -f http://localhost:5173 || echo "⚠️  App not responding"
```

**Recovery Protocol:** If health check fails:
1. `git log --oneline -10`
2. `git checkout [last-working-commit]`
3. `echo "Recovered from broken state in $(date)" >> .memory-bank/progress.md`
4. `./init.sh`

---

## Session Constraints (UNBREAKABLE RULES)

1. **ONE FEATURE PER SESSION** - Implement exactly one `feature-list.json` item
2. **END-TO-END TESTING** - Verify features work as a real user would
3. **NEVER EDIT FEATURE CRITERIA** - Only toggle `"passes": false` to `true`. Never modify `steps` or `description`.
4. **CLEAN HANDOFF REQUIRED** - Code must be production-ready: no major bugs, well-documented, mergeable.
5. **UPDATE PROGRESS LOG** - Append to `progress.md` at session end.
6. **OPTIONAL BROWSER VERIFICATION** - Use MCP browser tools only if user requests verification before final commit.

---

## Work Phase

### 1. Select Feature
```bash
jq '.[] | select(.passes == false) | .id, .priority, .description' .memory-bank/feature-list.json
```

### 2. Implement Feature
- Read `systemPatterns.md` for architectural guidance
- Read `techContext.md` for tech stack constraints
- Implement **only** the selected feature

### 3. Test Feature (Method Agnostic)

**Default Testing (No Browser Required):**
```bash
npm test
npm run dev
```

**If User Requests Browser Verification (Pre-Commit Only):**
- Use `browser_subagent` or `launch` tool to check `http://localhost:5173`.
- Take screenshots if needed.
- **CRITICAL:** Close browser tool before committing.

### 4. Update Documentation

**Append to `progress.md`:**
Update `.memory-bank/progress.md` with session details:
- Feature ID and Description
- Status
- Changes
- Testing results
- Issues
- Commit hash

**Update `activeContext.md`:**
Update `.memory-bank/activeContext.md` with:
- Current Work Focus
- Next Steps
- Active Decisions
- Learnings
