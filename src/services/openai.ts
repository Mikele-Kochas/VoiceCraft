import OpenAI from 'openai';
import { AgentPersonality, ConversationMessage } from '../types';
import { saveAs } from 'file-saver';

// Bezpośrednio pobieramy klucz API z zmiennej środowiskowej
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

if (!API_KEY) {
  console.warn('Brak klucza API OpenAI - funkcje generatywne będą niedostępne');
}

// Dodajemy logowanie, aby sprawdzić, czy klucz jest poprawnie odczytywany
console.log('API Key dostępny:', API_KEY ? 'Tak' : 'Nie');
console.log('Długość klucza API:', API_KEY ? API_KEY.length : 0);
console.log('Pierwsze 10 znaków klucza API:', API_KEY ? API_KEY.substring(0, 10) : 'brak');

// Inicjalizacja klienta OpenAI
const openai = new OpenAI({
  apiKey: API_KEY,
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

export const generateResponse = async (messages: ConversationMessage[]): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Możesz zmienić na inny model
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || 'Nie udało się wygenerować odpowiedzi.';
  } catch (error) {
    console.error('Error generating response:', error);
    return 'Wystąpił błąd podczas generowania odpowiedzi.';
  }
};

// Funkcja do wyodrębniania kluczowych punktów z historii
const extractKeyPoints = (history: string): string => {
  const lines = history.split('\n');
  const keyPoints: string[] = [];
  let currentExchange = '';
  
  for (const line of lines) {
    if (line.includes(':')) {
      if (currentExchange) {
        // Analizujemy poprzednią wymianę
        if (currentExchange.length > 50) { // Tylko znaczące wymiany
          keyPoints.push(currentExchange);
        }
      }
      currentExchange = line;
    } else {
      currentExchange += ' ' + line;
    }
  }
  
  // Dodajemy ostatnią wymianę
  if (currentExchange) {
    keyPoints.push(currentExchange);
  }
  
  // Zwracamy tylko ostatnie 5 kluczowych punktów
  return keyPoints.slice(-5).join('\n');
};

