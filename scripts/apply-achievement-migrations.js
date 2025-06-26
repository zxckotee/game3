/**
 * Скрипт для применения миграций достижений
 * Запускает все миграции и проверяет, что достижения и типы достижений загружаются правильно
 */

const path = require('path');
const Sequelize = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const connectionProvider = require('../src/services/database-connection-manager');
const achievementService = require('../src/services/achievement-service');

// Функция для применения миграций
async function applyMigrations() {
  console.log('Получение подключения к базе данных...');
  const { db } = await connectionProvider.getSequelizeInstance();
  
  console.log('Настройка Umzug для миграций...');
  const umzug = new Umzug({
    migrations: {
      // Загружаем все миграции из папки migrations
      glob: ['20250607-*.js', { cwd: path.join(__dirname, '../src/migrations') }],
      resolve: ({ name, path, context }) => {
        // Загружаем миграцию
        const migration = require(path);
        // Возвращаем объект с методами up и down
        return {
          name,
          up: async () => migration.up(context, Sequelize),
          down: async () => migration.down(context, Sequelize),
        };
      },
    },
    context: db.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: db }),
    logger: console,
  });
  
  // Запускаем миграции
  console.log('Применение миграций достижений...');
  const migrations = await umzug.up();
  console.log(`Применено ${migrations.length} миграций`);
  
  return migrations;
}

// Функция для проверки достижений после миграций
async function checkAchievements() {
  console.log('Проверка загрузки достижений...');
  
  try {
    // Получаем экземпляр Sequelize
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Проверяем таблицу achievement_types
    try {
      const achievementTypesCount = await db.query(
        'SELECT COUNT(*) as count FROM achievement_types',
        { type: db.QueryTypes.SELECT }
      );
      
      const typesCount = achievementTypesCount[0].count;
      console.log(`Загружено ${typesCount} типов достижений`);
      
      if (typesCount > 0) {
        const achievementTypes = await db.query(
          'SELECT * FROM achievement_types LIMIT 3',
          { type: db.QueryTypes.SELECT }
        );
        
        achievementTypes.forEach(type => {
          console.log(`- ${type.name}: ${type.category} (${type.icon})`);
        });
        
        if (typesCount > 3) {
          console.log(`... и еще ${typesCount - 3} типов достижений`);
        }
      } else {
        console.error('Ошибка: типы достижений не найдены в базе данных');
      }
    } catch (error) {
      console.error('Ошибка при проверке типов достижений:', error);
    }
    
    // Получаем все достижения
    const achievements = await achievementService.getAllAchievements();
    console.log(`Загружено ${achievements.length} достижений:`);
    
    if (achievements.length > 0) {
      // Выводим информацию о первых нескольких достижениях
      achievements.slice(0, 3).forEach(achievement => {
        console.log(`- ${achievement.id}: ${achievement.title} (${achievement.category})`);
      });
      
      if (achievements.length > 3) {
        console.log(`... и еще ${achievements.length - 3} достижений`);
      }
      
      console.log('Проверка успешна! Достижения загружены правильно.');
    } else {
      console.error('Ошибка: достижения не найдены в базе данных');
    }
  } catch (error) {
    console.error('Ошибка при проверке достижений:', error);
  }
}

// Функция для проверки таблиц в базе данных
async function checkTables() {
  console.log('Проверка таблиц в базе данных...');
  
  try {
    // Получаем экземпляр Sequelize
    const { db } = await connectionProvider.getSequelizeInstance();
    
    // Получаем список таблиц
    const tables = await db.getQueryInterface().showAllTables();
    
    console.log('Найдены следующие таблицы:');
    tables.forEach(table => {
      console.log(`- ${table}`);
    });
    
    // Проверяем наличие необходимых таблиц
    const requiredTables = ['achievement_types', 'achievements', 'achievement_progress'];
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('Все необходимые таблицы найдены в базе данных.');
      
      // Проверяем тип поля id в таблице users
      console.log('Проверка совместимости типов данных...');
      try {
        const userIdTypeResult = await db.query(
          "SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id'",
          { type: db.QueryTypes.SELECT }
        );

        if (userIdTypeResult.length > 0) {
          const userIdType = userIdTypeResult[0].data_type;
          console.log(`Тип поля id в таблице users: ${userIdType}`);
          
          // Проверяем тип поля user_id в таблице achievement_progress
          const achievementUserIdTypeResult = await db.query(
            "SELECT data_type FROM information_schema.columns WHERE table_name = 'achievement_progress' AND column_name = 'user_id'",
            { type: db.QueryTypes.SELECT }
          );
          
          if (achievementUserIdTypeResult.length > 0) {
            const achievementUserIdType = achievementUserIdTypeResult[0].data_type;
            console.log(`Тип поля user_id в таблице achievement_progress: ${achievementUserIdType}`);
            
            if (userIdType !== achievementUserIdType) {
              console.error(`Ошибка: Несовместимые типы данных - users.id (${userIdType}) и achievement_progress.user_id (${achievementUserIdType})`);
            } else {
              console.log('Типы данных совместимы.');
            }
          }
        }
      } catch (typeError) {
        console.error('Ошибка при проверке типов данных:', typeError);
      }
    } else {
      console.error('Отсутствуют следующие таблицы:', missingTables);
    }
  } catch (error) {
    console.error('Ошибка при проверке таблиц:', error);
  }
}

// Главная функция
async function main() {
  try {
    console.log('Запуск процесса миграции достижений...');
    
    // Применяем миграции
    await applyMigrations();
    
    // Проверяем таблицы в базе данных
    await checkTables();
    
    // Проверяем загрузку достижений
    await checkAchievements();
    
    console.log('Процесс миграции достижений завершен успешно!');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при выполнении миграций:', error);
    process.exit(1);
  }
}

// Запускаем скрипт
main();