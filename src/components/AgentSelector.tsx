import React from 'react';
import { AgentPersonality } from '../types';
import { getAllAgents } from '../services/agents';

interface AgentSelectorProps {
  selectedAgents: AgentPersonality[];
  onSelectAgent: (agentId: AgentPersonality) => void;
  maxAgents?: number;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ 
  selectedAgents, 
  onSelectAgent, 
  maxAgents = 2 
}) => {
  const agents = getAllAgents();

  const handleAgentClick = (agentId: AgentPersonality) => {
    if (selectedAgents.includes(agentId)) {
      // Jeśli agent jest już wybrany, odznacz go
      onSelectAgent(agentId);
    } else if (selectedAgents.length < maxAgents) {
      // Jeśli nie osiągnięto maksymalnej liczby agentów, wybierz nowego
      onSelectAgent(agentId);
    }
  };

  return (
    <div className="agent-selector">
      <div className="agents-grid">
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className={`agent-card ${selectedAgents.includes(agent.id) ? 'selected' : ''}`}
            onClick={() => handleAgentClick(agent.id)}
          >
            <h3>{agent.name}</h3>
            <p className="agent-type">{agent.id}</p>
            <p>{agent.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentSelector; 