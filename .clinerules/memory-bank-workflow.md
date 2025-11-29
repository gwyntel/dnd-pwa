# Cline's Day-to-Day Memory Bank Workflow

**You are in Coding Mode.** Your memory reset—you remember nothing. This document is your entire brain. Read it completely before every session.

---

## Pre-Flight Ritual (MANDATORY)

Use Cline's tools in exact order. **STOP if any step fails.**

```xml
<!-- 1. Confirm working directory -->
<execute_command>
<command>pwd</command>
</execute_command>

<!-- 2. Read ALL Memory Bank context files -->
<read_file>
<path>.memory-bank/projectbrief.md</path>
</read_file>

<read_file>
<path>.memory-bank/productContext.md</path>
</read_file>

<read_file>
<path>.memory-bank/systemPatterns.md</path>
</read_file>

<read_file>
<path>.memory-bank/techContext.md</path>
</read_file>

<read_file>
<path>.memory-bank/activeContext.md</path>
</read_file>

<read_file>
<path>.memory-bank/progress.md</path>
</read_file>

<!-- 3. Read feature list (THE SINGLE SOURCE OF TRUTH) -->
<read_file>
<path>.memory-bank/feature-list.json</path>
</read_file>

<!-- 4. Review recent git history -->
<execute_command>
<command>git log --oneline -20</command>
</execute_command>

<execute_command>
<command>git status</command>
</execute_command>

<!-- 5. Start environment -->
<execute_command>
<command>./init.sh</command>
</execute_command>
```

**Health Check (Required):** Verify the app starts correctly:
```xml
<execute_command>
<command>curl -f http://localhost:5173 || echo "⚠️  App not responding"</command>
</execute_command>

**Recovery Protocol:** If health check fails:
```xml
<execute_command>
<command>git log --oneline -10</command>
</execute_command>

<execute_command>
<command>git checkout [last-working-commit]</command>
</execute_command>

<execute_command>
<command>echo "Recovered from broken state in $(date)" >> .memory-bank/progress.md</command>
</execute_command>

<execute_command>
<command>./init.sh</command>
</execute_command>
```

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
```xml
<execute_command>
<command>jq '.[] | select(.passes == false) | .id, .priority, .description' .memory-bank/feature-list.json</command>
</execute_command>

### 2. Implement Feature
- Read `systemPatterns.md` for architectural guidance
- Read `techContext.md` for tech stack constraints
- Implement **only** the selected feature

### 3. Test Feature (Method Agnostic)

**Default Testing (No Browser Required):**
```xml
<execute_command>
<command>npm test</command>
</execute_command>

<execute_command>
<command>npm run dev</command>
</execute_command>
```

**If User Requests Browser Verification (Pre-Commit Only):**
```xml
<!-- Use MCP browser tool (e.g., Hyperbrowser) if available -->
<use_mcp_tool>
<server_name>hyperbrowser</server_name>
<tool_name>launch</tool_name>
<arguments>{ "url": "http://localhost:5173" }</arguments>
</use_mcp_tool>

<use_mcp_tool>
<server_name>hyperbrowser</server_name>
<tool_name>screenshot</tool_name>
<arguments>{}</arguments>
</use_mcp_tool>

<!-- Document screenshot path in progress.md -->

<use_mcp_tool>
<server_name>hyperbrowser</server_name>
<tool_name>close</tool_name>
<arguments>{}</arguments>
</use_mcp_tool>
```

**CRITICAL:** After browser verification, I must **CLOSE THE MCP BROWSER TOOL** before:
- Running git commands
- Editing any files
- Writing to progress.md

### 4. Update Documentation

**Append to `progress.md`:**
```xml
<replace_in_file>
<path>.memory-bank/progress.md</path>
<old_content># Project Progress Log</old_content>
<new_content># Project Progress Log

## Session $(date +%Y-%m-%d-%H%M)
- **Feature**: [ID] - [Description]
- **Status**: ✅ COMPLETED / 🚧 IN PROGRESS ([%])
- **Changes**: [Specific files modified]
- **Testing**: [curl/npm test output, or screenshot path if browser used]
- **Issues**: [Any blockers]
- **Commit**: `[hash]`</new_content>
</replace_in_file>
```

**Update `activeContext.md`:**
```xml
<write_to_file>
<path>.memory-bank/activeContext.md</path>
<content># Current Work Focus
- **Session Goal**: Feature [NEXT_ID] - [DESCRIPTION]
- **In Progress**: None
- **Blocked By**: [If applicable]

# Next Steps
1. Feature [NEXT_ID] - [DESCRIPTION]
2. Feature [FOLLOWING_ID] - [DESCRIPTION]

# Active Decisions & Considerations
- [Any recent architectural choices]

# Important Patterns & Preferences
- [Code style notes]

# Learnings & Insights
- [What worked/didn't]
