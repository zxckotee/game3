@echo off
echo Запуск миграции для использования только английского языка в инвентаре...
node scripts/run_inventory_english.js
if %ERRORLEVEL% EQU 0 (
  echo Миграция успешно выполнена!
) else (
  echo Ошибка при выполнении миграции! Код ошибки: %ERRORLEVEL%
)
pause