/**
 * Скрипт для выполнения SQL-миграции стандартизации инвентаря на английском языке
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dbConfigFile = require('../src/config/database.json');

async function runEnglishInventoryMigration() {
  console.log('Запуск миграции для стандартизации инвентаря на английском языке...');
  
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
    const sqlPath = path.join(__dirname, '..', 'sql', 'english_only_inventory.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Выполняем миграцию как единый запрос, чтобы сохранить транзакционность
    console.log('Выполнение SQL-запросов для стандартизации инвентаря...');
    const result = await pool.query(sqlContent);
    
    console.log('Миграция успешно завершена!');
    
    // Для отладки: выводим сообщения из NOTICE
    if (result.length) {
      result.forEach((res, i) => {
        if (res.command === 'SELECT') {
          console.log(`Результат запроса #${i+1}:`, res.rows);
        } else {
          console.log(`Запрос #${i+1}: ${res.command}, затронуто строк: ${res.rowCount}`);
        }
      });
    }
    
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
runEnglishInventoryMigration()
  .then(() => {
    console.log('Скрипт успешно завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Скрипт завершился с ошибкой:', error);
    process.exit(1);
  });