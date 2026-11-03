/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { redactString } from '../security/secret-redaction.js';

export function registerProcessLifecycle(app) {
  let shuttingDown = false;

  const gracefulShutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    app.logger?.info({ signal }, 'Received shutdown signal, closing Discord AI MCP');
    try {
      await app.stop();
    } catch (error) {
      app.logger?.error(
        { message: redactString(error?.message || 'Error during shutdown') },
        'Error during graceful shutdown'
      );
    }
  };

  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });

  process.on('uncaughtException', (error) => {
    app.logger?.fatal(
      { message: redactString(error?.message || 'Uncaught exception') },
      'Uncaught runtime exception'
    );
  });

  process.on('unhandledRejection', (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    app.logger?.error(
      { message: redactString(msg) },
      'Unhandled promise rejection'
    );
  });

  return gracefulShutdown;
}

