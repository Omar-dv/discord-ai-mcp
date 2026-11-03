/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { loadConfig } from './config.js';
import { createLogger } from '../utils/logger.js';
import { DatabaseManager } from '../database/database.js';
import { ConfirmationManager } from '../security/confirmation.js';
import { SlidingWindowRateLimiter } from '../security/rate-limiter.js';
import { PermissionService } from '../services/permissions/permission-service.js';
import { ModerationService } from '../services/moderation/moderation-service.js';
import { AuditService } from '../services/audit/audit-service.js';
import { BackupService } from '../services/backup/backup-service.js';
import { DiagnosticsService } from '../services/diagnostics/diagnostics-service.js';
import { DiscordClientManager } from '../discord/client.js';
import { BotManager } from '../discord/managers/bot-manager.js';
import { GuildManager } from '../discord/managers/guild-manager.js';
import { ChannelManager } from '../discord/managers/channel-manager.js';
import { VoiceManager } from '../discord/managers/voice-manager.js';
import { RoleManager } from '../discord/managers/role-manager.js';
import { MemberManager } from '../discord/managers/member-manager.js';
import { ModerationManager } from '../discord/managers/moderation-manager.js';
import { MessageManager } from '../discord/managers/message-manager.js';
import { ThreadManager } from '../discord/managers/thread-manager.js';
import { EmojiManager } from '../discord/managers/emoji-manager.js';
import { StickerManager } from '../discord/managers/sticker-manager.js';
import { InviteManager } from '../discord/managers/invite-manager.js';
import { WebhookManager } from '../discord/managers/webhook-manager.js';
import { EventManager } from '../discord/managers/event-manager.js';
import { AutoModManager } from '../discord/managers/automod-manager.js';
import { CommandManager } from '../discord/managers/command-manager.js';
import { DiscordMcpServer } from '../mcp/server.js';

export function createApplication({
  configOptions = {},
  customConfig = null,
  customLogger = null,
  discordClientInstance = null
} = {}) {
  const config = customConfig || loadConfig(configOptions);
  const logger = customLogger || createLogger({ level: config.logLevel });

  const databaseManager = new DatabaseManager({
    databasePath: config.resolvedDatabasePath,
    enableAuditHistory: config.enableAuditHistory,
    logger
  }).initialize();

  const confirmationManager = new ConfirmationManager({
    ttlSeconds: config.confirmationTtlSeconds
  });

  const rateLimiter = new SlidingWindowRateLimiter({
    maxDestructivePerMinute: config.rateLimitMaxDestructivePerMinute,
    maxMessagesPerMinute: config.rateLimitMaxMessagesPerMinute
  });

  const permissionService = new PermissionService();

  const moderationService = new ModerationService({
    databaseManager,
    logger
  });

  const auditService = new AuditService({
    databaseManager,
    permissionService,
    logger
  });

  const backupService = new BackupService({
    config,
    databaseManager,
    auditService,
    logger
  });

  const diagnosticsService = new DiagnosticsService({
    permissionService,
    config,
    databaseManager
  });

  const discordClientManager = new DiscordClientManager({
    config,
    logger,
    clientInstance: discordClientInstance
  });

  const botManager = new BotManager({
    discordClientManager,
    permissionService,
    config
  });

  const guildManager = new GuildManager({
    discordClientManager,
    permissionService,
    auditService,
    databaseManager
  });

  const channelManager = new ChannelManager({
    discordClientManager,
    permissionService
  });

  const voiceManager = new VoiceManager({
    discordClientManager,
    permissionService
  });

  const roleManager = new RoleManager({
    discordClientManager,
    permissionService
  });

  const memberManager = new MemberManager({
    discordClientManager,
    permissionService,
    moderationService,
    roleManager,
    voiceManager,
    config
  });

  const messageManager = new MessageManager({
    discordClientManager,
    permissionService,
    rateLimiter
  });

  const moderationManager = new ModerationManager({
    memberManager,
    guildManager,
    auditService,
    moderationService,
    messageManager,
    discordClientManager
  });

  const threadManager = new ThreadManager({
    discordClientManager,
    permissionService
  });

  const emojiManager = new EmojiManager({
    discordClientManager,
    permissionService
  });

  const stickerManager = new StickerManager({
    discordClientManager,
    permissionService
  });

  const inviteManager = new InviteManager({
    discordClientManager,
    permissionService
  });

  const webhookManager = new WebhookManager({
    discordClientManager,
    permissionService,
    messageManager,
    rateLimiter
  });

  const eventManager = new EventManager({
    discordClientManager,
    permissionService
  });

  const autoModManager = new AutoModManager({
    discordClientManager,
    permissionService
  });

  const commandManager = new CommandManager({
    discordClientManager
  });

  const dependencies = {
    config,
    logger,
    databaseManager,
    confirmationManager,
    rateLimiter,
    permissionService,
    moderationService,
    auditService,
    backupService,
    diagnosticsService,
    discordClientManager,
    botManager,
    guildManager,
    channelManager,
    voiceManager,
    roleManager,
    memberManager,
    moderationManager,
    messageManager,
    threadManager,
    emojiManager,
    stickerManager,
    inviteManager,
    webhookManager,
    eventManager,
    autoModManager,
    commandManager
  };

  const discordMcpServer = new DiscordMcpServer(dependencies);

  return {
    ...dependencies,
    discordMcpServer,
    async start({ connectDiscord = true, connectMcpStdio = true } = {}) {
      if (connectDiscord) {
        await discordClientManager.connect();
      }
      if (connectMcpStdio) {
        await discordMcpServer.connectStdio();
      }
    },
    async stop() {
      await discordMcpServer.close();
      await discordClientManager.disconnect();
      databaseManager.close();
    }
  };
}

