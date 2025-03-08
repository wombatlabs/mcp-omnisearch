import { Server } from '@modelcontextprotocol/sdk/server';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types';
import { handle_tavily_request } from './tavily';
import { handle_brave_request } from './brave';
import { handle_kagi_request } from './kagi';

export const register_search_tools = (server: Server) => {
  // Tool registration is handled in the main tools.ts file
};

export const handle_search_request = async (name: string, args: any) => {
  switch (name) {
    case 'search_tavily':
      return handle_tavily_request(args);
    case 'search_brave':
      return handle_brave_request(args);
    case 'search_kagi':
      return handle_kagi_request(args);
    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown search tool: ${name}`
      );
  }
};
