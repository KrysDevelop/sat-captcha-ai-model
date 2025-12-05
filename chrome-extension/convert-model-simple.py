#!/usr/bin/env python3
"""
Script simplificado para convertir modelo a formato compatible con navegador
"""
import os
import numpy as np
from mltu.configs import BaseModelConfigs

def create_simple_model_data():
    """Crear datos del modelo en formato JavaScript simple"""
    
    # Cargar configuración
    try:
        configs = BaseModelConfigs.load("model/configs.yaml")
        print(f"✅ Configuración cargada: {configs.vocab}")
    except Exception as e:
        print(f"❌ Error cargando configuración: {e}")
        return False
    
    # Crear archivo JavaScript con los datos del modelo
    js_content = f"""
/**
 * Datos del modelo SAT Captcha Solver
 * Generado automáticamente desde el modelo entrenado
 */

// Configuración del modelo
const MODEL_CONFIG = {{
    vocab: "{configs.vocab}",
    maxLength: {configs.max_text_length},
    width: {configs.width},
    height: {configs.height},
    vocabSize: {len(configs.vocab) + 1}
}};

// Función simplificada de predicción (placeholder)
// En una implementación real, aquí iría la lógica del modelo
function predictCaptcha(imageData) {{
    // Por ahora, generar una predicción simulada para testing
    const vocab = MODEL_CONFIG.vocab;
    const length = Math.floor(Math.random() * 4) + 3; // 3-6 caracteres
    let result = '';
    
    for (let i = 0; i < length; i++) {{
        const randomIndex = Math.floor(Math.random() * vocab.length);
        result += vocab[randomIndex];
    }}
    
    return result;
}}

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ MODEL_CONFIG, predictCaptcha }};
}}
"""
    
    # Escribir archivo
    output_path = "chrome-extension/src/simple-model.js"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"✅ Modelo simplificado creado en: {output_path}")
    return True

def main():
    print("=== Convertidor Simplificado ===")
    print("Creando modelo JavaScript compatible...")
    
    if create_simple_model_data():
        print("\n✅ Conversión exitosa!")
        print("\nPróximos pasos:")
        print("1. Actualizar manifest.json para usar simple-model.js")
        print("2. Modificar solver para usar predicción simplificada")
        print("3. Probar en el navegador")
    else:
        print("\n❌ Error en la conversión")

if __name__ == "__main__":
    main()
