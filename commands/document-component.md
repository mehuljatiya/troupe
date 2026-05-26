---
description: Generates a detailed component documentation figma frame in the same page where given component lives. Renders it as HTML for browser review, then pushes documentation as real Figma nodes into the same design file page where the component lives. Use when the user shares a Figma link to a component documentation page and asks for docs, a .md file, or a written reference.
---

# Document Component

You are generating developer-ready component documentation from a Figma design system page, rendering it for browser review, and pushing it as real Figma nodes into the **same design file page where the component lives**.

> **CRITICAL — Where to push docs:**
> Always push into the **Figma design file** (figma.com/design/...) on the same page as the component.
> **NEVER push to FigJam.** The `generate_diagram` MCP tool only supports FigJam — do NOT use it.

---

## Token budget rules — read before starting

These apply to every run. No exceptions.

1. **Research max 4 design systems.** Search at most 4 external sources (not 8). Prioritise: Material Design, Polaris, Carbon, Primer — pick whichever 4 are most relevant to the component type. Fetch only the specific component page, not the entire doc site.
2. **`excludeScreenshot: true` on data-only sections.** Screenshots are only useful where visual verification matters. Use `excludeScreenshot: true` on Props & Tokens, Accessibility, Usage Guidelines, and Platform sections — code alone is sufficient there. Keep screenshots enabled for Variations and Anatomy, where you need to visually verify all variants and component structure are captured correctly.
3. **Two `use_figma` calls maximum to build the doc frame.** Call 1: inspect — get all page names, component IDs, node IDs needed. Call 2: build the entire frame. Avoid iterative inspect → partial-build → fix loops.
4. **One final screenshot only.** Do not screenshot individual sections or tables during building. Screenshot the completed doc frame once at the end.
5. **Fetch only the sections that contain variant/token data.** If `get_design_context` on the top-level node is too large, fetch only the sections that carry structured data (Variations, Props & Tokens). Skip fetching sections that are plain text (Introduction, Usage Guidelines) — write those from what you can infer.

---

## Step 0 — Prerequisites Check

Call `mcp__claude_ai_Figma__whoami`. If it fails or returns an auth error:

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
> 6. Re-run `/document-component` with your Figma URL

Stop here — do not proceed until Figma MCP is confirmed working.

---

## Step 1 — Parse the Figma URL

Extract `fileKey` and `nodeId` from the URL:
- `figma.com/design/:fileKey/:name?node-id=:int-:int` → nodeId = `int:int` (replace `-` with `:`)
- If no URL is provided, ask for one before proceeding.

---

## Step 2 — Fetch the Design Context

Call `get_design_context` with **`excludeScreenshot: true`** on the top-level node. If the result is too large:
1. Read the saved output file
2. Extract all top-level section frame IDs using: `<frame id="..." name="Container" x="32" ...>`
3. Call `get_design_context` (with `excludeScreenshot: true`) **in parallel** on Variations and Props & Tokens sections only — these carry the structured data you need. Infer Introduction and Usage Guidelines from the component name and token data.

Typical sections:
- Variations (add actual component snapshots under each variant — see Step 6)
- Props & Tokens
- Usage Guidelines — add Do/Don't samples wherever possible
- Platform — only if min/max width data is explicitly available in the Figma component

Parse React/Tailwind code for design token values (color hex, spacing, radius, typography).
**Do not call `get_screenshot` during this step.** A single screenshot at the end (Step 6) is sufficient.

---

## Step 3 — Write the Markdown File

Save as `[component-name].md` in the current directory. Follow this exact structure — no placeholders:

