# Discord AI MCP

**Locally Hosted Discord Management Platform for AI Assistants via the Model Context Protocol (MCP)**

Copyright (c) 2026 Omar ElSabbagh.  
Licensed under the MIT License.

---

## Official Creator & Project Attribution

> **"This project was created by Omar ElSabbagh, a professional programmer from Egypt and the owner of the EnzoCord Discord community."**

| Field | Details |
| :--- | :--- |
| **Project Name** | Discord AI MCP |
| **Creator & Owner** | Omar ElSabbagh |
| **Country** | Egypt |
| **Role** | Project Creator, Owner, and Professional Programmer |
| **Discord Community** | EnzoCord |
| **License** | MIT License |
| **Transport (v1.0)** | Local STDIO (`@modelcontextprotocol/server/stdio`) |

---

## Overview

**Discord AI MCP** is a complete, production-grade, locally hosted Discord server management platform exposed through the **Model Context Protocol (MCP)**. It enables compatible AI assistants (such as Claude Desktop, Claude Code, Cursor, VS Code MCP clients, and other local MCP-compatible AI clients) to inspect, audit, moderate, organize, and manage your Discord bot and authorized Discord servers through natural language.

### Key Highlights

- **100% Local & Independent:** Runs entirely on your machine over local `STDIO`. Zero cloud dependencies, zero creator-hosted servers, zero external telemetry, and zero SaaS lock-in.
- **182 MCP Tools Across 19 Domains:** Full lifecycle management for bots, guilds, channels, categories, voice channels, roles, members, moderation cases, messages, embeds, reactions, threads, emojis, stickers, invites, webhooks, scheduled events, AutoMod rules, audit logs, server diagnostics, read-only structural backups, and bot application commands.
- **20 Contextual MCP Resources:** Static (`discord://project/*`, `discord://bot/*`, `discord://guilds`) and dynamic guild-scoped resource templates (`discord://guild/{guildId}/*`) with autocompletion.
- **17 Reusable MCP Prompts:** Turnkey workflows for security audits, server setup, cleanup, permission analysis, moderation review, and backup exports.
- **Security by Default:**
  - Deterministic Discord permission and role hierarchy enforcement before every API call.
  - Privilege escalation prevention (the bot cannot grant permissions it does not hold).
  - Guild owner protection and self-moderation safeguards.
  - **Cryptographic Two-Step Confirmation** (`request_action_confirmation` + single-use parameter-bound `confirmationToken`) for all destructive operations.
  - Automatic multi-layer redaction of Discord bot tokens and webhook tokens from all outputs and logs.
  - Prompt-injection filtering on untrusted Discord user content.
  - Local SQLite persistence (`better-sqlite3`) with versioned migrations for moderation cases, guild settings, and local audit trails.

---

## Architecture

Discord AI MCP is engineered with a strict separation of concerns so that Discord domain operations remain completely decoupled from MCP transport details (allowing future transports to be added without rewriting business logic):

