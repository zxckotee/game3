@echo off
echo Запуск скрипта обновления функций работы с инвентарем торговцев...
node %~dp0run_merchant_fix.js
if %errorlevel% neq 0 (
  echo Ошибка при выполнении скрипта.
  pause
  exit /b %errorlevel%
)
echo Скрипт успешно выполнен.
pause