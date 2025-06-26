/**
 * Консольные команды для тестирования алхимической системы
 */

const AlchemyIntegrator = require('../services/alchemy-integrator');
const AlchemyService = require('../services/alchemy-service');
const { getResourceById } = require('../data/resources');
const { getAlchemyItemById } = require('../data/alchemy-items');
const { ENEMY_TYPES, ELEMENTS } = require('../data/combat-alchemy-drops');

/**
 * Регистрирует команды консоли для работы с алхимической системой
 * @param {Object} consoleManager Менеджер консоли
 */
function registerAlchemyConsoleCommands(consoleManager) {
  /**
   * Инициализирует алхимическую систему
   */
  consoleManager.registerCommand(
    'initAlchemy',
    async () => {
      const result = await AlchemyIntegrator.initialize();
      return result ? 'Алхимическая система успешно инициализирована' : 'Ошибка при инициализации алхимической системы';
    },
    'Инициализирует систему алхимии, добавляя рецепты и ингредиенты в игру'
  );

  /**
   * Получает список всех доступных рецептов
   */
  consoleManager.registerCommand(
    'getAllRecipes',
    async () => {
      const recipes = await AlchemyService.getAllRecipes();
      return recipes.length > 0 
        ? `Найдено ${recipes.length} рецептов: \n${recipes.map(r => `- ${r.name} (${r.type})`).join('\n')}`
        : 'Рецепты не найдены';
    },
    'Выводит список всех доступных рецептов алхимии'
  );

  /**
   * Получает рецепты определенного типа
   */
  consoleManager.registerCommand(
    'getRecipesByType',
    async (type) => {
      if (!type || !['pill', 'talisman', 'weapon', 'armor', 'accessory'].includes(type)) {
        return 'Пожалуйста, укажите правильный тип рецепта: pill, talisman, weapon, armor или accessory';
      }
      
      const recipes = await AlchemyService.getRecipesByType(type);
      return recipes.length > 0 
        ? `Найдено ${recipes.length} рецептов типа ${type}: \n${recipes.map(r => `- ${r.name}`).join('\n')}`
        : `Рецепты типа ${type} не найдены`;
    },
    'Выводит список рецептов указанного типа. Использование: getRecipesByType pill'
  );

  /**
   * Получает доступные рецепты для игрока на определенной ступени культивации
   */
  consoleManager.registerCommand(
    'getAvailableRecipes',
    async (stage, level) => {
      const validStages = ['Закалка тела', 'Очищение Ци', 'Золотое ядро', 'Формирование души'];
      
      if (!stage || !validStages.includes(stage)) {
        return `Пожалуйста, укажите правильную ступень культивации: ${validStages.join(', ')}`;
      }
      
      if (!level || isNaN(level) || level < 1) {
        return 'Пожалуйста, укажите корректный уровень культивации (целое число больше 0)';
      }
      
      const recipes = await AlchemyIntegrator.getAvailableRecipes(stage, parseInt(level));
      return recipes.length > 0 
        ? `Доступные рецепты для ступени ${stage}, уровень ${level}: \n${recipes.map(r => `- ${r.name} (${r.type})`).join('\n')}`
        : `Нет доступных рецептов для ступени ${stage}, уровень ${level}`;
    },
    'Выводит список рецептов, доступных на указанной ступени культивации. Использование: getAvailableRecipes "Закалка тела" 5'
  );

  /**
   * Симулирует выпадение ингредиентов с врага
   */
  consoleManager.registerCommand(
    'simulateEnemyDrop',
    (enemyType, enemyLevel, isBoss) => {
      const validEnemyTypes = Object.values(ENEMY_TYPES);
      
      if (!enemyType || !validEnemyTypes.includes(enemyType)) {
        return `Пожалуйста, укажите правильный тип врага: ${validEnemyTypes.join(', ')}`;
      }
      
      if (!enemyLevel || isNaN(enemyLevel) || enemyLevel < 1) {
        return 'Пожалуйста, укажите корректный уровень врага (целое число больше 0)';
      }
      
      const bossFlag = isBoss === 'true';
      const drops = AlchemyIntegrator.getEnemyDropsWithAlchemy(
        enemyType, 
        parseInt(enemyLevel), 
        bossFlag
      );
      
      return drops.length > 0 
        ? `Добыча с врага типа ${enemyType}, уровень ${enemyLevel}${bossFlag ? ' (босс)' : ''}: \n${
            drops.map(drop => {
              const resource = getResourceById(drop.itemId);
              return resource 
                ? `- ${resource.name} x${drop.quantity} (${resource.rarity})`
                : `- Неизвестный ресурс: ${drop.itemId} x${drop.quantity}`;
            }).join('\n')
          }`
        : `С врага типа ${enemyType}, уровень ${enemyLevel}${bossFlag ? ' (босс)' : ''} ничего не выпало`;
    },
    'Симулирует выпадение алхимических ингредиентов с врага. Использование: simulateEnemyDrop beast 10 false'
  );

  /**
   * Симулирует выпадение ингредиентов с элементального врага
   */
  consoleManager.registerCommand(
    'simulateElementalEnemyDrop',
    (element, enemyLevel, isBoss) => {
      const validElements = Object.values(ELEMENTS);
      
      if (!element || !validElements.includes(element)) {
        return `Пожалуйста, укажите правильный элемент: ${validElements.join(', ')}`;
      }
      
      if (!enemyLevel || isNaN(enemyLevel) || enemyLevel < 1) {
        return 'Пожалуйста, укажите корректный уровень врага (целое число больше 0)';
      }
      
      const bossFlag = isBoss === 'true';
      const drops = AlchemyIntegrator.getEnemyDropsWithAlchemy(
        ENEMY_TYPES.ELEMENTAL, 
        parseInt(enemyLevel), 
        bossFlag,
        element
      );
      
      return drops.length > 0 
        ? `Добыча с элементального врага (${element}), уровень ${enemyLevel}${bossFlag ? ' (босс)' : ''}: \n${
            drops.map(drop => {
              const resource = getResourceById(drop.itemId);
              return resource 
                ? `- ${resource.name} x${drop.quantity} (${resource.rarity})`
                : `- Неизвестный ресурс: ${drop.itemId} x${drop.quantity}`;
            }).join('\n')
          }`
        : `С элементального врага (${element}), уровень ${enemyLevel}${bossFlag ? ' (босс)' : ''} ничего не выпало`;
    },
    'Симулирует выпадение алхимических ингредиентов с элементального врага. Использование: simulateElementalEnemyDrop fire 10 false'
  );

  /**
   * Выводит информацию об алхимическом предмете по ID
   */
  consoleManager.registerCommand(
    'getAlchemyItem',
    (itemId) => {
      if (!itemId) {
        return 'Пожалуйста, укажите ID предмета';
      }
      
      const item = getAlchemyItemById(itemId);
      if (!item) {
        return `Алхимический предмет с ID ${itemId} не найден`;
      }
      
      const effectsStr = Object.entries(item.effects)
        .map(([key, value]) => {
          if (typeof value === 'object') {
            if (Array.isArray(value)) {
              return `${key}: ${value.map(v => v.name).join(', ')}`;
            } else {
              return `${key}: ${Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
            }
          } else {
            return `${key}: ${value}`;
          }
        })
        .join('\n  ');
      
      return `Предмет: ${item.name} (${item.id})
Тип: ${item.type}
Редкость: ${item.rarity}
Описание: ${item.description}
Эффекты:
  ${effectsStr}
Стоимость: ${item.value}`;
    },
    'Выводит информацию об алхимическом предмете по его ID. Использование: getAlchemyItem qi_gathering_pill'
  );

  /**
   * Выводит информацию о ресурсе по ID
   */
  consoleManager.registerCommand(
    'getResource',
    (resourceId) => {
      if (!resourceId) {
        return 'Пожалуйста, укажите ID ресурса';
      }
      
      const resource = getResourceById(resourceId);
      if (!resource) {
        return `Ресурс с ID ${resourceId} не найден`;
      }
      
      return `Ресурс: ${resource.name} (${resource.id})
Тип: ${resource.type}
Редкость: ${resource.rarity}
Описание: ${resource.description}
Стоимость: ${resource.value}
Складируемый: ${resource.stackable ? 'Да' : 'Нет'}
Макс. в стопке: ${resource.maxStack}`;
    },
    'Выводит информацию о ресурсе по его ID. Использование: getResource low_grade_herb'
  );
}

module.exports = registerAlchemyConsoleCommands;
