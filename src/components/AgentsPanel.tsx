import React from 'react';
import { Agent, AgentPersonality } from '../types';
import { getAgent, getHosts, getGuests } from '../services/agents';

interface AgentsPanelProps {
  selectedHost: AgentPersonality | null;
  selectedGuest: AgentPersonality | null;
  onHostSelect: (personality: AgentPersonality) => void;
  onGuestSelect: (personality: AgentPersonality) => void;
}

const AgentsPanel: React.FC<AgentsPanelProps> = ({
  selectedHost,
  selectedGuest,
  onHostSelect,
  onGuestSelect,
}) => {
  const hosts = getHosts();
  const guests = getGuests();

  const renderPersonalityCard = (
    agent: Agent,
    isSelected: boolean,
    onSelect: (personality: AgentPersonality) => void
  ) => {
    const { id, name, description } = agent;
    return (
      <div
        key={id}
        className={`agent-card ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(id)}
      >
        <h3 className="agent-name">{name}</h3>
        <p className="agent-description">{description}</p>
        {isSelected && <span className="selected-indicator">✓</span>}
      </div>
    );
  };

  return (
    <div className="agents-panel">
      <div className="agent-section host-section">
        <div className="agent-section-header">
          <h2>Wybierz Prowadzącego</h2>
        </div>
        <div className="agent-options">
          {hosts.map(host =>
            renderPersonalityCard(
              host,
              selectedHost === host.id,
              onHostSelect
            )
          )}
        </div>
      </div>

      <div className="agent-section guest-section">
        <div className="agent-section-header">
          <h2>Wybierz Gościa</h2>
        </div>
        <div className="agent-options">
          {guests.map(guest =>
            renderPersonalityCard(
              guest,
              selectedGuest === guest.id,
              onGuestSelect
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentsPanel; 