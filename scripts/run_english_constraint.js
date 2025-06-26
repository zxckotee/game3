/**
 * Скрипт для установки ограничений инвентаря только на английском языке
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dbConfigFile = require('../src/config/database.json');

async function runEnglishConstraintMigration() {
  console.log('Запуск миграции для установки ограничений инвентаря на английском языке...');
  
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
    const sqlPath = path.join(__dirname, '..', 'sql', 'english_only_constraint.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Выполняем миграцию
    console.log('Установка ограничений только на английском языке...');
    await pool.query(sqlContent);
    
    console.log('Ограничения успешно обновлены!');
    return true;
  } catch (error) {
    console.error('Ошибка при установке ограничений:', error);
    throw error;
  } finally {
    // Закрываем соединение с базой данных
    await pool.end();
  }
}

// Запускаем миграцию
runEnglishConstraintMigration()
  .then(() => {
    console.log('Скрипт успешно завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Скрипт завершился с ошибкой:', error);
    process.exit(1);
  });