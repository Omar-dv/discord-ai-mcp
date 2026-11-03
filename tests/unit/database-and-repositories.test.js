/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../../src/database/database.js';

describe('SQLite Database Manager, Migrations, and Repositories', () => {
  let dbManager;

  beforeEach(() => {
    dbManager = new DatabaseManager({
      databasePath: ':memory:',
      enableAuditHistory: true
    }).initialize();
  });

  afterEach(() => {
    dbManager.close();
  });

  it('applies versioned migrations and reports healthy status', () => {
    expect(dbManager.isHealthy()).toBe(true);
    const migrations = dbManager.getAppliedMigrations();
    expect(migrations.length).toBeGreaterThanOrEqual(2);
    expect(migrations[0].name).toBe('initial_core_tables');
    expect(migrations[1].name).toBe('audit_history_and_backups');
  });

  it('stores and retrieves guild settings while blocking sensitive credential keys', () => {
    const saved = dbManager.configRepo.setSetting('555555555555555555', 'welcomeChannel', {
      channelId: '666666666666666662',
      enabled: true
    });
    expect(saved.value.enabled).toBe(true);

    const fetched = dbManager.configRepo.getSetting('555555555555555555', 'welcomeChannel');
    expect(fetched.value.channelId).toBe('666666666666666662');

    expect(() =>
      dbManager.configRepo.setSetting('555555555555555555', 'discordToken', 'secret')
    ).toThrowError(/Refusing to store sensitive credential key/);
  });

  it('creates and queries moderation cases in ModerationRepository', () => {
    const created = dbManager.moderationRepo.createCase({
      guildId: '555555555555555555',
      targetUserId: '444444444444444444',
      targetUserTag: 'test_member',
      moderatorId: '222222222222222222',
      actionType: 'warn',
      reason: 'First warning for link spam'
    });

    expect(created.caseId).toBe(1);
    expect(created.actionType).toBe('warn');

    const byId = dbManager.moderationRepo.getCase('555555555555555555', 1);
    expect(byId.reason).toBe('First warning for link spam');

    const history = dbManager.moderationRepo.getHistory({
      guildId: '555555555555555555',
      targetUserId: '444444444444444444'
    });
    expect(history).toHaveLength(1);
  });

  it('records local audit log events and backup records in AuditRepository', () => {
    const auditEntry = dbManager.auditRepo.recordEvent({
      toolName: 'create_channel',
      category: 'channel',
      guildId: '555555555555555555',
      targetId: '666666666666666688',
      status: 'success',
      isDestructive: false,
      durationMs: 18,
      details: { name: 'announcements', token: 'must_be_redacted' }
    });

    expect(auditEntry.details.token).toBe('[REDACTED]');

    const logs = dbManager.auditRepo.getAuditHistory({
      guildId: '555555555555555555'
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].toolName).toBe('create_channel');

    dbManager.auditRepo.recordBackup({
      backupId: 'backup_test_1',
      guildId: '555555555555555555',
      guildName: 'EnzoCord Official Test Server',
      summary: { channelsCount: 4 }
    });

    const backups = dbManager.auditRepo.listBackups('555555555555555555');
    expect(backups).toHaveLength(1);
    expect(backups[0].backupId).toBe('backup_test_1');
  });
});

