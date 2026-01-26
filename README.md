# Karaoke Expo Client

Client mobile React Native/Expo per un backend karaoke real-time Socket.IO.

## Architettura

### Principio Fondamentale: Server Authoritative

Il client è **completamente reattivo** allo stato server:

- ❌ NON contiene logica di business
- ❌ NON calcola stati derivati complessi
- ❌ NON assume nulla sul futuro
- ❌ NON applica update ottimistici
- ✅ Emette comandi
- ✅ Riceve eventi
- ✅ Riflette lo stato ricevuto

## Stack

- **Expo** (managed workflow)
- **React Native**
- **TypeScript** (strict mode)
- **socket.io-client**
- **@react-navigation/native-stack**
- State: React Context + Reducer

## Struttura Progetto

```
src/
├── components/           # Componenti UI riutilizzabili
│   ├── Button.tsx
│   ├── ConnectionStatusBar.tsx
│   ├── ErrorBanner.tsx
│   ├── PrepareNotification.tsx
│   ├── QueueItemCard.tsx
│   └── UserListItem.tsx
│
├── context/              # State management
│   └── KaraokeContext.tsx    # Provider + Reducer
│
├── hooks/                # Custom hooks
│   ├── useError.ts           # Gestione errori
│   ├── useNowPlaying.ts      # Canzone in riproduzione
│   ├── useQueue.ts           # Coda canzoni
│   ├── useSession.ts         # Stato sessione
│   └── useSocket.ts          # Comandi socket
│
├── navigation/           # Configurazione navigazione
│   └── AppNavigator.tsx
│
├── screens/              # Schermate
│   ├── JoinScreen.tsx        # Login/Join
│   ├── LobbyScreen.tsx       # Lista utenti
│   ├── QueueScreen.tsx       # Coda canzoni
│   └── NowPlayingScreen.tsx  # Player
│
├── services/             # Servizi
│   ├── index.ts              # Barrel export
│   ├── logger.service.ts     # Console logging strutturato
│   ├── socket.parsers.ts     # Normalizzazione dati server
│   └── socket.service.ts     # Singleton Socket.IO
│
└── types/                # TypeScript types
    ├── navigation.types.ts
    └── socket.types.ts       # Eventi e comandi
```

## Modello Connessione

### Socket Lifecycle

```
1. JoinScreen monta
2. connect() → ConnectionStatus.CONNECTING
3. Socket connesso → ConnectionStatus.CONNECTED
4. Utente emette join/createSession
5. Server risponde con welcome
6. Client naviga a Lobby

Su disconnect:
- ConnectionStatus.RECONNECTING (se recoverable)
- ConnectionStatus.DISCONNECTED (se server disconnect)

Su reconnect:
- Client rimane PASSIVO
- NON ri-emette join
- Attende sessionState dal server
```

### Eventi Server → Client

| Evento         | Descrizione                            |
| -------------- | -------------------------------------- |
| `welcome`      | Join riuscito, stato iniziale completo |
| `sessionState` | Sync completo (dopo reconnect)         |
| `queueUpdated` | Coda modificata                        |
| `nowPlaying`   | Cambio canzone in riproduzione         |
| `prepare`      | Notifica per prossimo performer        |
| `userJoined`   | Nuovo utente in sessione               |
| `userLeft`     | Utente uscito                          |
| `sessionEnded` | Sessione terminata                     |
| `error`        | Errore dal server                      |

### Comandi Client → Server

| Comando         | Ruolo       | Descrizione                        |
| --------------- | ----------- | ---------------------------------- |
| `join`          | Tutti       | Entra in sessione esistente        |
| `createSession` | Tutti       | Crea nuova sessione (diventa HOST) |
| `requestSong`   | PARTICIPANT | Richiedi canzone                   |
| `removeSong`    | Owner/HOST  | Rimuovi canzone da coda            |
| `nextSong`      | HOST        | Passa a prossima canzone           |
| `pauseSession`  | HOST        | Pausa sessione                     |
| `resumeSession` | HOST        | Riprendi sessione                  |
| `endSession`    | HOST        | Termina sessione                   |

## State Management

### KaraokeState

```typescript
interface KaraokeState {
  connectionStatus: ConnectionStatus;
  user: User | null;
  session: Session | null;
  users: User[];
  queue: QueueItem[]; // Già ordinata dal server
  nowPlaying: NowPlayingInfo | null;
  prepareNotification: PreparePayload | null;
  lastError: ServerErrorPayload | null;
  sessionEndedReason: string | null;
}
```

### Reducer Actions

Ogni evento server ha un'action corrispondente:

- `CONNECTION_STATUS_CHANGED`
- `WELCOME`
- `SESSION_STATE`
- `QUEUE_UPDATED`
- `NOW_PLAYING`
- `PREPARE`
- `USER_JOINED`
- `USER_LEFT`
- `SESSION_ENDED`
- `ERROR`
- `CLEAR_ERROR`
- `RESET`

### Data Parsing (socket.parsers.ts)

Il server potrebbe inviare dati in formati inconsistenti (es: booleani come stringhe `"true"`/`"false"`). Il modulo `socket.parsers.ts` normalizza tutti i payload ricevuti:

- `parseUser()` → Normalizza campi User (isConnected: boolean)
- `parseSession()` → Normalizza campi Session
- `parseQueueItem()` → Normalizza campi QueueItem (position: number | null)

