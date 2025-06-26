/**
 * Скрипт для проверки наличия и версий пакетов, 
 * необходимых для работы с PostgreSQL
 */

console.log('Проверка пакетов для PostgreSQL...\n');

// Проверка основных пакетов
const packagesToCheck = [
  'pg',
  'pg-hstore',
  'sequelize'
];

// Функция для проверки наличия пакета
function checkPackage(packageName) {
  console.log(`Проверка пакета ${packageName}...`);
  
  try {
    // Попытка получить версию пакета
    const packageModule = require(packageName);
    const version = packageModule.version || 
                    (packageModule.constructor && packageModule.constructor.version) || 
                    'неизвестная версия';
    
    console.log(`✅ Пакет ${packageName} установлен (версия: ${version})`);
    return { installed: true, version, package: packageModule };
  } catch (error) {
    console.error(`❌ Пакет ${packageName} НЕ установлен или не может быть загружен`);
    console.error(`   Ошибка: ${error.message}`);
    return { installed: false, error: error.message };
  }
}

// Проверка всех пакетов
const results = {};
packagesToCheck.forEach(packageName => {
  results[packageName] = checkPackage(packageName);
  console.log(''); // Пустая строка для разделения
});

// Проверка версии Node.js
console.log('Информация о системе:');
console.log(`Node.js: ${process.version}`);
console.log(`Операционная система: ${process.platform} (${process.arch})`);
console.log('');

// Проверка совместимости
console.log('Анализ совместимости:');

if (results.pg && results.pg.installed && results.sequelize && results.sequelize.installed) {
  console.log('✅ Основные пакеты установлены');
  
  // Вывод информации о совместимости версий pg и sequelize
  console.log(`   pg: ${results.pg.version}`);
  console.log(`   sequelize: ${results.sequelize.version}`);
  
  // Здесь можно добавить более сложную логику проверки совместимости версий
} else {
  console.log('❌ Не все необходимые пакеты установлены');
  
  // Рекомендации по установке недостающих пакетов
  const missingPackages = packagesToCheck.filter(pkg => !results[pkg] || !results[pkg].installed);
  if (missingPackages.length > 0) {
    console.log('\nНеобходимо установить следующие пакеты:');
    console.log(`npm install ${missingPackages.join(' ')}`);
  }
}

// Попытка проверить прямое подключение к PostgreSQL
console.log('\nПопытка проверки конфигурации подключения к PostgreSQL...');
try {
  const { Client } = require('pg');
  
  // Загружаем конфигурацию
  let dbConfig;
  try {
    dbConfig = require('../src/config/database.json');
    console.log('✅ Файл конфигурации базы данных найден');
    
    // Получаем конфигурацию для текущего окружения
    const env = process.env.NODE_ENV || 'development';
    const config = dbConfig[env];
    
    if (config) {
      console.log(`Конфигурация для окружения '${env}':`);
      console.log(`   Host: ${config.host}`);
      console.log(`   Port: ${config.port}`);
      console.log(`   Database: ${config.database}`);
      console.log(`   Username: ${config.username}`);
      console.log(`   Dialect: ${config.dialect}`);
    } else {
      console.log(`❌ Конфигурация для окружения '${env}' не найдена`);
    }
  } catch (configError) {
    console.error('❌ Ошибка при загрузке конфигурации:', configError.message);
  }
} catch (pgError) {
  console.error('❌ Ошибка при проверке подключения к PostgreSQL:', pgError.message);
}

console.log('\nПроверка завершена.');