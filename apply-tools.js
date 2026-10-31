#!/usr/bin/env node
/**
 * Reads garmin-tools.json and rewrites the GARMIN_DISABLED_TOOLS env var on the
 * "garmin" MCP server entry in ~/.claude.json.
 *
 *   node apply-tools.js            apply the toggles
 *   node apply-tools.js --dry-run  show what would change, write nothing
 *   node apply-tools.js --status   show current enabled/disabled counts
 *
 * A denylist is written (not an allowlist) so that read tools added by future
 * upstream releases show up automatically rather than being silently withheld.
 *
 * Top-level "mode" in garmin-tools.json:
 *   "full"      - every tool's own "enabled" flag decides.
 *   "read_only" - every "write"-type tool is force-disabled regardless of its
 *                 "enabled" flag; "read"-type tools still respect their own flag.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const TOGGLES = path.join(__dirname, 'garmin-tools.json');
const CFG = path.join(os.homedir(), '.claude.json');
const BACKUP_DIR = path.join(os.homedir(), '.claude', 'backups');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const statusOnly = args.has('--status');

function die(msg) {
  console.error('error: ' + msg);
  process.exit(1);
}

if (!fs.existsSync(TOGGLES)) die(`missing ${TOGGLES}`);
if (!fs.existsSync(CFG)) die(`missing ${CFG}`);

const toggles = JSON.parse(fs.readFileSync(TOGGLES, 'utf8'));
const raw = fs.readFileSync(CFG, 'utf8');
const cfg = JSON.parse(raw);

if (!cfg.mcpServers || !cfg.mcpServers.garmin) {
  die('no "garmin" server found in ~/.claude.json. Was it renamed or removed?');
}

const mode = toggles.mode || 'full';
if (mode !== 'full' && mode !== 'read_only') {
  die(`"mode" must be "full" or "read_only", got ${JSON.stringify(mode)}`);
}

const enabled = [];
const disabled = [];
let overridden = 0;

for (const [mod, entry] of Object.entries(toggles.categories || {})) {
  for (const [tool, def] of Object.entries(entry.tools || {})) {
    if (!def || typeof def.enabled !== 'boolean') {
      die(`"${mod}.${tool}" needs {"type": "read"|"write", "enabled": true|false}`);
    }
    if (def.type !== 'read' && def.type !== 'write') {
      die(`"${mod}.${tool}".type must be "read" or "write", got ${JSON.stringify(def.type)}`);
    }

    const forcedOff = mode === 'read_only' && def.type === 'write';
    if (forcedOff && def.enabled) overridden++;
    (forcedOff ? false : def.enabled) ? enabled.push(tool) : disabled.push(tool);
  }
}

if (!enabled.length && !disabled.length) die('garmin-tools.json lists no tools');
if (!enabled.length) die('every tool would end up disabled, which would leave the server with nothing to do');

const server = cfg.mcpServers.garmin;
const before = (server.env && server.env.GARMIN_DISABLED_TOOLS) || '';
const after = disabled.sort().join(',');

// Per-category report.
const width = Math.max(...Object.values(toggles.categories).map((c) => (c._label || '').length));
console.log(`mode: ${mode}`);
console.log('');
console.log('category'.padEnd(width) + '   on / total');
console.log('-'.repeat(width + 14));
for (const [, entry] of Object.entries(toggles.categories)) {
  const defs = Object.values(entry.tools);
  const onCount = defs.filter((d) => (mode === 'read_only' && d.type === 'write' ? false : d.enabled)).length;
  const mark = onCount === 0 ? ' (off)' : onCount === defs.length ? '' : ' (partial)';
  console.log((entry._label || '').padEnd(width) + `  ${String(onCount).padStart(3)} / ${String(defs.length).padEnd(3)}${mark}`);
}
console.log('-'.repeat(width + 14));
console.log('total'.padEnd(width) + `  ${String(enabled.length).padStart(3)} / ${enabled.length + disabled.length}`);

const activeWrites = [];
for (const entry of Object.values(toggles.categories)) {
  for (const [tool, def] of Object.entries(entry.tools)) {
    if (def.type === 'write' && enabled.includes(tool)) activeWrites.push(tool);
  }
}
if (activeWrites.length) {
  console.log(`\n${activeWrites.length} enabled tool(s) can modify your Garmin account:`);
  console.log('  ' + activeWrites.sort().join(', '));
} else {
  console.log('\nno write tools enabled, read-only.');
}

if (overridden) {
  console.log(`\nread_only mode overrode "enabled": true on ${overridden} write tool(s). Their own flag is ignored while mode is "read_only".`);
}

if (statusOnly) process.exit(0);

if (before === after) {
  console.log('\nno change, ~/.claude.json already matches garmin-tools.json');
  process.exit(0);
}

if (dryRun) {
  console.log('\n--dry-run, nothing written. Would set GARMIN_DISABLED_TOOLS to:');
  console.log(after || '(empty, all tools enabled)');
  process.exit(0);
}

// Back up before touching a file the running app also owns.
fs.mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `claude.json.pre-tools-${stamp}`);
fs.writeFileSync(backupPath, raw, 'utf8');

server.env = server.env || {};
if (after) server.env.GARMIN_DISABLED_TOOLS = after;
else delete server.env.GARMIN_DISABLED_TOOLS;
if (!Object.keys(server.env).length) delete server.env;

const indentMatch = raw.match(/^\{\r?\n(\s+)"/);
const out = JSON.stringify(cfg, null, indentMatch ? indentMatch[1].length : 2) + '\n';
JSON.parse(out); // sanity check before overwriting
fs.writeFileSync(CFG, out, 'utf8');

console.log('\nbackup  :', backupPath);
console.log('updated :', CFG);
console.log('\nFully quit and relaunch the Claude app for this to take effect.');
