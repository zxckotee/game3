/**
 * API сервер для обработки запросов от сервисов к базе данных
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const { unifiedDatabase, initializeDatabaseConnection } = require('./services/database-connection-manager');
const { Sequelize } = require('sequelize');
const { initializeModels } = require('./models/fix-model-associations');
const { preloadModels } = require('./models/preload-models');
const modelRegistry = require('./models/registry');
const EffectsService = require('./services/effects-service');
const InventoryService = require('./services/inventory-service');
const CultivationService = require('./services/cultivation-service');
const CharacterStatsService = require('./services/character-stats-service');
const TechniqueService = require('./services/technique-service');
//const SectService = require('./services/sect-service');
const AlchemyService = require('./services/alchemy-service');
const EffectLifecycleService = require('./services/effect-lifecycle-service');

// Обработка необработанных отклонений Promise
process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение Promise:', reason);
  // Если это критическая ошибка, можно завершить процесс
  if (reason && reason.message && (
    reason.message.includes('PostgreSQL') ||
    reason.message.includes('database') ||
    reason.message.includes('connection'))) {
    console.error('Критическая ошибка базы данных. Завершение процесса...'); 
    process.exit(1);
  }
});

// Функция для добавления таймаута к промису
function withTimeout(promise, timeoutMs, errorMessage) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage || 'Операция превысила время ожидания'));
    }, timeoutMs);
  });
  
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
}

const fs = require('fs');

// Импортируем маршруты API
const { registerRoutes } = require('./server/routes');

// Создаем приложение Express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ВАЖНО! Регистрируем специальный маршрут ДО того, как будут зарегистрированы остальные маршруты
console.log('Регистрация специального прямого маршрута для обновления инвентаря торговцев');

// Переменная для хранения экземпляра Sequelize
let sequelize;

// Асинхронная функция для получения экземпляра
async function getSequelizeInstance() {
  if (!sequelize) {
    const { db } = await initializeDatabaseConnection();
    sequelize = db;
  }
  return sequelize;
}

// Проверка состояния API
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});



// Импортируем утилиты для работы с ETag
const { calculateETag } = require('./utils/etag-utils');



// Получение всех изученных техник пользователя
/*app.get('/api/users/:userId/techniques', async (req, res) => {
  try {
    const userId = req.params.userId;
    const techniques = await TechniqueService.getLearnedTechniques(userId);
    res.json(techniques);
  } catch (error) {
    console.error('Ошибка при получении изученных техник:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' }); 
  }
});*/

// Импортируем middleware для аутентификации


// Регистрируем все маршруты API
// Раздача статических файлов из папки assets (для иконок и т.д.)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

registerRoutes(app);

// Обслуживание статических файлов из директории build для монолитного приложения
app.use(express.static(path.join(__dirname, '../build')));

// Маршрут для обслуживания SPA (Single Page Application)
// ВАЖНО: Разместить после всех API маршрутов, но перед обработкой ошибок
app.get('/*', (req, res, next) => {
  // Проверяем, начинается ли URL с /api
  if (req.url.startsWith('/api')) {
    // Если API-запрос, то переходим к следующему обработчику (который вернет 404)
    return next();
  }
  
  // Для всех остальных запросов возвращаем index.html
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Обработка ошибок 
app.use((err, req, res, next) => {
  console.error('Необработанная ошибка:', err);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: err.message
  });
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
const PORT = process.env.PORT || 3001;

// Функция для запуска сервера
async function startServer() {
  try {
    console.log('Запуск сервера, инициализация подключения к базе данных...');
    
    // Инициализируем подключение и получаем экземпляр Sequelize
    try {
      // Используем функцию напрямую из модуля с таймаутом
      const result = await withTimeout(
        unifiedDatabase.getSequelizeInstance(),
        20000, // Увеличиваем таймаут для инициализации до 20 секунд
        'Получение экземпляра Sequelize превысило время ожидания при запуске сервера'
      );
      
      sequelize = result.db;
      
      // Выполняем простой тестовый запрос для проверки работоспособности
      await withTimeout(
        sequelize.query('SELECT 1+1 AS result'),
        5000,
        'Тестовый запрос при запуске сервера превысил время ожидания'
      );
      
      console.log('Успешное подключение к PostgreSQL подтверждено');
      
      // Предварительно загружаем ключевые модели, чтобы избежать ошибок "модель не найдена"
      console.log('Предварительная загрузка ключевых моделей...');
      try {
        await preloadModels();
        console.log('Ключевые модели успешно предзагружены');
      } catch (preloadError) {
        console.error('ОШИБКА при предварительной загрузке моделей:', preloadError);
        console.error('Это может привести к проблемам с доступом к моделям');
      }
      
      // Инициализируем модели после подключения к БД
      console.log('Инициализация моделей...');
      try {
        await initializeModels();
        console.log('Все модели успешно инициализированы');
        
        // Инициализация централизованного реестра моделей
        console.log('Инициализация централизованного реестра моделей...');
        try {
          await modelRegistry.initializeRegistry();
          console.log('Централизованный реестр моделей успешно инициализирован');
        } catch (registryError) {
          console.error('ОШИБКА при инициализации централизованного реестра моделей:', registryError);
          console.error('Это может привести к проблемам с доступом к моделям через сервисы');
        }
      } catch (modelError) {
        console.error('ОШИБКА при инициализации моделей:', modelError);
        console.error('Продолжаем запуск сервера, но возможны проблемы с доступом к моделям');
      }
    } catch (dbError) {
      console.error('КРИТИЧЕСКАЯ ОШИБКА: Не удалось подключиться к базе данных:', dbError.message);
      console.error('Подробная информация об ошибке:', dbError);
      console.error('Сервер не может быть запущен без подключения к PostgreSQL');
      process.exit(1); // Завершаем процесс с ошибкой
    }
    
    // Запускаем периодическую очистку истекших эффектов
    console.log('Запуск периодической задачи для очистки истекших эффектов...');
    setInterval(() => {
      console.log('[EffectLifecycleService] Запуск плановой очистки истекших эффектов...');
      EffectLifecycleService.cleanupExpiredEffects();
    }, 600000); // Каждые 10 минут

    // Запускаем сервер только после успешного подключения к БД
    const server = app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`API сервер успешно запущен на порту ${PORT}`);
      console.log(`PostgreSQL успешно подключена, все системы функционируют нормально`);
      console.log(`=================================================`);
    });
    
    // Добавляем обработку ошибок для самого сервера
    server.on('error', (err) => {
      console.error('Ошибка HTTP сервера:', err);
      // В случае критической ошибки, завершаем процесс
      if (err.code === 'EADDRINUSE') {
        console.error(`Порт ${PORT} уже используется другим процессом!`);
        process.exit(1);
      }
    });
    
    // Добавляем обработку сигналов завершения
    process.on('SIGTERM', () => {
      console.log('Получен сигнал SIGTERM, закрытие сервера...');
      server.close(() => {
        console.log('Сервер закрыт.');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('Получен сигнал SIGINT, закрытие сервера...');
      server.close(() => {
        console.log('Сервер закрыт.');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА при запуске сервера:', error);
    console.error('Подробная информация об ошибке:', error);
    process.exit(1); // Завершаем процесс с ошибкой
  }
}

// Запускаем сервер если файл запущен напрямую (не импортирован)
if (require.main === module) {
  startServer();
}

module.exports = app;
