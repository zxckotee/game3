const { response } = require('express');
const InventoryItem = require('../models/inventory-item');
const ItemImage = require('../models/item-image');
const User = require('../models/user');
const { Sequelize } = require('sequelize');

// Проверяем, находимся ли мы в браузере
const isBrowser = typeof window !== 'undefined';

// Храним данные об инвентаре в памяти для браузера
let browserInventoryData = {};

/**
 * Проверяет и нормализует тип предмета из формата Redux в формат БД
 * Оба формата теперь используют одинаковые английские значения
 * @param {string} reduxType - Тип предмета в формате Redux (английский язык)
 * @returns {string} - Проверенный тип предмета (английский язык)
 */
const convertTypeToDbFormat = (reduxType) => {
  // Полностью отключаем проверку типов предметов
  // Возвращаем тип предмета без изменений и без подстановки 'misc'
  return reduxType || ''; // Просто возвращаем пустую строку если тип не определен
}; 

/**
 * Проверяет и нормализует тип предмета из формата БД в формат Redux
 * Оба формата теперь используют одинаковые английские значения
 * @param {string} dbType - Тип предмета в формате БД (английский язык)
 * @returns {string} - Проверенный тип предмета (английский язык)
 */
const convertTypeToReduxFormat = (dbType) => {
  // Полностью отключаем проверку типов предметов
  // Возвращаем тип предмета из БД без изменений и без подстановки 'misc'
  return dbType || ''; // Просто возвращаем пустую строку если тип не определен
};

/**
 * Получает данные предмета либо из непосредственных свойств, либо из stats
 * @param {Object} item - Объект предмета
 * @param {string} field - Имя поля
 * @param {*} defaultValue - Значение по умолчанию
 * @returns {*} - Значение поля
 */
const getItemField = (item, field, defaultValue) => {
  if (item[field] !== undefined) {
    return item[field];
  }
  
  if (item.stats && item.stats[field] !== undefined) {
    return item.stats[field];
  }
  
  return defaultValue;
};

/**
 * Сервис для работы с инвентарем
 */
const QuestService = require('./quest-service');

class InventoryService {

