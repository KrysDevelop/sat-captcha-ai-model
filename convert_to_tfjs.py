#!/usr/bin/env python3
"""
Script para convertir el modelo ONNX a TensorFlow.js
"""
import os
import subprocess
import sys

def install_requirements():
    """Instalar dependencias necesarias para la conversión"""
    requirements = [
        'tensorflowjs',
        'onnx',
        'onnx-tf'
    ]
    
    for req in requirements:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', req])
            print(f"✓ Instalado: {req}")
        except subprocess.CalledProcessError:
            print(f"✗ Error instalando: {req}")
            return False
    return True

def convert_onnx_to_tfjs():
    """Convertir modelo ONNX a TensorFlow.js"""
    
    # Rutas
    onnx_model_path = "model/model.onnx"
    tfjs_output_path = "chrome-extension/model"
    
    if not os.path.exists(onnx_model_path):
        print(f"✗ No se encontró el modelo ONNX en: {onnx_model_path}")
        return False
    
    # Crear directorio de salida
    os.makedirs(tfjs_output_path, exist_ok=True)
    
    try:
        # Convertir ONNX a TensorFlow SavedModel primero
        print("Paso 1: Convirtiendo ONNX a TensorFlow SavedModel...")
        import onnx
        from onnx_tf.backend import prepare
        
        onnx_model = onnx.load(onnx_model_path)
        tf_rep = prepare(onnx_model)
        
        temp_savedmodel_path = "temp_savedmodel"
        tf_rep.export_graph(temp_savedmodel_path)
        
        # Convertir SavedModel a TensorFlow.js
        print("Paso 2: Convirtiendo SavedModel a TensorFlow.js...")
        cmd = [
            'tensorflowjs_converter',
            '--input_format=tf_saved_model',
            '--output_format=tfjs_graph_model',
            '--signature_name=serving_default',
            temp_savedmodel_path,
            tfjs_output_path
        ]
        
        subprocess.check_call(cmd)
        
        # Limpiar archivos temporales
        import shutil
        if os.path.exists(temp_savedmodel_path):
            shutil.rmtree(temp_savedmodel_path)
        
        print(f"✓ Modelo convertido exitosamente a: {tfjs_output_path}")
        return True
        
    except Exception as e:
        print(f"✗ Error en la conversión: {e}")
        return False

def main():
    print("=== Convertidor ONNX a TensorFlow.js ===")
    
    print("\n1. Instalando dependencias...")
    if not install_requirements():
        print("✗ Error instalando dependencias")
        return
    
    print("\n2. Convirtiendo modelo...")
    if convert_onnx_to_tfjs():
        print("\n✓ Conversión completada exitosamente!")
        print("\nArchivos generados:")
        print("- chrome-extension/model/model.json")
        print("- chrome-extension/model/*.bin")
    else:
        print("\n✗ Error en la conversión")

if __name__ == "__main__":
    main()
