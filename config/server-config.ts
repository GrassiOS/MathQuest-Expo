// Configuración temporal del servidor - ACTUALIZAR ESTA IP
export const SERVER_CONFIG = {
  // CAMBIAR ESTA IP POR LA ACTUAL DE TU COMPUTADORA
  SERVER_IP: '10.41.21.217',
  PORT: 3001,
  
  get WEBSOCKET_URL() {
    return `http://${this.SERVER_IP}:${this.PORT}`;
  },
  
  get API_URL() {
    return `http://${this.SERVER_IP}:${this.PORT}/api`;
  }
};

// Función para obtener la URL de conexión
export const getServerURL = () => {
  return SERVER_CONFIG.WEBSOCKET_URL;
};

// Función para obtener la URL de la API
export const getAPIURL = () => {
  return SERVER_CONFIG.API_URL;
};

console.log('🌐 Configuración del servidor:');
console.log(`   IP: ${SERVER_CONFIG.SERVER_IP}`);
console.log(`   Puerto: ${SERVER_CONFIG.PORT}`);
console.log(`   URL WebSocket: ${SERVER_CONFIG.WEBSOCKET_URL}`);
console.log(`   URL API: ${SERVER_CONFIG.API_URL}`);

