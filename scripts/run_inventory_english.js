/**
 * Скрипт для обновления ограничений инвентаря на использование только английского языка
 * Преобразует существующие данные и добавляет ограничения для английских значений
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dbConfigFile = require('../src/config/database.json');

async function runInventoryMigration() {
  console.log('Запуск миграции для использования только английского языка в инвентаре...');
  
  // Получаем конфигурацию базы данных из файла database.json
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = dbConfigFile[env];
  
  // Создаем пул соединений с базой данных
  const pool = new Pool({
    user: dbConfig.username,
    host: dbConfig.host,
    database: dbConfig.database,
    password: dbConfig.password,
    port: dbConfig.port
  });
  
  try {
    // Читаем SQL-файл миграции
    const sqlPath = path.join(__dirname, '..', 'sql', 'inventory_english_only.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Выполняем миграцию
    console.log('Обновление ограничений и данных...');
    await pool.query(sqlContent);
    
    console.log('Миграция успешно завершена!');
    console.log('Теперь типы предметов и значения редкости сохраняются на английском языке');
    return true;
  } catch (error) {
    console.error('Ошибка при выполнении миграции:', error);
    throw error;
  } finally {
    // Закрываем соединение с базой данных
    await pool.end();
  }
}

// Запускаем миграцию
runInventoryMigration()
  .then(() => {
    console.log('Скрипт успешно выполнен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Скрипт завершился с ошибкой:', error);
    process.exit(1);
  });