/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { PROJECT_IDENTITY } from '../core/constants.js';
import { SERVER_INSTRUCTIONS } from './instructions.js';
import { registerAllTools } from './tools/index.js';
import { registerAllResources } from './resources/index.js';
import { registerAllPrompts } from './prompts/index.js';

export class DiscordMcpServer {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.logger = dependencies.logger;
    this.transport = null;

    this.mcpServer = new McpServer(
      {
        name: PROJECT_IDENTITY.packageName,
        version: PROJECT_IDENTITY.version
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
        instructions: SERVER_INSTRUCTIONS
      }
    );

    this.toolRegistry = registerAllTools(this.mcpServer, dependencies);
    this.resourceRegistry = registerAllResources(this.mcpServer, dependencies);
    this.promptRegistry = registerAllPrompts(this.mcpServer);

    this.logger?.info(
      {
        toolsCount: this.toolRegistry.registeredTools.size,
        staticResourcesCount: this.resourceRegistry.staticResources.size,
        templateResourcesCount: this.resourceRegistry.templateResources.size,
        promptsCount: this.promptRegistry.registeredPrompts.size
      },
      'Initialized MCP Server registries'
    );
  }

  async connectStdio(customTransport = null) {
    this.transport = customTransport || new StdioServerTransport();
    await this.mcpServer.connect(this.transport);
    this.logger?.info('MCP Server connected over local STDIO transport');
    return this.transport;
  }

  async close() {
    if (this.mcpServer) {
      await this.mcpServer.close();
      this.logger?.info('MCP Server closed');
    }
  }
}

