/**
 * Скрипт для применения исправления ограничений типов в таблице инвентаря
 * Запуск: node scripts/run_fix_inventory_constraint.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dbConfigFile = require('../src/config/database.json');

async function runFixMigration() {
  console.log('Применение исправления для ограничений типов инвентаря...');
  
  // Получаем конфигурацию базы данных из файла database.json
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = dbConfigFile[env];
  
  // Создаем пул подключений
  const pool = new Pool({
    user: dbConfig.username,
    host: dbConfig.host,
    database: dbConfig.database,
    password: dbConfig.password,
    port: dbConfig.port || 5432
  });

  try {
    // Читаем SQL-файл миграции и разбиваем на отдельные запросы
    const sqlPath = path.join(__dirname, '..', 'sql', 'fix_inventory_type_constraint.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Удаляем комментарии и разбиваем на отдельные запросы по точке с запятой
    const sqlQueries = sqlContent
      .replace(/--.*$/gm, '') // Удаляем однострочные комментарии
      .split(';')
      .filter(query => query.trim() !== ''); // Удаляем пустые запросы
    
    // Выполняем каждый запрос отдельно
    console.log('Выполнение SQL-запросов для исправления ограничений...');
    for (const query of sqlQueries) {
      if (query.trim()) {
        try {
          await pool.query(query + ';');
          console.log('Успешно выполнен запрос:', query.substring(0, 50).trim() + '...');
        } catch (queryError) {
          console.error('Ошибка при выполнении запроса:', query.trim());
          console.error(queryError);
          throw queryError;
        }
      }
    }
    
    console.log('Исправление успешно применено!');
    
    // Проверка возможности вставки предмета с русским типом
    try {
      await pool.query(`
        INSERT INTO inventory_items 
          (user_id, item_id, name, description, item_type, rarity, stats, quantity, equipped, slot, created_at, updated_at)
        VALUES 
          (1, 'test_item', 'Тестовый предмет', 'Для проверки ограничений', 'артефакт', 'обычный', '{}', 1, false, NULL, NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `);
      console.log('Проверка пройдена: можно вставлять предметы с русским типом');

      // Удаляем тестовый предмет
      await pool.query(`DELETE FROM inventory_items WHERE item_id = 'test_item'`);
    } catch (testError) {
      console.error('Проверка не пройдена:', testError.message);
    }
    
  } catch (error) {
    console.error('Ошибка при применении исправления:', error);
    process.exit(1);
  } finally {
    // Закрываем пул подключений
    await pool.end();
  }
}

// Запускаем исправление
runFixMigration().catch(console.error);