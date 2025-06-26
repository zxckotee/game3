@echo off
echo Установка ограничений инвентаря только на английском языке...
node scripts/run_english_constraint.js
if %ERRORLEVEL% EQU 0 (
  echo Ограничения успешно установлены!
) else (
  echo Ошибка при установке ограничений. Код ошибки: %ERRORLEVEL%
)
pause