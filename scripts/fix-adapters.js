#!/usr/bin/env node

/**
 * Скрипт для исправления всех адаптеров - убирает импорты серверных сервисов
 * Решает проблему crypto-browserify
 */

const fs = require('fs');
const path = require('path');

// Список оставшихся адаптеров для исправления
const adaptersToFix = [
  'group-activity-service-adapter.js',
  'group-service-adapter.js', 
  'market-service-adapter.js',
  'merchant-adapter.js',
  'reputation-service-adapter.js',
  'weather-service-adapter.js'
];

const servicesDir = path.join(__dirname, '..', 'src', 'services');

function fixAdapter(adapterName) {
  const filePath = path.join(servicesDir, adapterName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл ${adapterName} не найден`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Определяем имя API-сервиса на основе имени адаптера
  let apiServiceName;
  if (adapterName.includes('group-activity')) {
    apiServiceName = 'group-activity-service-api';
  } else if (adapterName.includes('group-service')) {
    apiServiceName = 'group-service-api';
  } else if (adapterName.includes('market-service')) {
    apiServiceName = 'market-service-api';
  } else if (adapterName.includes('merchant')) {
    apiServiceName = 'merchant-api';
  } else if (adapterName.includes('reputation')) {
    apiServiceName = 'reputation-service-api';
  } else if (adapterName.includes('weather')) {
    apiServiceName = 'weather-service-api';
  }

  const serviceName = apiServiceName.replace('-api', '').split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('') + 'API';

  // Создаем новое содержимое
  const newContent = `/**
 * Адаптер для работы с ${adapterName.replace('-adapter.js', '').replace(/-/g, ' ')}
 * Использует только API для обеспечения совместимости с браузером
 * Исправлено: убран импорт серверного сервиса для предотвращения ошибок crypto-browserify
 */

// Импортируем только API-версию для всех сред
const ${serviceName} = require('./${apiServiceName}');

// Всегда используем API-версию для предотвращения проблем с crypto-browserify
const Service = ${serviceName};

// Экспортируем сервис
module.exports = Service;
`;

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ Исправлен ${adapterName}`);
  return true;
}

console.log('🔧 Начинаем исправление адаптеров...\n');

let fixedCount = 0;
for (const adapter of adaptersToFix) {
  if (fixAdapter(adapter)) {
    fixedCount++;
  }
}

console.log(`\n🎉 Исправлено ${fixedCount} из ${adaptersToFix.length} адаптеров`);
console.log('✅ Все адаптеры теперь используют только API!');