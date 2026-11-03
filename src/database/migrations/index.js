/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

export const MIGRATIONS = Object.freeze([
  {
    version: 1,
    name: 'initial_core_tables',
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS guild_settings (
          guild_id TEXT NOT NULL,
          setting_key TEXT NOT NULL,
          setting_value TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (guild_id, setting_key)
        );

        CREATE TABLE IF NOT EXISTS moderation_cases (
          case_id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          target_user_id TEXT NOT NULL,
          target_user_tag TEXT,
          moderator_id TEXT,
          action_type TEXT NOT NULL,
          reason TEXT,
          duration_seconds INTEGER,
          metadata_json TEXT,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_moderation_cases_guild_target
          ON moderation_cases (guild_id, target_user_id, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_moderation_cases_guild_created
          ON moderation_cases (guild_id, created_at DESC);
      `);
    }
  },
  {
    version: 2,
    name: 'audit_history_and_backups',
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS local_audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tool_name TEXT NOT NULL,
          category TEXT NOT NULL,
          guild_id TEXT,
          target_id TEXT,
          status TEXT NOT NULL,
          is_destructive INTEGER NOT NULL DEFAULT 0,
          duration_ms INTEGER NOT NULL DEFAULT 0,
          details_json TEXT,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_local_audit_logs_guild_created
          ON local_audit_logs (guild_id, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_local_audit_logs_category_created
          ON local_audit_logs (category, created_at DESC);

        CREATE TABLE IF NOT EXISTS backup_records (
          backup_id TEXT PRIMARY KEY,
          guild_id TEXT NOT NULL,
          guild_name TEXT NOT NULL,
          file_path TEXT,
          summary_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);
    }
  }
]);

