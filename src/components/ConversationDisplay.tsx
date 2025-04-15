import React from 'react';
import { Conversation } from '../types';
import { getAgent } from '../services/agents';

interface ConversationDisplayProps {
  conversation: Conversation;
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ conversation }) => {
  const agent1 = getAgent(conversation.agent1);
  const agent2 = getAgent(conversation.agent2);

  return (
    <div className="conversation-display">
      <div className="messages">
        {conversation.introduction && (
          <div className="message introduction">
            <div className="message-header">Wprowadzenie</div>
            <div className="message-content">{conversation.introduction}</div>
          </div>
        )}

        {conversation.exchanges.map((exchange, index) => (
          <div key={index} className="exchange">
            <div className="message agent1">
              <div className="message-header">{agent1.name}</div>
              <div className="message-content">{exchange.agent1}</div>
            </div>
            <div className="message agent2">
              <div className="message-header">{agent2.name}</div>
              <div className="message-content">{exchange.agent2}</div>
            </div>
          </div>
        ))}

        {conversation.conclusion && (
          <div className="message conclusion">
            <div className="message-header">Zakończenie</div>
            <div className="message-content">{conversation.conclusion}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationDisplay; 