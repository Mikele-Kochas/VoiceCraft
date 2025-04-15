import React, { useState } from 'react';
import './App.css';
import { AgentPersonality } from './types';
import { ConversationProvider, useConversation } from './contexts/ConversationContext';
import AgentsPanel from './components/AgentsPanel';
import TopicInput from './components/TopicInput';
import ConversationDisplay from './components/ConversationDisplay';
import AudioPlayer from './components/AudioPlayer';
import LoadingSpinner from './components/LoadingSpinner';

const PodcastGenerator: React.FC = () => {
  const [selectedHost, setSelectedHost] = useState<AgentPersonality | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<AgentPersonality | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const { 
    isLoading, 
    isGeneratingAudio,
    conversation, 
    error, 
    audioBlob,
    generateNewConversation,
    generateAudio 
  } = useConversation();

  const handleHostSelect = (hostId: AgentPersonality) => {
    setSelectedHost(prev => prev === hostId ? null : hostId);
  };

  const handleGuestSelect = (guestId: AgentPersonality) => {
    setSelectedGuest(prev => prev === guestId ? null : guestId);
  };

  const handleTopicSubmit = (topic: string) => {
    if (selectedHost && selectedGuest) {
      generateNewConversation(topic, selectedHost, selectedGuest);
    }
  };

  const canGenerateConversation = selectedHost !== null && selectedGuest !== null;

  return (
    <div className="podcast-generator">
      <div className="agents-panel-wrapper">
        <AgentsPanel 
          selectedHost={selectedHost}
          selectedGuest={selectedGuest}
          onHostSelect={handleHostSelect}
          onGuestSelect={handleGuestSelect}
        />
      </div>

      <div className="conversation-panel">
        <div className={`conversation-view ${showConversation ? 'visible' : ''}`}>
          <div className="conversation-view-header">
            <h2><span className="podcast-label">Podcast: </span>{conversation?.topic}</h2>
          </div>
          <div className="conversation-view-content">
            {conversation && <ConversationDisplay conversation={conversation} />}
          </div>
        </div>

        <div className={`conversation-view ${!showConversation ? 'visible' : ''}`}>
          <div className="conversation-header">
            <div className="app-title">
              <h1><span className="main-title">VoiceCraft</span></h1>
            </div>
            
            <div className={`topic-section ${canGenerateConversation ? 'highlight' : ''}`}>
              <TopicInput 
                onSubmit={handleTopicSubmit} 
                isDisabled={!canGenerateConversation || isLoading} 
              />
              {error && <div className="error-message">{error}</div>}
            </div>
          </div>

          {!conversation && !isLoading && (
            <div className="welcome-screen">
              <div className="welcome-content">
                <h2>Generator podcastów AI</h2>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="controls-panel">
        <div className="controls-section podcast-controls">
          <h2 className="section-header">Kontrola audio</h2>
          {isLoading && <LoadingSpinner message="Generowanie konwersacji..." />}
          {conversation ? (
            <>
              {audioBlob ? (
                <AudioPlayer 
                  audioBlob={audioBlob} 
                  isLoading={isGeneratingAudio} 
                  podcastTitle={conversation.topic} 
                />
              ) : (
                <button 
                  className="generate-button"
                  onClick={generateAudio}
                  disabled={isGeneratingAudio}
                >
                  {isGeneratingAudio ? 'Generowanie audio...' : 'Wygeneruj audio podcastu'}
                </button>
              )}
              <div className="audio-info">
                <p>Temat: {conversation.topic}</p>
                <p>Liczba wymian: {conversation.exchanges.length}</p>
                <p>Status audio: {audioBlob ? 'Wygenerowane' : 'Nie wygenerowane'}</p>
              </div>
              <button 
                className="view-conversation-button"
                data-showing={showConversation}
                onClick={() => setShowConversation(!showConversation)}
              >
                <span className="button-text" />
              </button>
            </>
          ) : (
            <div className="audio-info">
              <p>Status: Wybierz prowadzącego, gościa i podaj temat.</p>
            </div>
          )}
          {error && <div className="error-message">Błąd: {error}</div>}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ConversationProvider>
      <div className="App">
        <PodcastGenerator />
      </div>
    </ConversationProvider>
  );
}

export default App;
