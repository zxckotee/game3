/**
 * Индексный файл маршрутов API
 * Регистрирует все маршруты API в приложении Express
 */

// Импортируем маршруты
const resourceRoutes = require('./resource-routes');
const techniqueRoutes = require('./technique-routes');
const enemyRoutes = require('./enemy-routes'); // Закомментировано, т.к. маршруты перенесены в server.js
const locationRoutes = require('./location-routes'); // Маршруты локаций
const merchantRoutes = require('./merchant-routes');
const achievementRoutes = require('./achievement-routes');
const alchemyRoutes = require('./alchemy-routes');
const pvpRoutes = require('./pvp-routes'); // Маршруты PvP
const combatRoutes = require('./combat-routes'); // Маршруты для боев с NPC
const inventoryRoutes = require('./inventory-routes');
const authRoutes = require('./auth-routes'); // Маршруты аутентификации
const sectRoutes = require('./sect-routes');
const spirit_petsRoutes = require('./spirit-pets-routes');

const userRoutes = require('./user_or_cultivation-routes');
const questRoutes = require('./quest-routes');
const statsRoutes = require('./stats-routes');
const profileRoutes = require('./profile-routes');
const effectsRoutes = require('./effects-routes');
const relationshipsRoutes = require('./relationships-routes');


/**
 * Функция для регистрации всех маршрутов API в приложении Express
 * @param {Express.Application} app - Экземпляр приложения Express 
 */
function registerRoutes(app) {
  // Регистрируем маршруты ресурсов
  app.use('/api/resources', resourceRoutes);

  // Регистрируем маршруты алхимии
  app.use(alchemyRoutes);

  // Регистрируем маршруты техник
  app.use(techniqueRoutes);
  
  // Маршруты врагов теперь регистрируются напрямую в server.js
  app.use(enemyRoutes);
  
  // Регистрируем маршруты локаций
  app.use(locationRoutes);
  
  // Регистрируем маршруты торговцев
  app.use(merchantRoutes);
  
  // Регистрируем маршруты достижений 
  app.use('/api/achievements', achievementRoutes);
  
  // Регистрируем маршруты PvP
  app.use('/api/pvp', pvpRoutes);
  
  // Регистрируем маршруты для боев
  app.use('/api/combat', combatRoutes);

  // Здесь можно добавлять другие маршруты, например:
  // app.use('/api/users', userRoutes);
  // app.use('/api/quests', questRoutes);
  // и т.д.
  
  // Регистрируем маршруты для инвентаря
  app.use(inventoryRoutes);
  
  // Регистрируем маршруты аутентификации
  app.use('/api/auth', authRoutes); 

  // Маршруты для духовных питомцев
  app.use(spirit_petsRoutes);

  // Регистрируем маршруты для сект
  app.use(sectRoutes); 

  // Регистрируем маршруты пользователей
  app.use(userRoutes);

  // Регистрируем маршруты квестов 
  app.use(questRoutes); 

  //Регистрируем маршруты характеристик персонажа
  app.use(statsRoutes);

  // Регистрируем маршруты для работы с профилем персонажа
  app.use(profileRoutes);

  // Регистрируем маршруты эффектов 
  app.use(effectsRoutes);

  // Регистрируем маршруты для отношений
  app.use('/api/relationships', relationshipsRoutes);
  

  console.log('Маршруты API успешно зарегистрированы');
}

module.exports = { registerRoutes };