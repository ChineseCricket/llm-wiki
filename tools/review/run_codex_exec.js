#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function usage() {
  console.error('Usage: node tools/review/run_codex_exec.js <prompt-file> [-- <extra codex args>]');
  process.exit(1);
}

if (process.argv.length < 3) {
  usage();
}

const promptFile = path.resolve(process.argv[2]);
if (!fs.existsSync(promptFile)) {
  console.error(`ERROR: Prompt file not found: ${promptFile}`);
  process.exit(1);
}

const prompt = fs.readFileSync(promptFile, 'utf8');
const separatorIndex = process.argv.indexOf('--');
const extraArgs = separatorIndex === -1 ? [] : process.argv.slice(separatorIndex + 1);

const candidates = process.platform === 'win32' ? ['codex.cmd', 'codex'] : ['codex'];
let result = null;

for (const command of candidates) {
  result = spawnSync(command, ['exec', prompt, '--skip-git-repo-check', ...extraArgs], {
    encoding: 'utf8',
    shell: false,
  });

  if (!result.error || result.error.code !== 'ENOENT') {
    break;
  }
}

if (!result || (result.error && result.error.code === 'ENOENT')) {
  console.error('ERROR: Could not find Codex CLI. Install @openai/codex and ensure it is on PATH.');
  process.exit(1);
}

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exit(typeof result.status === 'number' ? result.status : 1);
