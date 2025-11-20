// Sistema de descubrimiento automático de servidor
// Funciona en cualquier red WiFi sin configuración manual

export interface ServerInfo {
  ip: string;
  port: number;
  url: string;
  lastSeen: number;
}

class ServerDiscovery {
  private discoveredServers: Map<string, ServerInfo> = new Map();
  private discoveryInterval: ReturnType<typeof setInterval> | null = null;
  private isDiscovering = false;

  // Rangos de IP comunes para buscar
  private readonly COMMON_RANGES = [
    '192.168.1',    // Router doméstico común
    '192.168.0',    // Router doméstico común
    '10.0.0',       // Red empresarial
    '10.41.21',     // Red universitaria actual
    '172.16.0',     // Red privada
    '192.168.43',   // Hotspot Android
    '172.20.10',    // Hotspot iPhone
    '192.168.4',    // Hotspot Android alternativo
  ];

  // IPs específicas conocidas
  private readonly KNOWN_IPS = [
    '10.41.21.217',  // IP actual
    '192.168.100.3', // IP anterior
    'localhost',
    '127.0.0.1'
  ];

  /**
   * Busca servidores en la red
   */
  async discoverServers(): Promise<ServerInfo[]> {
    console.log('🔍 Iniciando búsqueda automática de servidores...');
    this.isDiscovering = true;
    
    const foundServers: ServerInfo[] = [];
    const promises: Promise<void>[] = [];

    // Buscar en IPs conocidas primero
    for (const ip of this.KNOWN_IPS) {
      promises.push(this.checkServer(ip, 3001, foundServers));
    }

    // Buscar en rangos comunes
    for (const range of this.COMMON_RANGES) {
      for (let i = 1; i <= 20; i++) { // Buscar en las primeras 20 IPs del rango
        const ip = `${range}.${i}`;
        promises.push(this.checkServer(ip, 3001, foundServers));
      }
    }

    // Esperar a que terminen todas las búsquedas
    await Promise.allSettled(promises);
    
    this.isDiscovering = false;
    console.log(`✅ Búsqueda completada. Encontrados ${foundServers.length} servidores`);
    
    return foundServers.sort((a, b) => b.lastSeen - a.lastSeen);
  }

  /**
   * Verifica si un servidor está disponible
   */
  private async checkServer(ip: string, port: number, foundServers: ServerInfo[]): Promise<void> {
    try {
      const url = `http://${ip}:${port}/api/status`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos timeout

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'online') {
          const serverInfo: ServerInfo = {
            ip,
            port,
            url: `http://${ip}:${port}`,
            lastSeen: Date.now()
          };
          
          foundServers.push(serverInfo);
          this.discoveredServers.set(ip, serverInfo);
          console.log(`✅ Servidor encontrado: ${ip}:${port}`);
        }
      }
    } catch (error) {
      // Silenciar errores de conexión
    }
  }

  /**
   * Encuentra el mejor servidor disponible
   */
  async findBestServer(): Promise<ServerInfo | null> {
    const servers = await this.discoverServers();
    
    if (servers.length === 0) {
      console.log('❌ No se encontraron servidores');
      return null;
    }

    // Retornar el servidor más reciente
    const bestServer = servers[0];
    console.log(`🎯 Mejor servidor encontrado: ${bestServer.ip}:${bestServer.port}`);
    
    return bestServer;
  }

  /**
   * Verifica si el servidor de Render está disponible
   */
  private async checkRenderServer(): Promise<ServerInfo | null> {
    try {
      const renderURL = 'https://server-x7b4.onrender.com';
      const url = `${renderURL}/api/status`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'online') {
          const serverInfo: ServerInfo = {
            ip: 'server-x7b4.onrender.com',
            port: 443,
            url: renderURL,
            lastSeen: Date.now()
          };
          console.log(`✅ Servidor Render encontrado: ${renderURL}`);
          return serverInfo;
        }
      }
    } catch (error) {
      // Silenciar errores de conexión
      console.log('⚠️ Servidor Render no disponible, buscando en red local...');
    }
    return null;
  }

  /**
   * Obtiene la URL del servidor automáticamente
   */
  async getServerURL(): Promise<string> {
    // Primero intentar conectar a Render (producción)
    const renderServer = await this.checkRenderServer();
    if (renderServer) {
      return renderServer.url;
    }
    
    // Si Render no está disponible, buscar en la red local
    const server = await this.findBestServer();
    
    if (server) {
      return server.url;
    }
    
    // Fallback final: usar Render (puede estar disponible más tarde)
    console.log('⚠️ No se encontró servidor local, usando Render como fallback');
    return 'https://server-x7b4.onrender.com';
  }

  /**
   * Inicia el descubrimiento automático en segundo plano
   */
  startAutoDiscovery(intervalMs: number = 30000) {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }

    this.discoveryInterval = setInterval(async () => {
      if (!this.isDiscovering) {
        await this.discoverServers();
      }
    }, intervalMs);

    console.log(`🔄 Descubrimiento automático iniciado (cada ${intervalMs/1000}s)`);
  }

  /**
   * Detiene el descubrimiento automático
   */
  stopAutoDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
      console.log('🛑 Descubrimiento automático detenido');
    }
  }

  /**
   * Obtiene la lista de servidores descubiertos
   */
  getDiscoveredServers(): ServerInfo[] {
    return Array.from(this.discoveredServers.values());
  }
}

// Instancia singleton
export const serverDiscovery = new ServerDiscovery();

// Función de conveniencia para obtener la URL del servidor
export const getAutoServerURL = async (): Promise<string> => {
  return await serverDiscovery.getServerURL();
};

// Función para encontrar el mejor servidor
export const findBestServer = async (): Promise<ServerInfo | null> => {
  return await serverDiscovery.findBestServer();
};
