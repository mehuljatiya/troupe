# Troupe

AI workflows for everyone on the team — designers, developers, and PMs.

One setup command installs 9 slash commands you can use inside Claude Code, right from your terminal.

---

## Setup

```bash
npx @mehuljatiya/troupe@latest setup
```

The wizard (~2 min) handles everything: Claude Code, Figma MCP, browser plugins, and all 9 commands.

---

## What you get

**9 slash commands** installed to `~/.claude/commands/`:

| Command | For | What it does |
|---|---|---|
| `/figma [url]` | Designers, Devs | Pull a Figma design and build it as code |
| `/document-component [url]` | Designers, PMs | Full component docs from a Figma URL — `.md` + `.html` preview |
| `/spec [url]` | PMs | Ticket-ready spec with edge cases and acceptance criteria |
| `/qa [url]` | PMs, Devs | Compare Figma to built component, flag gaps |
| `/new-component` | Designers, Devs | Start a new component from scratch |
| `/document` | Designers, Devs | Write docs for an existing codebase component |
| `/review` | Everyone | Design quality and consistency check |
| `/tokens` | Designers, Devs | Explain and audit design tokens in any project |
| `/handoff` | Designers, PMs | Generate a developer handoff spec |

---

## Usage

Open Terminal in any project folder and type:

```bash
claude
```

Or type `design` for a printed cheat sheet of all commands, then Claude opens.

---

## Figma

Commands that take a Figma URL need Figma MCP — the setup wizard configures this automatically.

To add it manually:

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp --scope user
```

Then inside Claude: `/mcp` → **figma** → **Authenticate** (one-time OAuth).

---

## Requirements

- Node.js 20+ (setup wizard can install this automatically via nvm or Homebrew)
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com) (free to start)
- Figma account (for Figma commands)

---

## Updating

To get the latest commands, delete existing ones and re-run:

```bash
rm ~/.claude/commands/{figma,document-component,spec,qa,new-component,document,review,tokens,handoff}.md
npx @mehuljatiya/troupe@latest setup
```

---

## License

MIT · by [Mehul Jatiya](https://github.com/mehuljatiya)
