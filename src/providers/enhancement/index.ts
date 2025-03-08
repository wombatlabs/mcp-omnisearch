import { Server } from '@modelcontextprotocol/sdk/server';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types';
import { handle_kagi_enrichment_request } from './kagi_enrichment';
import { handle_jina_grounding_request } from './jina_grounding';

export const register_enhancement_tools = (server: Server) => {
  // Tool registration is handled in the main tools.ts file
};

export const handle_enhancement_request = async (name: string, args: any) => {
  switch (name) {
    case 'enhance_kagi_enrichment':
      return handle_kagi_enrichment_request(args);
    case 'enhance_jina_grounding':
      return handle_jina_grounding_request(args);
    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown enhancement tool: ${name}`
      );
  }
};
