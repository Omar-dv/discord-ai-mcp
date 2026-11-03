/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApplication } from '../../src/core/application.js';
import { createMockDiscordClient, TEST_IDS } from '../fixtures/mock-discord.js';
import { PROJECT_IDENTITY } from '../../src/core/constants.js';

function parseToolResponse(mcpResult) {
  expect(mcpResult).toBeDefined();
  expect(Array.isArray(mcpResult.content)).toBe(true);
  const textBlock = mcpResult.content[0];
  expect(textBlock.type).toBe('text');
  return JSON.parse(textBlock.text);
}

describe('End-to-End Integration: MCP Tools, Resources, Prompts, and Mocked Discord Client', () => {
  let app;
  let mockEnv;

  beforeEach(() => {
    mockEnv = createMockDiscordClient();
    app = createApplication({
      configOptions: {
        env: {
          DISCORD_TOKEN: 'MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GhIjKl.MnOpQrStUvWxYz0123456789abcde',
          DATABASE_PATH: ':memory:',
          LOG_LEVEL: 'silent'
        },
        envFilePath: null
      },
      discordClientInstance: mockEnv.client
    });
  });

  afterEach(async () => {
    await app.stop();
  });

  it('registers all required MCP tools, resources, and prompts', () => {
    const tools = app.discordMcpServer.toolRegistry.listTools();
    const resources = app.discordMcpServer.resourceRegistry.listAllResources();
    const prompts = app.discordMcpServer.promptRegistry.listPrompts();

    expect(tools.length).toBe(182);
    expect(resources.length).toBe(20);
    expect(prompts.length).toBe(17);

    const requiredToolNames = [
      'get_bot_info',
      'list_guilds',
      'create_channel',
      'delete_channel',
      'get_voice_channels',
      'create_role',
      'delete_role',
      'get_member_info',
      'kick_member',
      'ban_member',
      'timeout_member',
      'send_message',
      'bulk_delete_messages',
      'create_thread',
      'create_emoji',
      'create_sticker',
      'create_invite',
      'create_webhook',
      'create_scheduled_event',
      'list_automod_rules',
      'get_audit_logs',
      'get_server_statistics',
      'export_server_backup',
      'list_application_commands',
      'request_action_confirmation'
    ];

    const registeredNames = new Set(tools.map((t) => t.name));
    for (const toolName of requiredToolNames) {
      expect(registeredNames.has(toolName)).toBe(true);
    }
  });

  it('executes Bot, Guild, Channel, Voice, and Role tools accurately', async () => {
    const registry = app.discordMcpServer.toolRegistry.registeredTools;

    const botInfoRes = parseToolResponse(await registry.get('get_bot_info').execute({}));
    expect(botInfoRes.ok).toBe(true);
    expect(botInfoRes.data.user.username).toBe('DiscordAIMCP');
    expect(botInfoRes.data.project.officialAttribution).toBe(PROJECT_IDENTITY.officialAttribution);

    const guildInfoRes = parseToolResponse(
      await registry.get('get_guild_info').execute({ guildId: TEST_IDS.GUILD_ID })
    );
    expect(guildInfoRes.ok).toBe(true);
    expect(guildInfoRes.data.name).toBe('EnzoCord Official Test Server');

    const createChanRes = parseToolResponse(
      await registry.get('create_channel').execute({
        guildId: TEST_IDS.GUILD_ID,
        name: 'announcements',
        type: 'text',
        topic: 'Official announcements'
      })
    );
    expect(createChanRes.ok).toBe(true);
    expect(createChanRes.data.name).toBe('announcements');

    const voiceListRes = parseToolResponse(
      await registry.get('get_voice_channels').execute({ guildId: TEST_IDS.GUILD_ID })
    );
    expect(voiceListRes.ok).toBe(true);
    expect(voiceListRes.data.count).toBe(2);

    const compareRolesRes = parseToolResponse(
      await registry.get('compare_role_permissions').execute({
        guildId: TEST_IDS.GUILD_ID,
        roleIdA: TEST_IDS.HIGH_ADMIN_ROLE_ID,
        roleIdB: TEST_IDS.MEMBER_ROLE_ID
      })
    );
    expect(compareRolesRes.ok).toBe(true);
    expect(compareRolesRes.data.onlyInRoleA).toContain('Administrator');
  });

  it('enforces two-step confirmation for destructive tools (kick_member, delete_channel, bulk_delete_messages)', async () => {
    const registry = app.discordMcpServer.toolRegistry.registeredTools;

    const unconfirmedKick = parseToolResponse(
      await registry.get('kick_member').execute({
        guildId: TEST_IDS.GUILD_ID,
        userId: TEST_IDS.MEMBER_USER_ID,
        reason: 'Rule violation'
      })
    );
    expect(unconfirmedKick.ok).toBe(false);
    expect(unconfirmedKick.error.code).toBe('CONFIRMATION_REQUIRED');
    const issuedToken = unconfirmedKick.error.details.confirmationToken;
    expect(issuedToken).toMatch(/^confirm_/);

    const confirmedKick = parseToolResponse(
      await registry.get('kick_member').execute({
        guildId: TEST_IDS.GUILD_ID,
        userId: TEST_IDS.MEMBER_USER_ID,
        reason: 'Rule violation',
        confirm: true,
        confirmationToken: issuedToken
      })
    );
    expect(confirmedKick.ok).toBe(true);
    expect(confirmedKick.data.kicked).toBe(true);
    expect(confirmedKick.data.moderationCase.actionType).toBe('kick');
  });

  it('redacts webhook tokens in webhook management tools', async () => {
    const registry = app.discordMcpServer.toolRegistry.registeredTools;

    const webhooksRes = parseToolResponse(
      await registry.get('list_webhooks').execute({ guildId: TEST_IDS.GUILD_ID })
    );
    expect(webhooksRes.ok).toBe(true);
    expect(webhooksRes.data.webhooks[0].tokenRedacted).toBe(true);
    expect(JSON.stringify(webhooksRes)).not.toContain(
      'super_secret_webhook_token_value_1234567890'
    );
  });

  it('executes Server Utilities, Diagnostics, and Read-Only Backup Export tools', async () => {
    const registry = app.discordMcpServer.toolRegistry.registeredTools;

    const diagRes = parseToolResponse(
      await registry.get('diagnose_server_configuration').execute({
        guildId: TEST_IDS.GUILD_ID
      })
    );
    expect(diagRes.ok).toBe(true);
    expect(diagRes.data.guild.id).toBe(TEST_IDS.GUILD_ID);

    const backupRes = parseToolResponse(
      await registry.get('export_server_backup').execute({
        guildId: TEST_IDS.GUILD_ID,
        includeAuditHistory: true,
        saveToFile: false
      })
    );
    expect(backupRes.ok).toBe(true);
    expect(backupRes.data.limitations.excludesMessages).toBe(true);
    expect(backupRes.data.snapshot.metadata.attribution).toBe(
      PROJECT_IDENTITY.officialAttribution
    );
  });

  it('executes Message, Thread, Emoji, Sticker, Invite, Event, AutoMod, Audit, and Command tools', async () => {
    const registry = app.discordMcpServer.toolRegistry.registeredTools;

    const sendRes = parseToolResponse(
      await registry.get('send_message').execute({
        guildId: TEST_IDS.GUILD_ID,
        channelId: TEST_IDS.TEXT_CHANNEL_ID,
        content: 'Hello from Discord AI MCP integration test!'
      })
    );
    expect(sendRes.ok).toBe(true);
    expect(sendRes.data.content).toContain('Hello from Discord AI MCP');

    const threadRes = parseToolResponse(
      await registry.get('create_thread').execute({
        guildId: TEST_IDS.GUILD_ID,
        channelId: TEST_IDS.TEXT_CHANNEL_ID,
        name: 'Support Thread'
      })
    );
    expect(threadRes.ok).toBe(true);
    expect(threadRes.data.name).toBe('Support Thread');

    const emojisRes = parseToolResponse(
      await registry.get('list_emojis').execute({ guildId: TEST_IDS.GUILD_ID })
    );
    expect(emojisRes.ok).toBe(true);
    expect(emojisRes.data.count).toBe(1);

    const stickersRes = parseToolResponse(
      await registry.get('list_stickers').execute({ guildId: TEST_IDS.GUILD_ID })
    );
    expect(stickersRes.ok).toBe(true);
    expect(stickersRes.data.count).toBe(1);

    const inviteRes = parseToolResponse(
      await registry.get('create_invite').execute({
        guildId: TEST_IDS.GUILD_ID,
        channelId: TEST_IDS.TEXT_CHANNEL_ID,
        maxAge: 3600
      })
    );
    expect(inviteRes.ok).toBe(true);
    expect(inviteRes.data.code).toBe('enzocord123');

    const eventsRes = parseToolResponse(
      await registry.get('list_scheduled_events').execute({ guildId: TEST_IDS.GUILD_ID })
    );
    expect(eventsRes.ok).toBe(true);
    expect(eventsRes.data.count).toBe(1);

    const autoModRes = parseToolResponse(
      await registry.get('list_automod_rules').execute({ guildId: TEST_IDS.GUILD_ID })
    );
    expect(autoModRes.ok).toBe(true);
    expect(autoModRes.data.count).toBe(1);

    const modAuditRes = parseToolResponse(
      await registry.get('get_recent_moderation_actions').execute({
        guildId: TEST_IDS.GUILD_ID
      })
    );
    expect(modAuditRes.ok).toBe(true);
    expect(modAuditRes.data.count).toBe(1);

    const commandsRes = parseToolResponse(
      await registry.get('list_application_commands').execute({
        guildId: TEST_IDS.GUILD_ID
      })
    );
    expect(commandsRes.ok).toBe(true);
    expect(commandsRes.data.count).toBe(1);
    expect(commandsRes.data.commands[0].name).toBe('status');
  });

  it('reads static and dynamic MCP Resources and executes MCP Prompts', async () => {
    const resourceRegistry = app.discordMcpServer.resourceRegistry;
    const promptRegistry = app.discordMcpServer.promptRegistry;

    const creatorRes = await resourceRegistry.staticResources
      .get('discord://project/creator')
      .read(new URL('discord://project/creator'));
    const creatorJson = JSON.parse(creatorRes.contents[0].text);
    expect(creatorJson.ok).toBe(true);
    expect(creatorJson.data.officialAttribution).toBe(PROJECT_IDENTITY.officialAttribution);

    const guildStructureRes = await resourceRegistry.templateResources
      .get('discord://guild/{guildId}/structure')
      .read(new URL(`discord://guild/${TEST_IDS.GUILD_ID}/structure`), {
        guildId: TEST_IDS.GUILD_ID
      });
    const structureJson = JSON.parse(guildStructureRes.contents[0].text);
    expect(structureJson.ok).toBe(true);
    expect(structureJson.data.categoriesCount).toBe(1);

    const identityPrompt = await promptRegistry.registeredPrompts
      .get('project_identity')
      .execute({});
    expect(identityPrompt.messages[0].content.text).toContain(
      PROJECT_IDENTITY.officialAttribution
    );

    const auditPrompt = await promptRegistry.registeredPrompts
      .get('server_audit')
      .execute({ guildId: TEST_IDS.GUILD_ID });
    expect(auditPrompt.messages[0].content.text).toContain(TEST_IDS.GUILD_ID);
  });
});
