/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_IDENTITY } from '../src/core/constants.js';
import { DatabaseManager } from '../src/database/database.js';

function runSetup() {
  const rootDir = process.cwd();
  const envExamplePath = path.join(rootDir, '.env.example');
  const envPath = path.join(rootDir, '.env');
  const dataDir = path.join(rootDir, 'data');
  const backupsDir = path.join(dataDir, 'backups');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  let envCreated = false;
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    envCreated = true;
  }

  const dbPath = path.join(dataDir, 'database.sqlite');
  const dbManager = new DatabaseManager({
    databasePath: dbPath,
    enableAuditHistory: true
  }).initialize();

  const migrations = dbManager.getAppliedMigrations();
  dbManager.close();

  process.stderr.write(
    JSON.stringify(
      {
        status: 'setup_complete',
        project: PROJECT_IDENTITY.name,
        version: PROJECT_IDENTITY.version,
        attribution: PROJECT_IDENTITY.officialAttribution,
        envFileCreated: envCreated,
        envFilePath: envPath,
        databasePath: dbPath,
        appliedMigrations: migrations,
        nextSteps: [
          '1. Edit .env and replace YOUR_DISCORD_BOT_TOKEN with your actual Discord Bot Token.',
          '2. Enable necessary Privileged Gateway Intents in the Discord Developer Portal.',
          '3. Run "npm run diagnostics" to verify your setup.',
          '4. Configure your MCP client to execute src/index.js with node.'
        ]
      },
      null,
      2
    ) + '\n'
  );
}

runSetup();

