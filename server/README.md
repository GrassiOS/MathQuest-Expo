# MathQuest WebSocket Server

This is the WebSocket server for the MathQuest 1v1 Online Game Mode. It handles matchmaking, game logic, and real-time communication between players.

## Features

- **Real-time Matchmaking**: Automatically pairs players in a queue
- **1v1 Game Mode**: Best 2 out of 3 rounds (first to 3 wins)
- **Category Selection**: Random category selection with 6 questions per round
- **Scoring System**: 100 points per correct answer + 50 bonus for fastest completion
- **Reconnection Support**: Players can reconnect within 30 seconds
- **Timer Management**: Server-side timing for fair gameplay

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Server Configuration

The server runs on port 8080 by default. You can modify this in `index.js`:

```javascript
const server = new MathQuestServer(8080); // Change port here
```

## WebSocket Events

### Client to Server

- `JOIN_QUEUE` - Join the matchmaking queue
- `PLAYER_READY` - Signal ready for round start
- `SUBMIT_ANSWER` - Submit answer for current question
- `RECONNECT` - Reconnect to existing match

### Server to Client

- `MATCH_FOUND` - Match has been found
- `ROUND_START` - Round is starting
- `ROUND_CATEGORY` - Category and questions for current round
- `TIME_WARNING` - Time is running out
- `ROUND_END` - Round has ended
- `ROUND_RESULT` - Results of the round
- `MATCH_END` - Match has ended
- `ERROR` - Error message
- `PLAYER_DISCONNECTED` - Another player disconnected
- `PLAYER_RECONNECTED` - Another player reconnected

## Game Flow

1. **Matchmaking**: Players join queue and are paired automatically
2. **Lobby**: Both players must be ready to start
3. **Round Start**: Server selects random category and sends 6 questions
4. **Question Phase**: Players answer questions within 15 seconds each
5. **Round Result**: Server calculates scores and determines winner
6. **Next Round**: Process repeats until one player wins 3 rounds
7. **Match End**: Final results and statistics

## Scoring System

- **Correct Answer**: 100 points
- **Fastest Completion**: 50 bonus points
- **Winner**: Player with highest total score for the round

## Reconnection Logic

- Players have 30 seconds to reconnect after disconnection
- If no reconnection, the other player wins automatically
- Match state is preserved during reconnection

## Development

### File Structure

```
server/
├── index.js           # Main server file
├── matchManager.js    # Matchmaking and match logic
├── roundManager.js    # Round and question management
├── messageTypes.js    # Event type definitions
├── package.json       # Dependencies
└── README.md         # This file
```

### Adding New Features

1. **New Events**: Add to `messageTypes.js`
2. **Game Logic**: Modify `roundManager.js`
3. **Matchmaking**: Modify `matchManager.js`
4. **Server Logic**: Modify `index.js`

### Testing

You can test the server using WebSocket clients or browser developer tools:

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // Join queue
  ws.send(JSON.stringify({
    type: 'JOIN_QUEUE',
    data: {
      playerId: 'test-player-1',
      username: 'TestPlayer',
      avatar: { skin_asset: 'skin01' }
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## Production Deployment

For production deployment:

1. Use a process manager like PM2
2. Set up reverse proxy (nginx)
3. Use SSL/TLS for secure connections
4. Configure firewall rules
5. Set up monitoring and logging

Example PM2 configuration:
```json
{
  "name": "mathquest-server",
  "script": "index.js",
  "instances": 1,
  "exec_mode": "fork",
  "env": {
    "NODE_ENV": "production",
    "PORT": 8080
  }
}
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port in `index.js`
2. **Connection refused**: Check if server is running
3. **WebSocket errors**: Check client URL (should be `ws://localhost:8080`)

### Logs

The server logs all important events to console. Check the terminal for:
- Player connections/disconnections
- Match creation/completion
- Round results
- Errors

## License

MIT License - see main project for details.