```markdown
# [Component Name] — [Design System Name]

> **Source:** [Design System / Documentation](figma-url) · [company].com

---

## Introduction

[One paragraph: what it is, what it does, types/sizes/variants/special modes.]

---

## Anatomy

[Describe each structural part — table only. NO ASCII diagrams.]

| Part | Description |
|---|---|
| **[part]** | [description] |

---

## Variations

### [Category — e.g. Type]

[One-line description of what this variation controls.]

| Variant | Visual Style | When to use |
|---|---|---|
| **[Name]** | [appearance] | [context] |

[Component snapshots are embedded in the Figma doc — not in the markdown]

---

### States

| State | Description |
|---|---|
| **Default** | Resting state |
| **Hover** | Pointer over element |
| **Focus** | Keyboard / programmatic focus |
| **Pressed** | Actively clicked or tapped |
| **Disabled** | Non-interactive |

---

## Props & Tokens

### Props

| Prop Name | Required | Type | Default | Description |
|---|---|---|---|---|
| `[prop]` | ✱ / — | `[type]` | `[default]` | [description] |

> ✱ = required

---

### Design Tokens — [Variant]

> **Token rule:** Always use token names in every applicable column. Raw values (hex, px, numbers) go alongside the token as a reference — never as the only value. For example: `--sds-size-14` with `14px` in the Value column; `var(--sds-weight-medium) — 500` in typography.

| Property | Token Name | Value |
|---|---|---|
| [property] | `--[token]` | `[value]` |

---

### Size Tokens

| Size | Height | H. Padding | V. Padding | Min Width |
|---|---|---|---|---|
| Large | `[px]` | `--[token]` ([px]) | `[px]` | `[px]` |

---

### Typography

> **Token rule:** Family, Size, and Weight columns MUST use token names with raw values as reference (e.g. `var(--sds-family-web-font) — DM Sans`). Never output raw values alone. Line Height has no token — raw value only is fine there.

| Type | Style Token | Family | Size | Weight | Line Height |
|---|---|---|---|---|---|
| [type] | `[token]` | `var(--[family]) — [name]` | `var(--[size]) — [px]` | `var(--[weight]) — [value]` | [px] |

---

## Usage Guidelines

### When to use

- [bullet]

---

### [Topic]

[One-line rule.]

**✓ Do**
> [Guidance with example.]

**✕ Don't**
> [What to avoid and why.]

---

## Platform

### Desktop
> [Context]
- [rule]

### Tablet
> [Context]
- [rule]

### Mobile
> [Context]
- [rule]
```

---

## Step 4 — Generate the HTML Preview File

After writing the `.md` file, generate a self-contained `[component-name].html` file in the same directory.

### HTML requirements

- Font: primary font from the design system (infer from Figma file; default to Inter if unknown)
- Color scheme: white background, `#1b1b1b` text, `#2563eb` accent
- Sticky left sidebar navigation linking to each `##` section
- All markdown tables as styled `<table>` elements
- `✓ Do` blocks: green card (`#f0faf4` bg, `#34a853` border)
- `✕ Don't` blocks: red card (`#fff4f4` bg, `#ea4335` border)
- Inline code / code blocks: monospace, `#f5f5f5` background
- Fixed header: component name + design system name + **"Push to Figma →"** button (`id=push-to-figma`)
- Push button: `alert('Ready to push to Figma. Run /document-component push in Claude Code.')`
- Section `##` headings get anchor `id` for sidebar deep-linking
- Responsive: sidebar collapses to top nav on narrow viewports

After writing, open:
```bash
open [component-name].html
```

---

## Step 5 — Ask to Push to Figma

> "Documentation is ready and open in your browser. Would you like to push it into the Figma design file?"

If yes → Step 6. If no → stop.

---

## Step 6 — Push Documentation into the Figma Design File

Build the full documentation as real Figma text/frame nodes using `use_figma` (Plugin API). Place the frame next to the component on the same page.

> **Two-call rule:** Use exactly two `use_figma` calls to build the doc frame — no more.
> - **Call 1 (inspect):** Get page names, component set node IDs, variant IDs, and any existing doc frame IDs. Return them all.
> - **Call 2 (build):** Build the entire documentation frame in one script using the IDs from Call 1.
> - Do NOT use a third call to fix or patch. Plan the full structure before Call 2 so it runs clean.
> - After Call 2, take ONE `get_screenshot` of the completed frame to verify. That is the only screenshot in the entire flow.

> **What does NOT work — do not attempt:**
> - `upload_assets` + curl → image hash returned does NOT render as fills in Plugin API context
> - Passing base64 image data in `use_figma` code string — 50,000 char limit makes full screenshots impossible
> - ASCII text diagrams as substitutes for actual component visuals — never add these
> - `mainComponent.createInstance()` for cloning configured instances — creates fresh defaults with placeholder text, not the actual content
> - `node.resize(w, h)` to scale instances — only shrinks the bounding box, clips content; text and child elements remain at original size
> - `node.rescale(factor)` on INSTANCE nodes — same problem; only resizes the bounding box, does not scale content
> - Setting `relativeTransform` before `appendChild` — resets to 1.0 when node moves between parents

### Async pattern — CRITICAL

**Always use top-level `await`** in `use_figma` scripts. Wrapping code in `async function main() { ... }; main()` silently drops all async results — the tool does not await the returned Promise.

```javascript
// CORRECT — top-level await
await figma.loadFontAsync({family: 'Inter', style: 'Regular'});
const bytes = await inst.exportAsync({...});

// WRONG — main() returns a Promise the tool never awaits
async function main() { ... }
main(); // async results silently dropped
```

### Pre-flight (always run first)

