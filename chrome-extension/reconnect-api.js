/**
 * Script para reconectar automáticamente con la API
 * Ejecutar cuando aparezca "API no disponible"
 */

console.clear();
console.log('🔄 Reconectando con API...');
console.log('========================');

// 1. Verificar estado actual
console.log('\n1. 🔍 Verificando estado actual:');
if (typeof getAPICaptchaSolver !== 'undefined') {
    const apiSolver = getAPICaptchaSolver();
    
    apiSolver.getAPIStatus().then(status => {
        console.log('📡 Estado API:', status);
        
        if (status.status === 'ok') {
            console.log('✅ API reconectada exitosamente');
            console.log('🧠 Modelo disponible:', status.model_loaded ? 'SÍ' : 'NO');
            
            // Forzar actualización del estado
            apiSolver.isReady = true;
            console.log('🔄 Estado del solver actualizado');
            
            // Cambiar a modo API si está en simple
            const switchButton = document.querySelector('[title*="Modo:"]');
            if (switchButton && switchButton.innerHTML === '🎲') {
                switchButton.click();
                console.log('🧠 Cambiado a modo API');
            }
            
        } else {
            console.log('❌ API aún no disponible');
            console.log('💡 Verifica que "python api_server.py" esté corriendo');
        }
    }).catch(error => {
        console.log('❌ Error conectando:', error.message);
        console.log('🔄 Intentando reconectar...');
        
        // Reintentar conexión
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    });
} else {
    console.log('❌ Solver API no disponible');
    console.log('🔄 Recarga la página');
}

// 2. Función de reconexión manual
window.reconnectAPI = {
    // Test de conexión
    testConnection: async () => {
        console.log('🧪 Probando conexión API...');
        
        try {
            const response = await fetch('http://localhost:5000/health');
            const data = await response.json();
            
            console.log('✅ Conexión exitosa:', data);
            return true;
        } catch (error) {
            console.log('❌ Conexión falló:', error.message);
            return false;
        }
    },
    
    // Forzar reconexión
    forceReconnect: async () => {
        console.log('🔄 Forzando reconexión...');
        
        if (await reconnectAPI.testConnection()) {
            // Actualizar solver
            if (typeof getAPICaptchaSolver !== 'undefined') {
                const apiSolver = getAPICaptchaSolver();
                await apiSolver.checkAPIConnection();
                
                console.log('✅ Reconexión completada');
                
                // Cambiar a modo API
                const switchButton = document.querySelector('[title*="Modo:"]');
                if (switchButton) {
                    switchButton.click();
                }
                
                return true;
            }
        } else {
            console.log('❌ No se pudo reconectar');
            console.log('💡 Verifica que el servidor esté corriendo');
            return false;
        }
    },
    
    // Recargar página si es necesario
    reloadIfNeeded: () => {
        console.log('🔄 Recargando página para reconectar...');
        window.location.reload();
    }
};

// 3. Auto-reconexión
console.log('\n🚀 Intentando reconexión automática...');
setTimeout(async () => {
    const connected = await reconnectAPI.forceReconnect();
    
    if (connected) {
        console.log('🎉 ¡Reconexión exitosa!');
        console.log('🧠 La extensión ahora usará el modelo real');
    } else {
        console.log('⚠️ Reconexión falló');
        console.log('📋 Comandos disponibles:');
        console.log('- reconnectAPI.testConnection() - Probar conexión');
        console.log('- reconnectAPI.forceReconnect() - Forzar reconexión');
        console.log('- reconnectAPI.reloadIfNeeded() - Recargar página');
    }
}, 1000);

console.log('\n💡 Si el problema persiste:');
console.log('1. Verifica que "python api_server.py" esté corriendo');
console.log('2. Ejecuta: reconnectAPI.forceReconnect()');
console.log('3. O recarga la página: reconnectAPI.reloadIfNeeded()');
