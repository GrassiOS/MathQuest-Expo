## MathQuest (Expo) – Quick Start

### Prerequisites
- Node.js 18+ and npm
- Physical device with Expo Go or iOS Simulator/Android Emulator

### 1) Clone and install
```bash
git clone https://github.com/GrassiOS/MathQuest-Expo.git
cd MathQuest-Expo
npm i
```

### 2) Run the Expo app
```bash
npx expo start
# or
npm run start
```
- Press i for iOS, a for Android, w for web, or scan the QR with Expo Go.

### 3) Start the WebSocket server (1v1 matchmaking)
Open a new terminal window:
```bash
cd server
npm i       # first time only
node websocket-server.js
# or
npm run start
```
- Default server port: 3001
- The server logs your local IP for the client to connect.

### Useful app scripts
```bash
npm run ios      # start on iOS simulator
npm run android  # start on Android emulator
npm run web      # run in the browser
```

### Troubleshooting
- Clear Expo cache if things look stale:
```bash
npx expo start --clear
```
- If the server port is busy, set a different one:
```bash
PORT=3002 node websocket-server.js
```

