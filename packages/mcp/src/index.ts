#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SynapseClient } from './api';

const client = new SynapseClient();

const server = new Server(
  {
    name: 'synapse-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ?? 1. List Tools ?????????????????????????????????????????????????????????????
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'synapse_search_brain',
        description: 'Full-text and semantic search across all architecture decisions (ADR), components, problems, solutions, benchmarks, and ideas in Synapse.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search term or technical concept (e.g. "lmax disruptor latency")' },
            projectId: { type: 'string', description: 'Optional project UUID filter' },
          },
          required: ['query'],
        },
      },
      {
        name: 'synapse_get_node',
        description: 'Retrieve detailed architectural specification for a specific node (e.g. C-002, D-001) including ADR constraints, relations, and parameters.',
        inputSchema: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: 'Node Display ID (e.g. "C-002") or UUID' },
            projectId: { type: 'string', description: 'Project UUID' },
          },
          required: ['nodeId'],
        },
      },
      {
        name: 'synapse_list_nodes',
        description: 'List all architectural components, ADR decisions, and features in a Synapse project.',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project UUID (optional, defaults to first active project)' },
          },
        },
      },
      {
        name: 'synapse_get_latest_drops',
        description: 'Get the latest code snippets, text, and clipboard items synced via Quick Drop between mobile and PC.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of recent drops to retrieve (default 5)' },
          },
        },
      },
      {
        name: 'synapse_capture_idea',
        description: 'Save a new idea, architectural observation, or note into Synapse Ideas for brainstorming.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Idea headline or concept' },
            content: { type: 'string', description: 'Detailed thought, code snippet, or analysis' },
          },
          required: ['title'],
        },
      },
      {
        name: 'synapse_quick_drop',
        description: 'Send a code snippet, prompt output, or link directly to the developer mobile phone & PC clipboard.',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Text or code to drop' },
            type: { type: 'string', enum: ['text', 'code', 'link'], description: 'Content format' },
          },
          required: ['content'],
        },
      },
      {
        name: 'synapse_create_node',
        description: 'Register a new architectural node (component, decision ADR, feature, benchmark) directly into the Synapse knowledge graph.',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project UUID' },
            type: {
              type: 'string',
              enum: ['component', 'decision', 'feature', 'problem', 'solution', 'benchmark', 'risk', 'lesson', 'note'],
              description: 'Node type',
            },
            title: { type: 'string', description: 'Node title' },
            content: { type: 'string', description: 'Specification and architectural details' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags (e.g. ["#c++", "#lock-free"])' },
          },
          required: ['projectId', 'type', 'title'],
        },
      },
    ],
  };
});

// ?? 2. Call Tool ??????????????????????????????????????????????????????????????
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'synapse_search_brain': {
        const results = await client.search(args?.query as string, args?.projectId as string | undefined);
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      }

      case 'synapse_get_node': {
        let projId = args?.projectId as string | undefined;
        if (!projId) {
          const projs = await client.listProjects();
          if (projs.length > 0) projId = projs[0].id;
        }
        if (!projId) {
          return { content: [{ type: 'text', text: 'No active project found' }] };
        }

        const nodes = await client.listNodes(projId);
        const searchId = (args?.nodeId as string).toUpperCase();
        const target = nodes.find((n) => n.display_id === searchId || n.id === searchId);

        if (!target) {
          return { content: [{ type: 'text', text: `Node ${searchId} not found in project` }] };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(target, null, 2) }],
        };
      }

      case 'synapse_list_nodes': {
        let projId = args?.projectId as string | undefined;
        if (!projId) {
          const projs = await client.listProjects();
          if (projs.length > 0) projId = projs[0].id;
        }
        if (!projId) {
          return { content: [{ type: 'text', text: '[]' }] };
        }

        const nodes = await client.listNodes(projId);
        const brief = nodes.map((n) => ({
          id: n.id,
          display_id: n.display_id,
          type: n.type,
          title: n.title,
          status: n.status || 'draft',
          tags: n.tags,
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(brief, null, 2) }],
        };
      }

      case 'synapse_get_latest_drops': {
        const limit = (args?.limit as number) || 5;
        const drops = await client.listQuickDrops();
        return {
          content: [{ type: 'text', text: JSON.stringify(drops.slice(0, limit), null, 2) }],
        };
      }

      case 'synapse_capture_idea': {
        const idea = await client.createIdea(args?.title as string, (args?.content as string) || '');
        return {
          content: [{ type: 'text', text: `Idea created successfully: [${idea.id}] ${idea.title}` }],
        };
      }

      case 'synapse_quick_drop': {
        const drop = await client.createQuickDrop((args?.type as string) || 'text', args?.content as string);
        return {
          content: [{ type: 'text', text: `Dropped to mobile & PC clipboard: [${drop.id}] (${drop.type})` }],
        };
      }

      case 'synapse_create_node': {
        const node = await client.createNode(args?.projectId as string, {
          type: args?.type,
          title: args?.title,
          content: args?.content || '',
          tags: args?.tags || [],
          visibility: 'internal',
        });
        return {
          content: [{ type: 'text', text: `Node created in graph: [${node.display_id}] ${node.title}` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Synapse MCP Error: ${err.message || err}` }],
    };
  }
});

// ?? 3. List Resources ?????????????????????????????????????????????????????????
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'synapse://project/context',
        name: 'Active Project Architecture Graph',
        mimeType: 'application/json',
        description: 'Complete architecture context and active node list for current project',
      },
      {
        uri: 'synapse://drops/latest',
        name: 'Recent Quick Drops & Clipboard',
        mimeType: 'application/json',
        description: 'Recent text snippets and notes synced between phone and PC',
      },
    ],
  };
});

// ?? 4. Read Resource ??????????????????????????????????????????????????????????
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'synapse://project/context') {
    const projs = await client.listProjects();
    if (projs.length === 0) {
      return { contents: [{ uri, mimeType: 'application/json', text: '{}' }] };
    }
    const nodes = await client.listNodes(projs[0].id);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ project: projs[0], nodes }, null, 2),
        },
      ],
    };
  }

  if (uri === 'synapse://drops/latest') {
    const drops = await client.listQuickDrops();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(drops.slice(0, 10), null, 2),
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});

// ?? Start Server ??????????????????????????????????????????????????????????????
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Synapse MCP Server running on stdio');
}

main().catch((err) => {
  console.error('Fatal MCP Server error:', err);
  process.exit(1);
});
