import tensorflow as tf
import tf2onnx
import os

# Ruta del modelo Keras entrenado para captchas grises
H5_PATH = os.path.join("model_gris", "model.h5")
ONNX_PATH = os.path.join("model_gris", "model.onnx")

print("Cargando modelo Keras de grises desde:", H5_PATH)
if not os.path.exists(H5_PATH):
    raise FileNotFoundError(f"No se encontró el archivo {H5_PATH}")

# Cargar modelo Keras sin compilar (solo para inferencia)
# safe_mode=False es necesario porque el modelo usa una capa Lambda
model = tf.keras.models.load_model(H5_PATH, compile=False, safe_mode=False)

print("Convirtiendo a ONNX...")
# Dimensiones según configs: height=60, width=160, canales=3
spec = (tf.TensorSpec((None, 60, 160, 3), tf.float32, name="input"),)

model_proto, _ = tf2onnx.convert.from_keras(
    model,
    input_signature=spec,
    opset=13,
    output_path=ONNX_PATH,
)

print("✅ Conversión completa. ONNX guardado en:", ONNX_PATH)
