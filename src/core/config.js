/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import * as z from 'zod/v4';
import { GatewayIntentBits } from 'discord.js';
import { ERROR_CODES, LOG_LEVELS } from './constants.js';
import { BASE_GATEWAY_INTENTS } from '../types/index.js';
import { AppError } from '../utils/errors.js';
import { registerSecretForRedaction } from '../security/secret-redaction.js';
import { validateSafeFilePath } from '../security/sanitization.js';

const PROJECT_ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const booleanEnvSchema = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === 'boolean') {
      return val;
    }
    const normalized = val.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  });

const rawConfigSchema = z.object({
  discordToken: z.string().trim().min(1, 'DISCORD_TOKEN is required.'),
  discordApplicationId: z.string().trim().optional(),
  logLevel: z
    .string()
    .trim()
    .toLowerCase()
    .refine((val) => LOG_LEVELS.includes(val), {
      message: `LOG_LEVEL must be one of: ${LOG_LEVELS.join(', ')}`
    })
    .default('info'),
  databasePath: z.string().trim().min(1).default('./data/database.sqlite'),
  intentsPreset: z.enum(['minimal', 'default', 'full']).default('default'),
  enableMessageContentIntent: booleanEnvSchema.default(true),
  enableGuildMembersIntent: booleanEnvSchema.default(true),
  enableGuildPresencesIntent: booleanEnvSchema.default(false),
  enableAuditHistory: booleanEnvSchema.default(true),
  confirmationTtlSeconds: z.coerce.number().int().min(30).max(3600).default(300),
  rateLimitMaxDestructivePerMinute: z.coerce.number().int().min(1).max(120).default(10),
  rateLimitMaxMessagesPerMinute: z.coerce.number().int().min(1).max(300).default(30),
  backupExportDir: z.string().trim().min(1).default('./data/backups')
});

export function resolveGatewayIntents(config) {
  if (config.intentsPreset === 'minimal') {
    return [GatewayIntentBits.Guilds];
  }

  const intents = new Set(BASE_GATEWAY_INTENTS);

  if (config.intentsPreset === 'full' || config.enableGuildMembersIntent) {
    intents.add(GatewayIntentBits.GuildMembers);
  }
  if (config.intentsPreset === 'full' || config.enableMessageContentIntent) {
    intents.add(GatewayIntentBits.MessageContent);
  }
  if (config.intentsPreset === 'full' || config.enableGuildPresencesIntent) {
    intents.add(GatewayIntentBits.GuildPresences);
  }

  return Array.from(intents);
}

export function loadConfig({
  env = process.env,
  envFilePath = path.resolve(PROJECT_ROOT_DIR, '.env'),
  allowMissingToken = false,
  baseDirectory = PROJECT_ROOT_DIR
} = {}) {
  if (envFilePath && fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath, quiet: true });
  }

  const rawToken = (env.DISCORD_TOKEN ?? '').trim();
  const isPlaceholder =
    rawToken === '' ||
    rawToken === 'YOUR_DISCORD_BOT_TOKEN' ||
    rawToken === 'REPLACE_WITH_YOUR_BOT_TOKEN';

  if (!allowMissingToken && isPlaceholder) {
    throw new AppError(
      ERROR_CODES.CONFIGURATION_ERROR,
      'Missing or placeholder DISCORD_TOKEN. Set a valid Discord Bot Token in your .env file or MCP client env configuration.'
    );
  }

  const candidate = {
    discordToken: isPlaceholder && allowMissingToken ? 'UNCONFIGURED_TOKEN' : rawToken,
    discordApplicationId: env.DISCORD_APPLICATION_ID?.trim() || undefined,
    logLevel: env.LOG_LEVEL || 'info',
    databasePath: env.DATABASE_PATH || './data/database.sqlite',
    intentsPreset: env.INTENTS_PRESET || 'default',
    enableMessageContentIntent: env.ENABLE_MESSAGE_CONTENT_INTENT ?? true,
    enableGuildMembersIntent: env.ENABLE_GUILD_MEMBERS_INTENT ?? true,
    enableGuildPresencesIntent: env.ENABLE_GUILD_PRESENCES_INTENT ?? false,
    enableAuditHistory: env.ENABLE_AUDIT_HISTORY ?? true,
    confirmationTtlSeconds: env.CONFIRMATION_TTL_SECONDS ?? 300,
    rateLimitMaxDestructivePerMinute: env.RATE_LIMIT_MAX_DESTRUCTIVE_PER_MINUTE ?? 10,
    rateLimitMaxMessagesPerMinute: env.RATE_LIMIT_MAX_MESSAGES_PER_MINUTE ?? 30,
    backupExportDir: env.BACKUP_EXPORT_DIR || './data/backups'
  };

  const parsed = rawConfigSchema.safeParse(candidate);
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new AppError(
      ERROR_CODES.CONFIGURATION_ERROR,
      `Configuration validation failed: ${messages}`
    );
  }

  const validData = parsed.data;

  if (!isPlaceholder) {
    registerSecretForRedaction(validData.discordToken);
  }

  const resolvedDatabasePath =
    validData.databasePath === ':memory:'
      ? ':memory:'
      : validateSafeFilePath(validData.databasePath, baseDirectory, ['.sqlite', '.db']);

  const resolvedBackupDir = validateSafeFilePath(validData.backupExportDir, baseDirectory);
  const gatewayIntents = resolveGatewayIntents(validData);

  return Object.freeze({
    ...validData,
    isTokenConfigured: !isPlaceholder,
    resolvedDatabasePath,
    resolvedBackupDir,
    gatewayIntents,
    getPublicSummary() {
      return {
        isTokenConfigured: !isPlaceholder,
        discordApplicationId: validData.discordApplicationId ?? null,
        logLevel: validData.logLevel,
        databasePath: validData.databasePath,
        intentsPreset: validData.intentsPreset,
        enableMessageContentIntent: validData.enableMessageContentIntent,
        enableGuildMembersIntent: validData.enableGuildMembersIntent,
        enableGuildPresencesIntent: validData.enableGuildPresencesIntent,
        enableAuditHistory: validData.enableAuditHistory,
        confirmationTtlSeconds: validData.confirmationTtlSeconds,
        rateLimitMaxDestructivePerMinute: validData.rateLimitMaxDestructivePerMinute,
        rateLimitMaxMessagesPerMinute: validData.rateLimitMaxMessagesPerMinute,
        backupExportDir: validData.backupExportDir
      };
    }
  });
}

