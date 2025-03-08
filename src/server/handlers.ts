import { Server } from '@modelcontextprotocol/sdk/server';
import { CallToolRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types';

// Import provider handlers
import { handle_search_request } from '../providers/search';
import { handle_ai_response_request } from '../providers/ai_response';
import { handle_processing_request } from '../providers/processing';
import { handle_enhancement_request } from '../providers/enhancement';

export const setup_handlers = (server: Server) => {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Route to appropriate handler based on tool name prefix
    if (name.startsWith('search_')) {
      return handle_search_request(name, args);
    }
    
    if (name.startsWith('ai_')) {
      return handle_ai_response_request(name, args);
    }
    
    if (name.startsWith('process_')) {
      return handle_processing_request(name, args);
    }
    
    if (name.startsWith('enhance_')) {
      return handle_enhancement_request(name, args);
    }

    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${name}`
    );
  });
};
