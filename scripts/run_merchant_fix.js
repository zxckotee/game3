/**
 * Скрипт для применения SQL-запросов по исправлению функций работы с инвентарем торговцев
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Загружаем переменные окружения из .env файла
dotenv.config();

// Создаем пул подключений к базе данных с настройками из .env
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'game_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

/**
 * Основная функция запуска скрипта
 */
async function main() {
  console.log('Запуск скрипта обновления функций работы с инвентарем торговцев...');
  
  try {
    // Путь к SQL-файлу с исправлениями
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'fix_merchant_functions.sql');
    
    // Проверяем существование файла
    if (!fs.existsSync(sqlFilePath)) {
      console.error('Ошибка: SQL-файл не найден:', sqlFilePath);
      process.exit(1);
    }
    
    // Читаем содержимое SQL-файла
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Получаем клиента из пула
    const client = await pool.connect();
    
    try {
      // Начинаем транзакцию
      await client.query('BEGIN');
      
      console.log('Выполнение SQL-запросов...');
      
      // Выполняем SQL-запросы
      await client.query(sqlScript);
      
      // Фиксируем транзакцию
      await client.query('COMMIT');
      
      console.log('SQL-запросы успешно выполнены.');
      
      // Проверяем, что функции созданы
      const res = await client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_type = 'FUNCTION' 
        AND routine_schema = 'public'
        AND routine_name IN ('update_merchant_item_quantity', 'get_merchant_items_for_user', 'update_merchant_relationship')
      `);
      
      if (res.rows.length > 0) {
        console.log('Созданные/обновленные функции:');
        res.rows.forEach(row => {
          console.log(`- ${row.routine_name}`);
        });
      } else {
        console.warn('Внимание: Функции не найдены после выполнения запросов.');
      }
    } catch (err) {
      // В случае ошибки откатываем транзакцию
      await client.query('ROLLBACK');
      throw err;
    } finally {
      // Возвращаем клиента в пул
      client.release();
    }
  } catch (err) {
    console.error('Ошибка при выполнении скрипта:', err);
    process.exit(1);
  } finally {
    // Закрываем пул соединений
    await pool.end();
  }
  
  console.log('Скрипт завершил работу успешно.');
}

// Запускаем основную функцию
main().catch(err => {
  console.error('Необработанная ошибка:', err);
  process.exit(1);
});