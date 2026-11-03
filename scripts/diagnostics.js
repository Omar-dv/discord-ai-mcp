/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { PROJECT_IDENTITY } from '../src/core/constants.js';
import { createApplication } from '../src/core/application.js';

function runDiagnostics() {
  const app = createApplication({
    configOptions: {
      allowMissingToken: true
    }
  });

  const tools = app.discordMcpServer.toolRegistry.listTools();
  const resources = app.discordMcpServer.resourceRegistry.listAllResources();
  const prompts = app.discordMcpServer.promptRegistry.listPrompts();
  const dbHealthy = app.databaseManager.isHealthy();
  const migrations = app.databaseManager.getAppliedMigrations();
  const configSummary = app.config.getPublicSummary();

  app.databaseManager.close();

  const report = {
    status: dbHealthy ? 'healthy' : 'degraded',
    project: PROJECT_IDENTITY.name,
    version: PROJECT_IDENTITY.version,
    creator: PROJECT_IDENTITY.creator,
    attribution: PROJECT_IDENTITY.officialAttribution,
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    configuration: configSummary,
    database: {
      healthy: dbHealthy,
      appliedMigrations: migrations
    },
    mcpRegistries: {
      toolsCount: tools.length,
      staticResourcesCount: resources.filter((r) => !r.isTemplate).length,
      resourceTemplatesCount: resources.filter((r) => r.isTemplate).length,
      totalResourcesCount: resources.length,
      promptsCount: prompts.length
    }
  };

  process.stderr.write(JSON.stringify(report, null, 2) + '\n');
}

runDiagnostics();

