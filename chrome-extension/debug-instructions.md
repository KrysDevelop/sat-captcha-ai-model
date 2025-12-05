# 🐛 Debug SAT Captcha Solver

## 1. Abrir Consola de Desarrollador
1. Presiona **F12** en la página del SAT
2. Ve a la pestaña **"Console"**
3. Busca mensajes que empiecen con:
   - 🤖 (Solver)
   - 🚀 (Detector)
   - ❌ (Errores)

## 2. Verificar Content Script
En la consola, escribe:
```javascript
// Verificar si el detector está cargado
console.log('Detector:', typeof SATCaptchaDetector !== 'undefined');
console.log('Solver:', typeof getONNXCaptchaSolver !== 'undefined');
console.log('ONNX:', typeof ort !== 'undefined');
```

## 3. Forzar Escaneo Manual
En la consola, escribe:
```javascript
// Buscar captchas manualmente
document.querySelectorAll('img').forEach((img, i) => {
    if (img.src && img.src.includes('captcha')) {
        console.log(`Captcha ${i}:`, img.src, img);
    }
});
```

## 4. Verificar Selectores
```javascript
// Verificar selectores de captcha
const selectors = [
    'img[src*="captcha"]',
    'img[src*="Captcha"]', 
    'img[alt*="captcha" i]',
    'img[id*="captcha" i]'
];

selectors.forEach(sel => {
    const found = document.querySelectorAll(sel);
    console.log(`Selector "${sel}":`, found.length, found);
});
```

## 5. Errores Comunes y Soluciones

### Error: "ort is not defined"
- **Problema**: ONNX Runtime no se cargó
- **Solución**: Verificar que `libs/ort.min.js` existe y es válido

### Error: "Failed to load model"
- **Problema**: Modelo ONNX no se puede cargar
- **Solución**: Verificar permisos y ruta del modelo

### Error: "Cannot read properties of null"
- **Problema**: Elementos DOM no encontrados
- **Solución**: Verificar selectores CSS

### No aparecen mensajes de debug
- **Problema**: Content script no se está ejecutando
- **Solución**: Recargar la página o reinstalar extensión