```javascript
// 1. Load all fonts — Inter for the doc frame, DM Sans for Cashmere component instances.
// CRITICAL: component instances use DM Sans; createInstance() throws "unloaded font" at
// appendChild if these are missing — even if you never write DM Sans text yourself.
await Promise.all([
  figma.loadFontAsync({family: 'Inter', style: 'Regular'}),
  figma.loadFontAsync({family: 'Inter', style: 'Medium'}),
  figma.loadFontAsync({family: 'Inter', style: 'Semi Bold'}),
  figma.loadFontAsync({family: 'Inter', style: 'Bold'}),
  figma.loadFontAsync({family: 'DM Sans', style: 'Regular'}),
  figma.loadFontAsync({family: 'DM Sans', style: 'Medium'}),
  figma.loadFontAsync({family: 'DM Sans', style: 'Bold'}),
]);

// 2. Switch to the correct page — find by the page name from the Figma URL
const targetPage = figma.root.children.find(p => p.name === 'EXACT PAGE NAME FROM URL');
// If unsure of the name, list all pages first:
// figma.root.children.map(p => p.name)
await figma.setCurrentPageAsync(targetPage);

// 3. Remove existing doc frame (idempotent safety)
targetPage.children
  .filter(n => n.name === '[Component] — Documentation')
  .forEach(n => n.remove());
```

### Frame structure

Build one top-level VERTICAL auto-layout frame (1400px wide):

```javascript
const doc = figma.createFrame();
doc.name = '[Component] — Documentation';
doc.layoutMode = 'VERTICAL';
doc.primaryAxisSizingMode = 'AUTO';
doc.counterAxisSizingMode = 'FIXED';
doc.resize(1400, 100);
doc.clipsContent = false;
doc.fills = [{type:'SOLID', color:{r:1,g:1,b:1}}];
```

Sections inside (each a VERTICAL auto-layout child at 1400px fixed width):
1. **Header** — dark bg, component name + design system name
2. **Introduction** — text block
3. **Anatomy** — table only (no ASCII)
4. **Variations** — table + component snapshots (see below)
5. **Props & Tokens** — props table, tokens table, spacing table, size table, typography table
6. **Usage Guidelines** — when to use / when not to use bullets + Do/Don't card pairs
7. **Accessibility** — keyboard table, ARIA table, focus text, screen reader text
8. **Related Components** — table

### clipsContent rule

**Set `clipsContent = false` on every section frame and the top-level doc frame.**

The exception: preview wrapper frames for component snapshots may use `clipsContent = false` too — since you're using `exportAsync` (see below), there is no overflow to contain.

```javascript
function noClip(node) {
  if ('clipsContent' in node) node.clipsContent = false;
  if ('children' in node) node.children.forEach(noClip);
}
noClip(doc);
```

### Component snapshots — how to embed actual variants

The only reliable way to show a properly scaled component instance is to export it as a PNG and embed it as an image fill. `resize()` and `rescale()` on instances only change the bounding box — they do not scale the content, causing text and layout to clip.

#### Finding the component nodes

```javascript
// List all children of the page to find component sets
const allNodes = figma.currentPage.children.map(n =>
  `${n.name} | ${n.type} | id:${n.id}`
).join('\n');

// Find the component set by name
const compSet = figma.currentPage.findOne(n =>
  n.type === 'COMPONENT_SET' && n.name.includes('YourComponentName')
);

// Its children are the individual variant components
compSet.children.forEach(c => console.log(c.name, JSON.stringify(c.variantProperties)));
```

#### Creating variant snapshots with exportAsync

```javascript
const SCALE = 0.45; // 0.35–0.5 works well for full-height panels/drawers
const GAP = 8;
const LABEL_H = 22;

// Find the variant component (a COMPONENT node, not COMPONENT_SET)
const variantComp = compSet.children.find(c =>
  c.variantProperties && Object.values(c.variantProperties).some(v => v === 'VariantName')
);

// 1. Create instance off-canvas for export
const inst = variantComp.createInstance();
figma.currentPage.appendChild(inst);
inst.x = -99999; inst.y = -99999;

const sw = Math.round(inst.width * SCALE);
const sh = Math.round(inst.height * SCALE);

// 2. Export at scaled size — this is the ONLY way to get proper visual scale
const bytes = await inst.exportAsync({
  format: 'PNG',
  constraint: {type: 'SCALE', value: SCALE}
});
inst.remove();

// 3. Embed as image fill on a rectangle
const image = figma.createImage(bytes);
const rect = figma.createRectangle();
rect.name = 'Preview — VariantName';
rect.resize(sw, sh);
rect.fills = [{type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL'}];
rect.cornerRadius = 4;

// 4. Wrapper frame with label below
const wrapper = figma.createFrame();
wrapper.name = 'Component Preview — VariantName';
wrapper.layoutMode = 'NONE';
wrapper.resize(sw, sh + GAP + LABEL_H);
wrapper.fills = [];
wrapper.clipsContent = false;

wrapper.appendChild(rect);
rect.x = 0; rect.y = 0;

const lbl = figma.createText();
lbl.characters = 'VariantName';
lbl.fontSize = 12;
lbl.fontName = {family: 'Inter', style: 'Regular'};
lbl.fills = [{type: 'SOLID', color: {r: 0.6, g: 0.6, b: 0.6}}];
wrapper.appendChild(lbl);
lbl.x = 0; lbl.y = sh + GAP;
```

