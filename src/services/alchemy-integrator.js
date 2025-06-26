/**
 * Интегратор алхимической системы с другими системами игры
 * Инициализирует алхимию и связывает её с боевой системой, инвентарем и т.д.
 */

const AlchemyService = require('./alchemy-service');
const InventoryService = require('./inventory-service');
const { alchemyItems, ITEM_TYPES, RARITY, getAlchemyItemById } = require('../data/alchemy-items');
const { getEnemyAlchemyDrops, ENEMY_TYPES, ELEMENTS } = require('../data/combat-alchemy-drops');
const { getResourceById } = require('../data/resources');
const { alchemyRecipes } = require('../data/alchemy-recipes');
const db = require('./database');

class AlchemyIntegrator {
  // Флаг инициализации
  static initialized = false;

  /**
   * Инициализирует алхимическую систему
   * Создает необходимые записи в БД, связывает с другими системами
   * @returns {Promise<boolean>} Результат инициализации
   */
  static async initialize() {
    if (this.initialized) {
      console.log('Алхимическая система уже инициализирована');
      return true;
    }
    
    const transaction = await db.transaction();
    
    try {
      // Получаем количество рецептов в базе данных
      const recipesCount = await db.models.AlchemyRecipe.count({ transaction });
      
      // Если рецептов нет, создаем их из centralized data source
      if (recipesCount === 0) {
        console.log('Создание базовых рецептов алхимии...');
        
        // Используем готовые данные из файла alchemy-recipes.js
        // Создаем рецепты для пилюль
        for (const recipe of alchemyRecipes.pills) {
          await AlchemyService.createRecipe(
            {
              name: recipe.name,
              description: recipe.description,
              type: recipe.type,
              rarity: recipe.rarity,
              requiredLevel: recipe.requiredLevel,
              requiredStage: recipe.requiredStage,
              successRate: recipe.successRate
            },
            recipe.ingredients,
            recipe.results
          );
        }
        
        // Создаем рецепты для талисманов
        for (const recipe of alchemyRecipes.talismans) {
          await AlchemyService.createRecipe(
            {
              name: recipe.name,
              description: recipe.description,
              type: recipe.type,
              rarity: recipe.rarity,
              requiredLevel: recipe.requiredLevel,
              requiredStage: recipe.requiredStage,
              successRate: recipe.successRate
            },
            recipe.ingredients,
            recipe.results
          );
        }
        
        // Создаем рецепты для оружия
        for (const recipe of alchemyRecipes.weapons) {
          await AlchemyService.createRecipe(
            {
              name: recipe.name,
              description: recipe.description,
              type: recipe.type,
              rarity: recipe.rarity,
              requiredLevel: recipe.requiredLevel,
              requiredStage: recipe.requiredStage,
              successRate: recipe.successRate
            },
            recipe.ingredients,
            recipe.results
          );
        }
        
        // Создаем рецепты для брони
        for (const recipe of alchemyRecipes.armor) {
          await AlchemyService.createRecipe(
            {
              name: recipe.name,
              description: recipe.description,
              type: recipe.type,
              rarity: recipe.rarity,
              requiredLevel: recipe.requiredLevel,
              requiredStage: recipe.requiredStage,
              successRate: recipe.successRate
            },
            recipe.ingredients,
            recipe.results
          );
        }
        
        // Создаем рецепты для аксессуаров
        for (const recipe of alchemyRecipes.accessories) {
          await AlchemyService.createRecipe(
            {
              name: recipe.name,
              description: recipe.description,
              type: recipe.type,
              rarity: recipe.rarity,
              requiredLevel: recipe.requiredLevel,
              requiredStage: recipe.requiredStage,
              successRate: recipe.successRate
            },
            recipe.ingredients,
            recipe.results
          );
        }
      }
      
      await transaction.commit();
      this.initialized = true;
      
      console.log('Алхимическая система успешно инициализирована!');
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error('Ошибка при инициализации алхимической системы:', error);
      return false;
    }
  }

  /**
   * Получает доступные рецепты для игрока на указанной ступени культивации
   * @param {string} stage Ступень культивации
   * @param {number} level Уровень культивации
   * @returns {Promise<Array>} Массив доступных рецептов
   */
  static async getAvailableRecipes(stage, level) {
    try {
      // Проверяем инициализацию системы
      if (!this.initialized) {
        await this.initialize();
      }
      
      return await AlchemyService.getAvailableRecipes(stage, level);
    } catch (error) {
      console.error(`Ошибка при получении доступных рецептов для ступени ${stage}, уровень ${level}:`, error);
      return [];
    }
  }

  /**
   * Получает выпадение алхимических ингредиентов с врага
   * @param {string} enemyType Тип врага
   * @param {number} enemyLevel Уровень врага
   * @param {boolean} isBoss Является ли враг боссом
   * @param {string} [element] Стихия врага
   * @returns {Array} Массив выпавших предметов
   */
  static getEnemyDropsWithAlchemy(enemyType, enemyLevel, isBoss = false, element = null) {
    return getEnemyAlchemyDrops(enemyType, enemyLevel, isBoss, element);
  }

  /**
   * Создает предмет по рецепту алхимии
   * @param {number} recipeId ID рецепта
   * @param {number} userId ID пользователя
   * @returns {Promise<Object>} Результат создания предмета
   */
  static async craftItem(recipeId, userId) {
    try {
      // Проверяем инициализацию системы
      if (!this.initialized) {
        await this.initialize();
      }
      
      return await AlchemyService.craftItem(recipeId, userId);
    } catch (error) {
      console.error('Ошибка при создании предмета по рецепту алхимии:', error);
      throw error;
    }
  }

  /**
   * Интегрирует алхимическую систему с боевой системой
   * Добавляет выпадение алхимических ингредиентов с врагов
   * @param {Object} combatSystem Боевая система
   */
  static integrateCombatSystem(combatSystem) {
    if (!combatSystem) {
      console.warn('Боевая система не передана для интеграции с алхимией');
      return;
    }
    
    // Добавляем функцию-обработчик получения добычи после боя
    combatSystem.on('combatEnd', (result) => {
      if (result.victory) {
        // Получаем данные о победе
        const { enemy, player } = result;
        
        // Получаем алхимические ингредиенты с врага
        const alchemyDrops = this.getEnemyDropsWithAlchemy(
          enemy.type,
          enemy.level,
          enemy.isBoss,
          enemy.element
        );
        
        // Если есть выпавшие предметы, добавляем их в инвентарь игрока
        if (alchemyDrops && alchemyDrops.length > 0) {
          // Добавляем предметы в инвентарь игрока
          alchemyDrops.forEach(drop => {
            InventoryService.addItem(player.id, drop.itemId, drop.quantity);
          });
          
          // Отправляем уведомление о добыче
          result.drops = result.drops || [];
          result.drops.push(...alchemyDrops);
        }
      }
    });
    
    console.log('Алхимическая система успешно интегрирована с боевой системой');
  }
}

module.exports = AlchemyIntegrator;
