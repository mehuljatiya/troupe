Compare a Figma design to what's actually built and flag gaps.

If the user hasn't shared a Figma URL, ask for one. Also ask which component or file in the codebase to compare it against.

---

## Step 1 — Read the design

Call `mcp__claude_ai_Figma__whoami` first. If it fails or returns an auth error, tell the user:

> **Figma not connected. Fix it in 30 seconds:**
>
> 1. Press `Ctrl+C` to exit Claude
> 2. In your terminal, run:
>    ```
>    claude mcp add --transport http figma https://mcp.figma.com/mcp --scope user
>    ```
> 3. Type `claude` to reopen Claude Code
> 4. Type `/mcp` → select **figma** → select **Authenticate**
> 5. Log in to Figma in the browser that opens, then come back here
> 6. Re-run `/qa` with your Figma URL

Call `get_design_context` on the provided URL. Call `get_screenshot` to get a visual reference of every variant and state.

---

## Step 2 — Read the built component

Find the component in the codebase. Read its implementation and any associated styles, tokens, and tests.

---

## Step 3 — Compare and report

Output a gap analysis report in this format:

```
# QA Report — [Component Name]
Figma: [url]
Built: [file path]

## Summary
One sentence verdict: how close is the implementation to the design?

## Gaps Found

### Visual
| Property | Figma | Built | Severity |
|---|---|---|---|
| [property] | [design value] | [actual value] | High / Medium / Low |

### Missing States
List every state visible in Figma that is not handled in the implementation.

| State | In Figma | In Code | Notes |
|---|---|---|---|
| [state] | ✓ | ✗ | [what's missing] |

### Missing Variants
List every variant in Figma that has no corresponding implementation.

### Interaction gaps
Describe any behaviours defined in the design (hover, transitions, animations) that are missing or wrong in the code.

### Accessibility gaps
- Missing ARIA attributes
- Keyboard navigation issues
- Colour contrast failures (compare design tokens to WCAG AA)

## What's correct
List things that match the design well — this gives the developer confidence in what not to change.

## Recommended fixes
Prioritised list of what to fix, most important first.

1. [Fix] — why it matters
2. [Fix] — why it matters
```

---

## Severity guide

- **High** — visible to users, breaks the intended experience, or blocks accessibility
- **Medium** — noticeable difference but doesn't break functionality
- **Low** — minor polish, pixel-level spacing, or nice-to-have

---

## Quality check

Before finishing:
- [ ] Every state in Figma is checked against the code
- [ ] All gaps have a severity rating
- [ ] Recommended fixes are ordered by impact, not by what's easiest
- [ ] Nothing invented — all findings come from the Figma file and codebase
