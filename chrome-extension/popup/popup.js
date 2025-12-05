/**
 * Popup script para la extensión SAT Captcha Solver
 */
class PopupController {
    constructor() {
        this.isEnabled = false;
        this.stats = {
            solved: 0,
            accuracy: 0
        };
        
        this.init();
    }

    async init() {
        // Cargar elementos del DOM
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.modelStatus = document.getElementById('modelStatus');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.toggleText = document.getElementById('toggleText');
        this.scanBtn = document.getElementById('scanBtn');
        this.solvedCount = document.getElementById('solvedCount');
        this.accuracyRate = document.getElementById('accuracyRate');

        // Configurar event listeners
        this.setupEventListeners();

        // Cargar estado inicial
        await this.loadCurrentState();

        // Verificar si estamos en una página del SAT
        await this.checkCurrentTab();
    }

    setupEventListeners() {
        this.toggleBtn.addEventListener('click', () => this.toggleSolver());
        this.scanBtn.addEventListener('click', () => this.scanForCaptchas());
    }

    async loadCurrentState() {
        try {
            // Cargar configuración
            const result = await chrome.storage.sync.get([
                'autoSolveEnabled',
                'solvedCount',
                'accuracyRate'
            ]);

            this.isEnabled = result.autoSolveEnabled !== false;
            this.stats.solved = result.solvedCount || 0;
            this.stats.accuracy = result.accuracyRate || 0;

            this.updateUI();

        } catch (error) {
            console.error('Error cargando estado:', error);
            this.updateStatus('error', 'Error cargando configuración');
        }
    }

    async checkCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab.url.includes('sat.gob.mx')) {
                this.updateStatus('active', 'Conectado al SAT');
                this.modelStatus.textContent = 'Modelo listo para usar';
                
                // Verificar si el content script está cargado
                this.checkContentScript(tab.id);
            } else {
                this.updateStatus('inactive', 'No estás en el SAT');
                this.modelStatus.textContent = 'Navega a sat.gob.mx para usar';
                this.toggleBtn.disabled = true;
                this.scanBtn.disabled = true;
            }

        } catch (error) {
            console.error('Error verificando pestaña:', error);
            this.updateStatus('error', 'Error verificando página');
        }
    }

    async checkContentScript(tabId) {
        try {
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            this.modelStatus.textContent = 'Extension activa y funcionando';
        } catch (error) {
            this.modelStatus.textContent = 'Recarga la página para activar';
        }
    }

    updateStatus(status, text) {
        this.statusText.textContent = text;
        
        // Remover clases anteriores
        this.statusDot.classList.remove('status-active', 'status-inactive', 'status-loading');
        
        // Agregar nueva clase
        switch (status) {
            case 'active':
                this.statusDot.classList.add('status-active');
                break;
            case 'inactive':
                this.statusDot.classList.add('status-inactive');
                break;
            case 'loading':
                this.statusDot.classList.add('status-loading');
                break;
        }
    }

    updateUI() {
        // Actualizar botón toggle
        if (this.isEnabled) {
            this.toggleText.textContent = 'Desactivar';
            this.toggleBtn.classList.remove('btn-secondary');
            this.toggleBtn.classList.add('btn-primary');
            this.updateStatus('active', 'Solver activo');
        } else {
            this.toggleText.textContent = 'Activar';
            this.toggleBtn.classList.remove('btn-primary');
            this.toggleBtn.classList.add('btn-secondary');
            this.updateStatus('inactive', 'Solver inactivo');
        }

        // Actualizar estadísticas
        this.solvedCount.textContent = this.stats.solved;
        this.accuracyRate.textContent = `${this.stats.accuracy}%`;
    }

    async toggleSolver() {
        try {
            this.isEnabled = !this.isEnabled;
            
            // Guardar configuración
            await chrome.storage.sync.set({ autoSolveEnabled: this.isEnabled });
            
            // Enviar mensaje al content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.url.includes('sat.gob.mx')) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'toggleSolver',
                        enabled: this.isEnabled
                    });
                } catch (error) {
                    console.log('Content script no disponible, se aplicará en la próxima carga');
                }
            }
            
            this.updateUI();
            
        } catch (error) {
            console.error('Error toggling solver:', error);
            this.updateStatus('error', 'Error cambiando estado');
        }
    }

    async scanForCaptchas() {
        try {
            this.updateStatus('loading', 'Escaneando captchas...');
            this.scanBtn.disabled = true;
            this.scanBtn.textContent = 'Escaneando...';

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab.url.includes('sat.gob.mx')) {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'scanCaptchas'
                });

                if (response && response.found > 0) {
                    this.updateStatus('active', `${response.found} captcha(s) encontrado(s)`);
                } else {
                    this.updateStatus('inactive', 'No se encontraron captchas');
                }
            }

        } catch (error) {
            console.error('Error escaneando:', error);
            this.updateStatus('error', 'Error escaneando página');
        } finally {
            this.scanBtn.disabled = false;
            this.scanBtn.textContent = 'Escanear';
        }
    }

    async updateStats(solved, accuracy) {
        this.stats.solved = solved;
        this.stats.accuracy = accuracy;
        
        // Guardar estadísticas
        await chrome.storage.sync.set({
            solvedCount: solved,
            accuracyRate: accuracy
        });
        
        this.updateUI();
    }
}

// Inicializar popup
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});

// Escuchar mensajes del background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'statsUpdate') {
        // Actualizar estadísticas si el popup está abierto
        const controller = window.popupController;
        if (controller) {
            controller.updateStats(message.solved, message.accuracy);
        }
    }
});
