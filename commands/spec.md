Generate a ticket-ready spec from a Figma design.

If the user hasn't shared a Figma URL, ask for one before proceeding.

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
> 6. Re-run `/spec` with your Figma URL

Call `get_design_context` on the provided URL. Also call `get_screenshot` to visually verify all variants and states.

---

## Step 2 — Write the spec

Output a structured spec a PM could paste directly into a Jira/Linear ticket or Notion page.

```
# [Component / Feature Name] — Spec

## Overview
One paragraph: what this is, what problem it solves, where it lives in the product.

## Variants & States
List every variant and state visible in the Figma design. Do not invent states that don't exist in the file.

| Variant / State | Description | Trigger |
|---|---|---|
| [name] | [what it looks like] | [what causes it] |

## Behaviour
Describe every interaction:
- What happens on click / tap
- What happens on hover
- Any transitions or animations
- Error handling visible in the design

## Edge Cases
List at least 3 non-obvious edge cases the developer needs to handle:
- Empty state (no data / no content)
- Long text / overflow
- Loading state
- Error state
- Any other edge cases visible or implied by the design

## Acceptance Criteria
Bulleted checklist a developer can use to verify the feature is complete. Write each item as a testable statement starting with "User can..." or "System should...".

- [ ] User can...
- [ ] System should...

## Open Questions
List anything that is unclear or not defined in the Figma file that needs a decision before development starts.

1. [Question]
2. [Question]

## Out of Scope
Explicitly list anything that looks related but is NOT part of this ticket.
```

---

## Quality check

Before finishing, verify:
- [ ] Every state visible in Figma is listed
- [ ] At least 3 edge cases documented
- [ ] Acceptance criteria are testable, not vague
- [ ] Open questions flag actual gaps — do not leave this section empty if there are genuine unknowns
- [ ] Nothing invented — all content comes from the Figma file
