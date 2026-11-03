/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { redactObject } from '../../security/secret-redaction.js';

export class AuditRepository {
  constructor(db, { enabled = true } = {}) {
    this.db = db;
    this.enabled = Boolean(enabled);

    this.insertAuditStmt = this.db.prepare(`
      INSERT INTO local_audit_logs (
        tool_name,
        category,
        guild_id,
        target_id,
        status,
        is_destructive,
        duration_ms,
        details_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.listRecentStmt = this.db.prepare(`
      SELECT
        id,
        tool_name AS toolName,
        category,
        guild_id AS guildId,
        target_id AS targetId,
        status,
        is_destructive AS isDestructive,
        duration_ms AS durationMs,
        details_json AS detailsJson,
        created_at AS createdAt
      FROM local_audit_logs
      ORDER BY id DESC
      LIMIT ?
    `);

    this.listByGuildStmt = this.db.prepare(`
      SELECT
        id,
        tool_name AS toolName,
        category,
        guild_id AS guildId,
        target_id AS targetId,
        status,
        is_destructive AS isDestructive,
        duration_ms AS durationMs,
        details_json AS detailsJson,
        created_at AS createdAt
      FROM local_audit_logs
      WHERE guild_id = ?
      ORDER BY id DESC
      LIMIT ?
    `);

    this.insertBackupStmt = this.db.prepare(`
      INSERT INTO backup_records (
        backup_id,
        guild_id,
        guild_name,
        file_path,
        summary_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.listBackupsByGuildStmt = this.db.prepare(`
      SELECT
        backup_id AS backupId,
        guild_id AS guildId,
        guild_name AS guildName,
        file_path AS filePath,
        summary_json AS summaryJson,
        created_at AS createdAt
      FROM backup_records
      WHERE guild_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
  }

  formatRow(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      toolName: row.toolName,
      category: row.category,
      guildId: row.guildId ?? null,
      targetId: row.targetId ?? null,
      status: row.status,
      isDestructive: Boolean(row.isDestructive),
      durationMs: row.durationMs,
      details: row.detailsJson ? JSON.parse(row.detailsJson) : {},
      createdAt: row.createdAt
    };
  }

  recordEvent({
    toolName,
    category = 'general',
    guildId = null,
    targetId = null,
    status = 'success',
    isDestructive = false,
    durationMs = 0,
    details = {}
  }) {
    if (!this.enabled) {
      return null;
    }

    const createdAt = new Date().toISOString();
    const safeDetails = JSON.stringify(redactObject(details || {}));

    const info = this.insertAuditStmt.run(
      String(toolName),
      String(category),
      guildId ? String(guildId) : null,
      targetId ? String(targetId) : null,
      String(status),
      isDestructive ? 1 : 0,
      Math.max(0, Math.round(Number(durationMs) || 0)),
      safeDetails,
      createdAt
    );

    return {
      id: Number(info.lastInsertRowid),
      toolName,
      category,
      guildId,
      targetId,
      status,
      isDestructive: Boolean(isDestructive),
      durationMs: Math.max(0, Math.round(Number(durationMs) || 0)),
      details: redactObject(details || {}),
      createdAt
    };
  }

  getAuditHistory({ guildId = null, limit = 50 } = {}) {
    const clampedLimit = Math.min(200, Math.max(1, Number(limit) || 50));
    const rows = guildId
      ? this.listByGuildStmt.all(String(guildId), clampedLimit)
      : this.listRecentStmt.all(clampedLimit);
    return rows.map((row) => this.formatRow(row));
  }

  recordBackup({ backupId, guildId, guildName, filePath = null, summary = {} }) {
    const createdAt = new Date().toISOString();
    this.insertBackupStmt.run(
      String(backupId),
      String(guildId),
      String(guildName),
      filePath ? String(filePath) : null,
      JSON.stringify(redactObject(summary || {})),
      createdAt
    );
    return {
      backupId,
      guildId,
      guildName,
      filePath,
      summary: redactObject(summary || {}),
      createdAt
    };
  }

  listBackups(guildId, limit = 20) {
    const clampedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const rows = this.listBackupsByGuildStmt.all(String(guildId), clampedLimit);
    return rows.map((row) => ({
      backupId: row.backupId,
      guildId: row.guildId,
      guildName: row.guildName,
      filePath: row.filePath ?? null,
      summary: row.summaryJson ? JSON.parse(row.summaryJson) : {},
      createdAt: row.createdAt
    }));
  }
}

