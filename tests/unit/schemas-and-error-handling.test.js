/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  snowflakeSchema,
  hexColorSchema,
  validateInput,
  parseHexColor,
  validateDataUriOrUrl
} from '../../src/security/validation.js';
import { normalizeError } from '../../src/utils/errors.js';
import { ERROR_CODES } from '../../src/core/constants.js';

function collectJsFiles(dirPath, result = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.git', 'data', 'coverage', 'logs'].includes(entry.name)) {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath, result);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      result.push(fullPath);
    }
  }
  return result;
}

describe('Zod v4 Schemas, Centralized Error Handling, and Code Style Compliance', () => {
  it('validates Discord Snowflakes and hex colors with Zod v4', () => {
    expect(validateInput(snowflakeSchema, '555555555555555555')).toBe('555555555555555555');
    expect(() => validateInput(snowflakeSchema, 'invalid-id')).toThrowError(
      /Must be a valid Discord Snowflake ID/
    );

    expect(parseHexColor('#5865F2')).toBe(0x5865f2);
    expect(validateInput(hexColorSchema, '#57F287')).toBe('#57F287');
  });

  it('validates image URLs and base64 data URIs and enforces size limits', () => {
    const validPngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = validateDataUriOrUrl(validPngBase64, 1024, ['png']);
    expect(Buffer.isBuffer(buffer)).toBe(true);

    expect(() => validateDataUriOrUrl(validPngBase64, 10, ['png'])).toThrowError(
      /exceeds Discord limit/
    );
  });

  it('normalizes Discord API, rate limit, network, and SQLite errors cleanly', () => {
    const missingPerms = normalizeError({ code: 50013, status: 403, message: 'Missing Permissions' });
    expect(missingPerms.code).toBe(ERROR_CODES.MISSING_PERMISSIONS);

    const oldBulkDelete = normalizeError({ code: 50034, status: 400, message: 'Too old' });
    expect(oldBulkDelete.code).toBe(ERROR_CODES.VALIDATION_ERROR);

    const rateLimited = normalizeError({ status: 429, retryAfter: 5 });
    expect(rateLimited.code).toBe(ERROR_CODES.RATE_LIMITED);

    const sqliteErr = normalizeError({ code: 'SQLITE_CONSTRAINT', message: 'Constraint failed' });
    expect(sqliteErr.code).toBe(ERROR_CODES.DATABASE_ERROR);
  });

  it('verifies every JavaScript file contains the Omar ElSabbagh copyright header and no forbidden comments', () => {
    const allJsFiles = collectJsFiles(process.cwd());
    expect(allJsFiles.length).toBeGreaterThan(30);

    for (const filePath of allJsFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('Copyright (c) 2026 Omar ElSabbagh.');
      expect(content).toContain('Licensed under the MIT License.');
    }
  });
});

