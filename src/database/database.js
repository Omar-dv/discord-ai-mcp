/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { ERROR_CODES } from '../core/constants.js';
import { AppError } from '../utils/errors.js';
import { MIGRATIONS } from './migrations/index.js';
import { ConfigRepository } from './repositories/config-repository.js';
import { ModerationRepository } from './repositories/moderation-repository.js';
import { AuditRepository } from './repositories/audit-repository.js';

export class DatabaseManager {
  constructor({ databasePath = ':memory:', enableAuditHistory = true, logger } = {}) {
    this.databasePath = databasePath;
    this.enableAuditHistory = Boolean(enableAuditHistory);
    this.logger = logger;
    this.db = null;
    this.configRepo = null;
    this.moderationRepo = null;
    this.auditRepo = null;
  }

  initialize() {
    if (this.db) {
      return this;
    }

    try {
      if (this.databasePath !== ':memory:') {
        const dir = path.dirname(this.databasePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      this.db = new Database(this.databasePath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('synchronous = NORMAL');

      this.runMigrations();

      this.configRepo = new ConfigRepository(this.db);
      this.moderationRepo = new ModerationRepository(this.db);
      this.auditRepo = new AuditRepository(this.db, {
        enabled: this.enableAuditHistory
      });

      this.logger?.info(
        { databasePath: this.databasePath, migrationsApplied: MIGRATIONS.length },
        'SQLite database initialized successfully'
      );

      return this;
    } catch (error) {
      this.logger?.error({ error }, 'Failed to initialize SQLite database');
      throw new AppError(
        ERROR_CODES.DATABASE_ERROR,
        `Failed to initialize SQLite database: ${error.message}`
      );
    }
  }

  runMigrations() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    const appliedRows = this.db
      .prepare('SELECT version FROM schema_migrations ORDER BY version ASC')
      .all();
    const appliedVersions = new Set(appliedRows.map((row) => row.version));

    const insertMigrationStmt = this.db.prepare(
      'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)'
    );

    for (const migration of MIGRATIONS) {
      if (!appliedVersions.has(migration.version)) {
        const applyTx = this.db.transaction(() => {
          migration.up(this.db);
          insertMigrationStmt.run(
            migration.version,
            migration.name,
            new Date().toISOString()
          );
        });
        applyTx();
      }
    }
  }

  getAppliedMigrations() {
    if (!this.db) {
      return [];
    }
    return this.db
      .prepare('SELECT version, name, applied_at AS appliedAt FROM schema_migrations ORDER BY version ASC')
      .all();
  }

  isHealthy() {
    if (!this.db || !this.db.open) {
      return false;
    }
    try {
      const row = this.db.prepare('SELECT 1 AS ok').get();
      return row?.ok === 1;
    } catch {
      return false;
    }
  }

  close() {
    if (this.db && this.db.open) {
      this.db.close();
      this.logger?.info('SQLite database connection closed');
    }
    this.db = null;
  }
}

