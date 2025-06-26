@echo off
echo Запуск миграции для удаления ограничений ENUM в инвентаре...
node scripts/run_remove_enum_constraints.js
if %ERRORLEVEL% EQU 0 (
  echo Миграция успешно выполнена!
) else (
  echo Ошибка при выполнении миграции! Код ошибки: %ERRORLEVEL%
)
pause