```text
discord-ai-mcp/
├── src/
│   ├── index.js                         # STDIO CLI entrypoint
│   ├── core/
│   │   ├── application.js               # Dependency graph assembly & lifecycle container
│   │   ├── config.js                    # Environment & Zod v4 configuration loader
│   │   ├── constants.js                 # Project identity, limits, and error codes
│   │   └── lifecycle.js                 # Graceful SIGINT/SIGTERM & process error handlers
│   ├── discord/
│   │   ├── client.js                    # Discord.js v14 Client manager & entity resolvers
│   │   ├── events/index.js              # Gateway shard & connection event listeners
│   │   └── managers/                    # 16 domain managers (Bot, Guild, Channel, Voice, Role, etc.)
│   ├── mcp/
│   │   ├── server.js                    # Official @modelcontextprotocol/server v2 wrapper
│   │   ├── instructions.js              # System & security instructions for connected AI models
│   │   ├── tools/                       # 19 modular tool suites + ToolRegistry
│   │   ├── resources/index.js           # Static & ResourceTemplate registrations
│   │   └── prompts/index.js             # 17 reusable MCP prompt registrations
│   ├── services/
│   │   ├── permissions/                 # Permission & role hierarchy verification engine
│   │   ├── moderation/                  # Local SQLite moderation case service
│   │   ├── audit/                       # Discord & local SQLite audit log service
│   │   ├── backup/                      # Read-only structural server export service
│   │   └── diagnostics/                 # Server health, structure, and security analyzer
│   ├── database/
│   │   ├── database.js                  # better-sqlite3 WAL connection & migration runner
│   │   ├── migrations/index.js          # Versioned SQLite schema migrations
│   │   └── repositories/                # Config, Moderation, and Audit repositories
│   ├── security/
│   │   ├── validation.js                # Reusable Zod v4 schemas & payload validators
│   │   ├── confirmation.js              # HMAC-SHA256 parameter-bound confirmation workflow
│   │   ├── rate-limiter.js              # Sliding-window rate limiter
│   │   ├── sanitization.js              # Prompt-injection filtering & path traversal guard
│   │   └── secret-redaction.js          # Bot token & webhook token redaction engine
│   ├── utils/
│   │   ├── logger.js                    # Pino structured logger writing strictly to stderr
│   │   ├── errors.js                    # Centralized error normalizer
│   │   └── formatters.js                # Safe Discord.js entity serializers
│   └── types/index.js                   # Channel type and Gateway Intent mappings
├── config/config.example.json
├── data/.gitkeep
├── scripts/
│   ├── setup.js                         # Initializes .env, data folders, and SQLite schema
│   └── diagnostics.js                   # Verifies local health and counts registered primitives
└── tests/
    ├── fixtures/mock-discord.js
    ├── unit/
    └── integration/
```

---

## Requirements

