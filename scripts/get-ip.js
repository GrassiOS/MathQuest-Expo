const os = require('os');

/**
 * Obtiene la IP local del servidor automáticamente
 * Funciona en cualquier red WiFi
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  // Buscar la IP en diferentes interfaces de red
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    
    for (const connection of networkInterface) {
      // Buscar IPv4 que no sea loopback (127.0.0.1)
      if (connection.family === 'IPv4' && !connection.internal) {
        console.log(`🌐 IP encontrada en ${interfaceName}: ${connection.address}`);
        return connection.address;
      }
    }
  }
  
  // Si no encuentra ninguna IP, usar localhost como fallback
  console.log('⚠️ No se encontró IP de red, usando localhost');
  return '127.0.0.1';
}

/**
 * Genera la configuración de red actualizada
 */
function generateNetworkConfig() {
  const ip = getLocalIP();
  const port = 3001;
  
  const config = {
    LOCAL_IP: ip,
    PORT: port,
    WEBSOCKET_URL: `http://${ip}:${port}`,
    API_URL: `http://${ip}:${port}/api`,
    CONNECTION_CONFIG: {
      timeout: 30000,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      transports: ['polling', 'websocket'],
      withCredentials: false,
      multiplex: false
    }
  };
  
  console.log('🔧 Configuración de red generada:');
  console.log(`   IP Local: ${config.LOCAL_IP}`);
  console.log(`   Puerto: ${config.PORT}`);
  console.log(`   URL WebSocket: ${config.WEBSOCKET_URL}`);
  console.log(`   URL API: ${config.API_URL}`);
  
  return config;
}

// Si se ejecuta directamente, mostrar la IP
if (require.main === module) {
  const ip = getLocalIP();
  console.log(`📍 IP del servidor: ${ip}`);
  console.log(`🔗 URL de conexión: http://${ip}:3001`);
  console.log(`📱 Para conectar desde móvil: http://${ip}:3001`);
}

module.exports = {
  getLocalIP,
  generateNetworkConfig
};

