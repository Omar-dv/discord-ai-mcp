# Changelog

Copyright (c) 2026 Omar ElSabbagh.  
Licensed under the MIT License.

> **Official Attribution:**  
> This project was created by Omar ElSabbagh, a professional programmer from Egypt and the owner of the EnzoCord Discord community.

All notable changes to **Discord AI MCP** are documented in this file.

---

## [1.0.0] - 2026-11-03

### Added
- Initial production release of **Discord AI MCP** created by **Omar ElSabbagh** (Egypt), owner of the **EnzoCord** Discord community.
- Local STDIO Model Context Protocol (MCP) server built on `@modelcontextprotocol/server` v2, `discord.js` v14, and `zod` v4.
- Complete modular architecture across `core`, `discord`, `mcp`, `services`, `database`, `security`, `utils`, and `types`.
- Full suite of Discord management MCP tools across 19 domains:
  - Bot Management (12 tools)
  - Guild Management (18 tools)
  - Channel Management (19 tools)
  - Voice Channel Management (9 tools)
  - Role Management (15 tools)
  - Member Management (19 tools)
  - Moderation Management (11 tools, with shared unified handlers where names overlap with Member/Audit/Message tools plus dedicated confirmation helper tools)
  - Message Management (16 tools)
  - Thread Management (13 tools)
  - Emoji Management (5 tools)
  - Sticker Management (4 tools)
  - Invite Management (5 tools)
  - Webhook Management (6 tools)
  - Scheduled Events Management (6 tools)
  - Auto Moderation Management (5 tools)
  - Audit Log Management (6 tools)
  - Server Utilities & Diagnostics (9 tools)
  - Backup & Export (3 tools)
  - Bot Application Commands (6 tools)
  - Security Confirmation Workflow (`request_action_confirmation`, `cancel_action_confirmation`)
- Complete MCP Resources (`discord://project/*`, `discord://bot/*`, `discord://guilds`, and dynamic `discord://guild/{guildId}/*` resource templates).
- Complete library of 16 reusable MCP Prompts (`server_audit`, `server_security_audit`, `server_setup`, `server_cleanup`, `server_optimization`, `moderation_assistant`, `moderation_review`, `role_management`, `channel_management`, `permission_analysis`, `server_structure_analysis`, `bot_diagnostics`, `activity_report`, `welcome_system_setup`, `community_management`, `discord_server_backup_guide`) plus `project_identity`.
- SQLite persistence via `better-sqlite3` with versioned schema migrations, configuration repository, moderation case repository, and local audit log repository.
- Security layer featuring Zod v4 input validation, Discord permission and role hierarchy checks, HMAC/token-based destructive action confirmation, sliding-window rate limiting, path traversal validation, prompt-injection sanitization, and secret/token redaction.
- Structured `stderr` logging via Pino.
- Automated unit and integration test suite powered by Vitest.