const parseConversationHistory = (
  history: string,
  agent1Name: string,
  agent2Name: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> => {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  
  // Dzielimy historię na linie
  const lines = history.split('\n');
  
  // Pomijamy linie puste
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  
  // Wyodrębniamy kluczowe punkty z wcześniejszej historii
  const keyPoints = extractKeyPoints(history);
  
  // Dodajemy podsumowanie wcześniejszej rozmowy
  if (keyPoints) {
    messages.push({
      role: 'system',
      content: `KLUCZOWE PUNKTY Z WCZEŚNIEJSZEJ ROZMOWY:\n${keyPoints}`
    });
  }
  
  // Bierzemy tylko ostatnie 4 wymiany dla bezpośredniego kontekstu
  const recentExchanges = nonEmptyLines.slice(-8);
  
  for (const line of recentExchanges) {
    if (line.startsWith('Wprowadzenie:')) {
      messages.push({
        role: 'system',
        content: `Wprowadzenie podcastu: ${line.replace('Wprowadzenie:', '').trim()}`
      });
    } else if (line.startsWith(`${agent1Name}:`)) {
      messages.push({
        role: 'user',
        content: line.replace(`${agent1Name}:`, '').trim()
      });
    } else if (line.startsWith(`${agent2Name}:`)) {
      messages.push({
        role: 'assistant',
        content: line.replace(`${agent2Name}:`, '').trim()
      });
    }
  }
  
  return messages;
};

// Funkcja do generowania wprowadzenia
const generateIntroduction = async (topic: string): Promise<string> => {
  try {
    const prompt = `
    Napisz krótkie wprowadzenie do podcastu na temat: "${topic}".
    
    Wprowadzenie powinno:
    - Być wygłoszone przez JEDNEGO prowadzącego
    - Mieć długość 2-3 zdań
    - Zawierać powitanie słuchaczy w naturalny sposób (bez szablonowych zwrotów)
    - Przedstawić temat w sposób intrygujący
    - Zachęcić do wysłuchania rozmowy
    - NIE zawierać dialogu między prowadzącymi
    - NIE używać szablonowych zwrotów typu "Witajcie w podcaście", "Witamy w kolejnym odcinku"
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'Jesteś doświadczonym prowadzącym podcast, który potrafi w naturalny i wciągający sposób rozpocząć odcinek.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
      presence_penalty: 0.4,
      frequency_penalty: 0.4,
    });

    return response.choices[0].message.content || `Witamy w podcaście na temat: ${topic}`;
  } catch (error) {
    console.error('Error generating introduction:', error);
    return `Witamy w podcaście na temat: ${topic}`;
  }
};

// Funkcja do generowania pojedynczej wypowiedzi agenta
const generateAgentResponse = async (
  agentName: string,
  agentSystemPrompt: string,
  topic: string,
  conversationHistory: string,
  isFirstSpeaker: boolean,
  remainingExchanges: number,
  otherAgentName: string,
  exchangeNumber: number,
  totalExchanges: number
): Promise<string> => {
  try {
    const podcastStage = exchangeNumber / totalExchanges;
    
    // Losowo określamy długość wypowiedzi (bardziej zróżnicowana)
    const responseLength = Math.random();
    const lengthDescription = responseLength < 0.3 ? 
      "krótka (1-2 zwięzłe zdania, maksymalnie 80-120 tokenów)" : 
      responseLength > 0.8 ? 
      "dłuższa (4-7 zdań, bardziej rozbudowana, maksymalnie 220-300 tokenów)" : 
      "średnia (2-3 zdania, maksymalnie 120-180 tokenów)";
    
    // Losowo decydujemy, czy ta wypowiedź powinna zawierać anegdotę/historię
    const includeAnecdote = Math.random() > 0.6; // 40% szans na anegdotę
    
    // Określamy cel dla tej części rozmowy
    let conversationGoal = "";
    if (podcastStage < 0.2) {
      conversationGoal = "Wprowadź słuchaczy w temat, wzbudź zainteresowanie i pokaż różne perspektywy.";
    } else if (podcastStage > 0.8) {
      conversationGoal = "Zacznij naturalnie zmierzać do podsumowania, ale bez formalnego kończenia.";
    } else if (podcastStage < 0.5) {
      conversationGoal = "Pogłęb temat, zadawaj pytania, wprowadź nowe aspekty.";
    } else {
      conversationGoal = "Rozwiń najciekawsze wątki, pokaż praktyczne zastosowania i wnioski.";
    }
    
    const systemPrompt = `${agentSystemPrompt}

TEMAT PODCASTU: "${topic}"
WSPÓŁPROWADZĄCY: ${otherAgentName}

CEL OBECNEJ CZĘŚCI ROZMOWY:
${conversationGoal}

PAMIĘĆ I KONTEKST:
- ZAWSZE odnosić się do poprzednich wypowiedzi
- NIE POWTARZAĆ tych samych argumentów i przykładów
- Rozwijać wątki rozpoczęte przez ${otherAgentName}
- Wprowadzać nowe perspektywy do istniejących tematów
- Pamiętać o głównych punktach z wcześniejszej rozmowy

STRUKTURA WYPOWIEDZI:
- Twoja odpowiedź powinna być ${lengthDescription}
- ${includeAnecdote ? 'Podziel się KRÓTKĄ, KONKRETNĄ ANEGDOTĄ lub OSOBISTYM PRZYKŁADEM związanym z tematem.' : 'Skup się na bezpośredniej reakcji i rozwinięciu myśli rozmówcy.'}
- Zacznij od BEZPOŚREDNIEGO nawiązania do ostatniej wypowiedzi ${otherAgentName}
- Zakończ w sposób zachęcający do dalszej rozmowy (pytanie, kontrowersyjna opinia, niedokończona myśl)

DODATKOWE ZASADY:
- Każda wypowiedź musi być BEZPOŚREDNIĄ REAKCJĄ na słowa ${otherAgentName}
- Odnoś się do KONKRETNYCH słów i argumentów z poprzednich wypowiedzi
- Wprowadzaj nowe wątki TYLKO jeśli naturalnie wynikają z rozmowy
- Twoje dygresje muszą mieć JASNY ZWIĄZEK z tematem głównym
- UNIKAJ szablonowych zwrotów i formalnego języka

KONTEKST ROZMOWY:
- Jesteś w ${podcastStage < 0.2 ? 'początkowej' : podcastStage > 0.8 ? 'końcowej' : 'środkowej'} fazie podcastu (wymiana ${exchangeNumber}/${totalExchanges})
- To luźna, naturalna rozmowa przy kawie, NIE akademicka dyskusja
- Możesz przerywać, zmieniać tor myśli, wahać się - jak w prawdziwej rozmowie`;
    
    // Parsujemy historię konwersacji
    const historyMessages = parseConversationHistory(
      conversationHistory,
      isFirstSpeaker ? agentName : otherAgentName,
      isFirstSpeaker ? otherAgentName : agentName
    );
    
    // Tworzymy pełne zapytanie z typem zgodnym z API OpenAI
    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: 'system', content: systemPrompt },
      ...historyMessages
    ];
    
    // Jeśli to pierwszy mówca i pierwsza wymiana, dodajemy specjalną instrukcję
    if (isFirstSpeaker && exchangeNumber === 1) {
      messages.push({
        role: 'system',
        content: `Rozpocznij podcast w sposób naturalny, nawiązując do wprowadzenia. NIE używaj szablonowych powitań. UNIKAJ formalnych, sztucznych konstrukcji typu "Witajcie drodzy słuchacze". Mów tak, jakbyś rozmawiał ze znajomym, który właśnie poruszył ten temat.`
      });
    }
    
    // Jeśli to ostatnia wymiana, dodajemy instrukcję o zakończeniu
    if (remainingExchanges <= 1) {
      messages.push({
        role: 'system',
        content: 'To jedna z ostatnich wymian w podcaście. Zacznij naturalnie zmierzać do zakończenia. NIE UŻYWAJ szablonowych formułek typu "dziękuję za rozmowę", "do usłyszenia w następnym odcinku". Zakończ tak, jak osoba kończyłaby ciekawą rozmowę z przyjacielem.'
      });
    }
    
    console.log(`Generowanie odpowiedzi dla ${agentName}, wymiana ${exchangeNumber}/${totalExchanges}, długość: ${lengthDescription}, anegdota: ${includeAnecdote ? 'tak' : 'nie'}`);
    
    // Losowy poziom temperatury między 0.85 a 1.1 dla większej różnorodności i nieprzewidywalności odpowiedzi
    const temperature = 0.85 + (Math.random() * 0.25);
    
    // Dostosowujemy maksymalną długość odpowiedzi w zależności od typu wypowiedzi
    let maxTokens = 0;
    if (responseLength < 0.3) {
      maxTokens = 80 + Math.floor(Math.random() * 40); // 80-120 tokenów dla krótkich
    } else if (responseLength > 0.8) {
      maxTokens = 220 + Math.floor(Math.random() * 80); // 220-300 tokenów dla długich
    } else {
      maxTokens = 120 + Math.floor(Math.random() * 60); // 120-180 tokenów dla średnich
    }
    
    // Zwiększamy długość jeśli ma być anegdota
    if (includeAnecdote) {
      maxTokens = Math.floor(maxTokens * 1.3); // +30% tokenów dla anegdot
    }
    
    // Dodajemy dodatkową instrukcję w zależności od etapu podcastu
    if (podcastStage < 0.3) {
      // Początek podcastu
      messages.push({
        role: 'system',
        content: 'W początkowej części podcastu, wprowadź energię i zainteresowanie tematem. Pokaż swoje podejście i osobowość, ale unikaj zbyt szczegółowych analiz. Stawiaj pytania i wysuwaj wstępne opinie, aby zainicjować głębszą dyskusję.'
      });
    } else if (podcastStage > 0.7) {
      // Końcówka podcastu
      messages.push({
        role: 'system',
        content: 'W końcowej części podcastu, naturalnie zmierzaj do podsumowania, ale bez formalnych zwrotów. Odnieś się do wcześniejszych punktów rozmowy, okaż satysfakcję z dyskusji lub zostaw słuchacza z intrygującą myślą. Unikaj sztucznych podziękowań.'
      });
    } else {
      // Środkowa część podcastu
      messages.push({
        role: 'system',
        content: 'W środkowej części podcastu, zagłęb się w temat. Pokazuj różne perspektywy, zadawaj trudniejsze pytania, dziel się głębszymi refleksjami. To czas na konstruktywne niezgadzanie się, wprowadzanie niuansów i pokazywanie złożoności tematu.'
      });
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.6,
      max_tokens: responseLength < 0.3 ? 120 : responseLength > 0.8 ? 300 : 180,
      presence_penalty: 0.4,
      frequency_penalty: 0.4,
    });
    
    return response.choices[0].message.content || 'Nie udało się wygenerować odpowiedzi.';
  } catch (error) {
    console.error('Error generating agent response:', error);
    return `[${agentName}] Wystąpił błąd podczas generowania odpowiedzi.`;
  }
};

// Funkcja do generowania zakończenia
const generateConclusion = async (topic: string, conversationHistory: string): Promise<string> => {
  try {
    const prompt = `
    Napisz krótkie zakończenie podcastu na temat: "${topic}".
    
    Zakończenie powinno:
    - Być wygłoszone przez JEDNEGO prowadzącego
    - Mieć długość 2-3 zdań
    - Podsumować główne wątki rozmowy
    - Zachęcić do przemyśleń
    - NIE zawierać dialogu między prowadzącymi
    - NIE używać szablonowych zwrotów typu "dziękujemy za uwagę", "do usłyszenia w następnym odcinku"
    - NIE zawierać podziękowań ani pożegnań
    
    Ostatnie wypowiedzi w podcaście (dla kontekstu):
    ${conversationHistory.split('\n').slice(-10).join('\n')}
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'Jesteś doświadczonym prowadzącym podcast, który potrafi w naturalny sposób podsumować i zakończyć odcinek.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
      presence_penalty: 0.4,
      frequency_penalty: 0.4,
    });

    return response.choices[0].message.content || `To był podcast na temat: ${topic}`;
  } catch (error) {
    console.error('Error generating conclusion:', error);
    return `To był podcast na temat: ${topic}`;
  }
};

