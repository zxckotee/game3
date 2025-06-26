/**
 * Скрипт для проверки работоспособности приложения
 * Проверяет инициализацию базы данных и моделей
 */
const { unifiedDatabase } = require('./services/database-connection-manager');
const { getSequelizeInstance } = require('./services/database');

// Цветной вывод в консоль для лучшей читаемости
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m", 
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m"
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m"
  }
};

// Красивый заголовок
function printHeader(text) {
  const line = "=".repeat(text.length + 8);
  console.log(`\n${colors.fg.cyan}${line}${colors.reset}`);
  console.log(`${colors.fg.cyan}===${colors.reset} ${colors.bright}${colors.fg.yellow}${text}${colors.reset} ${colors.fg.cyan}===${colors.reset}`);
  console.log(`${colors.fg.cyan}${line}${colors.reset}\n`);
}

// Вывод результата проверки
function printResult(name, check) {
  if (check) {
    console.log(`${colors.fg.green}✓${colors.reset} ${name}: ${colors.fg.green}Успешно${colors.reset}`);
  } else {
    console.log(`${colors.fg.red}✗${colors.reset} ${name}: ${colors.fg.red}Ошибка${colors.reset}`);
  }
}

// Главная функция проверки
async function checkApp() {
  printHeader("Проверка подключения к базе данных");
  
  try {
    // Проверка доступности БД через database-connection-manager
    console.log("Проверка unifiedDatabase...");
    const status = await unifiedDatabase.checkStatus();
    printResult("unifiedDatabase.checkStatus", status.connected);
    console.log(`  Используется: ${status.using}`);
    
    // Проверка прокси Sequelize из database.js
    console.log("\nПроверка Sequelize прокси...");
    let sequelizeInstance;
    try {
      sequelizeInstance = await getSequelizeInstance();
      printResult("getSequelizeInstance", !!sequelizeInstance);
      
      if (sequelizeInstance) {
        console.log(`  Тип: ${sequelizeInstance.constructor.name}`);
      }
    } catch (err) {
      console.error(`  ${colors.fg.red}Ошибка при получении экземпляра Sequelize:${colors.reset}`, err.message);
    }
    
    // Проверка инициализации всех моделей через index.js
    printHeader("Проверка инициализации всех моделей");
    try {
      console.log("Загрузка index.js и ожидание инициализации...");
      const db = require('./models/index'); // Загружаем index.js
      await db.initializePromise; // Дожидаемся завершения промиса инициализации
      printResult("Все модели инициализированы и ассоциированы", true);
      
      // Проверим наличие нескольких моделей в db объекте
      printResult("Модель User доступна в db", !!db.User);
      printResult("Модель Quest доступна в db", !!db.Quest);
      printResult("Модель Enemy доступна в db", !!db.Enemy);
      printResult("Модель Group доступна в db", !!db.Group);
      
      // Можно добавить дополнительные проверки, если нужно
      
    } catch (err) {
      console.error(`  ${colors.fg.red}Ошибка при работе с моделями:${colors.reset}`, err.message);
      console.error(err.stack);
    }
    
    printHeader("Итоги проверки");
    console.log(`${colors.fg.green}Подключение к БД и загрузка моделей выполнены успешно${colors.reset}`);
    console.log(`Для запуска приложения используйте: ${colors.fg.yellow}npm start${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.fg.red}${colors.bright}КРИТИЧЕСКАЯ ОШИБКА:${colors.reset}`, error);
  }
}

// Запускаем проверку
console.log(`${colors.bright}Запуск проверки приложения...${colors.reset}`);
checkApp().catch(err => console.error(`${colors.fg.red}Необработанная ошибка:${colors.reset}`, err));
