/**
 * Тестовый скрипт для проверки прямого подключения к PostgreSQL
 * Запуск: node test-pg-connection.js
 */

const { Client } = require('pg');

// Настройки подключения к PostgreSQL
// Используем те же настройки, что указаны в config/database.json
const config = {
  host: 'localhost',
  port: 5432,
  database: 'game',
  user: 'postgres',
  password: 'root',
  // Установим таймаут подключения
  connectionTimeoutMillis: 5000
};

console.log('Конфигурация соединения:');
console.log(JSON.stringify(config, null, 2));
console.log('Попытка подключения к PostgreSQL...');

// Создаем клиент PostgreSQL
const client = new Client(config);

// Обработчик ошибок для необработанных отклонений Promise
process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение Promise:', reason);
});

// Функция для завершения процесса после тестирования
function exit(code = 0) {
  setTimeout(() => {
    process.exit(code);
  }, 500); // Даем время на вывод логов
}

// Функция для детального вывода ошибки
function logDetailedError(error) {
  console.error('Детали ошибки:');
  console.error(`- Сообщение: ${error.message}`);
  console.error(`- Код: ${error.code || 'Нет кода'}`);
  console.error(`- Имя ошибки: ${error.name}`);
  
  if (error.stack) {
    console.error('- Стек вызовов:');
    console.error(error.stack);
  }
  
  // Если это ошибка PostgreSQL, выведем дополнительную информацию
  if (error.code) {
    console.error('\nРасшифровка кода ошибки PostgreSQL:');
    switch (error.code) {
      case 'ECONNREFUSED':
        console.error('Сервер PostgreSQL отклонил соединение. Возможно, он не запущен или используется неверный хост/порт.');
        break;
      case 'ETIMEDOUT':
        console.error('Превышено время ожидания соединения. Проверьте сетевые настройки и брандмауэр.');
        break;
      case 'ENOTFOUND':
        console.error('Хост не найден. Проверьте настройки DNS или имя хоста.');
        break;
      case '28P01':
        console.error('Неверное имя пользователя или пароль.');
        break;
      case '3D000':
        console.error('База данных не существует.');
        break;
      case '42P01':
        console.error('Таблица не существует.');
        break;
      default:
        console.error(`Описание для кода ${error.code} не найдено. Посмотрите документацию PostgreSQL.`);
    }
  }
  
  // Предложения по исправлению
  console.error('\nВозможные решения:');
  console.error('1. Проверьте, запущен ли сервер PostgreSQL');
  console.error('2. Проверьте настройки подключения (хост, порт, пользователь, пароль)');
  console.error('3. Проверьте, существует ли база данных');
  console.error('4. Проверьте настройки брандмауэра и сетевые подключения');
}

// Выполняем подключение и тестовый запрос
async function testConnection() {
  try {
    console.log('Подключение к серверу...');
    await client.connect();
    console.log('Соединение успешно установлено!');
    
    console.log('Выполнение тестового запроса...');
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name, version() as pg_version');
    
    console.log('\nРезультат тестового запроса:');
    console.log(`- Текущее время на сервере: ${result.rows[0].current_time}`);
    console.log(`- Имя текущей базы данных: ${result.rows[0].db_name}`);
    console.log(`- Версия PostgreSQL: ${result.rows[0].pg_version.split(',')[0]}`);
    
    console.log('\nПопытка выполнить более сложный запрос...');
    try {
      // Проверим, есть ли таблица users в базе данных
      const tablesResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        ) as table_exists
      `);
      
      if (tablesResult.rows[0].table_exists) {
        console.log('Таблица "users" существует в базе данных');
        
        // Попробуем получить количество пользователей
        const usersCount = await client.query('SELECT COUNT(*) as count FROM users');
        console.log(`Количество записей в таблице users: ${usersCount.rows[0].count}`);
      } else {
        console.log('Таблица "users" не существует в базе данных');
      }
    } catch (queryError) {
      console.error('Ошибка при выполнении сложного запроса:', queryError.message);
    }
    
    // Закрываем соединение
    await client.end();
    console.log('\nСоединение закрыто.');
    console.log('\n✅ ТЕСТ УСПЕШНО ПРОЙДЕН: Подключение к PostgreSQL работает корректно!');
    
    // Завершаем процесс успешно
    exit(0);
  } catch (error) {
    console.error('\n❌ ТЕСТ НЕ ПРОЙДЕН: Ошибка подключения к PostgreSQL!');
    logDetailedError(error);
    
    // Пробуем закрыть соединение, если оно было открыто
    try {
      await client.end();
    } catch (e) {
      // Игнорируем ошибки при закрытии соединения
    }
    
    // Завершаем процесс с ошибкой
    exit(1);
  }
}

// Запускаем тестирование подключения
testConnection();

// Устанавливаем таймаут для всего скрипта
setTimeout(() => {
  console.error('\n⚠️ ВНИМАНИЕ: Превышено время выполнения скрипта!');
  console.error('Возможно, соединение "зависло" и не получает ответа от сервера.');
  console.error('Это может указывать на проблемы с сетью или конфигурацией PostgreSQL.');
  exit(1);
}, 10000); // 10 секунд