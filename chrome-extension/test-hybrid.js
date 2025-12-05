/**
 * Test para la versión híbrida con API
 * Copia y pega en consola después de recargar la extensión
 */

console.clear();
console.log('🧪 SAT Captcha Solver HYBRID - Test con Modelo Real');
console.log('==================================================');

// 1. Verificar componentes híbridos
console.log('\n1. 🔧 Verificando componentes híbridos:');
console.log('- Modelo Simple:', typeof MODEL_CONFIG !== 'undefined' ? '✅' : '❌');
console.log('- Solver Simple:', typeof getSimpleCaptchaSolver !== 'undefined' ? '✅' : '❌');
console.log('- Solver API:', typeof getAPICaptchaSolver !== 'undefined' ? '✅' : '❌');
console.log('- Detector Híbrido:', typeof HybridCaptchaDetector !== 'undefined' ? '✅' : '❌');

// 2. Test de conexión API
console.log('\n2. 🌐 Verificando conexión API:');
if (typeof getAPICaptchaSolver !== 'undefined') {
    const apiSolver = getAPICaptchaSolver();
    
    apiSolver.getAPIStatus().then(status => {
        console.log('📡 Estado API:', status);
        
        if (status.status === 'ok') {
            console.log('✅ API funcionando correctamente');
            console.log('🧠 Modelo cargado:', status.model_loaded ? 'SÍ' : 'NO');
            console.log('📝 Vocabulario:', status.vocab);
        } else {
            console.log('❌ API no disponible:', status.error);
        }
    }).catch(error => {
        console.log('❌ Error conectando API:', error.message);
        console.log('💡 ¿Está corriendo "python api_server.py"?');
    });
} else {
    console.log('❌ Solver API no disponible');
}

// 3. Verificar botones de interfaz
console.log('\n3. 🎮 Verificando interfaz híbrida:');
setTimeout(() => {
    const buttons = {
        toggle: document.querySelector('[title*="Captcha Solver"]'),
        scan: document.querySelector('[title*="Escanear"]'),
        switch: document.querySelector('[title*="Modo:"]')
    };
    
    console.log('- Botón Toggle (🤖):', buttons.toggle ? '✅' : '❌');
    console.log('- Botón Escanear (🔍):', buttons.scan ? '✅' : '❌');
    console.log('- Botón Cambiar Modo (🧠/🎲):', buttons.switch ? '✅' : '❌');
    
    if (buttons.switch) {
        const isAPI = buttons.switch.innerHTML === '🧠';
        console.log('🔄 Modo actual:', isAPI ? 'Modelo Real (API)' : 'Solver Simple');
    }
}, 1000);

// 4. Buscar captchas
console.log('\n4. 🔍 Buscando captchas:');
const allImages = document.querySelectorAll('img');
const formImages = document.querySelectorAll('form img');
console.log(`- Total imágenes: ${allImages.length}`);
console.log(`- Imágenes en formularios: ${formImages.length}`);

if (formImages.length > 0) {
    console.log('🎯 Primera imagen de formulario:', {
        src: formImages[0].src?.substring(0, 60) + '...',
        dimensions: `${formImages[0].naturalWidth || formImages[0].width}x${formImages[0].naturalHeight || formImages[0].height}`
    });
}

// 5. Funciones de test
console.log('\n5. 🛠️ Funciones de test híbrido:');
window.testHybrid = {
    // Test con API (modelo real)
    testWithAPI: async () => {
        console.log('🧠 Probando con modelo real (API)...');
        
        if (formImages.length === 0) {
            console.log('❌ No hay imágenes en formularios');
            return;
        }
        
        try {
            const apiSolver = getAPICaptchaSolver();
            const result = await apiSolver.solveCaptchaFromElement(formImages[0]);
            console.log('✅ Resultado API:', result);
            return result;
        } catch (error) {
            console.error('❌ Error API:', error);
        }
    },
    
    // Test con solver simple
    testWithSimple: async () => {
        console.log('🎲 Probando con solver simple...');
        
        if (formImages.length === 0) {
            console.log('❌ No hay imágenes en formularios');
            return;
        }
        
        try {
            const simpleSolver = getSimpleCaptchaSolver();
            const result = await simpleSolver.solveCaptchaFromElement(formImages[0]);
            console.log('✅ Resultado Simple:', result);
            return result;
        } catch (error) {
            console.error('❌ Error Simple:', error);
        }
    },
    
    // Comparar ambos métodos
    compareResults: async () => {
        console.log('⚖️ Comparando API vs Simple...');
        
        const apiResult = await testHybrid.testWithAPI();
        const simpleResult = await testHybrid.testWithSimple();
        
        console.log('📊 Comparación:');
        console.log(`   🧠 API: ${apiResult}`);
        console.log(`   🎲 Simple: ${simpleResult}`);
        console.log(`   📏 Longitud API: ${apiResult?.length || 0}`);
        console.log(`   📏 Longitud Simple: ${simpleResult?.length || 0}`);
        
        return { api: apiResult, simple: simpleResult };
    },
    
    // Test de estado API
    checkAPI: async () => {
        console.log('🔍 Verificando estado API...');
        
        try {
            const response = await fetch('http://localhost:5000/health');
            const data = await response.json();
            console.log('📡 Respuesta API:', data);
            return data;
        } catch (error) {
            console.log('❌ API no accesible:', error.message);
            return null;
        }
    },
    
    // Forzar escaneo híbrido
    forceScan: () => {
        console.log('🔍 Forzando escaneo híbrido...');
        const scanButton = document.querySelector('[title*="Escanear"]');
        if (scanButton) {
            scanButton.click();
            console.log('✅ Escaneo iniciado');
        } else {
            console.log('❌ Botón de escaneo no encontrado');
        }
    }
};

// 6. Auto-test
console.log('\n6. 🚀 Ejecutando auto-test...');
setTimeout(async () => {
    // Verificar API primero
    const apiStatus = await testHybrid.checkAPI();
    
    if (apiStatus && apiStatus.status === 'ok') {
        console.log('🎉 API disponible - Probando modelo real...');
        if (formImages.length > 0) {
            setTimeout(() => testHybrid.testWithAPI(), 2000);
        }
    } else {
        console.log('⚠️ API no disponible - Usando solver simple');
        console.log('💡 Para usar modelo real: python api_server.py');
    }
}, 2000);

// 7. Instrucciones
console.log('\n📋 Comandos disponibles:');
console.log('- testHybrid.testWithAPI() - Probar con modelo real');
console.log('- testHybrid.testWithSimple() - Probar con solver simple');
console.log('- testHybrid.compareResults() - Comparar ambos métodos');
console.log('- testHybrid.checkAPI() - Verificar estado API');
console.log('- testHybrid.forceScan() - Forzar escaneo');

console.log('\n🎯 Botones disponibles:');
console.log('- 🤖 (Verde/Azul) = Toggle activar/desactivar');
console.log('- 🔍 (Azul) = Escanear manualmente');
console.log('- 🧠/🎲 = Cambiar entre Modelo Real y Simple');

console.log('\n✨ ¡La extensión híbrida está lista!');