Questi parser sono applicati in `KaraokeContext.tsx` su tutti gli eventi socket prima del dispatch al reducer.

## Flusso Completo

### Join → RequestSong → NextSong

```
1. JoinScreen
   └── User inserisce nickname + sessionCode
   └── Preme "Entra"
   └── useSocket().join({ nickname, sessionId })

2. Server processa
   └── Valida credenziali
   └── Aggiunge user a sessione
   └── Emette welcome

3. Client riceve welcome
   └── Reducer aggiorna stato completo
   └── JoinScreen detecta session !== null
   └── navigation.replace('Lobby')

4. LobbyScreen
   └── Mostra lista utenti (users)
   └── Preme "Vai alla coda"
   └── navigation.navigate('Queue')

5. QueueScreen
   └── Preme "Aggiungi canzone"
   └── Modal con catalogo
   └── Seleziona canzone
   └── useSocket().requestSong({ songId })

6. Server processa
   └── Valida permessi
   └── Aggiunge a coda
   └── Emette queueUpdated a tutti

7. Client riceve queueUpdated
   └── Reducer aggiorna queue
   └── QueueScreen re-renderizza con nuova lista

8. HOST preme "Prossima canzone"
   └── useSocket().nextSong()

9. Server processa
   └── Aggiorna nowPlaying
   └── Emette nowPlaying a tutti
   └── Emette prepare al prossimo (se esiste)

10. Client riceve nowPlaying
    └── Reducer aggiorna nowPlaying
    └── NowPlayingScreen mostra nuova canzone
```

### Gestione Disconnect

```
1. Rete cade
   └── socket.io tenta reconnect
   └── ConnectionStatus.RECONNECTING
   └── UI mostra banner giallo

2. Reconnect riuscito
   └── ConnectionStatus.CONNECTED
   └── Client NON ri-emette join
   └── Attende...

3a. Server riconosce sessione
    └── Emette sessionState
    └── Client aggiorna stato
    └── Utente continua normalmente

3b. Server non riconosce (sessione persa)
    └── Emette error o niente
    └── Client mostra errore
    └── Utente deve ri-joinare
```

### Gestione SessionEnded

```
1. HOST termina sessione
   └── useSocket().endSession()

2. Server processa
   └── Emette sessionEnded a tutti

3. Client riceve sessionEnded
   └── Reducer salva reason, pulisce stato
   └── Ogni screen detecta sessionEndedReason !== null
   └── Alert con motivo
   └── navigation.replace('Join')
```

## Configurazione

### Variabili Ambiente

```env
# URL del server Socket.IO
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000

# PIN per sbloccare modalità conduttore
EXPO_PUBLIC_HOST_PIN=1234
```

### Accesso Modalità Conduttore

**Web:** Aggiungi `?host=PIN` all'URL (es: `http://localhost:8081?host=1234`)

**Mobile (Expo Go):** Tocca 5 volte il titolo "Karaoke" per mostrare l'input PIN

### Sviluppo

```bash
# Installa dipendenze
npm install

# Avvia Expo
npm start

# Expo con tunnel (per test mobile da Internet)
npm run tunnel

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web browser
npm run web
```

## Assunzioni e Trade-off

### 1. Reconnect senza re-join automatico

**Assunzione**: Il server mantiene la sessione e invia `sessionState` su reconnect se il client era in una sessione valida.

**Trade-off**: Se il server non supporta questo, l'utente vedrà uno stato inconsistente e dovrà ri-joinare manualmente. Questo è preferibile a tentativi di recovery che potrebbero corrompere lo stato.

### 2. Elapsed time locale nel NowPlayingScreen

**Assunzione**: Per UX fluida, incrementiamo `elapsed` localmente ogni secondo.

**Trade-off**: Potrebbe driftare rispetto al server. Il valore autoritativo è quello ricevuto con `nowPlaying`. In produzione, il server potrebbe inviare heartbeat periodici per sync.

### 3. Catalogo canzoni mock

**Assunzione**: Il backend fornisce un endpoint/evento per il catalogo reale.

**Trade-off**: Per ora usiamo un mock locale. In produzione, il QueueScreen dovrebbe:

- Emettere `searchSongs` con query
- Ricevere `searchResults` con lista
- Mostrare i risultati

### 4. Nessuna persistenza locale

**Assunzione**: La sessione vive solo finché il socket è connesso.

**Trade-off**: Se l'app viene chiusa, la sessione è persa. Per supportare "resume", servirebbe:

- Salvare sessionId + token in SecureStore
- Emettere `rejoin` con token su app restart
- Il server dovrebbe validare e ripristinare

## Error Handling

- Gli errori arrivano SOLO dal server
- Il client li mostra tramite `ErrorBanner`
- L'utente può dismissare l'errore
- Gli errori NON corrompono lo stato
- Il client NON tenta recovery logica
- Il client NON corregge input automaticamente

## Testing

Per testare senza backend reale, creare un mock server:

```typescript
// mock-server.ts
import { Server } from 'socket.io';

const io = new Server(3000);
const karaoke = io.of('/karaoke');

karaoke.on('connection', (socket) => {
  socket.on('join', (payload) => {
    socket.emit('welcome', {
      user: { id: '1', nickname: payload.nickname, role: 'PARTICIPANT' },
      session: { id: payload.sessionId, status: 'ACTIVE', ... },
      users: [],
      queue: [],
      nowPlaying: null,
    });
  });
  // ... altri handler
});
```

## License

MIT
