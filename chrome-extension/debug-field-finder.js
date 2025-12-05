/**
 * Debug script para encontrar el campo de captcha correcto
 * Copia y pega en consola para diagnosticar el problema
 */

console.clear();
console.log('🔍 Debug: Buscador de Campo Captcha');
console.log('==================================');

// 1. Analizar todos los campos de entrada
console.log('\n1. 📝 Analizando campos de entrada:');
const allInputs = document.querySelectorAll('input');
console.log(`Total de inputs: ${allInputs.length}`);

allInputs.forEach((input, index) => {
    const info = {
        index: index + 1,
        type: input.type || 'text',
        name: input.name || 'sin nombre',
        id: input.id || 'sin id',
        placeholder: input.placeholder || 'sin placeholder',
        value: input.value || 'vacío',
        className: input.className || 'sin clase',
        visible: input.offsetParent !== null,
        element: input
    };
    
    console.log(`Input ${info.index}:`, info);
});

// 2. Buscar campos de texto específicamente
console.log('\n2. 📋 Campos de texto encontrados:');
const textInputs = document.querySelectorAll('input[type="text"], input:not([type])');
console.log(`Campos de texto: ${textInputs.length}`);

textInputs.forEach((input, index) => {
    const rect = input.getBoundingClientRect();
    console.log(`Campo ${index + 1}:`, {
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        position: `${Math.round(rect.x)}, ${Math.round(rect.y)}`,
        size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        visible: rect.width > 0 && rect.height > 0,
        element: input
    });
});

// 3. Buscar imágenes (captchas)
console.log('\n3. 🖼️ Imágenes encontradas:');
const images = document.querySelectorAll('img');
console.log(`Total imágenes: ${images.length}`);

const possibleCaptchas = [];
images.forEach((img, index) => {
    const src = img.src || img.getAttribute('src') || '';
    const alt = img.alt || '';
    const rect = img.getBoundingClientRect();
    
    const info = {
        index: index + 1,
        src: src.substring(0, 80) + (src.length > 80 ? '...' : ''),
        alt,
        dimensions: `${img.naturalWidth || img.width}x${img.naturalHeight || img.height}`,
        position: `${Math.round(rect.x)}, ${Math.round(rect.y)}`,
        visible: rect.width > 0 && rect.height > 0,
        element: img
    };
    
    // Detectar posibles captchas
    const couldBeCaptcha = src.toLowerCase().includes('captcha') || 
                          alt.toLowerCase().includes('captcha') ||
                          (img.naturalWidth > 50 && img.naturalWidth < 300 && 
                           img.naturalHeight > 20 && img.naturalHeight < 100);
    
    if (couldBeCaptcha) {
        possibleCaptchas.push(info);
        console.log(`🎯 Posible captcha ${info.index}:`, info);
    } else {
        console.log(`Imagen ${info.index}:`, info);
    }
});

// 4. Analizar relación espacial
console.log('\n4. 📐 Análisis espacial (captcha -> campo):');
if (possibleCaptchas.length > 0 && textInputs.length > 0) {
    possibleCaptchas.forEach(captcha => {
        console.log(`\nCaptcha ${captcha.index} -> Campos cercanos:`);
        
        const captchaRect = captcha.element.getBoundingClientRect();
        
        textInputs.forEach((input, inputIndex) => {
            const inputRect = input.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow(captchaRect.x - inputRect.x, 2) + 
                Math.pow(captchaRect.y - inputRect.y, 2)
            );
            
            console.log(`  Campo ${inputIndex + 1}: ${Math.round(distance)}px de distancia`, {
                name: input.name,
                placeholder: input.placeholder,
                element: input
            });
        });
    });
}

// 5. Buscar por contexto de formulario
console.log('\n5. 📋 Análisis de formularios:');
const forms = document.querySelectorAll('form');
console.log(`Formularios encontrados: ${forms.length}`);

forms.forEach((form, index) => {
    const formImages = form.querySelectorAll('img');
    const formInputs = form.querySelectorAll('input[type="text"], input:not([type])');
    
    console.log(`Formulario ${index + 1}:`, {
        images: formImages.length,
        textInputs: formInputs.length,
        action: form.action || 'sin action',
        method: form.method || 'GET'
    });
    
    if (formImages.length > 0 && formInputs.length > 0) {
        console.log('  🎯 Formulario con captcha potencial:');
        formInputs.forEach((input, inputIndex) => {
            console.log(`    Input ${inputIndex + 1}:`, {
                name: input.name,
                placeholder: input.placeholder,
                element: input
            });
        });
    }
});

// 6. Funciones helper para test manual
console.log('\n6. 🛠️ Funciones de test disponibles:');
window.debugCaptcha = {
    // Resaltar campo específico
    highlightField: (index) => {
        const input = textInputs[index - 1];
        if (input) {
            input.style.border = '3px solid red';
            input.style.backgroundColor = 'yellow';
            input.focus();
            console.log('🎯 Campo resaltado:', input);
            return input;
        } else {
            console.log('❌ Campo no encontrado');
        }
    },
    
    // Probar llenar campo específico
    fillField: (index, text = 'TEST123') => {
        const input = textInputs[index - 1];
        if (input) {
            input.value = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ Campo ${index} llenado con: ${text}`);
            return input;
        } else {
            console.log('❌ Campo no encontrado');
        }
    },
    
    // Limpiar resaltados
    clearHighlights: () => {
        textInputs.forEach(input => {
            input.style.border = '';
            input.style.backgroundColor = '';
        });
        console.log('🧹 Resaltados limpiados');
    },
    
    // Mostrar campo más probable
    findBestField: () => {
        console.log('🎯 Buscando campo más probable...');
        
        // Buscar por placeholder
        for (let i = 0; i < textInputs.length; i++) {
            const input = textInputs[i];
            const placeholder = input.placeholder?.toLowerCase() || '';
            const name = input.name?.toLowerCase() || '';
            
            if (placeholder.includes('captcha') || placeholder.includes('código') || 
                name.includes('captcha') || name.includes('codigo')) {
                console.log(`✅ Campo más probable: ${i + 1}`, input);
                debugCaptcha.highlightField(i + 1);
                return input;
            }
        }
        
        // Si no hay específico, usar el último
        if (textInputs.length > 0) {
            const lastIndex = textInputs.length;
            console.log(`⚠️ Usando último campo: ${lastIndex}`, textInputs[lastIndex - 1]);
            debugCaptcha.highlightField(lastIndex);
            return textInputs[lastIndex - 1];
        }
        
        console.log('❌ No se encontró campo probable');
        return null;
    }
};

// 7. Instrucciones
console.log('\n📋 Comandos disponibles:');
console.log('- debugCaptcha.highlightField(N) - Resaltar campo N');
console.log('- debugCaptcha.fillField(N, "texto") - Llenar campo N');
console.log('- debugCaptcha.clearHighlights() - Limpiar resaltados');
console.log('- debugCaptcha.findBestField() - Encontrar campo más probable');

console.log('\n💡 Sugerencias:');
console.log('1. Ejecuta debugCaptcha.findBestField() para encontrar el campo');
console.log('2. Si no es correcto, prueba debugCaptcha.highlightField(N) con diferentes números');
console.log('3. Una vez identificado, usa debugCaptcha.fillField(N, "PRUEBA")');

// 8. Auto-análisis
console.log('\n🚀 Ejecutando auto-análisis...');
setTimeout(() => {
    debugCaptcha.findBestField();
}, 1000);
