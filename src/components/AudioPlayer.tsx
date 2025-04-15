import React, { useRef, useState, useEffect } from 'react';
import { saveAudioFile } from '../services/tts';

interface AudioPlayerProps {
  audioBlob: Blob | null;
  isLoading: boolean;
  podcastTitle: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioBlob, 
  isLoading, 
  podcastTitle 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);
  
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = x / width;
      const newTime = percentage * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };
  
  const handleDownload = () => {
    if (audioBlob) {
      const safeTitle = podcastTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      saveAudioFile(audioBlob, `podcast_${safeTitle}.mp3`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="audio-player loading">
        <div className="loading-message">Generowanie audio...</div>
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  if (!audioBlob || !audioUrl) {
    return (
      <div className="audio-player empty">
        <div className="empty-message">Brak wygenerowanego audio</div>
      </div>
    );
  }
  
  return (
    <div className="audio-player">
      <div className="audio-controls">
        <button 
          className={`play-button ${isPlaying ? 'pause' : 'play'}`}
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pauza' : 'Odtwórz'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        
        <div 
          className="audio-progress" 
          ref={progressRef}
          onClick={handleProgressClick}
        >
          <div 
            className="audio-progress-bar" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <audio 
            ref={audioRef} 
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            preload="auto"
          />
          <div className="audio-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        <button 
          className="download-button"
          onClick={handleDownload}
          aria-label="Pobierz MP3"
        >
          ↓
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer; 