# WebSocket Messages Documentation

This document describes all WebSocket messages used in the `useWebSocket.ts` hook, including messages sent (client → server) and messages received (server → client).

---

## 📤 Messages Sent (Client → Server)

These are the messages emitted by the client through the `useWebSocket` hook methods.

### 1. `join-room`
**Method:** `joinRoom(data: JoinRoomData)`  
**Purpose:** Join an existing room

**Data Structure:**
```typescript
{
  roomId: string;
  userId: string;
  username: string;
}
```

---

### 2. `create-private-room`
**Method:** `createPrivateRoom(userId: string, username: string)`  
**Purpose:** Create a private room for a user

**Data Structure:**
```typescript
{
  userId: string;
  username: string;
}
```

---

### 3. `join-by-code`
**Method:** `joinByCode(roomCode: string, userId: string, username: string)`  
**Purpose:** Join a room using a room code

**Data Structure:**
```typescript
{
  roomCode: string;
  userId: string;
  username: string;
}
```

---

### 4. `find-player`
**Method:** `findPlayer(userId: string, username: string)`  
**Purpose:** Search for an opponent to match with

**Data Structure:**
```typescript
{
  userId: string;
  username: string;
}
```

---

### 5. `cancel-search`
**Method:** `cancelSearch(userId: string)`  
**Purpose:** Cancel an active player search

**Data Structure:**
```typescript
{
  userId: string;
}
```

---

### 6. `send-message`
**Method:** `sendMessage(data: SendMessageData)`  
**Purpose:** Send a chat message to a room

**Data Structure:**
```typescript
{
  roomId: string;
  userId?: string;
  username?: string;
  message: string;
  messageType?: 'text' | 'image' | 'file' | 'game';
  type?: string;
}
```

---

### 7. `ping`
**Method:** `ping()`  
**Purpose:** Keep connection alive (sent automatically every 30 seconds)

**Data Structure:** None

---

### 8. `server-pong`
**Method:** Automatic response (not directly called)  
**Purpose:** Respond to server heartbeat

**Data Structure:**
```typescript
{
  timestamp: string;        // ISO 8601 format
  clientTime: number;       // Unix timestamp
  message: string;          // "Client is alive"
}
```

---

## 📥 Messages Received (Server → Client)

These are the messages received from the server and handled by listeners in the `useWebSocket` hook.

### Connection Events

#### `connect`
**Event:** Socket.IO connection established  
**Handler:** Internal socket event  
**Data:** None  
**Notes:** Triggered when WebSocket connection is successfully established

---

#### `connected`
**Event:** Server connection confirmation  
**Handler:** Internal socket listener (line 155 in webSocketService.ts)  
**Data:**
```typescript
{
  socketId: string;        // Unique socket ID
  message: string;         // "Conectado al servidor WebSocket"
  timestamp: string        // ISO 8601 format
}
```

---

#### `disconnect`
**Event:** Socket disconnected  
**Handler:** Internal socket event  
**Data:** `reason: string`  
**Notes:** Triggered when connection is lost or manually disconnected

---

#### `reconnect`
**Event:** Reconnection successful  
**Handler:** Internal socket event  
**Data:** `attemptNumber: number`  
**Notes:** Triggered after successful reconnection

---

#### `connect_error`
**Event:** Connection error  
**Handler:** Internal socket event  
**Data:** Error object  
**Notes:** Triggered when connection fails

---

### Room Events

#### `room-joined`
**Event:** Successfully joined a room  
**Handler:** `onRoomJoined` listener (line 108-120 in useWebSocket.ts)  
**Data:**
```typescript
{
  roomId: string;
  users: User[];
  messages: WebSocketMessage[];
  opponent?: { userId: string; username: string } | null;
}
```

**User Interface:**
```typescript
interface User {
  id: string;
  username: string;
  avatar?: Avatar | null;
  socketId: string;
  joinedAt: string;
}
```

---

#### `private-room-created`
**Event:** Private room was created  
**Handler:** `onPrivateRoomCreated` listener (line 122-127 in useWebSocket.ts)  
**Data:**
```typescript
{
  roomId: string;
  message: string;
}
```

---

#### `room-created`
**Event:** New room created (when original was full)  
**Handler:** `onRoomCreated` listener (line 139-147 in useWebSocket.ts)  
**Data:**
```typescript
{
  roomId: string;
  users: User[];
  messages: WebSocketMessage[];
  reason: string;
}
```

---

### User Events

#### `user-joined`
**Event:** User joined the room  
**Handler:** `onUserJoined` listener (line 85-95 in useWebSocket.ts)  
**Data:**
```typescript
{
  userId: string;
  username: string;
  message: string;
}
```

**Notes:** Updates the users array in state

---

#### `user-left`
**Event:** User left the room  
**Handler:** `onUserLeft` listener (line 97-105 in useWebSocket.ts)  
**Data:**
```typescript
{
  userId: string;
  username: string;
  message: string;
}
```

**Notes:** Removes user from state and clears typing indicator

---

#### `user-typing`
**Event:** User typing indicator  
**Handler:** Not directly handled in useWebSocket hook (available in service)  
**Data:**
```typescript
{
  userId: string;
  username: string;
  isTyping: boolean;
}
```

---

### Chat Events

