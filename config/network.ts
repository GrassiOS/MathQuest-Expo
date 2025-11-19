// Configuración de red para dispositivos móviles
export const NETWORK_CONFIG = {
  // IPs comunes para probar (se detectará automáticamente)
  COMMON_IPS: [
    '10.41.141.145', //UABC 5G Valle Dorado
    '10.41.13.254',
    '10.41.7.181', //UABC 5G
    '192.168.1.227', // IP actual detectada (PRIMERA PRIORIDAD)
    '192.168.1.234', // FOG 5G
    '192.168.100.246',   // IP actual detectada (PRIMERA PRIORIDAD)
    '192.168.1.1',    // Router común
    '192.168.0.1',    // Router común
    '192.168.100.3',  // IP anterior
    '192.168.43.1',   // Hotspot móvil
    '172.20.10.1',    // Hotspot iPhone
    '192.168.4.1',    // Hotspot Android
  ],
  PORT: 3001,
  
  // URLs de conexión (se actualizarán dinámicamente)
  WEBSOCKET_URL: '',
  API_URL: '',
  
  // Configuración para diferentes entornos
  get CONNECTION_CONFIG() {
    return {
      timeout: 30000,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      transports: ['polling', 'websocket'] as string[],
      withCredentials: false,
      multiplex: false
    };
  }
};

// Función para detectar si estamos en un dispositivo móvil
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

// Función para probar si un servidor está disponible
export const testServerConnection = async (ip: string, port: number = 3001): Promise<boolean> => {
  try {
    const url = `http://${ip}:${port}/api/status`;
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
      return data.status === 'online';
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Servidor no disponible en ${ip}:${port}`);
    return false;
  }
};

// Función para detectar automáticamente el servidor
export const detectServerIP = async (): Promise<string | null> => {
  console.log('🔍 Detectando servidor automáticamente...');
  
  // Probar IPs comunes
  for (const ip of NETWORK_CONFIG.COMMON_IPS) {
    console.log(`🔍 Probando IP: ${ip}`);
    const isAvailable = await testServerConnection(ip);
    
    if (isAvailable) {
      console.log(`✅ Servidor encontrado en: ${ip}`);
      return ip;
    }
  }
  
  // Si no encuentra en las IPs comunes, probar rangos comunes
  const commonRanges = [
    '192.168.1', '192.168.0', '192.168.100', '10.41.21', 
    '192.168.43', '172.20.10', '192.168.4'
  ];
  
  for (const range of commonRanges) {
    console.log(`🔍 Probando rango: ${range}.x`);
    
    // Probar las primeras 10 IPs del rango
    for (let i = 1; i <= 10; i++) {
      const ip = `${range}.${i}`;
      const isAvailable = await testServerConnection(ip);
      
      if (isAvailable) {
        console.log(`✅ Servidor encontrado en: ${ip}`);
        return ip;
      }
    }
  }
  
  console.log('❌ No se pudo encontrar el servidor');
  return null;
};

// Función para obtener la URL correcta según el dispositivo
export const getConnectionURL = async (): Promise<string> => {
  if (__DEV__) {
    // En desarrollo, detectar automáticamente el servidor
    const detectedIP = await detectServerIP();
    
    if (detectedIP) {
      const url = `http://${detectedIP}:${NETWORK_CONFIG.PORT}`;
      NETWORK_CONFIG.WEBSOCKET_URL = url;
      NETWORK_CONFIG.API_URL = `${url}/api`;
      return url;
    }
    
    // Fallback a localhost si no encuentra el servidor
    console.log('⚠️ Usando localhost como fallback');
    return 'http://localhost:3001';
  }
  
  // En producción, usar el servidor de producción
  return 'https://tu-servidor-produccion.com';
};

// Logs de debug para verificar la configuración
export const logNetworkConfig = () => {
  console.log('🌐 Configuración de red:');
  console.log(`   Puerto: ${NETWORK_CONFIG.PORT}`);
  console.log(`   URL WebSocket: ${NETWORK_CONFIG.WEBSOCKET_URL || 'No configurada'}`);
  console.log(`   URL API: ${NETWORK_CONFIG.API_URL || 'No configurada'}`);
  console.log(`   Es dispositivo móvil: ${isMobileDevice()}`);
  console.log(`   IPs a probar: ${NETWORK_CONFIG.COMMON_IPS.join(', ')}`);
};
