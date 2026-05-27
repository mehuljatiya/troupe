import { execSync, spawnSync } from 'child_process'
import { existsSync, mkdirSync, copyFileSync, readdirSync, appendFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { confirm } from '@inquirer/prompts'
import chalk from 'chalk'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function runSetup() {
  console.log()
  console.log(chalk.bold('Troupe') + ' ✦')
  console.log("Let's get you set up. This takes about 2 minutes.\n")

  // ── Node version check ───────────────────────────────────────────────────
  const nodeVersion = process.versions.node
  const major = parseInt(nodeVersion.split('.')[0], 10)
  if (major < 20) {
    console.log(chalk.yellow(`  Node.js v${nodeVersion} detected — version 20 or higher is required.\n`))
    await upgradeNode()
    // upgradeNode either re-execs (nvm path) or exits
    process.exit(1)
  }
  console.log(chalk.green(`  ✓ Node.js v${nodeVersion}\n`))

  // ── Step 1: Claude Code ──────────────────────────────────────────────────
  console.log(chalk.bold('Step 1/5') + ' — Claude Code')

  const claudeInstalled = isClaudeInstalled()

  if (claudeInstalled) {
    console.log(chalk.green('  ✓ Claude Code is already installed\n'))
  } else {
    console.log(chalk.yellow('  Claude Code is not installed.'))

    const shouldInstall = await confirm({
      message: 'Install it now? (requires npm)',
      default: true,
    }).catch(() => false)

    if (!shouldInstall) {
      console.log()
      console.log('No problem. Install it yourself when ready:')
      console.log('  ' + chalk.cyan('npm install -g @anthropic-ai/claude-code'))
      console.log('\nThen re-run: ' + chalk.cyan('npx cashfree-troupe setup'))
      process.exit(0)
    }

    console.log(chalk.dim('  Installing...'))
    try {
      npmInstallGlobal('@anthropic-ai/claude-code')
      console.log(chalk.green('  ✓ Claude Code installed\n'))
    } catch {
      console.log()
      console.log(chalk.red('  Installation failed.'))
      console.log('  Try running this manually:')
      console.log('  ' + chalk.cyan('npm install -g @anthropic-ai/claude-code'))
      process.exit(1)
    }
  }

  // ── Step 2: Slash commands ───────────────────────────────────────────────
  console.log(chalk.bold('Step 2/5') + ' — Installing slash commands')

  const { installed, skipped } = installSlashCommands()

  if (installed.length > 0 && skipped.length > 0) {
    console.log(chalk.green(`  ✓ Installed ${installed.length} command(s)`))
    console.log(chalk.yellow(`  ${skipped.length} already existed — skipped to avoid overwriting`))
    console.log(chalk.dim('  (delete them from ~/.claude/commands/ and re-run to reset)'))
  } else if (installed.length > 0) {
    console.log(chalk.green(`  ✓ Installed ${installed.length} slash commands`))
  } else if (skipped.length > 0) {
    console.log(chalk.green(`  ✓ All ${skipped.length} commands already installed`))
    console.log(chalk.dim('  (delete them from ~/.claude/commands/ and re-run to reset)'))
  }
  console.log()

  // ── Step 3: Figma MCP ────────────────────────────────────────────────────
  console.log(chalk.bold('Step 3/5') + ' — Figma ' + chalk.dim('(optional)'))
  console.log(chalk.dim('  Lets Claude read your Figma designs directly — no copy-pasting needed.\n'))

  const wantsFigma = await confirm({
    message: 'Connect Figma?',
    default: true,
  }).catch(() => false)

  let figmaConnected = false
  let figmaAuthNeeded = false

  if (wantsFigma) {
    const alreadyConfigured = isFigmaMcpConfigured()

    if (alreadyConfigured) {
      console.log(chalk.green('  ✓ Figma is already configured\n'))
      figmaConnected = true
    } else {
      try {
        execSync(
          'claude mcp add --transport http figma https://mcp.figma.com/mcp --scope user',
          { stdio: 'pipe' }
        )
        console.log(chalk.green('  ✓ Figma MCP configured'))
        figmaConnected = true
        figmaAuthNeeded = true
      } catch {
        console.log(chalk.yellow('  Could not auto-configure Figma.'))
        console.log('  Run this manually after setup:')
        console.log('  ' + chalk.cyan('claude mcp add --transport http figma https://mcp.figma.com/mcp --scope user'))
        console.log()
      }

      if (figmaConnected) {
        console.log()
        console.log(chalk.bold('  Authenticate Figma now') + ' — takes 30 seconds, saves you the step later.\n')
        console.log('  Claude will open. Follow these 3 steps inside it:')
        console.log('    1. Type ' + chalk.cyan('/mcp') + ' and press Enter')
        console.log('    2. Select ' + chalk.cyan('figma') + ' → ' + chalk.cyan('Authenticate'))
        console.log('    3. Log in to Figma in the browser that opens, then come back here')
        console.log('    4. Press ' + chalk.cyan('Ctrl+C') + ' (or type /quit) to return here\n')

        const doAuth = await confirm({
          message: 'Open Claude to authenticate Figma now?',
          default: true,
        }).catch(() => false)

        if (doAuth) {
          try {
            execSync('claude', { stdio: 'inherit' })
            console.log(chalk.green('\n  ✓ Figma authentication complete\n'))
            figmaAuthNeeded = false
          } catch {
            console.log(chalk.dim('\n  (You can authenticate later — type /mcp inside Claude)\n'))
          }
        } else {
          console.log(chalk.dim('  Skipped. To authenticate later, open Claude and type /mcp → figma → Authenticate\n'))
        }
      }
    }
  } else {
    console.log(chalk.dim('  Skipped. You can always add it later:\n'))
    console.log(chalk.dim('  claude mcp add --transport http figma https://mcp.figma.com/mcp --scope user\n'))
  }

  // ── Step 4: Browser & Figma plugins ─────────────────────────────────────
  console.log(chalk.bold('Step 4/5') + ' — Browser tools ' + chalk.dim('(optional)'))
  console.log(chalk.dim('  Only needed for /document-component\'s push-to-Figma feature.\n'))

  const chromeOk = installPlugin('chrome-devtools-mcp', 'chrome-devtools-plugins', 'Chrome DevTools')
  const figmaFriendOk = installPlugin('figma-friend', 'figma-friend-marketplace', 'Figma Friend')
  const browserToolsOk = chromeOk && figmaFriendOk

  // ── Step 5: API key ──────────────────────────────────────────────────────
  console.log(chalk.bold('Step 5/5') + ' — API key')
  console.log('  You\'ll need an Anthropic API key to use Claude.')
  console.log('  Get one free at: ' + chalk.cyan('https://console.anthropic.com'))
  console.log(chalk.dim('  Claude will ask for it on first launch if it\'s not set yet.\n'))

  // ── Register design command globally ────────────────────────────────────
  console.log(chalk.dim('  Installing design command globally...'))
  try {
    npmInstallGlobal('cashfree-troupe')
    console.log(chalk.green('  ✓ design command ready\n'))
  } catch {
    console.log(chalk.dim('  (Could not install design command — you can still use claude directly)\n'))
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  showNextSteps({
    figmaConnected,
    figmaAuthNeeded,
    browserToolsOk,
    commandCount: installed.length + skipped.length,
  })
}

function npmInstallGlobal(pkg) {
  try {
    // Pipe stderr so we can inspect it; stdout still streams to terminal
    execSync(`npm install -g ${pkg}`, { stdio: ['inherit', 'inherit', 'pipe'] })
  } catch (err) {
    const stderr = err.stderr?.toString() || ''
    if (!stderr.includes('EACCES') && !stderr.includes('permission denied')) throw err

    // Permission denied — fix npm prefix to user home and retry
    console.log(chalk.yellow('\n  Permission denied. Fixing npm global directory...\n'))
    const npmGlobal = join(homedir(), '.npm-global')

    try {
      mkdirSync(join(npmGlobal, 'lib', 'node_modules'), { recursive: true })
      mkdirSync(join(npmGlobal, 'bin'), { recursive: true })
      execSync(`npm config set prefix '${npmGlobal}'`, { stdio: 'pipe' })
      process.env.PATH = join(npmGlobal, 'bin') + ':' + (process.env.PATH || '')
    } catch {
      console.log(chalk.red('  Could not fix npm permissions automatically.'))
      console.log('  Try: ' + chalk.cyan('sudo npm install -g ' + pkg))
      throw new Error('permission-fix-failed')
    }

    // Persist to shell profile
    const shell = process.env.SHELL || ''
    const profileFile = shell.includes('zsh') ? '.zshrc' : '.bashrc'
    const profilePath = join(homedir(), profileFile)
    try {
      appendFileSync(profilePath, `\nexport PATH="$HOME/.npm-global/bin:$PATH"\n`)
      console.log(chalk.dim(`  Added PATH export to ~/${profileFile}`))
    } catch { /* non-critical */ }

    try {
      // Pass --prefix directly so config file overrides can't interfere
      execSync(`npm install -g ${pkg} --prefix="${npmGlobal}"`, {
        stdio: 'inherit',
        env: { ...process.env, npm_config_prefix: npmGlobal }
      })
    } catch {
      console.log(chalk.red('\n  Install still failed after fixing permissions.'))
      console.log('  Try opening a new terminal tab and re-running:')
      console.log('  ' + chalk.cyan('npx cashfree-troupe@latest setup'))
      throw new Error('retry-failed')
    }
  }
}

async function upgradeNode() {
  const nvmScript = join(homedir(), '.nvm', 'nvm.sh')
  const nvmDirEnv = process.env.NVM_DIR ? join(process.env.NVM_DIR, 'nvm.sh') : null

  const nvmPath = nvmDirEnv && existsSync(nvmDirEnv) ? nvmDirEnv
    : existsSync(nvmScript) ? nvmScript
    : null

  if (nvmPath) {
    console.log(chalk.dim('  nvm detected.'))
    const go = await confirm({ message: 'Install Node.js 20 via nvm and continue setup?', default: true }).catch(() => false)
    if (go) {
      console.log(chalk.dim('\n  Installing Node.js 20 — this takes a minute...\n'))
      try {
        execSync(`. "${nvmPath}" && nvm install 20`, { shell: '/bin/bash', stdio: 'inherit' })
        const newNode = execSync(`. "${nvmPath}" && nvm which 20`, { shell: '/bin/bash', encoding: 'utf8', stdio: 'pipe' }).trim()
        console.log(chalk.green('\n  ✓ Node.js 20 installed'))
        console.log(chalk.dim('  Restarting setup with Node.js 20...\n'))
        const result = spawnSync(newNode, process.argv.slice(1), { stdio: 'inherit' })
        process.exit(result.status ?? 0)
      } catch {
        console.log(chalk.red('\n  Node.js upgrade failed.'))
        console.log('  Try manually: ' + chalk.cyan('nvm install 20') + ' then re-run setup.\n')
      }
    }
    return
  }

  try {
    execSync('which brew', { stdio: 'ignore' })
    console.log(chalk.dim('  Homebrew detected.'))

    // Check if node@20 is already installed but just not linked/active
    let brewNodePath = null
    try {
      const prefix = execSync('brew --prefix node@20 2>/dev/null', { encoding: 'utf8', stdio: 'pipe' }).trim()
      const candidate = join(prefix, 'bin', 'node')
      if (existsSync(candidate)) brewNodePath = candidate
    } catch { /* not installed yet */ }

    if (brewNodePath) {
      // Already installed — just re-exec with it directly
      console.log(chalk.green('  ✓ Node.js 20 already installed via Homebrew'))
      console.log(chalk.dim('  Restarting setup with Node.js 20...\n'))
      const result = spawnSync(brewNodePath, process.argv.slice(1), { stdio: 'inherit' })
      process.exit(result.status ?? 0)
    }

    const go = await confirm({ message: 'Install Node.js 20 via Homebrew?', default: true }).catch(() => false)
    if (go) {
      console.log(chalk.dim('\n  Installing Node.js 20 — this takes a minute...\n'))
      try {
        execSync('brew install node@20', { shell: '/bin/bash', stdio: 'inherit' })
        execSync('brew link --overwrite --force node@20', { shell: '/bin/bash', stdio: 'pipe' })
        const prefix = execSync('brew --prefix node@20', { encoding: 'utf8', stdio: 'pipe' }).trim()
        brewNodePath = join(prefix, 'bin', 'node')
        console.log(chalk.green('\n  ✓ Node.js 20 installed'))
        console.log(chalk.dim('  Restarting setup with Node.js 20...\n'))
        const result = spawnSync(brewNodePath, process.argv.slice(1), { stdio: 'inherit' })
        process.exit(result.status ?? 0)
      } catch {
        console.log(chalk.red('\n  Homebrew install failed.'))
        console.log('  Try manually: ' + chalk.cyan('brew install node@20') + '\n')
      }
    }
    return
  } catch { /* no brew */ }

  console.log('  Download Node.js 20 LTS from: ' + chalk.cyan('https://nodejs.org'))
  console.log('  Install it like any Mac app, then re-run this command.\n')
}

function installPlugin(pluginName, marketplace, label) {
  try {
    const result = execSync('claude plugin list', { encoding: 'utf8', stdio: 'pipe' })
    if (result.toLowerCase().includes(pluginName.toLowerCase())) {
      console.log(chalk.green(`  ✓ ${label} already installed`))
      console.log()
      return true
    }
  } catch { /* continue */ }

  try {
    execSync(`claude plugin install ${pluginName}@${marketplace} --scope user`, { stdio: 'pipe' })
    console.log(chalk.green(`  ✓ ${label} installed`))
    console.log()
    return true
  } catch {
    console.log(chalk.yellow(`  Could not install ${label} automatically.`))
    console.log('  Run this manually:')
    console.log('  ' + chalk.cyan(`claude plugin install ${pluginName}@${marketplace} --scope user`))
    console.log()
    return false
  }
}

function isClaudeInstalled() {
  try {
    execSync('which claude', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function isFigmaMcpConfigured() {
  try {
    const result = execSync('claude mcp list', { encoding: 'utf8', stdio: 'pipe' })
    return result.includes('mcp.figma.com')
  } catch {
    return false
  }
}

function installSlashCommands() {
  const commandsDir = join(homedir(), '.claude', 'commands')
  try {
    if (!existsSync(commandsDir)) {
      mkdirSync(commandsDir, { recursive: true })
    }
  } catch {
    console.log(chalk.red('  Could not create ~/.claude/commands/'))
    console.log(chalk.dim('  Check permissions on your home directory.'))
    return { installed: [], skipped: [] }
  }

  const sourceDir = join(__dirname, '..', 'commands')
  let files = []
  try {
    files = readdirSync(sourceDir).filter(f => f.endsWith('.md'))
  } catch {
    console.log(chalk.red('  Could not read commands from package — it may be corrupted.'))
    console.log(chalk.dim('  Try re-running: npx cashfree-troupe@latest setup'))
    return { installed: [], skipped: [] }
  }

  const installed = []
  const skipped = []

  for (const file of files) {
    const dest = join(commandsDir, file)
    if (existsSync(dest)) {
      skipped.push(file)
    } else {
      try {
        copyFileSync(join(sourceDir, file), dest)
        installed.push(file)
      } catch {
        console.log(chalk.yellow(`  Could not copy ${file} — skipping`))
      }
    }
  }

  return { installed, skipped }
}

function showNextSteps({ figmaConnected, figmaAuthNeeded, browserToolsOk, commandCount }) {
  console.log('─'.repeat(50))
  console.log(chalk.bold('\nYou\'re all set!\n'))
  console.log(chalk.yellow('  Open a new terminal tab first') + ' so PATH updates take effect.\n')
  console.log('To start:')
  console.log('  1. Open a new terminal tab in your project folder')
  console.log('  2. Type ' + chalk.cyan('claude') + ' (or ' + chalk.cyan('design') + ' for a command cheat sheet)')
  console.log()

  // ── Setup summary ────────────────────────────────────────────────────────
  console.log(chalk.bold('Setup summary:'))
  console.log(chalk.green(`  ✓ ${commandCount} slash commands installed`))
  console.log(chalk.green('  ✓ Claude Code ready'))

  if (figmaConnected && !figmaAuthNeeded) {
    console.log(chalk.green('  ✓ Figma connected') + chalk.dim('  → /figma, /spec, /qa, /document-component ready'))
  } else if (figmaConnected && figmaAuthNeeded) {
    console.log(chalk.yellow('  ⚠ Figma configured — authentication still needed'))
    console.log(chalk.dim('    Inside Claude: type /mcp → figma → Authenticate'))
    console.log(chalk.dim('    (/figma, /spec, /qa, /document-component won\'t work until authenticated)'))
  } else {
    console.log(chalk.yellow('  ⚠ Figma not connected'))
    console.log(chalk.dim('    /figma, /spec, /qa, /document-component need Figma to work'))
    console.log(chalk.dim('    To add it: claude mcp add --transport http figma https://mcp.figma.com/mcp --scope user'))
    console.log(chalk.dim('    Then in Claude: /mcp → figma → Authenticate'))
  }

  if (browserToolsOk) {
    console.log(chalk.green('  ✓ Browser tools ready') + chalk.dim('  → /document-component push-to-Figma available'))
  } else {
    console.log(chalk.yellow('  ⚠ Browser tools not installed'))
    console.log(chalk.dim('    /document-component will generate docs but won\'t push to Figma'))
    console.log(chalk.dim('    To add: claude plugin install chrome-devtools-mcp@chrome-devtools-plugins --scope user'))
    console.log(chalk.dim('            claude plugin install figma-friend@figma-friend-marketplace --scope user'))
  }

  console.log()
  console.log('All commands (type inside Claude):')
  console.log('  ' + chalk.cyan('/figma') + ' [url]              Pull a Figma design and build it')
  console.log('  ' + chalk.cyan('/document-component') + ' [url]  Generate full component docs from Figma')
  console.log('  ' + chalk.cyan('/spec') + ' [url]               Ticket-ready spec with acceptance criteria')
  console.log('  ' + chalk.cyan('/qa') + ' [url]                 Compare Figma to built component, flag gaps')
  console.log('  ' + chalk.cyan('/new-component') + '            Start a new component from scratch')
  console.log('  ' + chalk.cyan('/document') + '                 Write docs for a component')
  console.log('  ' + chalk.cyan('/review') + '                   Design quality and consistency check')
  console.log('  ' + chalk.cyan('/tokens') + '                   Explain the design tokens in this project')
  console.log('  ' + chalk.cyan('/handoff') + '                  Generate a developer handoff doc')
  console.log()
}
