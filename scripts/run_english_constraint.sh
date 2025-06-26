#!/bin/bash

echo "Установка ограничений инвентаря только на английском языке..."
node scripts/run_english_constraint.js

if [ $? -eq 0 ]; then
  echo "Ограничения успешно установлены!"
else
  echo "Ошибка при установке ограничений. Код ошибки: $?"
fi

read -p "Нажмите Enter для выхода"