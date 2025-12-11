/**
 * Content Script Híbrido - Usa modelo real via API + fallback simple
 */
class HybridCaptchaDetector {
    constructor() {
        this.apiSolver = null;
        this.simpleSolver = null;
        this.observer = null;
        this.processedCaptchas = new Set();
        this.isEnabled = true;
        this.useAPI = true; // Intentar API primero
        
        this.init();
    }

    /**
     * Inicializar el detector híbrido
     */
    async init() {
        console.log('🚀 Hybrid Captcha Detector iniciado');
        
        // Obtener ambos solvers
        this.apiSolver = getAPICaptchaSolver();
        this.simpleSolver = getSimpleCaptchaSolver();
        
        // Verificar estado de API
        await this.checkAPIStatus();
        
        // Cargar configuración
        await this.loadSettings();
        
        // Configurar observador de DOM
        this.setupDOMObserver();
        
        // Escanear captchas existentes
        this.scanForCaptchas();
        
        // Agregar interfaz de usuario
        this.addUI();
        
        console.log('✅ Detector híbrido configurado y activo');
    }

    /**
     * Verificar estado de la API
     */
    async checkAPIStatus() {
        try {
            const status = await this.apiSolver.getAPIStatus();
            if (status.status === 'ok' && status.model_loaded) {
                this.useAPI = true;
                console.log('✅ API disponible - Usando modelo real');
                console.log('📝 Vocabulario:', status.vocab);
            } else {
                this.useAPI = false;
                console.log('⚠️ API no disponible - Usando solver simple');
            }
        } catch (error) {
            this.useAPI = false;
            console.log('⚠️ Error verificando API - Usando solver simple');
        }
    }

