import { Server } from '@modelcontextprotocol/sdk/server';

export interface SearchArgs {
  query: string;
}

export interface ProcessingArgs {
  url: string;
}

export interface EnhancementArgs {
  query?: string;
  statement?: string;
}

export interface ProviderResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export type ProviderHandler = (args: any) => Promise<ProviderResponse>;

export interface ProviderRegistration {
  (server: Server): void;
}
