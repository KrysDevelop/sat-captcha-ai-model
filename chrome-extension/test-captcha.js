/**
 * Script de prueba para ejecutar en la consola del navegador
 * Copia y pega este código en la consola (F12) para diagnosticar problemas
 */

console.log('🧪 SAT Captcha Solver - Test de Diagnóstico');
console.log('==========================================');

// 1. Verificar si los scripts están cargados
console.log('\n1. 📦 Verificando scripts cargados:');
console.log('- ONNX Runtime:', typeof ort !== 'undefined' ? '✅' : '❌');
console.log('- Vocabulario:', typeof CAPTCHA_CONFIG !== 'undefined' ? '✅' : '❌');
console.log('- Solver ONNX:', typeof getONNXCaptchaSolver !== 'undefined' ? '✅' : '❌');
console.log('- Detector:', typeof SATCaptchaDetector !== 'undefined' ? '✅' : '❌');

// 2. Buscar todas las imágenes
console.log('\n2. 🖼️ Analizando imágenes en la página:');
const allImages = document.querySelectorAll('img');
console.log(`Total de imágenes encontradas: ${allImages.length}`);

allImages.forEach((img, index) => {
    const src = img.src || img.getAttribute('src') || 'Sin src';
    const alt = img.alt || 'Sin alt';
    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    
    console.log(`Imagen ${index + 1}:`, {
        src: src.substring(0, 100) + (src.length > 100 ? '...' : ''),
        alt,
        dimensions: `${width}x${height}`,
        element: img
    });
});

// 3. Buscar captchas específicamente
console.log('\n3. 🎯 Buscando captchas específicamente:');
const captchaSelectors = [
    'img[src*="captcha"]',
    'img[src*="Captcha"]',
    'img[src*="CAPTCHA"]',
    'img[alt*="captcha" i]',
    'img[id*="captcha" i]',
    'img[class*="captcha" i]',
    'img[src*="ImagenCaptcha"]',
    'img[src*="imagen"]',
    'form img',
    'table img'
];

let captchasFound = 0;
captchaSelectors.forEach(selector => {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
        console.log(`✅ Selector "${selector}": ${found.length} encontradas`);
        found.forEach(img => console.log('  -', img.src || img.getAttribute('src')));
        captchasFound += found.length;
    } else {
        console.log(`❌ Selector "${selector}": 0 encontradas`);
    }
});

// 4. Análisis contextual
console.log('\n4. 🔍 Análisis contextual:');
const formsWithImages = document.querySelectorAll('form');
console.log(`Formularios encontrados: ${formsWithImages.length}`);

formsWithImages.forEach((form, index) => {
    const images = form.querySelectorAll('img');
    const inputs = form.querySelectorAll('input[type="text"]');
    const formText = form.textContent.toLowerCase();
    
    if (images.length > 0) {
        console.log(`Formulario ${index + 1}:`, {
            images: images.length,
            textInputs: inputs.length,
            containsCaptchaText: formText.includes('captcha') || formText.includes('código'),
            firstImageSrc: images[0] ? (images[0].src || images[0].getAttribute('src')) : 'N/A'
        });
    }
});

// 5. Test manual de detección
console.log('\n5. 🧠 Test de detección inteligente:');
if (typeof getONNXCaptchaSolver !== 'undefined') {
    const solver = getONNXCaptchaSolver();
    console.log('Solver creado:', solver);
    
    // Intentar cargar modelo
    solver.loadModel().then(success => {
        console.log('Carga de modelo:', success ? '✅ Exitosa' : '❌ Falló');
    }).catch(error => {
        console.error('❌ Error cargando modelo:', error);
    });
} else {
    console.log('❌ No se puede crear solver - scripts no cargados');
}

// 6. Información del entorno
console.log('\n6. 🌐 Información del entorno:');
console.log('- URL actual:', window.location.href);
console.log('- User Agent:', navigator.userAgent.substring(0, 100) + '...');
console.log('- Extensiones activas:', chrome && chrome.runtime ? '✅' : '❌');

// 7. Función helper para test manual
console.log('\n7. 🛠️ Funciones de test disponibles:');
console.log('Ejecuta estas funciones para test manual:');

window.testCaptchaSolver = {
    // Forzar escaneo
    forceScan: () => {
        console.log('🔍 Forzando escaneo...');
        if (window.satCaptchaDetector) {
            window.satCaptchaDetector.scanForCaptchas();
        } else {
            console.log('❌ Detector no disponible');
        }
    },
    
    // Analizar imagen específica
    analyzeImage: (imgElement) => {
        if (!imgElement) {
            console.log('❌ Proporciona un elemento img');
            return;
        }
        
        console.log('🔍 Analizando imagen:', {
            src: imgElement.src,
            alt: imgElement.alt,
            dimensions: `${imgElement.naturalWidth || imgElement.width}x${imgElement.naturalHeight || imgElement.height}`,
            parent: imgElement.parentElement.tagName,
            nearbyInputs: imgElement.closest('form, table, div')?.querySelectorAll('input[type="text"]').length || 0
        });
    },
    
    // Test de solver directo
    testSolver: async (imgElement) => {
        if (!imgElement) {
            console.log('❌ Proporciona un elemento img');
            return;
        }
        
        try {
            const solver = getONNXCaptchaSolver();
            const result = await solver.solveCaptchaFromElement(imgElement);
            console.log('✅ Resultado:', result);
        } catch (error) {
            console.error('❌ Error:', error);
        }
    }
};

console.log('\n🎯 Comandos disponibles:');
console.log('- testCaptchaSolver.forceScan() - Forzar escaneo');
console.log('- testCaptchaSolver.analyzeImage(img) - Analizar imagen específica');
console.log('- testCaptchaSolver.testSolver(img) - Probar solver en imagen');

console.log('\n📊 Resumen:');
console.log(`- Imágenes totales: ${allImages.length}`);
console.log(`- Captchas detectados: ${captchasFound}`);
console.log(`- Scripts cargados: ${typeof ort !== 'undefined' && typeof getONNXCaptchaSolver !== 'undefined' ? '✅' : '❌'}`);

if (captchasFound === 0) {
    console.log('\n⚠️ DIAGNÓSTICO: No se detectaron captchas automáticamente.');
    console.log('💡 SOLUCIONES:');
    console.log('1. Haz clic en el botón 🔍 (escaneo manual)');
    console.log('2. Usa testCaptchaSolver.forceScan() en la consola');
    console.log('3. Verifica que estés en una página con captcha activo');
    console.log('4. Recarga la página si el captcha cambió');
}
