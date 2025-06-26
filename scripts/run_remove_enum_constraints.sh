#!/bin/bash

echo "Запуск миграции для удаления ограничений ENUM в инвентаре..."
node scripts/run_remove_enum_constraints.js

if [ $? -eq 0 ]; then
  echo "Миграция успешно выполнена!"
else
  echo "Ошибка при выполнении миграции! Код ошибки: $?"
fi

read -p "Нажмите Enter для выхода"