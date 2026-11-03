#!/usr/bin/env node
/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PROJECT_IDENTITY } from './core/constants.js';
import { createApplication } from './core/application.js';
import { registerProcessLifecycle } from './core/lifecycle.js';
import { redactString } from './security/secret-redaction.js';

export async function bootstrap() {
  try {
    const app = createApplication();
    registerProcessLifecycle(app);

    app.logger.info(
      {
        project: PROJECT_IDENTITY.name,
        version: PROJECT_IDENTITY.version,
        creator: PROJECT_IDENTITY.creator.name,
        community: PROJECT_IDENTITY.creator.discordCommunity
      },
      'Starting Discord AI MCP server over STDIO'
    );

    await app.start({
      connectDiscord: true,
      connectMcpStdio: true
    });

    return app;
  } catch (error) {
    const safeMessage = redactString(error?.message || 'Failed to start Discord AI MCP.');
    process.stderr.write(
      JSON.stringify({
        level: 'fatal',
        project: PROJECT_IDENTITY.name,
        error: safeMessage,
        timestamp: new Date().toISOString()
      }) + '\n'
    );
    process.exitCode = 1;
    return null;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFilePath === executedFilePath) {
  void bootstrap();
}

