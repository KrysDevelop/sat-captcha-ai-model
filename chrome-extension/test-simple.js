/**
 * Script de prueba para el solver simplificado
 * Copia y pega en la consola (F12) para probar
 */

console.log('🧪 SAT Captcha Solver - Test Simplificado');
console.log('=========================================');

// 1. Verificar scripts cargados
console.log('\n1. 📦 Verificando scripts:');
console.log('- Modelo Simple:', typeof MODEL_CONFIG !== 'undefined' ? '✅' : '❌');
console.log('- Vocabulario:', typeof CAPTCHA_CONFIG !== 'undefined' ? '✅' : '❌');
console.log('- Solver Simple:', typeof getSimpleCaptchaSolver !== 'undefined' ? '✅' : '❌');
console.log('- Detector:', typeof SATCaptchaDetector !== 'undefined' ? '✅' : '❌');

if (typeof MODEL_CONFIG !== 'undefined') {
    console.log('📝 Vocabulario del modelo:', MODEL_CONFIG.vocab);
}

// 2. Test del solver
console.log('\n2. 🧠 Probando solver simplificado:');
if (typeof getSimpleCaptchaSolver !== 'undefined') {
    const solver = getSimpleCaptchaSolver();
    console.log('✅ Solver creado:', solver);
    
    // Test de predicción fallback
    const testPrediction = solver.generateFallbackPrediction();
    console.log('🎯 Predicción de prueba:', testPrediction);
} else {
    console.log('❌ Solver no disponible');
}

// 3. Buscar captchas en la página
console.log('\n3. 🔍 Buscando captchas:');
const allImages = document.querySelectorAll('img');
console.log(`Total de imágenes: ${allImages.length}`);

let captchaFound = false;
allImages.forEach((img, index) => {
    const src = img.src || img.getAttribute('src') || '';
    const alt = img.alt || '';
    
    // Verificar si podría ser captcha
    const indicators = ['captcha', 'imagen', 'code', 'verify'];
    const couldBeCaptcha = indicators.some(indicator => 
        src.toLowerCase().includes(indicator) || 
        alt.toLowerCase().includes(indicator)
    );
    
    if (couldBeCaptcha || img.closest('form')) {
        console.log(`🎯 Posible captcha ${index + 1}:`, {
            src: src.substring(0, 80) + (src.length > 80 ? '...' : ''),
            alt,
            dimensions: `${img.naturalWidth || img.width}x${img.naturalHeight || img.height}`,
            inForm: !!img.closest('form')
        });
        captchaFound = true;
    }
});

if (!captchaFound) {
    console.log('⚠️ No se detectaron captchas obvios');
}

// 4. Funciones de test manual
console.log('\n4. 🛠️ Funciones de test disponibles:');

window.testSimpleSolver = {
    // Test directo del solver
    testSolver: async (imgElement) => {
        if (!imgElement) {
            console.log('❌ Proporciona un elemento img');
            console.log('Ejemplo: testSimpleSolver.testSolver(document.querySelector("img"))');
            return;
        }
        
        try {
            console.log('🔍 Probando solver en imagen...');
            const solver = getSimpleCaptchaSolver();
            const result = await solver.solveCaptchaFromElement(imgElement);
            console.log('✅ Resultado:', result);
            return result;
        } catch (error) {
            console.error('❌ Error:', error);
        }
    },
    
    // Test con la primera imagen de formulario
    testFirstFormImage: async () => {
        const formImages = document.querySelectorAll('form img');
        if (formImages.length > 0) {
            console.log(`🎯 Probando con primera imagen de formulario (${formImages.length} encontradas)`);
            return await testSimpleSolver.testSolver(formImages[0]);
        } else {
            console.log('❌ No se encontraron imágenes en formularios');
        }
    },
    
    // Forzar escaneo completo
    forceScan: () => {
        console.log('🔍 Forzando escaneo completo...');
        if (typeof SATCaptchaDetector !== 'undefined') {
            // Crear detector temporal si no existe
            const detector = new SATCaptchaDetector();
            detector.scanForCaptchas();
        } else {
            console.log('❌ Detector no disponible');
        }
    },
    
    // Test de predicción simple
    testPrediction: () => {
        const solver = getSimpleCaptchaSolver();
        const prediction = solver.generateFallbackPrediction();
        console.log('🎲 Predicción aleatoria:', prediction);
        return prediction;
    }
};

// 5. Instrucciones
console.log('\n📋 Comandos disponibles:');
console.log('- testSimpleSolver.testFirstFormImage() - Probar con primera imagen de formulario');
console.log('- testSimpleSolver.testSolver(img) - Probar con imagen específica');
console.log('- testSimpleSolver.forceScan() - Forzar escaneo');
console.log('- testSimpleSolver.testPrediction() - Generar predicción de prueba');

// 6. Auto-test si hay imágenes
if (allImages.length > 0) {
    console.log('\n🚀 Ejecutando auto-test...');
    
    // Probar con primera imagen de formulario si existe
    const formImages = document.querySelectorAll('form img');
    if (formImages.length > 0) {
        console.log('🎯 Auto-probando primera imagen de formulario...');
        setTimeout(() => {
            testSimpleSolver.testFirstFormImage();
        }, 1000);
    }
}

console.log('\n✅ Test simplificado completado');
console.log('💡 Si ves errores de ONNX/WASM, ¡esos ya están solucionados con el solver simple!');
