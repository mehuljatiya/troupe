#!/usr/bin/env node
import { execSync } from 'child_process'
import chalk from 'chalk'

console.log('\n' + chalk.bold('Troupe') + ' ✦')
console.log(chalk.dim('Available workflows — type any of these inside Claude:\n'))
console.log('  ' + chalk.cyan('/figma') + ' [url]             Pull a Figma design and build it')
console.log('  ' + chalk.cyan('/document-component') + ' [url]  Generate full component documentation from Figma')
console.log('  ' + chalk.cyan('/spec') + ' [url]              Ticket-ready spec with edge cases + acceptance criteria')
console.log('  ' + chalk.cyan('/qa') + ' [url]                Compare Figma design to built component, flag gaps')
console.log('  ' + chalk.cyan('/new-component') + '           Start a new component from scratch')
console.log('  ' + chalk.cyan('/document') + '                Write docs for a component')
console.log('  ' + chalk.cyan('/review') + '                  Design quality and consistency check')
console.log('  ' + chalk.cyan('/tokens') + '                  Explain the design tokens in this project')
console.log('  ' + chalk.cyan('/handoff') + '                 Generate a developer handoff doc')
console.log()

try {
  execSync('claude', { stdio: 'inherit' })
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log(chalk.red('\nClaude Code not found.'))
    console.log('Run: ' + chalk.cyan('npx cashfree-troupe setup'))
    process.exit(1)
  }
  // all other exits (Ctrl+C, non-interactive shell errors) — ignore silently
}