    /**
   * Получение подробной информации о предмете по его ID
   * @param {string} itemId - ID предмета
   * @param {string} ifNoneMatch - Заголовок If-None-Match для проверки ETag (опционально)
   * @returns {Promise<Object>} - Данные предмета и информация о кешировании
   */
  static async getItemDetails(itemId) {
    try {
      if (isBrowser) {
        // В браузере имитируем получение данных предмета
        //console.log(`Запрос информации о предмете с ID: ${itemId} в браузере`);
        return {
          success: false,
          message: 'Получение детальной информации предметов не поддерживается в браузере'
        };
      } else {
        //console.log(`[API] Запрос информации о предмете с ID: ${itemId}`);
        
        // Импортируем sequelize
        const { getSequelizeInstance } = require('../utils/connection-provider');
        const { calculateETag } = require('../utils/etag-utils');
        
        // Получаем объект с экземпляром sequelize
        const sequelizeResult = await getSequelizeInstance();
        
        // Извлекаем сам экземпляр из свойства db
        const sequelize = sequelizeResult.db;
        
        // Начинаем транзакцию для более быстрого и атомарного выполнения запросов
        const transaction = await sequelize.transaction();
        
        try {
          // Преобразуем itemId в строку для запросов
          const itemIdStr = String(itemId);
          
          // Проверяем существование предмета в едином справочнике item_catalog
          const itemCatalogCheck = await sequelize.query(
            `SELECT item_id, name, type, rarity, description, price, source_table
             FROM item_catalog
             WHERE item_id = :itemId
             LIMIT 1`,
            {
              replacements: { itemId: itemIdStr },
              type: Sequelize.QueryTypes.SELECT,
              transaction
            }
          );
          
          // Если предмет не найден в справочнике, возвращаем ошибку
          if (itemCatalogCheck.length === 0) {
            await transaction.rollback();
            //console.log(`[API] Предмет с ID ${itemId} не найден в справочнике предметов`);
            return {
              success: false,
              message: 'Предмет не найден'
            };
          }
          
          // Получаем основную информацию и источник данных из справочника
          const catalogItem = itemCatalogCheck[0];
          const sourceTable = catalogItem.source_table;
          //console.log(`[API] Предмет ${catalogItem.name} (ID: ${catalogItem.item_id}) найден в таблице ${sourceTable}`);
          
          // Инициализируем item данными из каталога
          let item = { ...catalogItem };
          let prelimETag = calculateETag({ item_id: itemId, name: catalogItem.name, type: catalogItem.type, rarity: catalogItem.rarity });
          
          // Инициализируем массивы для дополнительных данных
          let effects = [];
          let requirements = [];
          let specialEffects = [];
          
          // Определяем, является ли предмет алхимическим по его типу
          const itemType = catalogItem.type;
          const isAlchemyItem = itemType === 'pill' ||
                              itemType === 'elixir' ||
                              itemType === 'talisman' ||
                              itemType === 'consumable' ||
                              itemType === 'ingredient';
          
          //console.log(`[API] Тип предмета: ${itemType}, это алхимический предмет: ${isAlchemyItem}`);
          
          // Получаем дополнительные данные в зависимости от типа предмета
          if (sourceTable === 'equipment_items') {
            // Параллельное выполнение запросов для ускорения - ПРЕДМЕТЫ ЭКИПИРОВКИ
            [effects, requirements, specialEffects] = await Promise.all([
              // Получаем эффекты предмета
              sequelize.query(
                `SELECT id, type, target, value, operation, duration
                 FROM equipment_item_effects
                 WHERE item_id = :itemId`,
                {
                  replacements: { itemId: itemIdStr },
                  type: Sequelize.QueryTypes.SELECT,
                  transaction
                }
              ),
              
              // Получаем требования предмета
              sequelize.query(
                `SELECT id, type, value
                 FROM equipment_item_requirements
                 WHERE item_id = :itemId`,
                {
                  replacements: { itemId: itemIdStr },
                  type: Sequelize.QueryTypes.SELECT,
                  transaction
                }
              ),
              
              // Получаем специальные эффекты предмета
              sequelize.query(
                `SELECT id, effect_id, name, description
                 FROM equipment_item_special_effects
                 WHERE item_id = :itemId`,
                {
                  replacements: { itemId: itemIdStr },
                  type: Sequelize.QueryTypes.SELECT,
                  transaction
                }
              )
            ]);
          } else if (isAlchemyItem) {
            // Параллельное выполнение запросов для алхимических предметов
            [effects, requirements, specialEffects] = await Promise.all([
              // Получаем эффекты алхимического предмета
              sequelize.query(
                `SELECT id, effect_type AS type, description
                 FROM alchemy_item_effects
                 WHERE item_id = :itemId`,
                {
                  replacements: { itemId: itemIdStr },
                  type: Sequelize.QueryTypes.SELECT,
                  transaction
                }
              ),
              
              // Получаем свойства алхимического предмета (аналог требований)
              sequelize.query(
                `SELECT id, property_name AS type, property_value AS value
                 FROM alchemy_item_properties
                 WHERE item_id = :itemId`,
                {
                  replacements: { itemId: itemIdStr },
                  type: Sequelize.QueryTypes.SELECT,
                  transaction
                }
              ),
              
              // Получаем статистики алхимического предмета (аналог спец.эффектов)
              sequelize.query(
                `SELECT id, category, stat_name AS name, stat_value AS value,
                        CONCAT(category, ': ', stat_name) AS description
                 FROM alchemy_item_stats
                 WHERE item_id = :itemId`,
                {
                  replacements: { itemId: itemIdStr },
                  type: Sequelize.QueryTypes.SELECT,
                  transaction
                }
              )
            ]);
             
            //console.log(`[API] Найдено данных алхимии для ${catalogItem.name} (из ${sourceTable}): ${effects.length} эффектов, ${requirements.length} свойств, ${specialEffects.length} статистик`);
          }
          
          // Получаем данные об алхимических рецептах, связанных с предметом
          //console.log(`[API] Получение алхимических данных для предмета ${itemIdStr}...`);
          
          // 1. Получаем рецепты, в которых предмет используется как ингредиент
          const alchemyRecipesAsIngredient = await sequelize.query(
            `SELECT
              ar.id AS recipe_id,
              ar.name AS recipe_name,
              ar.description AS recipe_description,
              ar.type AS recipe_type,
              ar.rarity AS recipe_rarity,
              ar.required_level,
              ar.required_stage,
              ar.success_rate,
              ri.quantity AS ingredient_quantity
            FROM
              alchemy_recipes ar
            JOIN
              recipe_ingredients ri ON ar.id = ri.recipe_id
            WHERE
              ri.item_id = :itemId`,
            {
              replacements: { itemId: itemIdStr },
              type: Sequelize.QueryTypes.SELECT,
              transaction
            }
          );
          
          // 2. Получаем результаты для рецептов, где предмет - ингредиент
          let recipesWhereItemIsIngredient = [];
          if (alchemyRecipesAsIngredient && alchemyRecipesAsIngredient.length > 0) {
            //console.log(`[API] Найдено ${alchemyRecipesAsIngredient.length} рецептов, где предмет используется как ингредиент`);
            const recipeIds = alchemyRecipesAsIngredient.map(recipe => recipe.recipe_id);
            
            const alchemyResults = await sequelize.query(
              `SELECT
                ares.recipe_id,
                ares.item_id AS result_item_id,
                ic.name AS result_item_name,
                ic.description AS result_item_description,
                ic.rarity AS result_item_rarity,
                ares.quantity AS result_quantity,
                ares.chance AS result_chance
              FROM
                alchemy_results ares
              JOIN
                item_catalog ic ON ares.item_id = ic.item_id
              WHERE
                ares.recipe_id IN (:recipeIds)`,
              {
                replacements: { recipeIds },
                type: Sequelize.QueryTypes.SELECT,
                transaction
              }
            );
            
            // 3. Связываем результаты с рецептами
            recipesWhereItemIsIngredient = alchemyRecipesAsIngredient.map(recipe => {
              const results = alchemyResults.filter(result => result.recipe_id === recipe.recipe_id);
              return {
                ...recipe,
                results: results
              };
            });
          } else {
            //console.log(`[API] Предмет не используется в рецептах как ингредиент`);
          }
          
          // Получаем рецепты, в которых предмет является результатом
          const alchemyRecipesAsResult = await sequelize.query(
            `SELECT
              ar.id AS recipe_id,
              ar.name AS recipe_name,
              ar.description AS recipe_description,
              ar.type AS recipe_type,
              ar.rarity AS recipe_rarity,
              ar.required_level,
              ar.required_stage,
              ar.success_rate,
              ares.quantity AS result_quantity,
              ares.chance AS result_chance
            FROM
              alchemy_recipes ar
            JOIN
              alchemy_results ares ON ar.id = ares.recipe_id
            WHERE
              ares.item_id = :itemId`,
            {
              replacements: { itemId: itemIdStr },
              type: Sequelize.QueryTypes.SELECT,
              transaction
            }
          );
          
          // 2. Получаем ингредиенты для этих рецептов
          let recipesWhereItemIsResult = [];
          if (alchemyRecipesAsResult && alchemyRecipesAsResult.length > 0) {
            console.log(`[API] Найдено ${alchemyRecipesAsResult.length} рецептов, где предмет является результатом`);
            const recipeIds = alchemyRecipesAsResult.map(recipe => recipe.recipe_id);
            
            const recipeIngredients = await sequelize.query(
              `SELECT
                ri.recipe_id,
                ri.item_id AS ingredient_item_id,
                ic.name AS ingredient_item_name,
                ic.description AS ingredient_item_description,
                ic.rarity AS ingredient_item_rarity,
                ri.quantity AS ingredient_quantity
              FROM
                recipe_ingredients ri
              JOIN
                item_catalog ic ON ri.item_id = ic.item_id
              WHERE
                ri.recipe_id IN (:recipeIds)`,
              {
                replacements: { recipeIds },
                type: Sequelize.QueryTypes.SELECT,
                transaction
              }
            );
            
            // 3. Связываем ингредиенты с рецептами
            recipesWhereItemIsResult = alchemyRecipesAsResult.map(recipe => {
              const ingredients = recipeIngredients.filter(ingredient => ingredient.recipe_id === recipe.recipe_id);
              return {
                ...recipe,
                ingredients: ingredients
              };
            });
          } else {
            //console.log(`[API] Предмет не является результатом алхимических рецептов`);
          }
          
          // Завершаем транзакцию успешно
          await transaction.commit();
          
          //console.log(`[API] Найдено: ${effects.length} эффектов, ${requirements.length} требований, ${specialEffects.length} спец.эффектов`);
          
          // Формируем полный ответ на основе данных из каталога и дополнительных полей
          const fullItemData = { ...item };
          
          // Сохраняем исходный тип предмета, чтобы не потерять его при обогащении
          const originalItemType = itemType;
          
          // Добавляем дополнительные данные в зависимости от типа предмета
          if (sourceTable === 'equipment_items' || isAlchemyItem) {
            // Добавляем эффекты для обоих типов предметов в одинаковом формате
            if (effects && effects.length > 0) {
              fullItemData.effects = effects;
              //console.log(`[API] Добавлено ${effects.length} эффектов в ответ`);
            }
    
            // Для предметов экипировки используем поле requirements, для алхимии - properties
            if (requirements && requirements.length > 0) {
              if (sourceTable === 'equipment_items') {
                fullItemData.requirements = requirements;
                //console.log(`[API] Добавлено ${requirements.length} требований в ответ`);
              } else {
                fullItemData.properties = requirements;
                //console.log(`[API] Добавлено ${requirements.length} свойств в ответ`);
              }
            }
    
            // Для предметов экипировки используем поле specialEffects, для алхимии - stats
            if (specialEffects && specialEffects.length > 0) {
              if (sourceTable === 'equipment_items') {
                fullItemData.specialEffects = specialEffects;
                //console.log(`[API] Добавлено ${specialEffects.length} специальных эффектов в ответ`);
              } else {
                fullItemData.stats = specialEffects;
                //console.log(`[API] Добавлено ${specialEffects.length} статистик в ответ`);
              }
            }
          }
          
          // Удаляем служебное поле source_table из ответа
          delete fullItemData.source_table;
          
          // Для алхимических предметов устанавливаем тип "consumable" и добавляем дополнительную информацию
          if (isAlchemyItem) {
            // Устанавливаем тип "consumable" для всех алхимических предметов
            // для совместимости с клиентским кодом, но сохраняем исходный тип в оригинальной переменной
           // console.log(`[API] Изменение типа предмета с "${originalItemType}" на "consumable" для совместимости`);
            fullItemData.type = 'consumable';
            
            // Добавляем информацию о цене в золоте, если доступно
            if (fullItemData.value) {
              fullItemData.gold_value = fullItemData.value;
             // console.log(`[API] Добавлена стоимость алхимического предмета: ${fullItemData.gold_value} золота`);
            }
          } else {
            // Для неалхимических предметов сохраняем оригинальный тип
            fullItemData.type = originalItemType;
          }
          
          // Добавляем алхимические данные, если они есть
          if (recipesWhereItemIsIngredient.length > 0) {
            fullItemData.alchemyRecipesAsIngredient = recipesWhereItemIsIngredient;
            //console.log(`[API] Добавлено ${recipesWhereItemIsIngredient.length} рецептов, где предмет используется как ингредиент`);
          }
          
          if (recipesWhereItemIsResult.length > 0) {
            fullItemData.alchemyRecipesAsResult = recipesWhereItemIsResult;
            //console.log(`[API] Добавлено ${recipesWhereItemIsResult.length} рецептов, где предмет является результатом`);
          }
    
          // Удаляем поля с null/undefined значениями
          Object.keys(fullItemData).forEach(key => {
            if (fullItemData[key] === null || fullItemData[key] === undefined) {
              delete fullItemData[key];
             // console.log(`[API] Удалено поле ${key} с null/undefined значением`);
            }
          });
          
          // Вычисляем окончательный ETag для полных данных
          const etag = calculateETag(fullItemData);
          
          return {
            success: true,
            item: fullItemData,
            etag
          };
        } catch (innerError) {
          // В случае ошибки откатываем транзакцию
          await transaction.rollback();
          throw innerError;
        }
      }
    } catch (error) {
      console.error(`[API] Ошибка при получении информации о предмете ${itemId}:`, error);
      console.error(`[API] Стек ошибки:`, error.stack);
      return {
        success: false,
        message: 'Внутренняя ошибка сервера',
        error: error.message
      };
    }
  }
  

