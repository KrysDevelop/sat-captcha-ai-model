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

# Cargar modelo al iniciar
print("🚀 Cargando modelo SAT Captcha...")
try:
    configs = BaseModelConfigs.load("model/configs.yaml")
    model = ImageToWordModel(model_path=configs.model_path, char_list=configs.vocab)
    print("✅ Modelo cargado exitosamente")
    print(f"📝 Vocabulario: {configs.vocab}")
except Exception as e:
    print(f"❌ Error cargando modelo: {e}")
    model = None

@app.route('/health', methods=['GET'])
def health_check():
    """Verificar que el servidor está funcionando"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'vocab': configs.vocab if model else None
    })

@app.route('/solve-captcha', methods=['POST'])
def solve_captcha():
    """Resolver captcha desde imagen base64"""
    try:
        if not model:
            return jsonify({'error': 'Modelo no disponible'}), 500
        
        # Obtener imagen del request
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'Imagen requerida'}), 400
        
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
        
        # Resolver captcha usando tu modelo
        prediction = model.predict(image_cv)
        
        print(f"🎯 Captcha resuelto: {prediction}")
        
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
    print("🔗 URL: http://localhost:5000")
    print("⚠️  Mantén este servidor corriendo mientras uses la extensión")
    
    app.run(host='localhost', port=5000, debug=True)