    /**
     * Cargar configuración desde storage
     */
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['autoSolveEnabled']);
            this.isEnabled = result.autoSolveEnabled !== false;
        } catch (error) {
            console.log('Usando configuración por defecto');
            this.isEnabled = true;
        }
    }

    /**
     * Configurar observador de cambios en el DOM
     */
    setupDOMObserver() {
        this.observer = new MutationObserver((mutations) => {
            let shouldScan = false;
            
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'IMG' || node.querySelector('img')) {
                                shouldScan = true;
                                break;
                            }
                        }
                    }
                }
            });
            
            if (shouldScan) {
                clearTimeout(this.scanTimeout);
                this.scanTimeout = setTimeout(() => this.scanForCaptchas(), 500);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src']
        });
    }

    /**
     * Escanear la página en busca de captchas
     */
    async scanForCaptchas() {
        if (!this.isEnabled) return;
        console.log('🔍 Iniciando escaneo híbrido...');

        // Caso especial: Verificación CFDI
        if (window.location.hostname.includes('verificacfdi.facturaelectronica.sat.gob.mx')) {
            console.log('🔍 Modo especial CFDI (Hybrid): usando solo GeneraCaptcha.aspx');

            const captchaImages = Array.from(document.querySelectorAll('img[src*="GeneraCaptcha.aspx"]'));
            console.log('CFDI: imágenes GeneraCaptcha encontradas:', captchaImages.length);

            if (captchaImages.length > 0) {
                const img = captchaImages[0];
                console.log('🎯 CFDI: usando esta imagen como captcha:', img.src || img.getAttribute('src'));
                await this.processCaptchaImage(img);
                return; // No seguir con la lógica genérica para evitar logo/ajax-loader
            } else {
                console.log('⚠️ CFDI: no se encontró imagen GeneraCaptcha.aspx');
                // Seguimos al flujo genérico por si cambia en el futuro
            }
        }

        // Selectores específicos para captchas del SAT (flujo genérico)
        const captchaSelectors = [
            'img[src*="captcha"]',
            'img[src*="Captcha"]',
            'img[src*="CAPTCHA"]',
            'img[alt*="captcha" i]',
            'img[id*="captcha" i]',
            'img[class*="captcha" i]',
            '[id*="captcha"] img',
            '[class*="captcha"] img',
            'img[src*="ImagenCaptcha"]',
            'img[src*="imagen"]',
            'img[onclick*="captcha"]',
            'form img',
            'table img'
        ];

        let totalFound = 0;
        for (const selector of captchaSelectors) {
            const images = document.querySelectorAll(selector);
            console.log(`Selector "${selector}": ${images.length} imágenes encontradas`);
            totalFound += images.length;
            
            for (const img of images) {
                await this.processCaptchaImage(img);
            }
        }

        // Si no encontramos nada, buscar en todas las imágenes
        if (totalFound === 0) {
            console.log('⚠️ Buscando en todas las imágenes...');
            const allImages = document.querySelectorAll('img');
            console.log(`🖼️ Analizando ${allImages.length} imágenes totales`);
            
            for (const img of allImages) {
                if (this.couldBeCaptcha(img)) {
                    console.log('🎯 Posible captcha detectado:', img.src || img.getAttribute('src'));
                    await this.processCaptchaImage(img);
                }
            }
        }
    }

    /**
     * Verificar si una imagen podría ser un captcha
     */
    couldBeCaptcha(imgElement) {
        const src = imgElement.src || imgElement.getAttribute('src') || '';
        const alt = imgElement.alt || '';
        const id = imgElement.id || '';
        const className = imgElement.className || '';

        // Caso especial: página de verificación CFDI
        // Allí el captcha real viene siempre de GeneraCaptcha.aspx, y
        // debemos ignorar el logo (Logo_SHCP_SAT-.jpg) y el ajax-loader.gif
        if (window.location.hostname.includes('verificacfdi.facturaelectronica.sat.gob.mx')) {
            // Aceptar solo la imagen del captcha generado por el backend
            if (src.includes('GeneraCaptcha.aspx')) {
                return true;
            }
            // Cualquier otra imagen en esa página no es captcha
            return false;
        }
        
        // Verificar por URL/nombre (modo genérico)
        const urlIndicators = [
            'captcha', 'Captcha', 'CAPTCHA',
            'imagen', 'code', 'verify', 'security'
        ];
        
        for (const indicator of urlIndicators) {
            if (src.includes(indicator) || alt.includes(indicator) || 
                id.includes(indicator) || className.includes(indicator)) {
                return true;
            }
        }
        
        // Verificar por contexto
        const parent = imgElement.closest('form, table, div');
        if (parent) {
            const parentText = parent.textContent.toLowerCase();
            if (parentText.includes('captcha') || parentText.includes('código') || 
                parentText.includes('verificación') || parentText.includes('seguridad')) {
                return true;
            }
        }
        
        // Verificar por dimensiones y contexto
        const width = imgElement.naturalWidth || imgElement.width;
        const height = imgElement.naturalHeight || imgElement.height;
        
        if (width > 50 && width < 300 && height > 20 && height < 100) {
            const nearbyInputs = parent ? parent.querySelectorAll('input[type="text"]') : [];
            if (nearbyInputs.length > 0) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Procesar una imagen de captcha específica
     */
    async processCaptchaImage(imgElement) {
        const imgSrc = imgElement.src || imgElement.getAttribute('src');
        if (this.processedCaptchas.has(imgSrc) || !imgSrc) {
            return;
        }

        this.processedCaptchas.add(imgSrc);
        
        try {
            console.log('🔍 Captcha detectado:', imgSrc);
            
            // Agregar indicador visual
            this.addCaptchaIndicator(imgElement);
            
            // Elegir solver basado en disponibilidad de API
            let solution;
            if (this.useAPI) {
                console.log('🧠 Usando modelo real via API...');
                solution = await this.apiSolver.solveCaptchaFromElement(imgElement);
            } else {
                console.log('🎲 Usando solver simple...');
                solution = await this.simpleSolver.solveCaptchaFromElement(imgElement);
            }
            
            if (solution && solution.length > 0) {
                console.log('✅ Captcha resuelto:', solution);
                
                // Buscar campo de entrada y llenar automáticamente
                const inputField = this.findCaptchaInputField(imgElement);
                if (inputField) {
                    this.fillCaptchaField(inputField, solution);
                    this.showSuccessIndicator(imgElement, solution, this.useAPI);
                } else {
                    console.warn('⚠️ No se encontró campo de entrada');
                    this.showSolutionPopup(imgElement, solution, this.useAPI);
                }
            }
            
        } catch (error) {
            console.error('❌ Error procesando captcha:', error);
            this.showErrorIndicator(imgElement, error.message);
        }
    }

    /**
     * Buscar el campo de entrada asociado al captcha
     */
    findCaptchaInputField(imgElement) {
        console.log('🔍 Buscando campo de entrada para captcha...');
        
        // Buscar en diferentes niveles de contenedor
        const containers = [
            imgElement.closest('form'),
            imgElement.closest('table'),
            imgElement.closest('div'),
            imgElement.closest('tr'),
            imgElement.parentElement,
            document.body
        ].filter(Boolean);

        // Selectores específicos para captcha
        const captchaSelectors = [
            'input[name*="captcha" i]',
            'input[id*="captcha" i]',
            'input[class*="captcha" i]',
            'input[placeholder*="captcha" i]',
            'input[placeholder*="código" i]',
            'input[placeholder*="palabra" i]',
            'input[name*="codigo" i]',
            'input[id*="codigo" i]'
        ];

        // Buscar campos específicos de captcha
        for (const container of containers) {
            for (const selector of captchaSelectors) {
                const input = container.querySelector(selector);
                if (input && (input.type === 'text' || input.type === '')) {
                    console.log('✅ Campo captcha encontrado:', selector, input);
                    return input;
                }
            }
        }

        // Buscar campos de texto genéricos cerca del captcha
        for (const container of containers) {
            const textInputs = container.querySelectorAll('input[type="text"], input:not([type])');
            
            console.log(`📝 Campos de texto en contenedor: ${textInputs.length}`);
            
            // Si solo hay un campo de texto, probablemente es el captcha
            if (textInputs.length === 1) {
                console.log('✅ Campo único encontrado:', textInputs[0]);
                return textInputs[0];
            }
            
            // Buscar el campo más cercano al captcha
            if (textInputs.length > 1) {
                let closestInput = null;
                let minDistance = Infinity;
                
                const imgRect = imgElement.getBoundingClientRect();
                
                for (const input of textInputs) {
                    const inputRect = input.getBoundingClientRect();
                    const distance = Math.sqrt(
                        Math.pow(imgRect.x - inputRect.x, 2) + 
                        Math.pow(imgRect.y - inputRect.y, 2)
                    );
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestInput = input;
                    }
                }
                
                if (closestInput) {
                    console.log('✅ Campo más cercano encontrado:', closestInput);
                    return closestInput;
                }
            }
        }

        // Último recurso: buscar en toda la página
        console.log('⚠️ Buscando en toda la página...');
        const allTextInputs = document.querySelectorAll('input[type="text"], input:not([type])');
        console.log(`📝 Total campos de texto en página: ${allTextInputs.length}`);
        
        // Filtrar campos que podrían ser captcha por contexto
        for (const input of allTextInputs) {
            const label = input.labels?.[0]?.textContent?.toLowerCase() || '';
            const placeholder = input.placeholder?.toLowerCase() || '';
            const name = input.name?.toLowerCase() || '';
            const id = input.id?.toLowerCase() || '';
            
            const captchaKeywords = ['captcha', 'código', 'palabra', 'verificación', 'seguridad'];
            
            if (captchaKeywords.some(keyword => 
                label.includes(keyword) || 
                placeholder.includes(keyword) || 
                name.includes(keyword) || 
                id.includes(keyword)
            )) {
                console.log('✅ Campo captcha encontrado por contexto:', input);
                return input;
            }
        }

        // Si hay pocos campos, mostrar opciones
        if (allTextInputs.length <= 3) {
            console.log('📋 Campos disponibles:');
            allTextInputs.forEach((input, index) => {
                console.log(`  ${index + 1}. ${input.name || input.id || 'sin nombre'} - ${input.placeholder || 'sin placeholder'}`);
            });
            
            // Retornar el último campo (suele ser el captcha)
            if (allTextInputs.length > 0) {
                console.log('✅ Usando último campo como captcha');
                return allTextInputs[allTextInputs.length - 1];
            }
        }

        console.log('❌ No se encontró campo de entrada');
        return null;
    }

    /**
     * Llenar el campo de captcha con la solución
     */
    fillCaptchaField(inputField, solution) {
        inputField.value = '';
        inputField.focus();
        
        // Escribir carácter por carácter
        for (let i = 0; i < solution.length; i++) {
            setTimeout(() => {
                inputField.value += solution[i];
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                inputField.dispatchEvent(new Event('change', { bubbles: true }));
            }, i * 100);
        }
        
        console.log('📝 Campo llenado con:', solution);
    }

    /**
     * Agregar indicador visual al captcha
     */
    addCaptchaIndicator(imgElement) {
        // Inyectar estilos globales de animación para el input si aún no existen
        if (!document.getElementById('sat-captcha-input-style')) {
            const style = document.createElement('style');
            style.id = 'sat-captcha-input-style';
            style.textContent = `
                .sat-captcha-input-loading {
                    position: relative;
                    z-index: 1;
                    box-shadow: 0 0 0 1px rgba(0,168,138,0.45) !important;
                    background-image: linear-gradient(120deg, rgba(0,168,138,0.15), rgba(255,255,255,0.2), rgba(0,168,138,0.15)) !important;
                    background-size: 200% 200% !important;
                    animation: sat-input-pulse 1.2s infinite ease-in-out !important;
                }
                .sat-captcha-input-success {
                    box-shadow: 0 0 0 2px rgba(40,167,69,0.8) !important;
                    background-image: linear-gradient(120deg, rgba(40,167,69,0.18), rgba(255,255,255,0.25), rgba(40,167,69,0.18)) !important;
                    background-size: 200% 200% !important;
                    animation: sat-input-pulse 1.2s infinite ease-in-out !important;
                }
                .sat-captcha-input-error {
                    box-shadow: 0 0 0 2px rgba(220,53,69,0.7);
                    animation: sat-input-error 0.5s ease-out forwards;
                }
                @keyframes sat-input-pulse {
                    0% {
                        box-shadow: 0 0 0 1px rgba(0,168,138,0.25);
                        background-position: 0% 50%;
                    }
                    50% {
                        box-shadow: 0 0 8px 2px rgba(0,168,138,0.65);
                        background-position: 100% 50%;
                    }
                    100% {
                        box-shadow: 0 0 0 1px rgba(0,168,138,0.25);
                        background-position: 0% 50%;
                    }
                }
                @keyframes sat-input-success {
                    0% { box-shadow: 0 0 0 2px rgba(40,167,69,0.0); }
                    100% { box-shadow: 0 0 0 2px rgba(40,167,69,0.7); }
                }
                @keyframes sat-input-error {
                    0% { box-shadow: 0 0 0 2px rgba(220,53,69,0.0); }
                    100% { box-shadow: 0 0 0 2px rgba(220,53,69,0.7); }
                }
                .sat-captcha-credit-link {
                    display: inline-block;
                    margin-top: 2px;
                    font-size: 11px;
                    font-family: Arial, sans-serif;
                    color: #0b63ce;
                    text-decoration: underline;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(style);
        }

        // Marcar el input asociado como "cargando"
        const inputField = this.findCaptchaInputField(imgElement);
        if (inputField) {
            inputField.classList.remove('sat-captcha-input-success', 'sat-captcha-input-error');
            inputField.classList.add('sat-captcha-input-loading');
        }
    }

    /**
     * Mostrar indicador de éxito
     */
    showSuccessIndicator(imgElement, solution, usedAPI) {
        const inputField = this.findCaptchaInputField(imgElement);
        if (inputField) {
            inputField.classList.remove('sat-captcha-input-loading', 'sat-captcha-input-error');
            inputField.classList.add('sat-captcha-input-success');

            // Agregar crédito "Resuelto por Asesor.ia" debajo del campo (una sola vez)
            const parent = inputField.parentNode;
            if (parent && !parent.querySelector('.sat-captcha-credit-link')) {
                const credit = document.createElement('a');
                credit.className = 'sat-captcha-credit-link';
                credit.href = 'https://martinezmarquez.com/';
                credit.target = '_blank';
                credit.rel = 'noopener noreferrer';
                credit.textContent = 'Resuelto por Asesor.ia';
                parent.appendChild(credit);
            }
            // Retirar el efecto después de un momento para no dejar sombra permanente
            setTimeout(() => {
                inputField.classList.remove('sat-captcha-input-success');
            }, 2500);
        }
    }

    /**
     * Mostrar indicador de error
     */
    showErrorIndicator(imgElement, errorMsg) {
        const inputField = this.findCaptchaInputField(imgElement);
        if (inputField) {
            inputField.classList.remove('sat-captcha-input-loading', 'sat-captcha-input-success');
            inputField.classList.add('sat-captcha-input-error');
            setTimeout(() => {
                inputField.classList.remove('sat-captcha-input-error');
            }, 1500);
        }
    }

    /**
     * Mostrar popup con la solución
     */
    showSolutionPopup(imgElement, solution, usedAPI) {
        const method = usedAPI ? 'Modelo Real 🧠' : 'Solver Simple 🎲';
        const popup = document.createElement('div');
        popup.innerHTML = `
            <div style="background: white; border: 2px solid #007cba; padding: 10px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                <strong>Captcha resuelto (${method}):</strong> 
                <code style="background: #f0f0f0; padding: 2px 4px;">${solution}</code>
                <button onclick="this.parentNode.parentNode.remove()" style="margin-left: 10px; padding: 2px 8px;">Cerrar</button>
            </div>
        `;
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 10000);
    }

    /**
     * Agregar interfaz de usuario
     */
    addUI() {
        // UI flotante desactivada intencionalmente
        // El solver seguirá funcionando en automático sin mostrar botones.
        return;
    }

    /**
     * Toggle del solver
     */
    async toggleSolver() {
        this.isEnabled = !this.isEnabled;
        
        try {
            await chrome.storage.sync.set({ autoSolveEnabled: this.isEnabled });
        } catch (error) {
            console.error('Error guardando configuración:', error);
        }
        
        console.log('🔄 Solver', this.isEnabled ? 'activado' : 'desactivado');
        
        if (this.isEnabled) {
            this.scanForCaptchas();
        }
    }

    /**
     * Toggle entre API y modo simple
     */
    async toggleAPIMode() {
        if (this.useAPI) {
            // Cambiar a modo simple
            this.useAPI = false;
            console.log('🎲 Cambiado a solver simple');
        } else {
            // Intentar cambiar a API
            await this.checkAPIStatus();
            if (this.useAPI) {
                console.log('🧠 Cambiado a modelo real (API)');
            } else {
                console.log('⚠️ API no disponible, manteniéndose en modo simple');
            }
        }
    }

    /**
     * Limpiar recursos
     */
    dispose() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        if (this.apiSolver) {
            this.apiSolver.dispose();
        }
        
        if (this.simpleSolver) {
            this.simpleSolver.dispose();
        }
        
        clearTimeout(this.scanTimeout);
    }
}

// Inicializar cuando el DOM esté listo
function initHybridCaptchaDetector() {
    if (window.location.hostname.includes('sat.gob.mx')) {
        // Guardar la instancia globalmente para poder usarla desde mensajes
        window.__satHybridDetector = new HybridCaptchaDetector();
    }
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHybridCaptchaDetector);
} else {
    initHybridCaptchaDetector();
}

// Listener para mensajes desde popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        const detector = window.__satHybridDetector;

        // Si aún no se ha creado el detector, no hacemos nada
        if (!detector) {
            if (message.action === 'ping') {
                // Responder para que el popup no marque error
                sendResponse({ ok: false, reason: 'detector_not_ready' });
            }
            return; // Importante: no llamar a sendResponse otra vez
        }

        if (message.action === 'ping') {
            // Usado por el popup para saber si el content script está activo
            sendResponse({ ok: true });
            return true;
        }

        if (message.action === 'toggleSolver') {
            // Actualizar estado desde el popup
            detector.isEnabled = !!message.enabled;
            console.log('🔄 Estado del solver actualizado desde popup:', detector.isEnabled);
            if (detector.isEnabled) {
                detector.scanForCaptchas();
            }
            sendResponse({ ok: true, enabled: detector.isEnabled });
            return true;
        }

        if (message.action === 'scanCaptchas') {
            // Ejecutar escaneo manual solicitado por el popup
            (async () => {
                await detector.scanForCaptchas();
                // No contamos cuántos encontró aquí, pero devolvemos ok para que no marque error
                sendResponse({ ok: true, found: 1 });
            })();
            return true; // Indica que sendResponse será llamado de forma asíncrona
        }
    } catch (error) {
        console.error('❌ Error en listener de mensajes:', error);
        try {
            sendResponse({ ok: false, error: error.message });
        } catch (_) {}
        return false;
    }
});
