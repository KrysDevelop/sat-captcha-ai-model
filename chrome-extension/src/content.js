/**
 * Content Script para detectar y resolver captchas automáticamente en el SAT
 */
class SATCaptchaDetector {
    constructor() {
        this.solver = null;
        this.observer = null;
        this.processedCaptchas = new Set();
        this.isEnabled = true;
        
        this.init();
    }

    /**
     * Inicializar el detector
     */
    async init() {
        console.log('🚀 SAT Captcha Detector iniciado');
        
        // Obtener solver simplificado
        this.solver = getSimpleCaptchaSolver();
        
        // Cargar configuración
        await this.loadSettings();
        
        // Configurar observador de DOM
        this.setupDOMObserver();
        
        // Escanear captchas existentes
        this.scanForCaptchas();
        
        // Agregar interfaz de usuario
        this.addUI();
        
        console.log('✅ Detector configurado y activo');
    }

    /**
     * Cargar configuración desde storage
     */
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['autoSolveEnabled']);
            this.isEnabled = result.autoSolveEnabled !== false; // Por defecto true
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
                // Verificar si se agregaron nodos
                if (mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Verificar si es una imagen o contiene imágenes
                            if (node.tagName === 'IMG' || node.querySelector('img')) {
                                shouldScan = true;
                                break;
                            }
                        }
                    }
                }
            });
            
            if (shouldScan) {
                // Debounce para evitar múltiples escaneos
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

        // Caso especial: página de verificación CFDI
        if (window.location.hostname.includes('verificacfdi.facturaelectronica.sat.gob.mx')) {
            console.log('🔍 Modo especial CFDI: buscando captcha cerca del input de "dígitos de la imagen"');

            // Buscar input de captcha por texto/placeholder/atributos
            let captchaInput = document.querySelector(
                'input[placeholder*="imagen" i], ' +
                'input[placeholder*="dígitos" i], ' +
                'input[name*="captcha" i], ' +
                'input[id*="captcha" i]'
            );

            // Si no encontramos por atributos, intentar por contexto del texto cercano
            if (!captchaInput) {
                const allInputs = document.querySelectorAll('input[type="text"], input:not([type])');
                for (const input of allInputs) {
                    const parentText = (input.closest('td, div, label, form')?.textContent || '').toLowerCase();
                    if (parentText.includes('dígitos de la imagen') || parentText.includes('digitos de la imagen')) {
                        captchaInput = input;
                        break;
                    }
                }
            }

            if (!captchaInput) {
                console.log('⚠️ No se encontró input específico de captcha en CFDI');
            } else {
                console.log('✅ Input de captcha CFDI detectado:', captchaInput);

                // Buscar la imagen más cercana a ese input
                const allImages = document.querySelectorAll('img');
                let bestImg = null;
                let minDist = Infinity;

                const inputRect = captchaInput.getBoundingClientRect();
                const inputCenter = {
                    x: inputRect.left + inputRect.width / 2,
                    y: inputRect.top + inputRect.height / 2,
                };

                for (const img of allImages) {
                    if (!this.couldBeCaptcha(img)) continue;

                    const rect = img.getBoundingClientRect();
                    const imgCenter = {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                    };

                    // Ignorar imágenes que estén claramente por ENCIMA del input
                    // El captcha de CFDI está debajo o al mismo nivel vertical
                    if (imgCenter.y < inputCenter.y - 20) continue;

                    const dist = Math.sqrt(
                        Math.pow(imgCenter.x - inputCenter.x, 2) +
                        Math.pow(imgCenter.y - inputCenter.y, 2)
                    );

                    if (dist < minDist) {
                        minDist = dist;
                        bestImg = img;
                    }
                }

                if (bestImg) {
                    console.log('🎯 Imagen de captcha CFDI seleccionada por proximidad:', bestImg.src || bestImg.getAttribute('src'));
                    await this.processCaptchaImage(bestImg);
                    return; // No seguir con la lógica genérica
                } else {
                    console.log('⚠️ No se encontró imagen de captcha adecuada en CFDI');
                }
            }
        }

        // Selectores específicos para captchas del SAT (modo genérico)
        const captchaSelectors = [
            'img[src*="captcha"]',
            'img[src*="Captcha"]',
            'img[src*="CAPTCHA"]',
            'img[alt*="captcha" i]',
            'img[id*="captcha" i]',
            'img[class*="captcha" i]',
            '[id*="captcha"] img',
            '[class*="captcha"] img',
            // Selectores específicos del SAT
            'img[src*="ImagenCaptcha"]',
            'img[src*="imagen"]',
            'img[onclick*="captcha"]',
            // Buscar por contexto (cerca de campos de texto)
            'form img',
            'table img'
        ];

        console.log('🔍 Iniciando escaneo con', captchaSelectors.length, 'selectores');

        let totalFound = 0;
        for (const selector of captchaSelectors) {
            const images = document.querySelectorAll(selector);
            console.log(`Selector "${selector}": ${images.length} imágenes encontradas`);

            for (const img of images) {
                // Filtrar imágenes que claramente no son captchas
                if (!this.couldBeCaptcha(img)) continue;

                totalFound++;
                await this.processCaptchaImage(img);
            }
        }

        // Si no encontramos nada con selectores específicos, buscar todas las imágenes
        if (totalFound === 0) {
            console.log('⚠️ No se encontraron captchas con selectores específicos, buscando en todas las imágenes...');
            const allImages = document.querySelectorAll('img');
            console.log(`🖼️ Analizando ${allImages.length} imágenes totales`);
            
            for (const img of allImages) {
                // Verificar si podría ser un captcha por contexto
                if (this.couldBeCaptcha(img)) {
                    console.log('🎯 Posible captcha detectado:', img.src || img.getAttribute('src'));
                    await this.processCaptchaImage(img);
                }
            }
        }
    }

    /**
     * Verificar si una imagen podría ser un captcha basado en contexto
     */
    couldBeCaptcha(imgElement) {
        const src = imgElement.src || imgElement.getAttribute('src') || '';
        const alt = imgElement.alt || '';
        const id = imgElement.id || '';
        const className = imgElement.className || '';
        
        // 🚫 Ignorar SVGs y data URIs de SVG
        if (src.endsWith('.svg') || src.includes('image/svg+xml')) {
            return false;
        }

        // 🚫 Ignorar imágenes muy pequeñas (iconos, spacers)
        const width = imgElement.naturalWidth || imgElement.width;
        const height = imgElement.naturalHeight || imgElement.height;
        
        // Un captcha suele ser más ancho que alto, y tener un tamaño mínimo razonable
        if (width < 50 || height < 20) {
            return false;
        }

        // ✅ Verificar por URL/nombre explícito
        const urlIndicators = [
            'captcha', 'Captcha', 'CAPTCHA',
            'imagenCaptcha', 'ImagenCaptcha'
        ];
        
        for (const indicator of urlIndicators) {
            if (src.includes(indicator) || alt.includes(indicator) || 
                id.includes(indicator) || className.includes(indicator)) {
                return true;
            }
        }
        
        // ✅ Verificar contexto específico (solo si parece estar en un login)
        // Buscamos si hay un input de password cerca, señal fuerte de login
        const parent = imgElement.closest('form, div.login-container, table');
        if (parent) {
            const hasPassword = parent.querySelector('input[type="password"]');
            const hasCaptchaInput = parent.querySelector('input[name*="captcha"], input[id*="captcha"]');
            
            if (hasPassword || hasCaptchaInput) {
                // Si hay password o input de captcha, y la imagen tiene tamaño razonable, es probable
                if (width > 80 && width < 400 && height > 30 && height < 150) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Procesar una imagen de captcha específica
     */
    async processCaptchaImage(imgElement) {
        // Verificar si ya fue procesada
        const imgSrc = imgElement.src || imgElement.getAttribute('src');
        if (this.processedCaptchas.has(imgSrc) || !imgSrc) {
            return;
        }

        // Marcar como procesada
        this.processedCaptchas.add(imgSrc);
        
        try {
            console.log('🔍 Captcha detectado:', imgSrc);
            
            // Agregar indicador visual
            this.addCaptchaIndicator(imgElement);
            
            // Resolver captcha
            const solution = await this.solver.solveCaptchaFromElement(imgElement);
            
            if (solution && solution.length > 0) {
                console.log('✅ Captcha resuelto:', solution);
                
                // Buscar campo de entrada y llenar automáticamente
                const inputField = this.findCaptchaInputField(imgElement);
                if (inputField) {
                    this.fillCaptchaField(inputField, solution);
                    this.showSuccessIndicator(imgElement, solution);
                } else {
                    console.warn('⚠️ No se encontró campo de entrada para el captcha');
                    this.showSolutionPopup(imgElement, solution);
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
        console.log('🔍 Buscando campo de entrada...');

        // 1. Buscar en el contenedor padre directo y ancestros cercanos
        // A veces está en un tr, td, div o form
        let container = imgElement.closest('form, div, table, tr, td');
        
        // Selectores específicos primero
        const specificSelectors = [
            'input[name*="captcha" i]',
            'input[id*="captcha" i]',
            'input[class*="captcha" i]',
            'input[placeholder*="captcha" i]',
            'input[placeholder*="imagen" i]',
            'input[placeholder*="texto" i]'
        ];

        // Intentar encontrar en ancestros (subiendo hasta 3 niveles)
        let currentEl = imgElement.parentElement;
        for(let i=0; i<3 && currentEl; i++) {
            for (const selector of specificSelectors) {
                const input = currentEl.querySelector(selector);
                if (input && this.isVisible(input)) return input;
            }
            // También buscar inputs de texto genéricos si están muy cerca en el DOM
            const inputs = currentEl.querySelectorAll('input[type="text"]:not([disabled])');
            if (inputs.length === 1 && this.isVisible(inputs[0])) return inputs[0];
            
            currentEl = currentEl.parentElement;
        }

        // 2. Búsqueda global en la página por selectores específicos
        for (const selector of specificSelectors) {
            const inputs = document.querySelectorAll(selector);
            // Filtrar visibles
            for(const input of inputs) {
                if (this.isVisible(input)) return input;
            }
        }

        // 3. Búsqueda por proximidad física (Geometría)
        // Esto es útil para tablas o layouts complejos donde el DOM no refleja la cercanía visual
        const allInputs = document.querySelectorAll('input[type="text"]:not([disabled]), input:not([type]):not([disabled])');
        let closestInput = null;
        let minDistance = Infinity;
        const imgRect = imgElement.getBoundingClientRect();

        for (const input of allInputs) {
            if (!this.isVisible(input)) continue;

            const inputRect = input.getBoundingClientRect();
            
            // Calcular distancia entre centros
            const imgCenter = { x: imgRect.left + imgRect.width/2, y: imgRect.top + imgRect.height/2 };
            const inputCenter = { x: inputRect.left + inputRect.width/2, y: inputRect.top + inputRect.height/2 };
            
            const distance = Math.sqrt(
                Math.pow(imgCenter.x - inputCenter.x, 2) + 
                Math.pow(imgCenter.y - inputCenter.y, 2)
            );

            // Solo considerar si está "razonablemente" cerca (ej. menos de 300px)
            if (distance < 300 && distance < minDistance) {
                minDistance = distance;
                closestInput = input;
            }
        }

        if (closestInput) {
            console.log('✅ Input encontrado por proximidad:', closestInput);
            return closestInput;
        }

        return null;
    }

    /**
     * Verificar si un elemento es visible
     */
    isVisible(elem) {
        if (!(elem instanceof Element)) return false;
        const style = getComputedStyle(elem);
        if (style.display === 'none') return false;
        if (style.visibility !== 'visible') return false;
        if (style.opacity < 0.1) return false;
        if (elem.offsetWidth + elem.offsetHeight + elem.getClientRects().length === 0) return false;
        return true;
    }

    /**
     * Llenar el campo de captcha con la solución
     */
    fillCaptchaField(inputField, solution) {
        // Limpiar campo
        inputField.value = '';
        
        // Simular escritura natural
        inputField.focus();
        
        // Escribir carácter por carácter
        for (let i = 0; i < solution.length; i++) {
            setTimeout(() => {
                inputField.value += solution[i];
                
                // Disparar eventos
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
        const indicator = document.createElement('div');
        indicator.className = 'sat-captcha-indicator';
        indicator.innerHTML = '🤖 Procesando...';
        indicator.style.cssText = `
            position: absolute;
            top: -25px;
            left: 0;
            background: #007cba;
            color: white;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-family: Arial, sans-serif;
            z-index: 10000;
            pointer-events: none;
        `;
        
        // Posicionar relativo al captcha
        imgElement.style.position = 'relative';
        imgElement.parentNode.style.position = 'relative';
        imgElement.parentNode.appendChild(indicator);
    }

    /**
     * Mostrar indicador de éxito
     */
    showSuccessIndicator(imgElement, solution) {
        const indicator = imgElement.parentNode.querySelector('.sat-captcha-indicator');
        if (indicator) {
            indicator.innerHTML = `✅ ${solution}`;
            indicator.style.background = '#28a745';
            
            // Ocultar después de 5 segundos
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 5000);
        }
    }

    /**
     * Mostrar indicador de error
     */
    showErrorIndicator(imgElement, errorMsg) {
        const indicator = imgElement.parentNode.querySelector('.sat-captcha-indicator');
        if (indicator) {
            indicator.innerHTML = '❌ Error';
            indicator.style.background = '#dc3545';
            indicator.title = errorMsg;
            
            // Ocultar después de 3 segundos
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 3000);
        }
    }

    /**
     * Mostrar popup con la solución si no se encuentra el campo
     */
    showSolutionPopup(imgElement, solution) {
        const popup = document.createElement('div');
        popup.innerHTML = `
            <div style="background: white; border: 2px solid #007cba; padding: 10px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                <strong>Captcha resuelto:</strong> <code style="background: #f0f0f0; padding: 2px 4px;">${solution}</code>
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
        
        // Auto-cerrar después de 10 segundos
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
        // Botón flotante para toggle
        const toggleButton = document.createElement('div');
        toggleButton.innerHTML = this.isEnabled ? '🤖' : '😴';
        toggleButton.title = this.isEnabled ? 'Captcha Solver: Activo' : 'Captcha Solver: Inactivo';
        toggleButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: ${this.isEnabled ? '#28a745' : '#6c757d'};
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        toggleButton.addEventListener('click', () => {
            this.toggleSolver();
            toggleButton.innerHTML = this.isEnabled ? '🤖' : '😴';
            toggleButton.title = this.isEnabled ? 'Captcha Solver: Activo' : 'Captcha Solver: Inactivo';
            toggleButton.style.background = this.isEnabled ? '#28a745' : '#6c757d';
        });
        
        document.body.appendChild(toggleButton);

        // Botón de escaneo manual
        const scanButton = document.createElement('div');
        scanButton.innerHTML = '🔍';
        scanButton.title = 'Escanear Captchas Manualmente';
        scanButton.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #007cba;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        scanButton.addEventListener('click', async () => {
            scanButton.innerHTML = '⏳';
            scanButton.style.background = '#ffc107';
            
            console.log('🔍 Escaneo manual iniciado por usuario');
            await this.scanForCaptchas();
            
            setTimeout(() => {
                scanButton.innerHTML = '🔍';
                scanButton.style.background = '#007cba';
            }, 2000);
        });
        
        document.body.appendChild(scanButton);
    }

    /**
     * Toggle del solver
     */
    async toggleSolver() {
        this.isEnabled = !this.isEnabled;
        
        // Guardar configuración
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
     * Limpiar recursos
     */
    dispose() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        if (this.solver) {
            this.solver.dispose();
        }
        
        clearTimeout(this.scanTimeout);
    }
}

// Inicializar cuando el DOM esté listo
function initCaptchaDetector() {
    // Verificar si estamos en una página del SAT
    if (window.location.hostname.includes('sat.gob.mx')) {
        new SATCaptchaDetector();
    }
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCaptchaDetector);
} else {
    initCaptchaDetector();
}
