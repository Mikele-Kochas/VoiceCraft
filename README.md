# VoiceCraft: Generator Podcastów AI

VoiceCraft to interaktywna aplikacja webowa umożliwiająca generowanie symulowanych podcastów z wykorzystaniem sztucznej inteligencji. Aplikacja pozwala na tworzenie rozmów między wirtualnymi postaciami o różnych osobowościach na dowolne tematy, a następnie konwertowanie tych rozmów na formę audio.


## Funkcjonalności

- **Generowanie konwersacji AI**: Tworzenie (w miarę) realistycznych rozmów między dwoma wirtualnymi postaciami
- **Wybór osobowości rozmówców**: 6 predefiniowanych, unikalnych osobowości do wyboru
- **Konwersja tekstu na mowę**: Synteza mowy z wykorzystaniem modeli TTS (Text-to-Speech)
- **Interaktywny interfejs**: Prosty w obsłudze interfejs do generowania i przeglądania konwersacji
- **Eksport audio**: Możliwość zapisania wygenerowanego podcastu jako plik MP3

## Technologie

- **Frontend**: React, TypeScript, CSS
- **Zarządzanie stanem**: React Context API
- **API zewnętrzne**:
  - OpenAI API - generowanie tekstu (GPT-4o-mini)
  - OpenAI API - synteza mowy (TTS-1)
- **Biblioteki pomocnicze**:
  - openai - klient API OpenAI
  - file-saver - zapisywanie plików audio

## Instalacja

1. Klonuj to repozytorium:
```bash
git clone https://github.com/Mikele-Kochas/VoiceCraft.git
cd VoiceCraft
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Utwórz plik `.env` w głównym katalogu projektu i dodaj swój klucz API OpenAI:
```
REACT_APP_OPENAI_API_KEY=twój_klucz_api_openai
```

## Uruchomienie

Aby uruchomić aplikację w trybie deweloperskim:

```bash
npm start
```

Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce, aby zobaczyć aplikację.

Aby zbudować wersję produkcyjną:

```bash
npm run build
```

## Instrukcja użycia

1. **Wprowadź temat podcastu**: Wpisz dowolny temat w pole tekstowe
2. **Wybierz rozmówców**: Wybierz dwóch różnych agentów AI z dostępnych osobowości:
   - Ola - 8-letnie dziecko, dociekliwe i zaangażowane
   - Kazimierz - 45-letni naukowiec, ekscentryczny i chaotyczny
   - Kasia - 25-letnia prowadząca, charyzmatyczna i błyskotliwa
   - Janinka - 65-letnia seniorka, strażniczka tradycji
   - Albert - geek z obsesją na punkcie popkultury
   - Krystian - charyzmatyczny prowadzący z ciętą ripostą
3. **Generuj rozmowę**: Kliknij przycisk "Generuj", aby stworzyć konwersację
4. **Przeglądaj wyniki**: Przeczytaj wygenerowaną transkrypcję podcastu
5. **Generuj audio**: Kliknij przycisk "Generuj Audio", aby przekształcić tekst w plik audio
6. **Słuchaj lub pobierz**: Odsłuchaj wygenerowany podcast lub pobierz go jako plik MP3

## Uwagi dotyczące bezpieczeństwa

- **Klucz API**: Nigdy nie udostępniaj swojego klucza API OpenAI w publicznym repozytorium
- **Koszty API**: Pamiętaj, że korzystanie z API OpenAI (szczególnie TTS) wiąże się z kosztami

## Ograniczenia

- Aplikacja działa całkowicie po stronie przeglądarki (frontend-only), co nie jest zalecane dla rozwiązań produkcyjnych ze względów bezpieczeństwa
- Funkcja łączenia plików audio jest uproszczona i w pełnej implementacji wymagałaby bardziej zaawansowanych bibliotek (np. ffmpeg.js)

## Licencja

Ten projekt jest udostępniony na licencji MIT.

## Autorzy

Michał Kocher, Martyna Kłak
