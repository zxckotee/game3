/**
 * Скрипт для обновления PvP системы и проверки корректности записи истории боёв
 * Добавляет поле total_damage в таблицу pvp_participants и проверяет корректность расчёта наград
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { sequelizeConfig } = require('../src/sequelize-config');
const modelRegistry = require('../src/models/registry');

// Инициализация подключения к базе данных
const pool = new Pool({
  user: sequelizeConfig.username,
  host: sequelizeConfig.host,
  database: sequelizeConfig.database,
  password: sequelizeConfig.password,
  port: sequelizeConfig.port || 5432
});

/**
 * Запускает SQL-скрипт для обновления структуры таблиц
 */
async function executeUpdateScript() {
  try {
    console.log('Запуск скрипта обновления PvP системы...');
    
    // Читаем SQL-скрипт
    const scriptPath = path.join(__dirname, '../sql/43_pvp_damage_tracking.sql');
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');
    
    // Выполняем скрипт
    await pool.query(sqlScript);
    
    console.log('SQL-скрипт успешно выполнен.');
    return true;
  } catch (error) {
    console.error('Ошибка при выполнении SQL-скрипта:', error);
    return false;
  }
}

/**
 * Проверяет корректность записи истории боёв и расчёта наград
 */
async function testPvPHistoryRecording() {
  try {
    console.log('Тестирование записи истории PvP боёв...');
    
    // Инициализируем реестр моделей
    await modelRegistry.initializeRegistry();
    
    // Получаем необходимые модели
    const PvPHistory = modelRegistry.getModel('PvPHistory');
    
    // Проверяем последние записи в истории боёв
    const recentHistory = await PvPHistory.findAll({
      limit: 5,
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Последние ${recentHistory.length} записей в истории боёв:`);
    
    recentHistory.forEach((record, index) => {
      console.log(`\nЗапись #${index + 1}:`);
      console.log(`- ID пользователя: ${record.user_id}`);
      console.log(`- ID комнаты: ${record.room_id}`);
      console.log(`- Результат: ${record.result}`);
      console.log(`- Изменение рейтинга: ${record.rating_change}`);
      console.log(`- Противники: ${record.opponent_ids ? record.opponent_ids.join(', ') : 'не указаны'}`);
      console.log(`- Союзники: ${record.team_ids ? record.team_ids.join(', ') : 'не указаны'}`);
      console.log(`- Длительность: ${record.duration || 'не указана'} сек.`);
      
      // Проверяем награды
      const rewards = record.rewards ? 
        (typeof record.rewards === 'string' ? JSON.parse(record.rewards) : record.rewards) 
        : {};
      
      console.log(`- Награды: ${Object.keys(rewards).length > 0 ? JSON.stringify(rewards, null, 2) : 'отсутствуют'}`);
    });
    
    console.log('\nТестирование записи истории PvP боёв завершено.');
    return true;
  } catch (error) {
    console.error('Ошибка при тестировании записи истории PvP боёв:', error);
    return false;
  } finally {
    // Закрываем соединение с базой данных
    await pool.end();
  }
}

/**
 * Главная функция для запуска обновления и тестирования
 */
async function main() {
  try {
    // Запускаем скрипт обновления
    const updateSuccess = await executeUpdateScript();
    
    if (updateSuccess) {
      // Тестируем запись истории боёв
      await testPvPHistoryRecording();
    }
    
    console.log('Скрипт обновления PvP системы завершен.');
  } catch (error) {
    console.error('Ошибка при выполнении скрипта:', error);
  }
}

// Запускаем главную функцию
main();