export const generateConversation = async (
  topic: string,
  agent1SystemPrompt: string,
  agent2SystemPrompt: string,
  agent1Name: string,
  agent2Name: string,
  numExchanges: number = 10
): Promise<{ introduction: string; exchanges: { agent1: string; agent2: string }[]; conclusion: string }> => {
  try {
    // Sprawdzamy, czy klucz API jest dostępny
    if (!API_KEY) {
      console.error('Klucz API OpenAI nie jest dostępny. Sprawdź plik .env.');
      
      // Zwracamy przykładową rozmowę dla testów, gdy klucz API nie jest dostępny
      return {
        introduction: "Witamy w naszym podcaście na temat: " + topic,
        exchanges: Array(numExchanges).fill(0).map((_, i) => ({
          agent1: `[${agent1Name}] To jest przykładowa wypowiedź agenta 1 w wymianie ${i+1}. Klucz API nie jest dostępny.`,
          agent2: `[${agent2Name}] To jest przykładowa wypowiedź agenta 2 w wymianie ${i+1}. Klucz API nie jest dostępny.`
        })),
        conclusion: "To była przykładowa rozmowa wygenerowana bez użycia API OpenAI."
      };
    }

    try {
      // Generujemy wprowadzenie
      const introduction = await generateIntroduction(topic);
      
      // Inicjalizujemy tablicę wymian i historię konwersacji
      const exchanges: { agent1: string; agent2: string }[] = [];
      let conversationHistory = `Wprowadzenie: ${introduction}\n\n`;
      
      // Dodajemy losowość do długości podcastu (8-12 wymian)
      const actualExchanges = Math.floor(numExchanges * (0.8 + Math.random() * 0.4));
      
      console.log(`Generowanie ${actualExchanges} wymian dla podcastu na temat: "${topic}"`);
      
      // Iteracyjnie budujemy rozmowę
      for (let i = 0; i < actualExchanges; i++) {
        const remainingExchanges = actualExchanges - i - 1;
        const currentExchangeNumber = i + 1;
        
        console.log(`Generowanie wymiany ${currentExchangeNumber}/${actualExchanges}`);
        
        // Generujemy wypowiedź pierwszego agenta
        const agent1Response = await generateAgentResponse(
          agent1Name,
          agent1SystemPrompt,  // Przekazujemy oryginalny system prompt
          topic,
          conversationHistory,
          i === 0,
          remainingExchanges,
          agent2Name,
          currentExchangeNumber,
          actualExchanges
        );
        
        // Aktualizujemy historię konwersacji
        conversationHistory += `${agent1Name}: ${agent1Response}\n\n`;
        
        // Generujemy wypowiedź drugiego agenta
        const agent2Response = await generateAgentResponse(
          agent2Name,
          agent2SystemPrompt,  // Przekazujemy oryginalny system prompt
          topic,
          conversationHistory,
          false,
          remainingExchanges,
          agent1Name,
          currentExchangeNumber,
          actualExchanges
        );
        
        // Aktualizujemy historię konwersacji
        conversationHistory += `${agent2Name}: ${agent2Response}\n\n`;
        
        // Dodajemy wymianę do tablicy
        exchanges.push({
          agent1: agent1Response,
          agent2: agent2Response
        });
      }
      
      // Generujemy zakończenie
      const conclusion = await generateConclusion(topic, conversationHistory);
      
      return {
        introduction,
        exchanges,
        conclusion
      };
    } catch (error: any) {
      console.error('Szczegóły błędu OpenAI:', error);
      
      if (error.status === 401) {
        console.error('Błąd uwierzytelniania. Sprawdź swój klucz API.');
      }
      
      // Zwracamy przykładową rozmowę dla testów, gdy wystąpi błąd API
      return {
        introduction: "Witamy w naszym podcaście na temat: " + topic,
        exchanges: Array(numExchanges).fill(0).map((_, i) => ({
          agent1: `[${agent1Name}] To jest przykładowa wypowiedź agenta 1 w wymianie ${i+1}. Wystąpił błąd API: ${error.message || 'Nieznany błąd'}`,
          agent2: `[${agent2Name}] To jest przykładowa wypowiedź agenta 2 w wymianie ${i+1}. Wystąpił błąd API: ${error.message || 'Nieznany błąd'}`
        })),
        conclusion: "To była przykładowa rozmowa wygenerowana z powodu błędu API OpenAI."
      };
    }
  } catch (error) {
    console.error('Error generating conversation:', error);
    throw new Error('Nie udało się wygenerować rozmowy.');
  }
}; 