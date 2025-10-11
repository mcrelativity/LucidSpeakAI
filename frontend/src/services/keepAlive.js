/**
 * Keep-Alive Service
 * Mantiene el backend despierto haciendo ping cada 10 minutos
 * Evita que Render.com ponga el servicio en sleep mode
 */

const PING_INTERVAL = 10 * 60 * 1000; // 10 minutos en milisegundos

class KeepAliveService {
  constructor() {
    this.intervalId = null;
    this.apiBase = null;
  }

  /**
   * Inicia el servicio de keep-alive
   * @param {string} apiBase - URL base del backend (ej: https://lucidspeak.onrender.com)
   */
  start(apiBase) {
    if (!apiBase || apiBase.includes('localhost')) {
      console.log('Keep-alive: Skip en localhost');
      return;
    }

    this.apiBase = apiBase;
    console.log('Keep-alive: Iniciado para', apiBase);

    // Hacer ping inmediato
    this.ping();

    // Programar pings cada 10 minutos
    this.intervalId = setInterval(() => {
      this.ping();
    }, PING_INTERVAL);
  }

  /**
   * Hace ping al endpoint /health del backend
   */
  async ping() {
    if (!this.apiBase) return;

    try {
      const response = await fetch(`${this.apiBase}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Keep-alive: Ping exitoso', new Date().toLocaleTimeString(), data);
      } else {
        console.warn('Keep-alive: Ping falló', response.status);
      }
    } catch (error) {
      console.warn('Keep-alive: Error en ping', error.message);
    }
  }

  /**
   * Detiene el servicio de keep-alive
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Keep-alive: Detenido');
    }
  }
}

// Exportar instancia única (singleton)
export const keepAliveService = new KeepAliveService();
