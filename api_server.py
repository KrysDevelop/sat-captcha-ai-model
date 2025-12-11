#!/usr/bin/env python3
"""
API Server para servir el modelo SAT Captcha
Permite que la extensión use el modelo real entrenado
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import io
from PIL import Image
import os

# Importar tu modelo existente
from inferenceModel import ImageToWordModel
from mltu.configs import BaseModelConfigs

app = Flask(__name__)
CORS(app)  # Permitir requests desde la extensión

# Cargar modelos al iniciar
print("🚀 Cargando modelo SAT Captcha (color)...")
color_configs = None
color_model = None

try:
    color_configs = BaseModelConfigs.load("model/configs.yaml")
    color_model = ImageToWordModel(model_path=color_configs.model_path, char_list=color_configs.vocab)
    print("✅ Modelo de COLOR cargado exitosamente")
    print(f"📝 Vocabulario COLOR: {color_configs.vocab}")
except Exception as e:
    print(f"❌ Error cargando modelo de COLOR: {e}")

print("🚀 Cargando modelo SAT Captcha (grises)...")
gris_configs = None
gris_model = None

try:
    gris_configs = BaseModelConfigs.load("model_gris/configs.yaml")
    gris_model = ImageToWordModel(model_path=gris_configs.model_path, char_list=gris_configs.vocab)
    print("✅ Modelo de GRISES cargado exitosamente")
    print(f"📝 Vocabulario GRISES: {gris_configs.vocab}")
except Exception as e:
    print(f"❌ Error cargando modelo de GRISES: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Verificar que el servidor está funcionando"""
    return jsonify({
        'status': 'ok',
        'model_loaded': color_model is not None or gris_model is not None,
        'color_loaded': color_model is not None,
        'gris_loaded': gris_model is not None,
        'vocab_color': color_configs.vocab if color_configs else None,
        'vocab_gris': gris_configs.vocab if gris_configs else None,
    })

@app.route('/solve-captcha', methods=['POST'])
def solve_captcha():
    """Resolver captcha desde imagen base64"""
    try:
        # Obtener imagen del request
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'Imagen requerida'}), 400

        # Determinar tipo de página / modelo a usar
        page_type = (data.get('pageType') or 'color').lower()

        # Seleccionar modelo y configs
        selected_model = None
        selected_configs = None

        if 'gris' in page_type or 'cfdi' in page_type:
            # Preferir modelo de grises para CFDI
            if gris_model is not None:
                selected_model = gris_model
                selected_configs = gris_configs
            else:
                # Fallback a color si no hay modelo gris
                selected_model = color_model
                selected_configs = color_configs
        else:
            # Modelo por defecto: color
            selected_model = color_model
            selected_configs = color_configs

        if selected_model is None:
            return jsonify({'error': 'Ningún modelo disponible'}), 500
        
        # Decodificar imagen base64
        image_data = data['image']
        if image_data.startswith('data:image'):
            # Remover header data:image/png;base64,
            image_data = image_data.split(',')[1]
        
        # Convertir a imagen
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convertir a formato OpenCV
        image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Resolver captcha usando el modelo seleccionado
        prediction = selected_model.predict(image_cv)

        modelo_usado = 'gris' if selected_model is gris_model else 'color'
        print(f"🎯 Captcha resuelto ({modelo_usado}): {prediction}")
        
        return jsonify({
            'success': True,
            'prediction': prediction,
            'confidence': 0.95  # Placeholder para confianza
        })
        
    except Exception as e:
        print(f"❌ Error resolviendo captcha: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Endpoint de prueba"""
    return jsonify({
        'message': 'SAT Captcha API funcionando',
        'model_status': 'loaded' if model else 'not_loaded',
        'endpoints': ['/health', '/solve-captcha', '/test']
    })

if __name__ == '__main__':
    print("🌐 Iniciando API Server...")
    print("📡 Endpoints disponibles:")
    print("   - GET  /health - Estado del modelo")
    print("   - POST /solve-captcha - Resolver captcha")
    print("   - GET  /test - Prueba de conexión")
    print()
    print("🔗 Escuchando en: http://0.0.0.0:5000 (todas las interfaces)")
    print("   Usa la IP de esta máquina en tu red, por ejemplo: http://192.168.0.169:5000")
    print("⚠️  Mantén este servidor corriendo mientras uses la extensión")

    app.run(host='0.0.0.0', port=5000, debug=True)
