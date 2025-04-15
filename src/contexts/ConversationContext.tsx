import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AgentPersonality, Conversation, ConversationExchange } from '../types';
import { generateConversation } from '../services/openai';
import { getAgent } from '../services/agents';
import { generatePodcastAudio } from '../services/tts';

interface ConversationContextType {
  isLoading: boolean;
  isGeneratingAudio: boolean;
  conversation: Conversation | null;
  error: string | null;
  audioBlob: Blob | null;
  generateNewConversation: (topic: string, agent1Id: AgentPersonality, agent2Id: AgentPersonality) => Promise<void>;
  generateAudio: () => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

interface ConversationProviderProps {
  children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const generateNewConversation = async (
    topic: string,
    agent1Id: AgentPersonality,
    agent2Id: AgentPersonality
  ) => {
    setIsLoading(true);
    setError(null);
    setAudioBlob(null); // Reset audio when generating new conversation

    try {
      const agent1 = getAgent(agent1Id);
      const agent2 = getAgent(agent2Id);

      const result = await generateConversation(
        topic,
        agent1.systemPrompt,
        agent2.systemPrompt,
        agent1.name,
        agent2.name
      );

      setConversation({
        topic,
        agent1: agent1Id,
        agent2: agent2Id,
        exchanges: result.exchanges,
        introduction: result.introduction,
        conclusion: result.conclusion
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd');
      console.error('Error in generateNewConversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!conversation) {
      setError('Nie można wygenerować audio bez konwersacji');
      return;
    }

    setIsGeneratingAudio(true);
    setError(null);

    try {
      const audio = await generatePodcastAudio(
        conversation.introduction,
        conversation.exchanges,
        conversation.conclusion,
        conversation.agent1,
        conversation.agent2
      );

      setAudioBlob(audio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas generowania audio');
      console.error('Error in generateAudio:', err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const value = {
    isLoading,
    isGeneratingAudio,
    conversation,
    error,
    audioBlob,
    generateNewConversation,
    generateAudio
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}; 