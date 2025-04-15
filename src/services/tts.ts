import OpenAI from 'openai';
import { saveAs } from 'file-saver';
import { AgentPersonality } from '../types';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Tylko dla prototypu, w produkcji należy używać backendu
});

// Typy głosów dostępne w OpenAI TTS API
type OpenAITTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// Mapowanie osobowości agentów na głosy TTS OpenAI
const voiceMap: Record<AgentPersonality, OpenAITTSVoice> = {
  ola: 'nova',
  kazimierz: 'echo',
  kasia: 'nova',
  janinka: 'shimmer',
  albert: 'alloy',
  krystian: 'onyx'
};

// Funkcja generująca audio dla pojedynczej wypowiedzi
export const generateSpeech = async (
  text: string,
  agentPersonality: AgentPersonality
): Promise<ArrayBuffer> => {
  try {
    const voice = voiceMap[agentPersonality];
    
    const response = await openai.audio.speech.create({
      model: 'tts-1', // lub 'tts-1-hd' dla wyższej jakości
      voice: voice,
      input: text,
      speed: 1.2 // Zwiększamy szybkość o 20%
    });

    const audioBuffer = await response.arrayBuffer();
    return audioBuffer;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw new Error('Nie udało się wygenerować audio.');
  }
};

// Funkcja generująca audio dla wprowadzenia i zakończenia (neutralny głos)
export const generateNarratorSpeech = async (text: string): Promise<ArrayBuffer> => {
  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy' as OpenAITTSVoice, // Neutralny głos dla narratora
      input: text,
      speed: 1.15 // Zwiększamy szybkość o 15%
    });

    const audioBuffer = await response.arrayBuffer();
    return audioBuffer;
  } catch (error) {
    console.error('Error generating narrator speech:', error);
    throw new Error('Nie udało się wygenerować audio dla narratora.');
  }
};

// Funkcja łącząca fragmenty audio (pomocnicza, prosta implementacja)
export const concatenateAudioBuffers = (audioBuffers: ArrayBuffer[]): Blob => {
  // W rzeczywistej implementacji potrzebowalibyśmy ffmpeg.js do łączenia plików audio
  // Uproszczona implementacja tylko skleja bufory (nie będzie działać poprawnie)
  const totalLength = audioBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const buffer of audioBuffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  
  return new Blob([result], { type: 'audio/mp3' });
};

// Funkcja do zapisywania wygenerowanego audio jako pliku
export const saveAudioFile = (audioBlob: Blob, filename: string = 'podcast.mp3'): void => {
  saveAs(audioBlob, filename);
};

// Główna funkcja generująca audio dla całej rozmowy
export const generatePodcastAudio = async (
  introduction: string,
  exchanges: { agent1: string; agent2: string }[],
  conclusion: string,
  agent1Personality: AgentPersonality,
  agent2Personality: AgentPersonality
): Promise<Blob> => {
  try {
    // Generowanie audio dla wprowadzenia
    const introAudio = await generateNarratorSpeech(introduction);
    
    // Generowanie audio dla wymian
    const exchangeAudios: ArrayBuffer[] = [];
    
    for (const exchange of exchanges) {
      // Generowanie audio dla wypowiedzi pierwszego agenta
      const agent1Audio = await generateSpeech(exchange.agent1, agent1Personality);
      exchangeAudios.push(agent1Audio);
      
      // Generowanie audio dla wypowiedzi drugiego agenta
      const agent2Audio = await generateSpeech(exchange.agent2, agent2Personality);
      exchangeAudios.push(agent2Audio);
    }
    
    // Generowanie audio dla zakończenia
    const outroAudio = await generateNarratorSpeech(conclusion);
    
    // Łączenie wszystkich fragmentów audio
    const allAudios = [introAudio, ...exchangeAudios, outroAudio];
    return concatenateAudioBuffers(allAudios);
    
  } catch (error) {
    console.error('Error generating podcast audio:', error);
    throw new Error('Nie udało się wygenerować audio dla podcastu.');
  }
}; 