# SAT Captcha Solver - Extensión Chrome

Extensión de Chrome que resuelve automáticamente captchas del SAT usando inteligencia artificial.

## 🚀 Instalación

### Paso 1: Convertir el Modelo
```bash
# Desde la carpeta raíz del proyecto
cd c:\Users\AEMM\Desktop\sat-captcha-ai-model

# Ejecutar script de conversión
python convert_to_tfjs.py
```

### Paso 2: Descargar TensorFlow.js
Descarga la librería TensorFlow.js y colócala en `chrome-extension/libs/`:

```bash
# Crear directorio libs
mkdir chrome-extension\libs

# Descargar TensorFlow.js (puedes usar este enlace)
# https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js
# Guardar como: chrome-extension/libs/tensorflow.min.js
```

### Paso 3: Instalar en Chrome
1. Abre Chrome y ve a `chrome://extensions/`
2. Activa el "Modo de desarrollador" (esquina superior derecha)
3. Haz clic en "Cargar extensión sin empaquetar"
4. Selecciona la carpeta `chrome-extension`
5. ¡Listo! La extensión aparecerá en tu barra de herramientas

## 📁 Estructura de Archivos

```
chrome-extension/
├── manifest.json              # Configuración de la extensión
├── config/
│   └── vocab.js              # Vocabulario del modelo
├── src/
│   ├── captcha-solver.js     # Lógica principal del solver
│   ├── content.js            # Script de detección automática
│   └── background.js         # Service worker
├── popup/
│   ├── popup.html            # Interfaz del popup
│   └── popup.js              # Lógica del popup
├── model/
│   ├── model.json            # Modelo TensorFlow.js (generado)
│   └── *.bin                 # Pesos del modelo (generados)
└── libs/
    └── tensorflow.min.js     # Librería TensorFlow.js
```

## 🎯 Uso

### Automático
1. Navega a cualquier página del SAT (sat.gob.mx)
2. La extensión detectará automáticamente los captchas
3. Los resolverá y llenará los campos automáticamente
4. Verás indicadores visuales del progreso

### Manual
1. Haz clic en el ícono de la extensión 🤖
2. Usa el botón "Escanear" para buscar captchas manualmente
3. Toggle "Activar/Desactivar" para controlar el comportamiento automático

### Indicadores Visuales
- 🤖 **Procesando...** - Analizando captcha
- ✅ **ABC123** - Captcha resuelto exitosamente
- ❌ **Error** - Error en el procesamiento

## ⚙️ Configuración

### Vocabulario del Modelo
El vocabulario se extrae automáticamente de `configs.yaml`:
```javascript
// config/vocab.js
const CAPTCHA_CONFIG = {
    vocab: "Y65WRD98SMBG3NJ21CP4KF7ZXHVTQL",  // Tu vocabulario específico
    maxLength: 6,
    width: 160,
    height: 60
};
```

### Ajustes Disponibles
- **Auto-solve**: Activar/desactivar resolución automática
- **Estadísticas**: Ver captchas resueltos y precisión
- **Indicadores visuales**: Mostrar/ocultar feedback visual

## 🔧 Desarrollo

### Requisitos
- Python 3.8+
- TensorFlow 2.10.0
- Chrome/Chromium Browser

### Scripts Útiles
```bash
# Convertir modelo a TensorFlow.js
python convert_to_tfjs.py

# Verificar vocabulario
python -c "from mltu.configs import BaseModelConfigs; c=BaseModelConfigs.load('model/configs.yaml'); print(c.vocab)"
```

### Debug
1. Abre Chrome DevTools (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes que empiecen con:
   - 🤖 (Solver)
   - 🔍 (Detección)
   - ✅ (Éxito)
   - ❌ (Error)

## 📊 Estadísticas

La extensión rastrea:
- **Captchas resueltos**: Número total de captchas procesados exitosamente
- **Precisión**: Porcentaje de éxito
- **Tiempo de respuesta**: Velocidad de procesamiento

## ⚠️ Limitaciones

### Técnicas
- **Tamaño del modelo**: ~2MB (puede tardar en cargar)
- **Rendimiento**: Depende de la potencia del dispositivo
- **Compatibilidad**: Solo Chrome/Chromium

### Legales
- **Uso responsable**: Respeta los términos de servicio del SAT
- **Automatización**: Úsalo éticamente y dentro de los límites legales
- **Privacidad**: Los datos se procesan localmente

## 🐛 Solución de Problemas

### La extensión no aparece
- Verifica que el "Modo desarrollador" esté activo
- Revisa la consola de extensiones para errores

### No detecta captchas
- Recarga la página del SAT
- Verifica que estés en sat.gob.mx
- Haz clic en "Escanear" manualmente

### Modelo no carga
- Verifica que `model.json` y `*.bin` existan
- Revisa que `tensorflow.min.js` esté en `libs/`
- Comprueba la consola del navegador para errores

### Captchas incorrectos
- El modelo puede necesitar más entrenamiento
- Verifica que el vocabulario sea correcto
- Algunos captchas pueden ser más difíciles

## 📝 Changelog

### v1.0.0
- ✅ Detección automática de captchas
- ✅ Resolución usando TensorFlow.js
- ✅ Interfaz de usuario completa
- ✅ Estadísticas y configuración
- ✅ Indicadores visuales

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la misma licencia que el proyecto original SAT Captcha AI Model.
