/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { sanitizeUntrustedText } from '../../security/sanitization.js';
import { redactObject } from '../../security/secret-redaction.js';

export class ModerationRepository {
  constructor(db) {
    this.db = db;
    this.insertStmt = this.db.prepare(`
      INSERT INTO moderation_cases (
        guild_id,
        target_user_id,
        target_user_tag,
        moderator_id,
        action_type,
        reason,
        duration_seconds,
        metadata_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getByIdStmt = this.db.prepare(`
      SELECT
        case_id AS caseId,
        guild_id AS guildId,
        target_user_id AS targetUserId,
        target_user_tag AS targetUserTag,
        moderator_id AS moderatorId,
        action_type AS actionType,
        reason,
        duration_seconds AS durationSeconds,
        metadata_json AS metadataJson,
        created_at AS createdAt
      FROM moderation_cases
      WHERE guild_id = ? AND case_id = ?
    `);

    this.listByGuildStmt = this.db.prepare(`
      SELECT
        case_id AS caseId,
        guild_id AS guildId,
        target_user_id AS targetUserId,
        target_user_tag AS targetUserTag,
        moderator_id AS moderatorId,
        action_type AS actionType,
        reason,
        duration_seconds AS durationSeconds,
        metadata_json AS metadataJson,
        created_at AS createdAt
      FROM moderation_cases
      WHERE guild_id = ?
      ORDER BY case_id DESC
      LIMIT ?
    `);

    this.listByTargetStmt = this.db.prepare(`
      SELECT
        case_id AS caseId,
        guild_id AS guildId,
        target_user_id AS targetUserId,
        target_user_tag AS targetUserTag,
        moderator_id AS moderatorId,
        action_type AS actionType,
        reason,
        duration_seconds AS durationSeconds,
        metadata_json AS metadataJson,
        created_at AS createdAt
      FROM moderation_cases
      WHERE guild_id = ? AND target_user_id = ?
      ORDER BY case_id DESC
      LIMIT ?
    `);
  }

  formatRow(row) {
    if (!row) {
      return null;
    }
    return {
      caseId: row.caseId,
      guildId: row.guildId,
      targetUserId: row.targetUserId,
      targetUserTag: row.targetUserTag ? sanitizeUntrustedText(row.targetUserTag, 160) : null,
      moderatorId: row.moderatorId ?? null,
      actionType: row.actionType,
      reason: row.reason ? sanitizeUntrustedText(row.reason, 512) : null,
      durationSeconds: row.durationSeconds ?? null,
      metadata: row.metadataJson ? JSON.parse(row.metadataJson) : {},
      createdAt: row.createdAt
    };
  }

  createCase({
    guildId,
    targetUserId,
    targetUserTag = null,
    moderatorId = null,
    actionType,
    reason = null,
    durationSeconds = null,
    metadata = {}
  }) {
    const createdAt = new Date().toISOString();
    const safeReason = reason ? sanitizeUntrustedText(reason, 512) : null;
    const safeTag = targetUserTag ? sanitizeUntrustedText(targetUserTag, 160) : null;
    const safeMetadata = JSON.stringify(redactObject(metadata || {}));

    const info = this.insertStmt.run(
      String(guildId),
      String(targetUserId),
      safeTag,
      moderatorId ? String(moderatorId) : null,
      String(actionType),
      safeReason,
      durationSeconds !== null && durationSeconds !== undefined ? Number(durationSeconds) : null,
      safeMetadata,
      createdAt
    );

    return this.getCase(guildId, Number(info.lastInsertRowid));
  }

  getCase(guildId, caseId) {
    const row = this.getByIdStmt.get(String(guildId), Number(caseId));
    return this.formatRow(row);
  }

  getHistory({ guildId, targetUserId = null, limit = 50 }) {
    const clampedLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const rows = targetUserId
      ? this.listByTargetStmt.all(String(guildId), String(targetUserId), clampedLimit)
      : this.listByGuildStmt.all(String(guildId), clampedLimit);

    return rows.map((row) => this.formatRow(row));
  }
}