  /**
   * Получение всех предметов инвентаря пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Массив предметов инвентаря
   */
  static async getInventoryItems(userId) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        if (!browserInventoryData[userId]) {
          browserInventoryData[userId] = [];
        }
        
        // Возвращаем данные из памяти в формате Redux
        return browserInventoryData[userId].map(item => ({
          id: item.id,
          item_id: item.id, // Добавляем item_id для соответствия формату
          name: item.name,
          type: item.type,
          quality: item.rarity, // Используем quality вместо rarity
          description: item.description || (item.stats && item.stats.description) || '',
          quantity: item.quantity,
          equipped: item.equipped,
          ...item.stats // Используем stats вместо properties
        }));
      } else {
        // На сервере используем базу данных
        // Получаем все предметы инвентаря пользователя
        const items = await InventoryItem.findAll({
          where: { userId }
        });
        // Сразу "обогащаем" предметы
        const responsePromies = items.map(async (item) => {
          let item_image = await ItemImage.findByPk(item.itemId);

          if (item_image !== null){
            item.dataValues.image_url = item_image.image_url;
          }
          let secondary_itemData = await this.getItemDetails(item.itemId);
          // комбинируем поля для совместного возврата данных о предмете а также для формата Redux
          let item_data = Object.assign(item, secondary_itemData.item); 
          //if (item_image !== null) { console.log(item)};
          return item_data;
        });

        let responseData = await Promise.all(responsePromies);
        return responseData;
        /* --> пока что не нужно, получаем полные данные
        // Преобразуем данные для клиента в формат Redux
        return items.map(item => ({
          id: item.itemId, // Используем itemId в качестве id, как показано на скриншоте
          item_id: item.itemId, // Сохраняем также item_id для совместимости
          name: item.name,
          type: item.type, // используем type вместо item_type
          quality: item.rarity, // используем quality вместо rarity
          description: item.description || (item.stats && item.stats.description) || '',
          quantity: item.quantity,
          equipped: item.equipped,
          ...item.stats // Используем stats для дополнительных свойств
        }));*/
      }
    } catch (error) {
      console.error('Ошибка при получении предметов инвентаря:', error);
      throw error;
    }
  }
  
  /**
   * Добавление предмета в инвентарь
   * @param {number} userId - ID пользователя
   * @param {Object} item - Данные о предмете
   * @returns {Promise<Object>} - Добавленный предмет
   */
  static async addInventoryItem(userId, item) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        if (!browserInventoryData[userId]) {
          browserInventoryData[userId] = [];
        }
        
        // Проверяем, есть ли уже такой предмет в инвентаре
        const existingItemIndex = browserInventoryData[userId].findIndex(
          existingItem => existingItem.id === item.id
        );
        
        if (existingItemIndex >= 0 && item.stackable !== false) {
          // Если предмет уже есть и он складируемый, увеличиваем количество
          browserInventoryData[userId][existingItemIndex].quantity += item.quantity || 1;
          
          const existingItem = browserInventoryData[userId][existingItemIndex];
          
          return {
            id: existingItem.id,
            item_id: existingItem.id, // Добавляем item_id для соответствия формату
            name: existingItem.name,
            type: existingItem.type,
            quality: existingItem.rarity, // Используем quality вместо rarity
            quantity: existingItem.quantity,
            equipped: existingItem.equipped,
            ...existingItem.stats
          };
        } else {
          // Если предмета нет или он не складируемый, создаем новый
          const newItem = {
            userId,
            id: item.id, // Используем id вместо itemId
            name: item.name,
            type: item.type || '', // Не используем 'misc' по умолчанию, а пустую строку
            rarity: item.rarity || 'common',
            quantity: item.quantity || 1,
            equipped: item.equipped || false,
            stats: {  // Используем stats вместо properties
              description: item.description,
              effects: item.effects,
              requirements: item.requirements,
              value: item.value,
              ...item
            }
          };
          
          browserInventoryData[userId].push(newItem);
          
          return {
            id: newItem.id,
            item_id: newItem.id, // Добавляем item_id для соответствия формату
            name: newItem.name,
            type: newItem.type,
            quality: newItem.rarity, // Используем quality вместо rarity
            quantity: newItem.quantity,
            equipped: newItem.equipped,
            ...newItem.stats
          };
        }
      } else {
        // На сервере используем базу данных
        // Проверяем, есть ли уже такой предмет в инвентаре
        // Проверяем различные варианты идентификатора предмета
        const itemIdentifier = item.item_id || item.itemId || item.id;
        
        if (!itemIdentifier) {
          throw new Error(`Отсутствует идентификатор предмета: ${JSON.stringify(item)}`);
        }
        
        console.log(`Поиск предмета в инвентаре: userId=${userId}, itemIdentifier=${itemIdentifier}`, item);
        
        const existingItem = await InventoryItem.findOne({
          where: {
            userId,
            [Sequelize.Op.or]: [
              { item_id: itemIdentifier },
              { itemId: itemIdentifier }
            ]
          }
        });
        
        if (existingItem && item.stackable !== false) {
          // Если предмет уже есть и он складируемый, увеличиваем количество
          existingItem.quantity += item.quantity || 1;
          await existingItem.save();
          
          return {
            id: existingItem.itemId, // Используем itemId вместо id
            item_id: existingItem.itemId, // Добавляем item_id для соответствия формату
            name: existingItem.name,
            type: existingItem.type,
            quality: existingItem.rarity, // Используем quality вместо rarity
            quantity: existingItem.quantity,
            equipped: existingItem.equipped,
            ...existingItem.stats // Используем stats вместо properties
          };
        } else {
          // Извлекаем данные предмета из объекта item или из item.stats
          const itemName = getItemField(item, 'name', 'Неизвестный предмет');
          const itemType = getItemField(item, 'type', ''); // Не используем 'misc' по умолчанию, а пустую строку
          const itemDescription = getItemField(item, 'description', '');
          const itemRarity = getItemField(item, 'rarity', getItemField(item, 'quality', 'common'));
          const itemQuantity = getItemField(item, 'quantity', 1);
          const itemEquipped = getItemField(item, 'equipped', false);
          
          // Используем оригинальный тип предмета без проверки
          console.log('Создание нового предмета:', {
            name: itemName,
            type: itemType,
            description: itemDescription,
            rarity: itemRarity
          });
          
          // Если предмета нет или он не складируемый, создаем новый
          const itemIdentifier = item.item_id || item.itemId || item.id;
          
          if (!itemIdentifier) {
            throw new Error(`Отсутствует идентификатор предмета для создания: ${JSON.stringify(item)}`);
          }
          
          console.log(`Создание нового предмета в инвентаре: itemIdentifier=${itemIdentifier}`, item);
          
          const newItem = await InventoryItem.create({
            userId,
            itemId: itemIdentifier, // Используем определенный выше идентификатор
            item_id: itemIdentifier, // Добавляем item_id для совместимости
            name: itemName,
            description: itemDescription, // Добавляем description как основное поле
            type: itemType, // Используем оригинальный тип без проверки
            rarity: itemRarity,
            quantity: itemQuantity,
            equipped: itemEquipped,
            stats: {  // Сохраняем оригинальные данные для обратной совместимости
              name: itemName,
              description: itemDescription,
              type: itemType, // Храним оригинальный тип в Redux формате
              rarity: itemRarity,
              quality: itemRarity, // Для обратной совместимости
              effects: item.effects,
              requirements: item.requirements,
              value: item.value,
              ...item
            }
          });

          // Проверка квестов
          QuestService.checkQuestEvent(userId, 'GATHER_ITEM', { itemId: newItem.itemId, amount: itemQuantity });
          
          return {
            id: itemIdentifier, // Используем согласованный идентификатор
            item_id: itemIdentifier, // Явно добавляем item_id для соответствия формату
            itemId: itemIdentifier, // Добавляем itemId для обратной совместимости
            name: itemName, // Используем извлеченное имя
            type: itemType, // Возвращаем тип в формате Redux
            quality: itemRarity, // Используем quality вместо rarity
            rarity: itemRarity, // Добавляем rarity для совместимости
            description: itemDescription, // Добавляем описание
            quantity: newItem.quantity,
            equipped: newItem.equipped,
            slot: newItem.slot, // Добавляем slot в возвращаемые данные
            // Добавляем остальные поля из stats, не включая те, которые уже добавлены выше
            ...(newItem.stats ? Object.fromEntries(
              Object.entries(newItem.stats).filter(([key]) =>
                !['name', 'type', 'rarity', 'quality', 'description', 'quantity', 'equipped', 'slot'].includes(key)
              )
            ) : {})
          };
        }
      }
    } catch (error) {
      console.error('Ошибка при добавлении предмета в инвентарь:', error);
      throw error;
    }
  }
  
  /**
   * Удаление предмета из инвентаря
   * @param {number} userId - ID пользователя
   * @param {string} itemId - ID предмета
   * @param {number} quantity - Количество предметов для удаления (по умолчанию 1)
   * @returns {Promise<boolean>} - Результат удаления
   */
  static async removeInventoryItem(userId, itemId, quantity = 1) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        if (!browserInventoryData[userId]) {
          browserInventoryData[userId] = [];
        }
        
        // Получаем предмет из инвентаря
        const itemIndex = browserInventoryData[userId].findIndex(
          item => item.id === itemId
        );
        
        if (itemIndex === -1) {
          throw new Error('Предмет не найден в инвентаре');
        }
        
        const item = browserInventoryData[userId][itemIndex];
        
        if (item.quantity > quantity) {
          // Если предметов больше, чем нужно удалить, уменьшаем количество
          item.quantity -= quantity;
        } else {
          // Если предметов меньше или равно, удаляем полностью
          browserInventoryData[userId].splice(itemIndex, 1);
        }
        
        return true;
      } else {
        // На сервере используем базу данных
        // Получаем предмет из инвентаря
        const item = await InventoryItem.findOne({
          where: {
            userId,
            itemId: itemId // Используем itemId в соответствии с обновленной моделью
          }
        });
        
        if (!item) {
          throw new Error('Предмет не найден в инвентаре');
        }
        
        if (item.quantity > quantity) {
          // Если предметов больше, чем нужно удалить, уменьшаем количество
          item.quantity -= quantity;
          await item.save();
        } else {
          // Если предметов меньше или равно, удаляем полностью
          await item.destroy();
        }
        
        return true;
      }
    } catch (error) {
      console.error('Ошибка при удалении предмета из инвентаря:', error);
      throw error;
    }
  }
  
  /**
   * Экипировка/снятие предмета
   * @param {number} userId - ID пользователя
   * @param {string} itemId - ID предмета
   * @param {boolean} equipped - Флаг экипировки
   * @returns {Promise<Object>} - Обновленный предмет
   */
  static async toggleEquipItem(userId, itemId, equipped) {
    try {
      // Подключаем сервис экипировки для проверки требований
      let EquipmentService;
      try {
        EquipmentService = require('./equipment-service-adapter');
      } catch (error) {
        console.warn('Ошибка при импорте equipment-service-adapter:', error);
      }
      
      if (isBrowser) {
        // В браузере используем объект в памяти
        if (!browserInventoryData[userId]) {
          browserInventoryData[userId] = [];
        }
        
        // Получаем предмет из инвентаря
        const itemIndex = browserInventoryData[userId].findIndex(
          item => item.id === itemId
        );
        
        if (itemIndex === -1) {
          throw new Error('Предмет не найден в инвентаре');
        }
        
        const item = browserInventoryData[userId][itemIndex];
        
        // Проверяем требования при экипировке
        if (equipped && EquipmentService) {
          try {
            // Получаем данные пользователя из глобального объекта
            const userObj = {
              level: window.gameState?.player?.level || 1,
              stats: window.gameState?.player?.stats || {}
            };
            
            // Проверяем требования
            const checkResult = EquipmentService.checkItemRequirements(item, userObj);
            if (!checkResult.canEquip) {
              return {
                success: false,
                message: 'Не соответствует требованиям',
                failedRequirements: checkResult.failedRequirements
              };
            }
          } catch (error) {
            console.warn('Ошибка при проверке требований предмета:', error);
          }
        }
        
        // Обновляем статус экипировки
        browserInventoryData[userId][itemIndex].equipped = equipped;
        
        return {
          success: true,
          id: item.id,
          item_id: item.id, // Добавляем item_id для соответствия формату
          name: item.name,
          type: item.type,
          quality: item.rarity, // Используем quality вместо rarity
          quantity: item.quantity,
          equipped: equipped,
          ...item.stats // Используем stats вместо properties
        };
      } else {
        // На сервере используем базу данных
        // Получаем предмет из инвентаря
        const item = await InventoryItem.findOne({
          where: {
            userId,
            itemId: itemId // Используем itemId в соответствии с обновленной моделью
          }
        });
        
        if (!item) {
          throw new Error('Предмет не найден в инвентаре');
        }

        // Проверяем требования при экипировке
        if (equipped && EquipmentService) {
          try {
            // Получаем данные пользователя из базы
            const User = require('../models/user');
            const user = await User.findByPk(userId);
            if (!user) {
              throw new Error('Пользователь не найден');
            }
            
            const userObj = {
              level: user.level || 1,
              stats: user.stats || {}
            };
            
            // Проверяем требования
            const checkResult = EquipmentService.checkItemRequirements(item, userObj);
            if (!checkResult.canEquip) {
              return {
                success: false,
                message: 'Не соответствует требованиям',
                failedRequirements: checkResult.failedRequirements
              };
            }
          } catch (error) {
            console.warn('Ошибка при проверке требований предмета:', error);
          }
        }
        
        // Обновляем статус экипировки
        item.equipped = equipped;
        await item.save();
        
        return {
          success: true,
          id: item.itemId, // Используем itemId как id для клиентской части
          item_id: item.itemId, // Добавляем item_id для соответствия формату
          name: item.name,
          type: item.type, // Тип теперь совпадает с Redux форматом
          quality: item.rarity, // Используем quality вместо rarity
          description: item.description,
          quantity: item.quantity,
          equipped: item.equipped,
          slot: item.slot, // Добавляем slot в возвращаемые данные
          // Добавляем остальные поля из stats, не включая те, которые уже добавлены выше
          ...(item.stats ? Object.fromEntries(
            Object.entries(item.stats).filter(([key]) =>
              !['name', 'type', 'rarity', 'quality', 'description', 'quantity', 'equipped', 'slot'].includes(key)
            )
          ) : {})
        };
      }
    } catch (error) {
      console.error('Ошибка при экипировке/снятии предмета:', error);
      throw error;
    }
  }

  /**
   * Очистка всего инвентаря пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<boolean>} - Результат очистки
   */
  static async clearUserInventory(userId) {
    try {
      if (isBrowser) {
        // В браузере просто очищаем массив предметов
        browserInventoryData[userId] = [];
        return true;
      } else {
        // На сервере удаляем все предметы пользователя из базы данных
        await InventoryItem.destroy({
          where: {
            userId
          }
        });
        return true;
      }
    } catch (error) {
      console.error('Ошибка при очистке инвентаря пользователя:', error);
      return false;
    }
  }

  /**
   * Добавление нескольких предметов в инвентарь за один запрос
   * @param {number} userId - ID пользователя
   * @param {Array<Object>} items - Массив предметов для добавления
   * @returns {Promise<Array<Object>>} - Массив добавленных предметов
   */
  static async addBatchInventoryItems(userId, items) {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        return [];
      }

      if (isBrowser) {
        // В браузере обрабатываем каждый предмет отдельно
        const addedItems = [];
        for (const item of items) {
          const addedItem = await this.addInventoryItem(userId, item);
          addedItems.push(addedItem);
        }
        return addedItems;
      } else {
        // На сервере используем оптимизированный подход с Sequelize
        const formattedItems = items.map(item => ({
          userId,
          itemId: item.id,
          name: item.name || 'Предмет',
          type: item.type || '', // Не используем 'misc' по умолчанию, а пустую строку
          rarity: item.rarity || 'common',
          quantity: item.quantity || 1,
          equipped: item.equipped || false,
          slot: item.slot || null,
          stats: item.stats || {}
        }));

        // Используем bulkCreate для оптимизации
        const createdItems = await InventoryItem.bulkCreate(formattedItems);
        
        // Преобразуем созданные предметы в формат для клиента
        return createdItems.map(item => ({
          id: item.itemId,
          item_id: item.itemId, // Добавляем item_id для соответствия формату
          name: item.name,
          type: convertTypeToReduxFormat(item.type), // Преобразуем тип в формат Redux
          quality: item.rarity, // Используем quality вместо rarity
          description: item.description || (item.stats && item.stats.description) || '',
          quantity: item.quantity,
          equipped: item.equipped,
          slot: item.slot,
          // Добавляем остальные поля из stats, не включая те, которые уже добавлены выше
          ...(item.stats ? Object.fromEntries(
            Object.entries(item.stats).filter(([key]) =>
              !['name', 'type', 'rarity', 'quality', 'description', 'quantity', 'equipped', 'slot'].includes(key)
            )
          ) : {})
        }));
      }
    } catch (error) {
      console.error('Ошибка при массовом добавлении предметов в инвентарь:', error);
      return [];
    }
  }

  /**
   * Сохранение всего инвентаря пользователя
   * @param {number} userId - ID пользователя
   * @param {Array} items - Массив предметов инвентаря
   * @returns {Promise<Array>} - Обновленные предметы инвентаря
   */
  
  /**
   * Проверяет наличие предмета в инвентаре пользователя и его количество
   * @param {number} userId - ID пользователя
   * @param {string} itemId - ID предмета (строковый идентификатор, например "celestial_perception_ring")
   * @param {number} quantity - Требуемое количество
   * @returns {Promise<Object>} - Результат проверки
   */
  static async checkInventoryItem(userId, itemId, quantity = 1) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        if (!browserInventoryData[userId]) {
          browserInventoryData[userId] = [];
        }
        
        // Ищем предмет по любому из возможных идентификаторов
        const item = browserInventoryData[userId].find(item =>
          item.item_id === itemId ||
          item.itemId === itemId ||
          item.id === itemId
        );
        
        if (!item) {
          return { success: false, message: 'Предмет не найден в инвентаре' };
        }
        
        if (item.quantity < quantity) {
          return { success: false, message: 'Недостаточное количество предметов в инвентаре' };
        }
        
        return { success: true, item };
      } else {
        // На сервере используем базу данных
        // В базе данных может быть колонка item_id вместо itemId
        const item = await InventoryItem.findOne({
          where: {
            userId,
            [Sequelize.Op.or]: [
              { item_id: itemId },
              { itemId: itemId }
            ]
          }
        });
        
        if (!item) {
          return { success: false, message: 'Предмет не найден в инвентаре' };
        }
        
        if (item.quantity < quantity) {
          return { success: false, message: 'Недостаточное количество предметов в инвентаре' };
        }
        
        return { success: true, item };
      }
    } catch (error) {
      console.error('Ошибка при проверке предмета в инвентаре:', error);
      return { success: false, message: 'Произошла ошибка при проверке инвентаря' };
    }
  }


}


module.exports = InventoryService;
