// Configuración dinámica que se actualiza automáticamente
// No necesitas cambiar nada manualmente

export interface DynamicConfig {
  serverIP: string;
  serverPort: number;
  websocketURL: string;
  apiURL: string;
  lastUpdated: number;
}

class DynamicConfigManager {
  private config: DynamicConfig | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Actualiza la configuración automáticamente
   */
  async updateConfig(): Promise<DynamicConfig | null> {
    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { findBestServer } = await import('./auto-discovery');
      
      const server = await findBestServer();
      
      if (server) {
        this.config = {
          serverIP: server.ip,
          serverPort: server.port,
          websocketURL: server.url,
          apiURL: `${server.url}/api`,
          lastUpdated: Date.now()
        };
        
        console.log('🔄 Configuración actualizada:', this.config);
        return this.config;
      }
      
      return null;
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      return null;
    }
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): DynamicConfig | null {
    return this.config;
  }

  /**
   * Obtiene la URL del WebSocket
   */
  getWebSocketURL(): string {
    if (this.config) {
      return this.config.websocketURL;
    }
    
    // Fallback a localhost
    return 'http://localhost:3001';
  }

  /**
   * Obtiene la URL de la API
   */
  getAPIURL(): string {
    if (this.config) {
      return this.config.apiURL;
    }
    
    // Fallback a localhost
    return 'http://localhost:3001/api';
  }

  /**
   * Inicia la actualización automática de configuración
   */
  startAutoUpdate(intervalMs: number = 30000) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Actualizar inmediatamente
    this.updateConfig();

    // Actualizar periódicamente
    this.updateInterval = setInterval(() => {
      this.updateConfig();
    }, intervalMs);

    console.log(`🔄 Actualización automática de configuración iniciada (cada ${intervalMs/1000}s)`);
  }

  /**
   * Detiene la actualización automática
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('🛑 Actualización automática detenida');
    }
  }

  /**
   * Verifica si la configuración está actualizada
   */
  isConfigFresh(maxAgeMs: number = 60000): boolean {
    if (!this.config) return false;
    
    const age = Date.now() - this.config.lastUpdated;
    return age < maxAgeMs;
  }
}

// Instancia singleton
export const dynamicConfig = new DynamicConfigManager();

// Funciones de conveniencia
export const getDynamicWebSocketURL = (): string => {
  return dynamicConfig.getWebSocketURL();
};

export const getDynamicAPIURL = (): string => {
  return dynamicConfig.getAPIURL();
};

export const getCurrentConfig = (): DynamicConfig | null => {
  return dynamicConfig.getConfig();
};

// Iniciar actualización automática
dynamicConfig.startAutoUpdate();

