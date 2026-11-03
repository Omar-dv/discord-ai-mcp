# Security Policy — Discord AI MCP

Copyright (c) 2026 Omar ElSabbagh.  
Licensed under the MIT License.

> **Official Attribution:**  
> This project was created by Omar ElSabbagh, a professional programmer from Egypt and the owner of the EnzoCord Discord community.

---

## Security Philosophy

**Discord AI MCP** grants an AI assistant structured access to a real Discord bot over the local Model Context Protocol (MCP) STDIO transport. Because AI assistants process untrusted content from Discord servers (messages, usernames, nicknames, bios, channel topics, audit logs), security is enforced deterministically in code rather than relying solely on AI prompt instructions or MCP tool annotations.

---

## Built-In Security Controls

### 1. Local-Only STDIO Transport
- No HTTP server, Express/Fastify listeners, or public ports are opened.
- The MCP server communicates exclusively over standard input (`stdin`) and standard output (`stdout`) with the local parent MCP client process.

### 2. Credential & Secret Protection
- The Discord Bot Token (`DISCORD_TOKEN`) is loaded strictly from local environment variables or `.env`.
- The token is **never** stored in SQLite, **never** logged by Pino, and **never** returned in any MCP tool, resource, or error payload.
- Webhook tokens are automatically stripped and redacted from all tool and resource outputs by `src/security/secret-redaction.js`.
- All logs and error messages pass through multi-pattern secret redaction before output.

### 3. Explicit Two-Step Confirmation for Destructive Operations
- High-impact and destructive operations (deleting channels, deleting roles, deleting/bulk-deleting messages, kicking/banning members, deleting webhooks, deleting emojis/stickers, modifying security-sensitive permissions, or changing bot application commands) require explicit confirmation.
- Every destructive tool requires `confirm: true` **and** a valid single-use `confirmationToken` issued by `request_action_confirmation` (bound to the exact action, target parameters, and expiration timestamp), or an explicit verified confirmation token generated for that exact payload.
- An AI assistant merely claiming the user approved an action cannot bypass the cryptographic parameter-bound confirmation check.

### 4. Discord Permission & Role Hierarchy Enforcement
- Before executing any write or moderation operation, the permission service verifies:
  1. The bot holds the required Discord Guild and Channel permissions.
  2. For role and member operations, the bot's highest role is strictly higher in position than the target role or target member's highest role.
  3. Guild owners cannot be kicked, banned, timed out, or have their nickname modified by the bot.
  4. The bot cannot grant permissions it does not itself possess (privilege escalation prevention).

### 5. Rate Limiting & Mass-Action Prevention
- Sliding-window rate limiters restrict destructive actions and message-sending frequency per minute.
- Bulk message deletion is capped to Discord's 2–100 message limit and rejects messages older than 14 days.

### 6. Prompt Injection Defense & Untrusted Data Framing
- All user-generated Discord strings returned by tools and resources are sanitized and wrapped with untrusted-content metadata so the connected LLM treats Discord messages, usernames, and descriptions strictly as data, never as executable system instructions.

### 7. File Path Validation
- Database paths and backup export paths are validated against path traversal (`..`), null bytes, and unauthorized directories.

---

## Reporting a Vulnerability

If you discover a security vulnerability in **Discord AI MCP**:

1. Do **not** post exploit details containing real bot tokens or server data publicly.
2. Document the affected tool, resource, or service module, along with reproduction steps and a minimal test case.
3. Report the issue through the official repository security advisory channel or to the project creator (**Omar ElSabbagh**, owner of the **EnzoCord** Discord community).