- **Node.js:** `v20.0.0` or newer (tested on Node.js `v22.x`).
- **npm:** `v10.0.0` or newer.
- **Discord Bot Application:** Created in the [Discord Developer Portal](https://discord.com/developers/applications) with a valid Bot Token and invited to at least one Discord server where you have administrative permissions.

---

## Installation

1. **Clone or download the repository:**
   ```bash
   git clone https://github.com/your-username/discord-ai-mcp.git
   cd discord-ai-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the automated setup script** (creates `.env` from `.env.example`, creates `./data` and `./data/backups`, and runs SQLite migrations):
   ```bash
   npm run setup
   ```

4. **Verify installation health:**
   ```bash
   npm run diagnostics
   ```

---

## Discord Developer Portal & Bot Setup

### 1. Create a Discord Application & Bot
1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Navigate to the **Bot** tab on the left sidebar.
3. Click **Reset Token** (or **View Token**) to copy your **Discord Bot Token**.
4. Paste your token into `.env` as `DISCORD_TOKEN=your_actual_token_here`.

### 2. Configure Privileged Gateway Intents
Still inside the **Bot** tab of the Discord Developer Portal, scroll down to **Privileged Gateway Intents**:

| Privileged Intent | Environment Variable | Default | Purpose & When Required |
| :--- | :--- | :--- | :--- |
| **Server Members Intent** (`GuildMembers`) | `ENABLE_GUILD_MEMBERS_INTENT=true` | `true` | Required to list all server members, search members reliably, and track member join/role events. |
| **Message Content Intent** (`MessageContent`) | `ENABLE_MESSAGE_CONTENT_INTENT=true` | `true` | Required to read non-empty `content` on messages not directly mentioning the bot (`get_channel_messages`, `search_messages`, `get_message`). |
| **Presence Intent** (`GuildPresences`) | `ENABLE_GUILD_PRESENCES_INTENT=false` | `false` | Optional. Enable in both the Developer Portal and `.env` only if you want `get_member_presence` to report live online/idle/dnd statuses and custom activities. |

> **Important:** If `ENABLE_GUILD_MEMBERS_INTENT=true` or `ENABLE_MESSAGE_CONTENT_INTENT=true` is enabled in `.env`, the corresponding toggle **must** be switched ON in the Discord Developer Portal, or Discord will reject the Gateway connection with `DisallowedIntents`.

### 3. Invite the Bot to Your Server
1. In the Developer Portal, open **OAuth2 -> URL Generator**.
2. Under **Scopes**, check `bot` and `applications.commands`.
3. Under **Bot Permissions**, select the permissions matching the tools you plan to use (e.g., `View Channels`, `Manage Channels`, `Manage Roles`, `Manage Guild`, `Kick Members`, `Ban Members`, `Moderate Members`, `Send Messages`, `Manage Messages`, `Read Message History`, `View Audit Log`, `Manage Webhooks`, `Manage Expressions`, `Manage Events`, `Move Members`).
4. Open the generated URL in your browser and authorize the bot on your server.
5. *(Tip)* Once connected, you can also generate custom invite URLs anytime using the `get_bot_invite_url` MCP tool.

---

## Local Configuration (`.env`)

```dotenv
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
DISCORD_APPLICATION_ID=
LOG_LEVEL=info
DATABASE_PATH=./data/database.sqlite
INTENTS_PRESET=default
ENABLE_MESSAGE_CONTENT_INTENT=true
ENABLE_GUILD_MEMBERS_INTENT=true
ENABLE_GUILD_PRESENCES_INTENT=false
ENABLE_AUDIT_HISTORY=true
CONFIRMATION_TTL_SECONDS=300
RATE_LIMIT_MAX_DESTRUCTIVE_PER_MINUTE=10
RATE_LIMIT_MAX_MESSAGES_PER_MINUTE=30
BACKUP_EXPORT_DIR=./data/backups
```

---

## Starting the Project

Because Discord AI MCP uses the **LOCAL STDIO transport**, your MCP client (Claude Desktop, Claude Code, Cursor, VS Code, etc.) automatically launches and manages the `node src/index.js` process.

To test starting the server manually from a terminal:

```bash
npm start
```

---

## MCP Client Configuration Examples

> **Path Format Note:**
> - **Windows:** Use escaped backslashes (`C:\\path\\to\\discord-ai-mcp\\src\\index.js`) or forward slashes (`C:/path/to/discord-ai-mcp/src/index.js`).
> - **macOS / Linux:** Use absolute POSIX paths (`/Users/username/projects/discord-ai-mcp/src/index.js` or `/home/username/projects/discord-ai-mcp/src/index.js`).

### 1. Claude Desktop (`claude_desktop_config.json`)

- **Windows path:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS path:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "discord-ai-mcp": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/discord-ai-mcp/src/index.js"
      ],
      "env": {
        "DISCORD_TOKEN": "YOUR_DISCORD_BOT_TOKEN",
        "LOG_LEVEL": "info",
        "DATABASE_PATH": "/ABSOLUTE/PATH/TO/discord-ai-mcp/data/database.sqlite"
      }
    }
  }
}
```

### 2. Claude Code (CLI & `.mcp.json`)

Add via the Claude Code CLI:

```bash
claude mcp add discord-ai-mcp -e DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN -- node /ABSOLUTE/PATH/TO/discord-ai-mcp/src/index.js
```

Or in a project-scoped `.mcp.json`:

```json
{
  "mcpServers": {
    "discord-ai-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/discord-ai-mcp/src/index.js"
      ],
      "env": {
        "DISCORD_TOKEN": "YOUR_DISCORD_BOT_TOKEN"
      }
    }
  }
}
```

### 3. Cursor (`.cursor/mcp.json`)

Create or edit `.cursor/mcp.json` in your workspace or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "discord-ai-mcp": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/discord-ai-mcp/src/index.js"
      ],
      "env": {
        "DISCORD_TOKEN": "YOUR_DISCORD_BOT_TOKEN",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 4. Visual Studio Code (`.vscode/mcp.json`)

Create `.vscode/mcp.json` in your workspace (note that VS Code uses `"servers"` as the root key):

```json
{
  "servers": {
    "discord-ai-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/discord-ai-mcp/src/index.js"
      ],
      "env": {
        "DISCORD_TOKEN": "YOUR_DISCORD_BOT_TOKEN",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 5. ChatGPT Compatibility Notes

- **Important Platform & Plan Limitation:** ChatGPT on the web (`chatgpt.com`) runs in OpenAI's cloud and only connects to remote HTTPS MCP servers; it cannot directly spawn a local `stdio` process on your computer.
- **Local ChatGPT Desktop / OpenAI Agents SDK / Local MCP Bridges:** Local `STDIO` MCP connections with ChatGPT models are supported when using local MCP-compatible desktop clients, the OpenAI Agents SDK (`MCPServerStdio`), or official local MCP host integrations where local stdio server configuration is enabled for your platform and plan.

---

## Complete MCP Tool Catalog (182 Tools)

### A. Bot Management (12 Tools)
| Tool | Mode | Description |
| :--- | :--- | :--- |
| `get_bot_info` | Read-Only | Bot user profile, application ID, guild count, and project attribution. |
| `get_bot_status` | Read-Only | Current connection status, online presence, and activities. |
| `get_bot_application` | Read-Only | Discord Developer Portal application metadata. |
| `get_bot_guilds` | Read-Only | List all guilds the bot is connected to. |
| `get_bot_permissions` | Read-Only | Inspect bot guild and channel permissions. |
| `get_bot_latency` | Read-Only | WebSocket Gateway ping in milliseconds. |
| `get_bot_uptime` | Read-Only | Bot session and Node.js process uptime. |
| `get_bot_version` | Read-Only | Project, Discord.js, and Node.js versions + creator attribution. |
| `get_bot_configuration` | Read-Only | Active non-sensitive configuration and rate limits. |
| `get_bot_statistics` | Read-Only | Guilds, approximate members, cache sizes, and memory usage. |
| `get_bot_gateway_status` | Read-Only | WebSocket Gateway status and shard details. |
| `get_bot_invite_url` | Read-Only | Generate an OAuth2 bot invite link with requested permission flags. |

### B. Guild Management (18 Tools)
| Tool | Mode | Description |
| :--- | :--- | :--- |
| `list_guilds` | Read-Only | List all accessible Discord guilds. |
| `get_guild_info` | Read-Only | Comprehensive metadata for a guild. |
| `get_guild_preview` | Read-Only | Public preview counts and features. |
| `get_guild_settings` | Read-Only | Verification, content filter, MFA, system channels, and local settings. |
| `get_guild_features` | Read-Only | Enabled Discord feature flags for a guild. |
| `get_guild_owner` | Read-Only | Guild owner member and user profile. |
| `get_guild_members_count` | Read-Only | Total member count and cached human/bot breakdown. |
| `get_guild_channels` | Read-Only | All channels and categories in a guild. |
| `get_guild_roles` | Read-Only | All roles ordered by position. |
| `get_guild_emojis` | Read-Only | All custom guild emojis. |
| `get_guild_stickers` | Read-Only | All custom guild stickers. |
| `get_guild_invites` | Read-Only | Active invite codes in a guild. |
| `get_guild_audit_logs` | Read-Only | Recent guild audit log entries. |
| `get_guild_bans` | Read-Only | Banned users and reasons. |
| `get_guild_integrations` | Read-Only | Connected guild integrations. |
| `get_guild_webhooks` | Read-Only | Guild webhooks (tokens redacted). |
| `get_guild_events` | Read-Only | Guild scheduled events. |
| `get_guild_automod_rules` | Read-Only | Guild Auto Moderation rules. |

### C. Channel Management (19 Tools)
`create_channel`, `delete_channel` *(Confirm)*, `edit_channel`, `get_channel_info`, `list_channels`, `clone_channel`, `move_channel`, `set_channel_position`, `set_channel_topic`, `set_channel_name`, `set_channel_slowmode`, `set_channel_nsfw`, `set_channel_permissions` *(Confirm)*, `get_channel_permissions`, `add_channel_permission`, `edit_channel_permission`, `remove_channel_permission` *(Confirm)*, `create_category`, `get_category_channels`.

### D. Voice Channel Management (9 Tools)
`get_voice_channels`, `get_voice_channel_members`, `get_member_voice_state`, `move_member_to_voice_channel`, `disconnect_member_from_voice`, `edit_voice_channel`, `set_voice_channel_status`, `set_voice_channel_user_limit`, `set_voice_channel_bitrate`.

### E. Role Management (15 Tools)
`create_role`, `delete_role` *(Confirm)*, `edit_role`, `get_role_info`, `list_roles`, `assign_role`, `remove_role`, `get_member_roles`, `set_role_permissions` *(Confirm)*, `compare_role_permissions`, `set_role_position`, `set_role_color`, `set_role_hoist`, `set_role_mentionable`, `get_role_members`.

### F. Member Management (19 Tools)
`get_member_info`, `get_member_profile`, `list_guild_members`, `search_guild_members`, `get_member_permissions`, `get_member_roles`, `get_member_voice_state`, `assign_role_to_member`, `remove_role_from_member`, `edit_member_nickname`, `reset_member_nickname`, `edit_member_timeout` *(Confirm)*, `remove_member_timeout`, `kick_member` *(Confirm)*, `ban_member` *(Confirm)*, `unban_member`, `get_member_avatar`, `get_member_join_date`, `get_member_presence`.

### G. Moderation Management & Confirmation Security (13 Tools)
`kick_member` *(Confirm)*, `ban_member` *(Confirm)*, `unban_member`, `timeout_member` *(Confirm)*, `remove_timeout`, `get_ban_list`, `get_audit_logs`, `create_moderation_case`, `get_moderation_case`, `get_moderation_history`, `bulk_delete_messages` *(Confirm)*, `request_action_confirmation`, `cancel_action_confirmation`.

### H. Message Management (16 Tools)
`send_message`, `send_embed`, `edit_message`, `delete_message` *(Confirm)*, `bulk_delete_messages` *(Confirm)*, `get_message`, `get_channel_messages`, `search_messages`, `pin_message`, `unpin_message`, `add_reaction`, `remove_reaction`, `get_message_reactions`, `crosspost_message`, `create_message_thread`, `reply_to_message`.

### I. Thread Management (13 Tools)
`create_thread`, `delete_thread` *(Confirm)*, `archive_thread`, `unarchive_thread`, `lock_thread`, `unlock_thread`, `join_thread`, `leave_thread`, `add_thread_member`, `remove_thread_member`, `get_thread_info`, `list_active_threads`, `list_archived_threads`.

### J. Emoji Management (5 Tools)
`create_emoji`, `delete_emoji` *(Confirm)*, `edit_emoji`, `get_emoji_info`, `list_emojis`.

### K. Sticker Management (4 Tools)
`create_sticker`, `delete_sticker` *(Confirm)*, `get_sticker_info`, `list_stickers`.

### L. Invite Management (5 Tools)
`create_invite`, `delete_invite` *(Confirm)*, `get_invite_info`, `list_guild_invites`, `list_channel_invites`.

### M. Webhook Management (6 Tools)
`create_webhook`, `delete_webhook` *(Confirm)*, `edit_webhook`, `get_webhook_info`, `list_webhooks`, `execute_webhook`.

### N. Scheduled Events (6 Tools)
`create_scheduled_event`, `edit_scheduled_event`, `delete_scheduled_event` *(Confirm)*, `get_scheduled_event`, `list_scheduled_events`, `get_scheduled_event_users`.

### O. Auto Moderation (5 Tools)
`list_automod_rules`, `get_automod_rule`, `create_automod_rule`, `edit_automod_rule`, `delete_automod_rule` *(Confirm)*.

### P. Audit Logs (6 Tools)
`get_audit_logs`, `get_audit_log_entry`, `get_recent_moderation_actions`, `get_recent_channel_changes`, `get_recent_role_changes`, `get_recent_member_actions`.

### Q. Server Utilities & Diagnostics (9 Tools)
`get_server_statistics`, `get_server_activity_summary`, `get_server_structure`, `get_server_permission_overview`, `get_server_security_overview`, `get_server_configuration_report`, `check_bot_permissions`, `check_bot_hierarchy`, `diagnose_server_configuration`.

### R. Read-Only Backup & Export (3 Tools)
`export_server_backup`, `list_server_backups`, `get_backup_limitations`.

### S. Bot Application Commands (6 Tools)
`list_application_commands`, `list_guild_application_commands`, `get_application_command`, `create_application_command` *(Confirm)*, `edit_application_command` *(Confirm)*, `delete_application_command` *(Confirm)*.

*(Note: Overlapping tool names shared across Member/Role/Voice/Moderation/Message/Audit groups are unified into 182 unique registered MCP tools).*

---

## Complete MCP Resources Catalog (20 Resources)

### Static Resources (8)
- `discord://project/info` — Project metadata, version, and architecture.
- `discord://project/creator` — Official creator attribution for Omar ElSabbagh (EnzoCord).
- `discord://project/version` — Runtime, Discord.js, and project version details.
- `discord://bot/info` — Connected bot user and application profile.
- `discord://bot/status` — Gateway connection health, uptime, and ping.
- `discord://bot/permissions` — Permission summary across all connected guilds.
- `discord://bot/guilds` — Guilds where the bot is a member.
- `discord://guilds` — Available Discord servers list.

### Dynamic Guild Resource Templates (12)
- `discord://guild/{guildId}/info`
- `discord://guild/{guildId}/channels`
- `discord://guild/{guildId}/roles`
- `discord://guild/{guildId}/members`
- `discord://guild/{guildId}/emojis`
- `discord://guild/{guildId}/stickers`
- `discord://guild/{guildId}/events`
- `discord://guild/{guildId}/automod`
- `discord://guild/{guildId}/audit-logs`
- `discord://guild/{guildId}/statistics`
- `discord://guild/{guildId}/security`
- `discord://guild/{guildId}/structure`

---

## Complete MCP Prompts Catalog (17 Prompts)

1. `project_identity` — Official project identity and creator attribution.
2. `server_audit` — Full operational and structural server audit.
3. `server_security_audit` — Deep permission, MFA, verification, and AutoMod security review.
4. `server_setup` — Guided server category, channel, and role design.
5. `server_cleanup` — Safe archival and cleanup of unused channels, roles, and threads.
6. `server_optimization` — Channel layout, topic, and slowmode optimization.
7. `moderation_assistant` — Proportionate member investigation and moderation workflow.
8. `moderation_review` — Audit log, ban list, and moderation case history review.
9. `role_management` — Role hierarchy inspection and safe permission configuration.
10. `channel_management` — Channel, category, and permission overwrite management.
11. `permission_analysis` — Effective guild/channel/member permission troubleshooting.
12. `server_structure_analysis` — Visual category tree and uncategorized channel analysis.
13. `bot_diagnostics` — Gateway status, latency, intents, and permission diagnostics.
14. `activity_report` — Voice activity, active threads, events, and recent change summary.
15. `welcome_system_setup` — Read-only welcome/rules channel and embed setup.
16. `community_management` — Scheduled events, announcements, and community engagement.
17. `discord_server_backup_guide` — Read-only structural backup export workflow and limitations.

---

## Security Considerations & Discord API Limitations

1. **Destructive Action Confirmation:**
   All destructive tools require `confirm: true` **and** a valid single-use `confirmationToken` bound to the exact tool name and arguments via HMAC-SHA256. If invoked without a valid token, the tool refuses execution and returns a pending confirmation challenge so the user can review and approve the exact parameters first.
2. **Discord API Limitations:**
   - **Bulk Delete:** Discord prohibits bulk-deleting messages older than 14 days (`50034`) or deleting fewer than 2 / more than 100 messages in a single bulk call.
   - **Editing Messages:** A bot can only edit messages authored by the bot itself.
   - **Voice Movement:** A bot can only move or disconnect a member who is already connected to a voice channel, and only when the bot has `MoveMembers` and `Connect` permissions.
   - **Role & Member Hierarchy:** A bot cannot modify, assign, or delete roles positioned at or above the bot's highest role, nor can it kick, ban, timeout, or rename the server owner or members with a role ≥ the bot's highest role.
   - **Application Commands:** The bot can only inspect and manage slash commands belonging to its own Discord application, never slash commands owned by other bots.
   - **Backups:** Backups (`export_server_backup`) are read-only structural and metadata exports. They intentionally exclude user message history, file attachments, DMs, bot tokens, and webhook tokens.

---

## Troubleshooting

- **`Missing or placeholder DISCORD_TOKEN`:** Ensure you set a real Discord Bot Token in `.env` or in your MCP client's `"env"` block.
- **`DisallowedIntents` on startup:** Enable **Server Members Intent** and **Message Content Intent** under **Bot -> Privileged Gateway Intents** in the Discord Developer Portal, or set `ENABLE_GUILD_MEMBERS_INTENT=false` / `ENABLE_MESSAGE_CONTENT_INTENT=false` in `.env`.
- **`Role hierarchy violation`:** Open **Server Settings -> Roles** in Discord and drag the **Discord AI MCP** bot role above the roles you want it to manage.
- **`Missing Permissions (50013)`:** Run `check_bot_permissions` to see which guild or channel overwrite permissions the bot is missing.

---

## Testing & Code Quality

Run the automated Vitest test suite (no live Discord token required):

```bash
npm test
```

Run ESLint verification:

```bash
npm run lint
```

---

## License

Released under the [MIT License](./LICENSE).  
Copyright (c) 2026 **Omar ElSabbagh** (Egypt) — Creator & Owner of **Discord AI MCP** and the **EnzoCord** Discord community.

