/**
 * Скрипт для выполнения миграции, которая удаляет ограничения ENUM
 * для полей item_type и rarity в таблице inventory_items
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dbConfigFile = require('../src/config/database.json');

async function runRemoveEnumConstraintsMigration() {
  console.log('Запуск миграции для удаления ограничений ENUM для инвентаря...');
  
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
    const sqlPath = path.join(__dirname, '..', 'sql', 'remove_item_type_enum_constraint.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Выполняем миграцию
    console.log('Удаление ограничений ENUM для полей item_type и rarity...');
    await pool.query(sqlContent);
    
    console.log('Миграция успешно завершена!');
    console.log('Теперь таблица inventory_items может содержать любые строковые значения в полях item_type и rarity');
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
runRemoveEnumConstraintsMigration()
  .then(() => {
    console.log('Скрипт успешно выполнен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Скрипт завершился с ошибкой:', error);
    process.exit(1);
  });