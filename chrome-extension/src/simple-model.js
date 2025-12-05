
/**
 * Datos del modelo SAT Captcha Solver
 * Generado automáticamente desde el modelo entrenado
 */

// Configuración del modelo
const MODEL_CONFIG = {
    vocab: "Y65WRD98SMBG3NJ21CP4KF7ZXHVTQL",
    maxLength: 6,
    width: 160,
    height: 60,
    vocabSize: 31
};

// Función simplificada de predicción (placeholder)
// En una implementación real, aquí iría la lógica del modelo
function predictCaptcha(imageData) {
    // Por ahora, generar una predicción simulada para testing
    const vocab = MODEL_CONFIG.vocab;
    const length = Math.floor(Math.random() * 4) + 3; // 3-6 caracteres
    let result = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * vocab.length);
        result += vocab[randomIndex];
    }
    
    return result;
}

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MODEL_CONFIG, predictCaptcha };
}
