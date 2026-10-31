# Garmin MCP setup guide (Windows)

Server: [Taxuspt/garmin_mcp](https://github.com/Taxuspt/garmin_mcp), pinned to commit
`655efb8f5639602f661c26164282d0ddd4f5d3db`. One install, shared by Claude Code, Claude Desktop and omp.

## 1. Prerequisites

```powershell
winget install -e --id astral-sh.uv
winget install -e --id Git.Git          # only used by the install step
pyenv install 3.12.5                    # pyenv-win; uv's managed CPython fails here
```
Node.js is needed for `apply-tools.js`.

## 2. Install

```powershell
uv tool install --python "$env:USERPROFILE\.pyenv\pyenv-win\versions\3.12.5\python.exe" --with "mcp<2" "git+https://github.com/Taxuspt/garmin_mcp@655efb8f5639602f661c26164282d0ddd4f5d3db"
```
Creates `%USERPROFILE%\.local\bin\garmin-mcp.exe` and `garmin-mcp-auth.exe`.
`--with "mcp<2"`: the server imports `mcp.server.fastmcp`, removed in mcp 2.0.

## 3. Log in

```powershell
garmin-mcp-auth --force-reauth   # password + MFA; tokens → ~/.garminconnect (~6 months)
garmin-mcp-auth --verify         # check without prompting
```
Missing or expired tokens → the server registers **no tools**.

## 4. Register

Same entry in each agent (replace `<user>`):
```json
"garmin": { "command": "C:\\Users\\<user>\\.local\\bin\\garmin-mcp.exe", "args": [] }
```

| Agent | Config (`mcpServers`) |
| --- | --- |
| Claude Code | `~/.claude.json`, or run `claude mcp add garmin --scope user -- "$env:USERPROFILE\.local\bin\garmin-mcp.exe"` |
| Claude Desktop | `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json` |
| omp | `~/.omp/agent/mcp.json`, add `"type": "stdio"` (omp does not read `~/.claude.json`) |

Restart each agent; quit Claude Desktop from the system tray.

## 5. Tools and permissions

- Edit `garmin-tools.json`: `"enabled"` per tool; top-level `"mode"`: `"full"` or `"read_only"` (forces all `write` tools off).
- `node apply-tools.js` (`--dry-run`, `--status`) writes the denylist `GARMIN_DISABLED_TOOLS` into `~/.claude.json` only; copy that `env` to the Desktop and omp entries. Unlisted tools stay enabled.
- Auto-approve read tools in `~/.claude/settings.json` `permissions.allow` (run in this folder; adds missing ones, keeps other entries):
  ```bash
  node -e "const fs=require('fs'),p=require('path').join(require('os').homedir(),'.claude','settings.json');const j=require('./garmin-tools.json');const r=[];for(const e of Object.values(j.categories))for(const[n,d]of Object.entries(e.tools))if(d.type==='read')r.push('mcp__garmin__'+n);const s=JSON.parse(fs.readFileSync(p,'utf8'));s.permissions??={};s.permissions.allow=[...new Set([...(s.permissions.allow||[]),...r])].sort();fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n');console.log(s.permissions.allow.length,'entries')"
  ```

Current state: mode `full`, nothing disabled; 151 tools (110 read, 41 write), matching the pinned server.
After an update, compare the server's tool list with `garmin-tools.json` and add new tools; classify any
`create_/upload_/delete_/set_/add_/log_/schedule_` name as `write`.

## 6. Verify

`claude mcp list` → `garmin ... √ Connected`.

## Maintenance

- **Update:** rerun step 2 with a new full SHA and `--force`; registrations unchanged; restart agents.
- **Broken install:** step 2 with `--force --reinstall`.
- **Do not** register via `uvx --from git+...`: it re-resolves git and rebuilds on every launch, which raced
  between agents (`Access is denied`), corrupted uv's git cache, and fails in Claude Desktop (no git in MSIX).
- `GARMIN_MCP_TRANSPORT=streamable-http` (shared instance) stays off: it has no auth.
