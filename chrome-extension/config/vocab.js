// Vocabulario extraído del modelo entrenado
// Basado en configs.yaml: vocab: Y65WRD98SMBG3NJ21CP4KF7ZXHVTQL
const CAPTCHA_CONFIG = {
    vocab: "Y65WRD98SMBG3NJ21CP4KF7ZXHVTQL",
    maxLength: 6,
    width: 160,
    height: 60,
    vocabSize: 30 // Longitud del vocabulario + 1 para CTC blank
};

// Función para decodificar predicciones CTC
function ctcDecode(predictions, vocab) {
    const decoded = [];
    let lastChar = null;
    
    for (let i = 0; i < predictions.length; i++) {
        const charIndex = predictions[i];
        
        // Ignorar blank token (último índice)
        if (charIndex < vocab.length && charIndex !== lastChar) {
            decoded.push(vocab[charIndex]);
        }
        lastChar = charIndex;
    }
    
    return decoded.join('');
}

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CAPTCHA_CONFIG, ctcDecode };
}
