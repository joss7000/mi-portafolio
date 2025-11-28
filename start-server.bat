@echo off
echo Iniciando servidor local...
echo.
echo El portafolio estara disponible en: http://localhost:8000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
python -m http.server 8000
pause