#### Laying out multiple variant previews side by side

```javascript
const PADDING = 24;
const BETWEEN_GAP = 16;

// Build all wrappers (await each exportAsync separately — top-level await)
const bytes1 = await inst1.exportAsync({format: 'PNG', constraint: {type: 'SCALE', value: SCALE}});
// ... build wrap1 ...

const bytes2 = await inst2.exportAsync({format: 'PNG', constraint: {type: 'SCALE', value: SCALE}});
// ... build wrap2 ...

// Add to preview row with explicit positioning
previewRow.appendChild(wrap1);
wrap1.x = PADDING; wrap1.y = PADDING;

previewRow.appendChild(wrap2);
wrap2.x = PADDING + wrap1.width + BETWEEN_GAP; wrap2.y = PADDING;

const totalW = PADDING + wrap1.width + BETWEEN_GAP + wrap2.width + PADDING;
const totalH = PADDING + Math.max(wrap1.height, wrap2.height) + PADDING;
previewRow.resize(totalW, totalH);
previewRow.clipsContent = false;
```

#### Cloning configured sub-item instances (for individual states/types within a component)

Use `.clone()` — NOT `mainComponent.createInstance()`. Clone preserves actual overrides (labels, icons, toggle states):

```javascript
const configuredItem = figma.getNodeById('<INSTANCE_NODE_ID>'); // an INSTANCE node
const clone = configuredItem.clone();
myContainer.appendChild(clone);
```

#### Inserting snapshots at the right position inside a section

Sections use `insertChild(index, child)`. Track index shifts — each insertion bumps subsequent indices by 1:

```javascript
let tableIdx = varSection.children.findIndex(c => c.name === 'table');
varSection.insertChild(tableIdx + 1, snapshotRow);

// For the SECOND table (index shifted +1 after first insertion)
let secondTableIdx = varSection.children.findIndex((c, i) => c.name === 'table' && i > tableIdx + 1);
varSection.insertChild(secondTableIdx + 1, secondSnapshotRow);
```

### Positioning the doc frame

Place the doc frame to the right of the component with a gap:

```javascript
// Find the bounding box of the component on the page
const comp = figma.currentPage.findOne(n =>
  (n.type === 'COMPONENT_SET' || n.type === 'FRAME') && n.name.includes('YourComponentName')
);
doc.x = comp.x + comp.width + 120;
doc.y = comp.y;
targetPage.appendChild(doc);
figma.viewport.scrollAndZoomIntoView([doc]);
```

---

## Quality Checklist

Before finishing, verify:

- [ ] `.md` file has no placeholder text and no ASCII diagrams
- [ ] Every prop has type, default, and description
- [ ] All design token names start with `--` and have hex/px values
- [ ] Each usage guideline has both a ✓ Do and ✕ Don't
- [ ] `.html` file opens correctly in the browser
- [ ] HTML sidebar links to all `##` sections
- [ ] Do/Don't cards render in correct green/red colors
- [ ] "Push to Figma →" button visible in header
- [ ] Figma doc frame: no ASCII diagrams anywhere
- [ ] Figma doc frame: `clipsContent = false` on all section frames (run `noClip(doc)` at the end)
- [ ] Figma doc frame: actual component snapshots in Variations section (not placeholder text, not clipped)
- [ ] Figma doc frame: snapshots built with `exportAsync` + image fills (not `resize()`/`rescale()`)
- [ ] Figma doc frame: positioned on same page as component, to the right with 120px gap
- [ ] `figma.viewport.scrollAndZoomIntoView([doc])` called at end so user sees it
- [ ] All `use_figma` scripts use top-level `await` (not `async function main() { ... }; main()`)

---

## Notes

- Adapt section names to match whatever the Figma doc uses — not all components have every section
- Additional sections (Accessibility, Changelog, Figma usage) go after Platform
- Token naming pattern varies by design system — infer from the Figma file (e.g. `--sds-*`, `--ds-*`, `--color-*`); do not assume a fixed prefix
- If the node is a component (not a doc page), fetch individual variant states in parallel to extract tokens
- The HTML file is the primary review artifact — make it polished enough to share with a design team
- To find the correct page name for `setCurrentPageAsync`, list `figma.root.children.map(p => p.name)` first rather than guessing
