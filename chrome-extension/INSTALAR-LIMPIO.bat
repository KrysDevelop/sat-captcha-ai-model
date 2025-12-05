@echo off
echo ========================================
echo   SAT Captcha Solver - Instalacion Limpia
echo ========================================
echo.

echo 1. Abriendo Chrome Extensions...
start chrome://extensions/

echo.
echo 2. INSTRUCCIONES:
echo    a) Busca "SAT Captcha Solver" en la lista
echo    b) Haz clic en "Quitar" para desinstalar la version anterior
echo    c) Activa "Modo de desarrollador" (toggle superior derecha)
echo    d) Haz clic en "Cargar extension sin empaquetar"
echo    e) Selecciona esta carpeta: chrome-extension
echo.

echo 3. Archivos incluidos:
dir /b src\*.js
echo.

echo 4. Version: 2.0.0 (Simple - Sin ONNX)
echo.

pause
echo.
echo ¡Listo! Ahora ve a sat.gob.mx para probar
pause
