import React, { useState } from 'react';

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  isDisabled?: boolean;
}

const TopicInput: React.FC<TopicInputProps> = ({ onSubmit, isDisabled = false }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic.trim());
    }
  };

  return (
    <div className="controls-section">
      <h2 className="section-header">Podaj temat rozmowy</h2>
      <form onSubmit={handleSubmit} className="topic-form">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Np. Sztuczna inteligencja w edukacji"
          disabled={isDisabled}
          className="topic-input"
        />
        <button 
          type="submit" 
          disabled={!topic.trim() || isDisabled}
          className="generate-button"
        >
          Generuj rozmowę
        </button>
      </form>
    </div>
  );
};

export default TopicInput; 