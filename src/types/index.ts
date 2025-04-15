export type AgentPersonality =
  | 'ola'
  | 'kazimierz'
  | 'kasia'
  | 'janinka'
  | 'albert'
  | 'krystian';

export interface Agent {
  id: AgentPersonality;
  name: string;
  age: number | null;
  role: 'host' | 'guest';
  description: string;
  systemPrompt: string;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  agentId?: AgentPersonality;
}

export interface ConversationExchange {
  agent1: string;
  agent2: string;
}

export interface Conversation {
  topic: string;
  agent1: AgentPersonality;
  agent2: AgentPersonality;
  exchanges: ConversationExchange[];
  introduction: string;
  conclusion: string;
} 