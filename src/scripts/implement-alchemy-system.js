/**
 * Скрипт для внедрения алхимической системы
 * Выполняет SQL-скрипт, который внедряет всю алхимическую систему целиком
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { config } = require('../sequelize-config');

// Создаем пул подключений к базе данных
const pool = new Pool({
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.username,
  password: config.password
});

console.log('Запуск внедрения алхимической системы...');

// Путь к SQL-файлу внедрения алхимической системы
const sqlFilePath = path.join(__dirname, '../../sql/implement_alchemy_system.sql');

// Проверяем существование файла
if (!fs.existsSync(sqlFilePath)) {
  console.error(`Ошибка: Файл ${sqlFilePath} не найден!`);
  process.exit(1);
}

// Читаем содержимое SQL-файла
const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

async function implementAlchemySystem() {
  const client = await pool.connect();
  
  try {
    console.log('Установлено подключение к базе данных');
    console.log('Начало выполнения SQL-скрипта...');
    
    // Начинаем транзакцию
    await client.query('BEGIN');
    
    try {
      // Выполняем SQL-скрипт
      await client.query(sqlScript);
      
      // Если все успешно, коммитим транзакцию
      await client.query('COMMIT');
      console.log('SQL-скрипт успешно выполнен!');
      console.log('Алхимическая система успешно внедрена!');
    } catch (error) {
      // В случае ошибки откатываем транзакцию
      await client.query('ROLLBACK');
      console.error('Ошибка при выполнении SQL-скрипта:');
      console.error(error);
      process.exit(1);
    }
  } finally {
    // Закрываем подключение к базе данных
    client.release();
    console.log('Подключение к базе данных закрыто');
  }
  
  // Закрываем пул подключений
  await pool.end();
}

// Выполняем функцию внедрения алхимической системы
implementAlchemySystem()
  .then(() => {
    console.log('Процесс внедрения алхимической системы завершен');
  })
  .catch(error => {
    console.error('Неожиданная ошибка:');
    console.error(error);
    process.exit(1);
  });