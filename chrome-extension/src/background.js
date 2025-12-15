/**
 * Background Service Worker para la extensión SAT Captcha Solver
 */
class BackgroundService {
    constructor() {
        this.stats = {
            solved: 0,
            total: 0,
            accuracy: 100
        };
        
        this.init();
    }

    init() {
        // Escuchar instalación/actualización
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstall(details);
        });

        // Escuchar mensajes de content scripts
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Mantener canal abierto para respuestas asíncronas
        });

        // Cargar estadísticas guardadas
        this.loadStats();

        console.log('🔧 Background service iniciado');
    }

    async handleInstall(details) {
        if (details.reason === 'install') {
            console.log('🎉 Extensión instalada por primera vez');
            
            // Configuración inicial
            await chrome.storage.sync.set({
                autoSolveEnabled: true,
                solvedCount: 0,
                accuracyRate: 100,
                installDate: Date.now()
            });
            
            // Abrir página de bienvenida (opcional)
            // chrome.tabs.create({ url: 'popup/welcome.html' });
            
        } else if (details.reason === 'update') {
            console.log('🔄 Extensión actualizada');
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'apiHealth':
                    sendResponse(await this.handleApiHealth(message));
                    break;

                case 'solveCaptchaApi':
                    sendResponse(await this.handleSolveCaptchaApi(message));
                    break;

                case 'captchaSolved':
                    await this.handleCaptchaSolved(message.data);
                    sendResponse({ success: true });
                    break;

                case 'captchaFailed':
                    await this.handleCaptchaFailed(message.data);
                    sendResponse({ success: true });
                    break;

                case 'getStats':
                    sendResponse({ stats: this.stats });
                    break;

                case 'resetStats':
                    await this.resetStats();
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ error: 'Acción no reconocida' });
            }
        } catch (error) {
            console.error('Error manejando mensaje:', error);
            sendResponse({ error: error.message });
        }
    }

    async handleApiHealth(message) {
        try {
            const apiUrl = message.apiUrl;
            const response = await fetch(`${apiUrl}/health`, { method: 'GET' });
            const data = await response.json();
            return { ok: true, data };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    }

    async handleSolveCaptchaApi(message) {
        try {
            const apiUrl = message.apiUrl;
            const response = await fetch(`${apiUrl}/solve-captcha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: message.image,
                    pageType: message.pageType,
                }),
            });

            const data = await response.json();
            return { ok: true, status: response.status, data };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    }

    async handleCaptchaSolved(data) {
        this.stats.solved++;
        this.stats.total++;
        this.updateAccuracy();
        
        await this.saveStats();
        
        // Notificar al popup si está abierto
        this.notifyPopup();
        
        console.log('✅ Captcha resuelto. Stats:', this.stats);
    }

    async handleCaptchaFailed(data) {
        this.stats.total++;
        this.updateAccuracy();
        
        await this.saveStats();
        
        console.log('❌ Captcha falló. Stats:', this.stats);
    }

    updateAccuracy() {
        if (this.stats.total > 0) {
            this.stats.accuracy = Math.round((this.stats.solved / this.stats.total) * 100);
        }
    }

    async loadStats() {
        try {
            const result = await chrome.storage.sync.get([
                'solvedCount',
                'totalCount',
                'accuracyRate'
            ]);

            this.stats.solved = result.solvedCount || 0;
            this.stats.total = result.totalCount || 0;
            this.stats.accuracy = result.accuracyRate || 100;

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    async saveStats() {
        try {
            await chrome.storage.sync.set({
                solvedCount: this.stats.solved,
                totalCount: this.stats.total,
                accuracyRate: this.stats.accuracy
            });
        } catch (error) {
            console.error('Error guardando estadísticas:', error);
        }
    }

    async resetStats() {
        this.stats = {
            solved: 0,
            total: 0,
            accuracy: 100
        };
        
        await this.saveStats();
        this.notifyPopup();
    }

    notifyPopup() {
        // Enviar mensaje al popup si está abierto
        chrome.runtime.sendMessage({
            action: 'statsUpdate',
            solved: this.stats.solved,
            accuracy: this.stats.accuracy
        }).catch(() => {
            // Popup no está abierto, ignorar error
        });
    }
}

// Inicializar service worker
new BackgroundService();
