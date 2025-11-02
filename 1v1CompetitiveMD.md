iOS Simulator + iPhone Setup (Localhost -> Local Wi‑Fi)
1) Backend setup
Start server:

For iPhone access, ensure the server listens on all interfaces:
If needed, in src/server.ts:
    server.listen(PORT, '0.0.0.0', () => {      console.log(`✅ Server running on port ${PORT}`);    });    ```- Find your Mac’s IP (for iPhone):  ```bash  ipconfig getifaddr en0  ```- Allow incoming connections for Node.js in macOS Firewall.### 2) URLs to use in the app- iOS Simulator: `http://localhost:4000`- Real iPhone (same Wi‑Fi): `http://<your-mac-ip>:4000`### 3) React Native client (minimal)- Install deps:  ```bash  npm i socket.io-client @supabase/supabase-js  ```- Add URL polyfill once (index.ts):  ```ts  import 'react-native-url-polyfill/auto';  ```- Example client:  ```ts  // matchmakingClient.ts  import { io, Socket } from 'socket.io-client';  import { createClient } from '@supabase/supabase-js';  import { Platform } from 'react-native';  const BASE_URL = __DEV__    ? (Platform.OS === 'ios'        ? 'http://localhost:4000'         // iOS simulator        : 'http://10.0.2.2:4000')         // Android emulator ref (ignored for now)    : 'http://<your-mac-ip>:4000';        // swap this for real device testing in dev  const supabase = createClient(    process.env.PUBLIC_SUPABASE_URL!,    process.env.PUBLIC_SUPABASE_ANON_KEY!  );  export async function connectAndFindPlayer(): Promise<Socket> {    const { data: { session } } = await supabase.auth.getSession();    const token = session?.access_token;    if (!token) throw new Error('No Supabase session/token');    const socket: Socket = io(BASE_URL, {      transports: ['websocket'],      forceNew: true,      autoConnect: false,    });    return new Promise((resolve, reject) => {      socket.on('connect', () => {        socket.emit('find-player', { token });        resolve(socket);      });      socket.on('waiting-for-player', () => console.log('Waiting for player…'));      socket.on('player-found', (payload) => console.log('Match ready', payload));      socket.on('error', (e) => console.warn('Matchmaking error', e));      socket.on('connect_error', reject);      socket.connect();    });  }  export function cancelAndDisconnect(socket?: Socket) {    socket?.emit('cancel-search');    socket?.disconnect();  }  ```- Env in RN (e.g., `react-native-config` or your preferred method):  - `PUBLIC_SUPABASE_URL`  - `PUBLIC_SUPABASE_ANON_KEY`  - Optionally `LOCAL_API_URL_SIM=http://localhost:4000`, `LOCAL_API_URL_PHONE=http://<your-mac-ip>:4000`### 4) iOS ATS for HTTP (dev only)- If connecting via `http://<your-mac-ip>:4000` on iPhone, add to `Info.plist`:  ```xml  <key>NSAppTransportSecurity</key>  <dict>    <key>NSAllowsArbitraryLoads</key>    <true/>  </dict>  ```- Remove this for production and use HTTPS when hosted.### 5) Test flows- Two iOS Simulators: both use `http://localhost:4000`- iOS Simulator + iPhone:  - Simulator: `http://localhost:4000`  - iPhone: `http://<your-mac-ip>:4000`- Expect server logs:  - “🔗 Socket connected…”  - “🎯 Player added to matchmaking queue…”  - “🤝 Match created: matchId=…”### 6) Common issues- iPhone can’t connect:  - Ensure same Wi‑Fi, correct `<your-mac-ip>`, and server bound to `0.0.0.0`  - macOS Firewall allows Node.js incoming- “Invalid token”:  - Make sure Supabase `session.access_token` exists (user is authenticated)- “Match creation failed”:  - Use `SUPABASE_SERVICE_ROLE_KEY` locally OR ensure RLS allows inserts for authenticated users on `public.matches`- CORS:  - React Native is not a browser; default `*` in server is fine for devWhen ready to host, switch the client URL to your HTTPS domain and remove ATS exceptions.
Find your Mac’s IP (for iPhone):
  ipconfig getifaddr en0
Allow incoming connections for Node.js in macOS Firewall.
2) URLs to use in the app
iOS Simulator: http://localhost:4000
Real iPhone (same Wi‑Fi): http://<your-mac-ip>:4000
3) React Native client (minimal)
Install deps:
  npm i socket.io-client @supabase/supabase-js
Add URL polyfill once (index.ts):
  import 'react-native-url-polyfill/auto';
Example client:
  // matchmakingClient.ts  import { io, Socket } from 'socket.io-client';  import { createClient } from '@supabase/supabase-js';  import { Platform } from 'react-native';  const BASE_URL = __DEV__    ? (Platform.OS === 'ios'        ? 'http://localhost:4000'         // iOS simulator        : 'http://10.0.2.2:4000')         // Android emulator ref (ignored for now)    : 'http://<your-mac-ip>:4000';        // swap this for real device testing in dev  const supabase = createClient(    process.env.PUBLIC_SUPABASE_URL!,    process.env.PUBLIC_SUPABASE_ANON_KEY!  );  export async function connectAndFindPlayer(): Promise<Socket> {    const { data: { session } } = await supabase.auth.getSession();    const token = session?.access_token;    if (!token) throw new Error('No Supabase session/token');    const socket: Socket = io(BASE_URL, {      transports: ['websocket'],      forceNew: true,      autoConnect: false,    });    return new Promise((resolve, reject) => {      socket.on('connect', () => {        socket.emit('find-player', { token });        resolve(socket);      });      socket.on('waiting-for-player', () => console.log('Waiting for player…'));      socket.on('player-found', (payload) => console.log('Match ready', payload));      socket.on('error', (e) => console.warn('Matchmaking error', e));      socket.on('connect_error', reject);      socket.connect();    });  }  export function cancelAndDisconnect(socket?: Socket) {    socket?.emit('cancel-search');    socket?.disconnect();  }
Env in RN (e.g., react-native-config or your preferred method):
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
Optionally LOCAL_API_URL_SIM=http://localhost:4000, LOCAL_API_URL_PHONE=http://<your-mac-ip>:4000
4) iOS ATS for HTTP (dev only)
If connecting via http://<your-mac-ip>:4000 on iPhone, add to Info.plist:
>
  <key>NSAppTransportSecurity</key>  <dict>    <key>NSAllowsArbitraryLoads</key>    <true/>  </dict>
Remove this for production and use HTTPS when hosted.
5) Test flows
Two iOS Simulators: both use http://localhost:4000
iOS Simulator + iPhone:
Simulator: http://localhost:4000
iPhone: http://<your-mac-ip>:4000
Expect server logs:
“🔗 Socket connected…”
“🎯 Player added to matchmaking queue…”
“🤝 Match created: matchId=…”
6) Common issues
iPhone can’t connect:
Ensure same Wi‑Fi, correct <your-mac-ip>, and server bound to 0.0.0.0
macOS Firewall allows Node.js incoming
“Invalid token”:
Make sure Supabase session.access_token exists (user is authenticated)
“Match creation failed”:
Use SUPABASE_SERVICE_ROLE_KEY locally OR ensure RLS allows inserts for authenticated users on public.matches
CORS:
React Native is not a browser; default * in server is fine for dev
When ready to host, switch the client URL to your HTTPS domain and remove ATS exceptions.