#### `new-message`
**Event:** New chat message received  
**Handler:** `onMessage` listener (line 75-78 in useWebSocket.ts)  
**Data:**
```typescript
interface WebSocketMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: string;
  roomId: string;
}
```

**Notes:** Messages expire after 5 seconds

---

#### `message-expired`
**Event:** Message expired (after 5 seconds)  
**Handler:** `onMessageExpired` listener (line 80-83 in useWebSocket.ts)  
**Data:**
```typescript
{
  messageId: string;
}
```

**Notes:** Automatically removes expired messages from state

---

### Matchmaking Events

#### `waiting-for-player`
**Event:** Waiting in matchmaking queue  
**Handler:** Available in service but not directly exposed in hook  
**Data:**
```typescript
{
  message: string;
  position: number;
}
```

---

#### `player-found`
**Event:** Opponent found in matchmaking  
**Handler:** `onPlayerFound` listener (line 129-137 in useWebSocket.ts)  
**Data:**
```typescript
{
  roomId: string;
  message: string;
  opponent: {
    userId: string;
    username: string;
  };
  users: User[];
  messages: WebSocketMessage[];
  selectedCategory?: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  };
}
```

**Notes:** Also accessible via `onPlayerFound` method in hook return value

---

#### `search-cancelled`
**Event:** Search was cancelled  
**Handler:** Available in service but not directly exposed in hook  
**Data:**
```typescript
{
  message: string;
}
```

---

### Game Events

#### `round-started`
**Event:** Game round started  
**Handler:** `onRoundStarted` listener (exposed via hook return)  
**Data:** `any`  
**Notes:** Use via `hook.onRoundStarted((data) => {...})`

---

#### `round-finished`
**Event:** Game round finished  
**Handler:** `onRoundFinished` listener (exposed via hook return)  
**Data:** `any`  
**Notes:** Use via `hook.onRoundFinished((data) => {...})`

---

#### `game-finished`
**Event:** Game finished  
**Handler:** `onGameFinished` listener (exposed via hook return)  
**Data:** `any`  
**Notes:** Use via `hook.onGameFinished((data) => {...})`

---

#### `player-completed`
**Event:** Player completed a round  
**Handler:** `onPlayerCompleted` listener (exposed via hook return)  
**Data:** `any`  
**Notes:** Use via `hook.onPlayerCompleted((data) => {...})`

---

#### `timer-started`
**Event:** Round timer started  
**Handler:** `onTimerStarted` listener (exposed via hook return)  
**Data:** `any`  
**Notes:** Use via `hook.onTimerStarted((data) => {...})`

---

#### `answer-result`
**Event:** Answer result received  
**Handler:** `onAnswerResult` listener (exposed via hook return)  
**Data:** `any`  
**Notes:** Use via `hook.onAnswerResult((data) => {...})`

---

### System Events

#### `error`
**Event:** Server error  
**Handler:** `onError` listener (line 149-153 in useWebSocket.ts)  
**Data:**
```typescript
{
  message: string;
}
```

**Notes:** Updates error state in hook

---

#### `pong`
**Event:** Response to ping  
**Handler:** Internal socket listener  
**Data:** Any  
**Notes:** Confirms connection is alive

---

#### `server-ping`
**Event:** Server heartbeat  
**Handler:** Internal socket listener (line 326-337 in webSocketService.ts)  
**Data:** Any  
**Notes:** Automatically responds with `server-pong`

---

## 🔄 Hook State Management

The `useWebSocket` hook manages the following state:

```typescript
{
  // Connection state
  isConnected: boolean;
  socketId: string | undefined;
  
  // Room state
  currentRoom: string | null;
  users: User[];
  messages: WebSocketMessage[];
  
  // Typing state
  typingUsers: { [userId: string]: boolean };
  
  // Application state
  isLoading: boolean;
  error: string | null;
}
```

---

## 🔧 Automatic Behaviors

1. **Auto-connect:** WebSocket connects automatically when hook is mounted (line 201-205)
2. **Ping interval:** Sends ping every 30 seconds to keep connection alive (line 208-212)
3. **Auto-cleanup:** All listeners are removed when component unmounts (line 215-254)
4. **State reset:** Room state is cleared on disconnect (line 160-165)

---

## 📝 Usage Example

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function MyComponent() {
  const {
    isConnected,
    currentRoom,
    users,
    messages,
    joinRoom,
    findPlayer,
    sendMessage,
    onPlayerFound,
    onRoundStarted,
    error,
    isLoading
  } = useWebSocket();

  // Set up game listeners
  useEffect(() => {
    const handlePlayerFound = (data) => {
      console.log('Player found!', data.opponent);
    };

    const handleRoundStarted = (data) => {
      console.log('Round started!', data);
    };

    onPlayerFound(handlePlayerFound);
    onRoundStarted(handleRoundStarted);

    return () => {
      // Listeners are automatically cleaned up by the service
    };
  }, []);

  // Use methods
  const handleFindPlayer = () => {
    findPlayer('user123', 'PlayerName');
  };

  return (
    // Your component JSX
  );
}
```

---

## 📊 Summary

- **Outgoing Messages:** 8 types (via exposed methods)
- **Incoming Messages:** 22+ event types (handled by listeners)
- **Auto-managed:** Connection, ping, cleanup, state synchronization

---

*Last updated: Based on `useWebSocket.ts` hook implementation*
