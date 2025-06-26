#!/bin/bash

echo "Запуск миграции для использования только английского языка в инвентаре..."
node scripts/run_inventory_english.js

if [ $? -eq 0 ]; then
  echo "Миграция успешно выполнена!"
else
  echo "Ошибка при выполнении миграции! Код ошибки: $?"
fi

read -p "Нажмите Enter для выхода"