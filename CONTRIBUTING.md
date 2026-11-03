# Contributing to Discord AI MCP

Copyright (c) 2026 Omar ElSabbagh.  
Licensed under the MIT License.

> **Official Attribution:**  
> This project was created by Omar ElSabbagh, a professional programmer from Egypt and the owner of the EnzoCord Discord community.

Thank you for your interest in contributing to **Discord AI MCP**. We welcome bug reports, security disclosures, documentation improvements, and well-tested feature enhancements that align with the project's local-first, security-by-default architecture.

---

## Core Architectural Principles

Before submitting a contribution, ensure your changes adhere to the following foundational rules:

1. **Local-First & Zero Creator Infrastructure Dependency:**
   - Version 1.x uses **LOCAL STDIO transport only**.
   - Never introduce cloud dependencies, telemetry, external analytics, centralized authentication, or external servers.
   - Keep Discord business logic strictly decoupled from MCP transport code so future transport adapters can be added cleanly.

2. **Strict Code Style & Comment Policy:**
   - Every JavaScript source file (`*.js`) **must** begin with the exact legal copyright header:
     ```js
     /*
      * Copyright (c) 2026 Omar ElSabbagh.
      * Licensed under the MIT License.
      */
     ```
   - **No explanatory, decorative, or section-separator comments** are allowed inside source files. Write self-documenting code using descriptive function names, variable names, and modular architecture.

3. **Security & Permission Enforcement:**
   - Every tool must validate inputs with **Zod v4**.
   - Every guild/channel/role/member operation must verify bot permissions and role hierarchy before calling the Discord API.
   - Destructive operations must require explicit confirmation via the confirmation subsystem.
   - Never log or return Discord bot tokens, webhook tokens, or credentials.

4. **STDIO Logging Discipline:**
   - Never write logs or debug output to `stdout` (`console.log` is forbidden in runtime code). All Pino logs must write exclusively to `stderr` (`fd 2`).

---

## Development Workflow

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run automated tests:**
   ```bash
   npm test
   ```

3. **Run ESLint:**
   ```bash
   npm run lint
   ```

4. **Run local diagnostics:**
   ```bash
   npm run diagnostics
   ```

---

## Pull Request Checklist

- [ ] Legal copyright header is present at the top of every new JavaScript file.
- [ ] No explanatory or decorative comments exist in any source file.
- [ ] All Zod v4 schemas validate parameters strictly.
- [ ] Unit and integration tests cover the new or modified behavior (`npm test` passes).
- [ ] Code passes ESLint with zero errors (`npm run lint`).
- [ ] Documentation (`README.md`, `CHANGELOG.md`) is updated if tools, resources, or prompts changed.

