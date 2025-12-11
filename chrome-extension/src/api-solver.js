/**
 * Solver que usa el modelo real a través de API local
 */
class APICaptchaSolver {
    constructor() {
        this.apiUrl = 'http://localhost:5000';
        this.isReady = false;
        this.config = MODEL_CONFIG;
        
        console.log('🤖 API Captcha Solver inicializado');
        this.checkAPIConnection();
    }

    /**
     * Verificar conexión con la API
     */
    async checkAPIConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            const data = await response.json();
            
            if (data.status === 'ok' && data.model_loaded) {
                this.isReady = true;
                console.log('✅ Conexión API establecida');
                console.log('📝 Vocabulario del modelo:', data.vocab);
            } else {
                console.warn('⚠️ API disponible pero modelo no cargado');
                this.isReady = false;
            }
        } catch (error) {
            console.warn('⚠️ API no disponible, usando solver simple como fallback');
            console.log('💡 Para usar el modelo real, ejecuta: python api_server.py');
            this.isReady = false;
        }
    }

    /**
     * Resolver captcha usando el modelo real via API
     */
    async solveCaptcha(imageData) {
        console.log('🔍 Procesando captcha con modelo real...');

        try {
            // Determinar tipo de página para seleccionar modelo en el servidor
            let pageType = 'color';
            const host = window.location.hostname || '';
            if (host.includes('verificacfdi.facturaelectronica.sat.gob.mx')) {
                pageType = 'gris';
            }
            console.log('🧠 Tipo de página detectado para API:', pageType);

            // Convertir ImageData a base64
            const base64Image = await this.imageDataToBase64(imageData);
            
            // Enviar a API
            const response = await fetch(`${this.apiUrl}/solve-captcha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Image,
                    pageType: pageType
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                console.log('🎯 Captcha resuelto con modelo real:', result.prediction);
                return result.prediction;
            } else {
                throw new Error(result.error || 'Error desconocido');
            }

        } catch (error) {
            console.error('❌ Error con API, usando fallback:', error);
            
            // Fallback al solver simple
            const simpleSolver = getSimpleCaptchaSolver();
            return await simpleSolver.solveCaptcha(imageData);
        }
    }

    /**
     * Convertir ImageData a base64
     */
    async imageDataToBase64(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            
            ctx.putImageData(imageData, 0, 0);
            
            const base64 = canvas.toDataURL('image/png');
            resolve(base64);
        });
    }

    /**
     * Resolver captcha desde elemento IMG del DOM
     */
    async solveCaptchaFromElement(imgElement) {
        try {
            // Esperar a que la imagen cargue
            await this.waitForImageLoad(imgElement);
            
            // Capturar píxeles reales
            const imageData = await this.captureImageData(imgElement);
            
            // Resolver captcha
            const solution = await this.solveCaptcha(imageData);
            
            return solution;
            
        } catch (error) {
            console.error('❌ Error resolviendo captcha:', error);
            
            // Fallback al solver simple
            const simpleSolver = getSimpleCaptchaSolver();
            return await simpleSolver.solveCaptchaFromElement(imgElement);
        }
    }

    /**
     * Esperar a que una imagen termine de cargar
     */
    waitForImageLoad(imgElement) {
        return new Promise((resolve, reject) => {
            if (imgElement.complete && imgElement.naturalWidth > 0) {
                resolve();
            } else {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout esperando carga de imagen'));
                }, 10000);

                imgElement.onload = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                
                imgElement.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Error cargando imagen'));
                };
            }
        });
    }

    /**
     * Capturar píxeles reales de una imagen usando canvas
     */
    async captureImageData(imgElement) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Configurar canvas con las dimensiones originales de la imagen
                canvas.width = imgElement.naturalWidth || imgElement.width;
                canvas.height = imgElement.naturalHeight || imgElement.height;
                
                // Dibujar imagen en canvas
                ctx.drawImage(imgElement, 0, 0);
                
                // Obtener datos de píxeles
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                resolve(imageData);
                
            } catch (error) {
                reject(new Error(`Error capturando imagen: ${error.message}`));
            }
        });
    }

    /**
     * Verificar estado de la API
     */
    async getAPIStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            const data = await response.json();
            return data;
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Limpiar recursos
     */
    dispose() {
        console.log('🧹 Recursos del API solver limpiados');
    }
}

// Instancia global del solver API
let apiCaptchaSolver = null;

/**
 * Obtener instancia del solver API (singleton)
 */
function getAPICaptchaSolver() {
    if (!apiCaptchaSolver) {
        apiCaptchaSolver = new APICaptchaSolver();
    }
    return apiCaptchaSolver;
}
