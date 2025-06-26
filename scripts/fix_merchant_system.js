/**
 * Скрипт для исправления системы торговцев и инвентаря:
 * 1. Изменение типа колонки item_id в таблице merchant_inventories
 * 2. Добавление триггера для инициализации репутации торговцев
 * 3. Исправление проблем с NaN в записях репутации
 * 4. Исправление таблицы inventory_items, добавление и заполнение поля item_id
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { config } = require('../src/sequelize-config');

// Получаем конфигурацию БД из настроек Sequelize
const pgConfig = {
  host: config.host,
  user: config.username,
  password: config.password,
  database: config.database,
  port: config.port || 5432
};

// Создаем соединение с базой данных
const pool = new Pool(pgConfig);

// Путь к SQL-файлам
const scriptPaths = [
  path.join(__dirname, '..', 'sql', 'update_merchant_inventory_item_id_type.sql'),
  path.join(__dirname, '..', 'sql', 'fix_merchant_reputation_system.sql'),
  path.join(__dirname, '..', 'sql', 'fix_inventory_items.sql')
];

/**
 * Выполнение SQL скрипта из файла
 * @param {string} filePath - Путь к SQL файлу
 */
async function executeScript(filePath) {
  try {
    console.log(`Выполняется скрипт: ${path.basename(filePath)}`);
    
    // Читаем содержимое файла
    const scriptContent = fs.readFileSync(filePath, 'utf8');
    
    // Разделяем скрипт на отдельные команды по ';'
    const commands = scriptContent
      .replace(/\\encoding UTF8/g, '') // Убираем директивы \encoding
      .replace(/\\echo.+/g, '') // Убираем директивы \echo
      .replace(/\\i.+/g, '') // Убираем директивы \i
      .split(';')
      .filter(cmd => cmd.trim().length > 0); // Фильтруем пустые команды
    
    // Выполняем каждую команду отдельно
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i].trim();
        if (cmd.length > 0) {
          try {
            await client.query(cmd);
            process.stdout.write('.');
          } catch (err) {
            console.error(`\nОшибка выполнения команды #${i + 1}:`);
            console.error(cmd.substring(0, 150) + '...');
            console.error(err.message);
            // Продолжаем выполнение, не прерывая весь скрипт
          }
        }
      }
      
      await client.query('COMMIT');
      console.log(`\nУспешно выполнен скрипт: ${path.basename(filePath)}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`\nОшибка выполнения скрипта ${path.basename(filePath)}:`, err.message);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Ошибка при чтении/выполнении файла ${filePath}:`, err.message);
    throw err;
  }
}

/**
 * Основная функция для выполнения всех скриптов
 */
async function fixMerchantSystem() {
  console.log('Начинаем исправление системы торговцев...');
  
  try {
    // Последовательно выполняем все скрипты
    for (const scriptPath of scriptPaths) {
      await executeScript(scriptPath);
    }
    
    console.log('\nИсправление системы торговцев успешно завершено!');
    console.log('Теперь система должна корректно обрабатывать строковые идентификаторы предметов');
    console.log('и автоматически создавать записи репутации для новых пользователей.');
  } catch (err) {
    console.error('\nПроизошла ошибка при исправлении системы торговцев:', err.message);
  } finally {
    // Закрываем соединение с базой данных
    await pool.end();
  }
}

// Запускаем основную функцию
fixMerchantSystem();