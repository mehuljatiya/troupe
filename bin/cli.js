#!/usr/bin/env node
import { runSetup } from '../src/setup.js'

const command = process.argv[2]

if (!command || command === 'setup') {
  runSetup()
} else if (command === '--help' || command === '-h') {
  console.log(`
@mehuljatiya/troupe

Usage:
  npx @mehuljatiya/troupe setup   Set up Troupe for the first time
  design                       Launch Claude with design workflows
`)
} else {
  console.log(`Unknown command: ${command}`)
  console.log('Run: npx @mehuljatiya/troupe setup')
  process.exit(1)
}
