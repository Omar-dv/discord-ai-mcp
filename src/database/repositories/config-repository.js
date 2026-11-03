/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { ERROR_CODES } from '../../core/constants.js';
import { AppError } from '../../utils/errors.js';
import { isSensitiveKey, redactObject } from '../../security/secret-redaction.js';

export class ConfigRepository {
  constructor(db) {
    this.db = db;
    this.upsertStmt = this.db.prepare(`
      INSERT INTO guild_settings (guild_id, setting_key, setting_value, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(guild_id, setting_key)
      DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at
    `);
    this.getStmt = this.db.prepare(`
      SELECT guild_id AS guildId, setting_key AS key, setting_value AS value, updated_at AS updatedAt
      FROM guild_settings
      WHERE guild_id = ? AND setting_key = ?
    `);
    this.listByGuildStmt = this.db.prepare(`
      SELECT guild_id AS guildId, setting_key AS key, setting_value AS value, updated_at AS updatedAt
      FROM guild_settings
      WHERE guild_id = ?
      ORDER BY setting_key ASC
    `);
    this.deleteStmt = this.db.prepare(`
      DELETE FROM guild_settings WHERE guild_id = ? AND setting_key = ?
    `);
  }

  setSetting(guildId, key, value) {
    if (isSensitiveKey(key)) {
      throw new AppError(
        ERROR_CODES.SECURITY_VIOLATION,
        `Refusing to store sensitive credential key "${key}" in SQLite.`
      );
    }

    const safeValue = redactObject(value);
    const serialized = JSON.stringify(safeValue);
    const updatedAt = new Date().toISOString();

    this.upsertStmt.run(String(guildId), String(key), serialized, updatedAt);

    return {
      guildId: String(guildId),
      key: String(key),
      value: safeValue,
      updatedAt
    };
  }

  getSetting(guildId, key) {
    const row = this.getStmt.get(String(guildId), String(key));
    if (!row) {
      return null;
    }
    return {
      guildId: row.guildId,
      key: row.key,
      value: JSON.parse(row.value),
      updatedAt: row.updatedAt
    };
  }

  getGuildSettings(guildId) {
    const rows = this.listByGuildStmt.all(String(guildId));
    const settings = {};
    for (const row of rows) {
      settings[row.key] = {
        value: JSON.parse(row.value),
        updatedAt: row.updatedAt
      };
    }
    return settings;
  }

  deleteSetting(guildId, key) {
    const result = this.deleteStmt.run(String(guildId), String(key));
    return result.changes > 0;
  }
}

