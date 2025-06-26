/**
 * Сервис для работы с достижениями
 * Обрабатывает запросы от API и взаимодействует с базой данных через ORM
 */

const { unifiedDatabase, initializeDatabaseConnection } = require('./database-connection-manager');
let sequelize; const { Sequelize } = require('sequelize');

// Импортируем прямые сервисы вместо API-клиентов
const characterProfileService = require('./character-profile-service');
const inventoryService = require('./inventory-service');
const cultivationService = require('./cultivation-service');
const techniqueService = require('./technique-service');
const questService = require('./quest-service');
const alchemyService = require('./alchemy-service');
const sectService = require('./sect-service');
const pvpService = require('./pvp-service');
const merchantService = require('./merchant-service');
const resourceService = require('./resource-service');
const spiritPetService = require('./spirit-pet-service');

// Кэш для хранения достижений (для оптимизации)
let achievementsCache = [];

async function getSequelizeInstance(){
  if (!sequelize) {
    const { db } = await unifiedDatabase.getSequelizeInstance();
    sequelize = db;
  }
  return sequelize; 
}

/**
 * Определяет тип предмета на основе его ID
 * @param {string} itemId - ID предмета
 * @returns {string} - Тип предмета
 */
function determineItemType(itemId) {
  if (!itemId) return 'misc';
  
  // Определяем тип предмета на основе его ID
  if (itemId.includes('crystal')) return 'ingredient';
  if (itemId.includes('essence')) return 'ingredient';
  if (itemId.includes('herb')) return 'resource';
  if (itemId.includes('blade') || itemId.includes('sword')) return 'weapon';
  if (itemId.includes('talisman')) return 'talisman';
  if (itemId.includes('elixir') || itemId.includes('pill')) return 'consumable';
  if (itemId.includes('manual') || itemId.includes('book')) return 'book';
  if (itemId.includes('food')) return 'pet_food';
  if (itemId.includes('dust') || itemId.includes('powder')) return 'ingredient';
  if (itemId.includes('armor') || itemId.includes('robe')) return 'armor';
  if (itemId.includes('accessory') || itemId.includes('ring') || itemId.includes('necklace')) return 'accessory';
  
  // Если не удалось определить, возвращаем misc
  return 'misc';
}

/**
 * Обрабатывает и выдает награду за достижение
 * @param {string} userId - ID пользователя
 * @param {string} achievementId - ID достижения
 * @param {Array} rewards - Массив наград
 * @returns {Promise<Object>} - Результат обработки наград
 */
async function processAchievementReward(userId, achievementId, rewards) {
  try {
    if (!userId) {
      console.error('processAchievementReward: userId не предоставлен');
      return { success: false, error: 'Не указан ID пользователя' };
    }
    
    if (!achievementId) {
      console.error('processAchievementReward: achievementId не предоставлен');
      return { success: false, error: 'Не указан ID достижения' };
    }
    
    if (!rewards || !Array.isArray(rewards) || rewards.length === 0) {
      console.warn(`processAchievementReward: пустой массив наград для достижения ${achievementId}`);
      return { success: true, results: [], warning: 'Нет наград для обработки' };
    }
    
    console.log(`Начало обработки наград для достижения ${achievementId} пользователя ${userId}. Количество наград: ${rewards.length}`);
    
    const results = [];
    const errors = [];
    
    // Обрабатываем каждую награду из массива
    for (const reward of rewards) {
      try {
        if (!reward.type) {
          console.warn(`Награда без указания типа для достижения ${achievementId}`);
          results.push({
            type: 'unknown',
            success: false,
            error: 'Тип награды не указан'
          });
          continue;
        }
        
        console.log(`Обработка награды типа ${reward.type} для достижения ${achievementId}`);
        
        switch (reward.type) {
          case 'currency':
            // Обработка валюты через character_profile_service_api
            const currencyType = reward.currency_type || 'gold';
            const currencyAmount = reward.amount || 0;
            
            if (currencyAmount <= 0) {
              console.warn(`Некорректная сумма валюты ${currencyAmount} для достижения ${achievementId}`);
              results.push({
                type: 'currency',
                currency_type: currencyType,
                amount: currencyAmount,
                success: false,
                error: 'Некорректная сумма валюты'
              });
              continue;
            }
            
            // Проверяем доступные типы валюты
            const validCurrencyTypes = ['gold', 'silver', 'copper', 'spirit_stones'];
            if (!validCurrencyTypes.includes(currencyType)) {
              console.warn(`Неизвестный тип валюты ${currencyType} для достижения ${achievementId}`);
              results.push({
                type: 'currency',
                currency_type: currencyType,
                success: false,
                error: 'Неизвестный тип валюты'
              });
              continue;
            }
            
            // Создаем объект для обновления валюты
            const currencyUpdate = {};
            currencyUpdate[currencyType] = currencyAmount;
            
            try {
              // Пытаемся обновить валюту с повторными попытками при необходимости
              let retryCount = 0;
              let currencyResult = null;
              
              while (retryCount < 3) {
                try {
                  currencyResult = await characterProfileService.updateCurrency(userId, currencyUpdate);
                  break; // Успешно обновили, выходим из цикла
                } catch (err) {
                  retryCount++;
                  if (retryCount >= 3) throw err; // Бросаем ошибку после 3 неудачных попыток
                  
                  console.warn(`Ошибка при обновлении валюты, попытка ${retryCount}/3:`, err);
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Ждем 1 секунду перед повторной попыткой
                }
              }
              
              results.push({
                type: 'currency',
                currency_type: currencyType,
                amount: currencyAmount,
                success: true
              });
              
              console.log(`Успешно выдано ${currencyAmount} ${currencyType} пользователю ${userId}`);
            } catch (currencyError) {
              console.error(`Ошибка при обновлении валюты для достижения ${achievementId}:`, currencyError);
              
              errors.push({
                type: 'currency',
                message: currencyError.message,
                details: `Не удалось обновить ${currencyType} на ${currencyAmount}`
              });   
              
              results.push({
                type: 'currency',
                currency_type: currencyType,
                amount: currencyAmount,
                success: false,
                error: currencyError.message
              });
            }
            break;
            
          case 'item':
            // Обработка предмета через inventory_api
            if (!reward.item_id) {
              console.warn(`Отсутствует item_id для награды предмета в достижении ${achievementId}`);
              results.push({
                type: 'item',
                success: false,
                error: 'Отсутствует идентификатор предмета'
              });
              continue;
            }
            
            // Формируем данные предмета с учетом различных типов предметов
            const itemData = {
              id: reward.item_id,
              name: reward.name || 'Предмет достижения',
              type: reward.item_type || determineItemType(reward.item_id),
              rarity: reward.rarity || 'uncommon',
              description: reward.description || `Награда за достижение ${achievementId}`,
              quantity: reward.quantity || 1
            };
            
            // Добавляем дополнительные атрибуты в зависимости от типа предмета
            if (reward.stats) itemData.stats = reward.stats;
            if (reward.effects) itemData.effects = reward.effects;
            if (reward.requirements) itemData.requirements = reward.requirements;
            if (reward.value) itemData.value = reward.value;
            
            try {
              // Пытаемся добавить предмет с повторными попытками при необходимости
              let retryCount = 0;
              let itemResult = null;
              
              while (retryCount < 3) {
                try {
                  itemResult = await inventoryService.addInventoryItem(userId, itemData);
                  break; // Успешно добавили, выходим из цикла
                } catch (err) {
                  retryCount++;
                  if (retryCount >= 3) throw err; // Бросаем ошибку после 3 неудачных попыток
                  
                  console.warn(`Ошибка при добавлении предмета, попытка ${retryCount}/3:`, err);
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Ждем 1 секунду перед повторной попыткой
                }
              }
              
              results.push({
                type: 'item',
                item_id: reward.item_id,
                name: reward.name,
                item_type: itemData.type,
                quantity: itemData.quantity,
                success: true
              });
              
              console.log(`Успешно добавлен предмет ${reward.item_id} (${reward.name}) пользователю ${userId}`);
            } catch (itemError) {
              console.error(`Ошибка при добавлении предмета для достижения ${achievementId}:`, itemError);
              
              errors.push({
                type: 'item',
                message: itemError.message,
                details: `Не удалось добавить предмет ${reward.item_id}`
              });
              
              results.push({
                type: 'item',
                item_id: reward.item_id,
                name: reward.name,
                success: false,
                error: itemError.message
              });
            }
            break;
            
          case 'experience':
            // Обработка опыта через cultivation_api
            const expAmount = reward.amount || 0;
            
            if (expAmount <= 0) {
              console.warn(`Некорректное количество опыта ${expAmount} для достижения ${achievementId}`);
              results.push({
                type: 'experience',
                amount: expAmount,
                success: false,
                error: 'Некорректное количество опыта'
              });
              continue;
            }
            
            try {
              // Пытаемся получить и обновить прогресс культивации
              let cultProgress = null;
              
              try {
                cultProgress = await cultivationService.getCultivationProgress(userId);
              } catch (cultError) {
                console.error(`Не удалось получить прогресс культивации для пользователя ${userId}:`, cultError);
                throw new Error('Не удалось получить прогресс культивации');
              }
              
              if (!cultProgress) {
                throw new Error('Данные о культивации пользователя не найдены');
              }
              
              // Обновляем опыт
              const currentExp = cultProgress.experience || 0;
              const updatedExp = currentExp + expAmount;
              
              const updatedCult = await cultivationService.updateCultivationProgress(userId, {
                experience: updatedExp
              });
              
              results.push({
                type: 'experience',
                amount: expAmount,
                new_total: updatedExp,
                success: true
              });
              
              console.log(`Успешно добавлено ${expAmount} опыта пользователю ${userId}`);
            } catch (expError) {
              console.error(`Ошибка при добавлении опыта для достижения ${achievementId}:`, expError);
              
              errors.push({
                type: 'experience',
                message: expError.message,
                details: `Не удалось добавить ${expAmount} опыта`
              });
              
              results.push({
                type: 'experience',
                amount: expAmount,
                success: false,
                error: expError.message
              });
            }
            break;
            
          default:
            console.warn(`Неизвестный тип награды ${reward.type} для достижения ${achievementId}`);
            results.push({
              type: reward.type,
              success: false,
              error: 'Неизвестный тип награды'
            });
        }
      } catch (rewardError) {
        console.error(`Неожиданная ошибка при обработке награды для достижения ${achievementId}:`, rewardError);
        
        errors.push({
          type: reward.type || 'unknown',
          message: rewardError.message,
          details: 'Неожиданная ошибка при обработке награды'
        });
        
        results.push({
          type: reward.type || 'unknown',
          success: false,
          error: rewardError.message
        });
      }
    }
    
    const anySuccess = results.some(r => r.success);
    const anyFailure = results.some(r => !r.success);
    
    console.log(`Завершена обработка наград для достижения ${achievementId}. Успехи: ${anySuccess}, Ошибки: ${anyFailure}`);
    
    // Если были ошибки, но хотя бы одна награда успешно выдана, возвращаем частичный успех
    if (anySuccess && anyFailure) {
      return {
        partial_success: true,
        results,
        errors,
        message: 'Некоторые награды были выданы успешно, но были и ошибки'
      };
    }
    
    // Если все награды успешно выданы
    if (anySuccess && !anyFailure) {
      return { success: true, results };
    }
    
    // Если все награды с ошибками
    return {
      success: false,
      results,
      errors,
      message: 'Не удалось выдать ни одной награды'
    };
  } catch (error) {
    console.error(`Критическая ошибка при обработке наград для достижения ${achievementId}:`, error);
    return {
      success: false,
      error: error.message,
      critical: true,
      message: 'Критическая ошибка при обработке наград'
    };
  }
}

/**
 * Проверяет достижения, связанные с культивацией
 * @param {Object} achievement - Объект достижения
 * @param {Object} cultivationData - Данные о культивации
 * @returns {number} - Текущий прогресс
 */
function checkCultivationAchievement(achievement, cultivationData) {
  if (!cultivationData) return 0;
  
  const title = achievement.title ? achievement.title.toLowerCase() : '';
  const description = achievement.description ? achievement.description.toLowerCase() : '';
  
  // Проверка уровня культивации
  if (title.includes('уровень') || title.includes('шаги') || description.includes('уровня')) {
    return cultivationData.level || 0;
  }
  
  // Проверка времени медитации
  if (title.includes('медитация') || description.includes('медитация')) {
    return cultivationData.meditationTime || 0;
  }
  
  // Общая проверка для категории культивации
  if (achievement.category === 'культивация') {
    return cultivationData.level || 0;
  }
  
  return 0;
}

/**
 * Проверяет достижения, связанные с техниками
 * @param {Object} achievement - Объект достижения
 * @param {Array} techniquesData - Данные о техниках
 * @returns {number} - Текущий прогресс
 */
function checkTechniqueAchievement(achievement, techniquesData) {
  if (!techniquesData || !Array.isArray(techniquesData)) return 0;
  
  const title = achievement.title ? achievement.title.toLowerCase() : '';
  const description = achievement.description ? achievement.description.toLowerCase() : '';
  
  // Проверка на количество изученных техник
  if (title.includes('коллекционер') || description.includes('изучите')) {
    return techniquesData.length;
  }
  
  // Проверка на освоение стихийных техник
  if (title.includes('стихий') || description.includes('стихийных')) {
    const elementTypes = ['огонь', 'вода', 'земля', 'воздух', 'молния'];
    const uniqueElements = new Set();
    
    techniquesData.forEach(technique => {
      // Извлекаем элемент из разных возможных источников данных
      let element = technique.element?.toLowerCase() ||
                  technique.damage_type?.toLowerCase() ||
                  (technique.type === 'elemental' ? technique.subtype?.toLowerCase() : null);
      
      // Приводим английские названия к русским
      if (element === 'fire') element = 'огонь';
      if (element === 'water') element = 'вода';
      if (element === 'earth') element = 'земля';
      if (element === 'wind' || element === 'air') element = 'воздух';
      if (element === 'lightning') element = 'молния';
      
      if (element && elementTypes.includes(element)) {
        uniqueElements.add(element);
      }
    });
    
    return uniqueElements.size;
  }
  
  return 0;
}

/**
 * Проверяет достижения, связанные с боями
 * @param {Object} achievement - Объект достижения
 * @param {Object} pvpData - Данные о PvP статистике
 * @returns {number} - Текущий прогресс
 */
function checkCombatAchievement(achievement, pvpData) {
  if (!pvpData) return 0;
  
  const title = achievement.title ? achievement.title.toLowerCase() : '';
  const description = achievement.description ? achievement.description.toLowerCase() : '';
  
  // Проверка на количество побед
  if (title.includes('воин') || description.includes('победите')) {
    return pvpData.totalWins || 0;
  }
  
  // Проверка на рейтинг
  if (title.includes('боевых искусств') || description.includes('рейтинг')) {
    return pvpData.rating || 0;
  }
  
  // Для достижений, основанных на победах над определенным количеством противников
  if (description.includes('победить') || description.includes('побед')) {
    return pvpData.totalWins || 0;
  }
  
  return 0;
}

/**
 * Проверяет достижения, связанные с исследованием мира
 * @param {Object} achievement - Объект достижения
 * @param {Object} locationsData - Данные об открытых локациях
 * @param {Object} inventoryData - Данные инвентаря (для растений и ресурсов)
 * @returns {number} - Текущий прогресс
 */
function checkExplorationAchievement(achievement, locationsData, inventoryData) {
  if (!locationsData && !inventoryData) return 0;
  
  const title = achievement.title ? achievement.title.toLowerCase() : '';
  const description = achievement.description ? achievement.description.toLowerCase() : '';
  
  // Проверка на количество открытых локаций
  if (title.includes('исследователь') || description.includes('локаций')) {
    if (locationsData && Array.isArray(locationsData.locations)) {
      return locationsData.locations.length;
    }
    return 0;
  }
  
  // Проверка на покорение гор
  if (title.includes('гор') || description.includes('вершины')) {
    if (locationsData && Array.isArray(locationsData.mountains)) {
      return locationsData.mountains.filter(m => m.conquered).length;
    }
    return 0;
  }
  
  // Проверка на сбор растений
  if (title.includes('растений') || description.includes('растений')) {
    if (inventoryData && Array.isArray(inventoryData.items)) {
      const plantTypes = new Set();
      inventoryData.items.forEach(item => {
        if (item.type === 'resource' && item.subType === 'plant') {
          plantTypes.add(item.id);
        }
      });
      return plantTypes.size;
    }
    return 0;
  }
  
  return 0;
}

/**
 * Проверяет достижения, связанные с алхимией
 * @param {Object} achievement - Объект достижения
 * @param {Object} alchemyData - Данные о созданных алхимических предметах
 * @returns {number} - Текущий прогресс
 */
function checkAlchemyAchievement(achievement, alchemyData) {
  if (!alchemyData) return 0;
  
  const title = achievement.title ? achievement.title.toLowerCase() : '';
  const description = achievement.description ? achievement.description.toLowerCase() : '';
  
  // Проверка на количество созданных алхимических предметов
  if (title.includes('мастер алхимии') || description.includes('алхимических предметов')) {
    if (alchemyData.createdItems && Array.isArray(alchemyData.createdItems)) {
      return alchemyData.createdItems.length;
    }
    return 0;
  }
  
  // Проверка на создание первого зелья
  if (title.includes('алхимик-новичок') || description.includes('первое алхимическое')) {
    if (alchemyData.createdItems && Array.isArray(alchemyData.createdItems)) {
      const hasPotion = alchemyData.createdItems.some(item =>
        item.type === 'consumable' &&
        (item.subType === 'potion' || item.subType === 'elixir')
      );
      return hasPotion ? 1 : 0;
    }
    return 0;
  }
  
  return 0;
}

/**
 * Проверяет достижения, связанные с экономикой и предметами
 * @param {Object} achievement - Объект достижения
 * @param {Object} profileData - Данные профиля персонажа
 * @param {Object} inventoryData - Данные инвентаря
 * @param {Object} tradeData - Данные о торговле
 * @returns {number} - Текущий прогресс
 */
function checkEconomyAchievement(achievement, profileData, inventoryData, tradeData) {
  if (!profileData && !inventoryData && !tradeData) return 0;
  
  const title = achievement.title ? achievement.title.toLowerCase() : '';
  const description = achievement.description ? achievement.description.toLowerCase() : '';
  
  // Проверка на сбор ценных ресурсов
  if (title.includes('охотник за сокровищами') || description.includes('ценных ресурсов')) {
    if (inventoryData && Array.isArray(inventoryData.items)) {
      const valuableResources = inventoryData.items.filter(item =>
        item.type === 'resource' &&
        (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary')
      );
      return valuableResources.length;
    }
    return 0;
  }
  
  // Проверка на заработок золота от торговли
  if (title.includes('легендарный торговец') || description.includes('заработайте')) {
    if (tradeData && tradeData.totalEarned) {
      return tradeData.totalEarned;
    }
    return 0;
  }
  
  // Проверка на сбор легендарных предметов
  if (title.includes('собиратель редкостей') || description.includes('легендарных предметов')) {
    if (inventoryData && Array.isArray(inventoryData.items)) {
      const legendaryItems = inventoryData.items.filter(item => item.rarity === 'legendary');
      return legendaryItems.length;
    }
    return 0;
  }
  
  return 0;
}

/**
 * Проверяет достижения, связанные с социальными взаимодействиями
 * @param {Object} achievement - Объект достижения
 * @param {Object} profileData - Данные профиля персонажа
 * @param {Object} sectData - Данные о секте
 * @returns {number} - Текущий прогресс
 */
function checkSocialAchievement(achievement, profileData, sectData) {
  if (!profileData && !sectData) return 0;
  
  const title = achievement.title ? achievement.title.toLowerCase() : '';
  const description = achievement.description ? achievement.description.toLowerCase() : '';
  
  // Проверка на достижение уровня старейшины в секте
  if (title.includes('мудрец секты') || description.includes('старейшины')) {
    if (sectData && sectData.rank) {
      return sectData.rank === 'elder' ? 1 : 0;
    }
    return 0;
  }
  
  // Проверка на количество отношений
  if (description.includes('отношения') || description.includes('связей')) {
    if (profileData && profileData.relationships && Array.isArray(profileData.relationships)) {
      return profileData.relationships.length;
    }
    return 0;
  }
  
  return 0;
}

/**
 * Проверяет достижения, связанные с квестами
 * @param {Object} achievement - Объект достижения
 * @param {Object} questsData - Данные о выполненных квестах
 * @returns {number} - Текущий прогресс
 */
function checkQuestAchievement(achievement, questsData) {
  if (!questsData) return 0;
  
  const title = achievement.title ? achievement.title.toLowerCase() : '';
  const description = achievement.description ? achievement.description.toLowerCase() : '';
  
  // Проверка на количество выполненных квестов
  if (description.includes('выполните') || description.includes('завершите')) {
    if (questsData.completed && Array.isArray(questsData.completed)) {
      return questsData.completed.length;
    }
    return 0;
  }
  
  // Проверка на количество выполненных квестов определенного типа
  if (description.includes('основных') || title.includes('основных')) {
    if (questsData.completed && Array.isArray(questsData.completed)) {
      return questsData.completed.filter(q => q.type === 'main').length;
    }
    return 0;
  }
  
  if (description.includes('побочных') || title.includes('побочных')) {
    if (questsData.completed && Array.isArray(questsData.completed)) {
      return questsData.completed.filter(q => q.type === 'side').length;
    }
    return 0;
  }
  
  return 0;
}

/**
 * Проверяет достижения, связанные с духовными питомцами
 * @param {Object} achievement - Объект достижения
 * @param {Object} petsData - Данные о духовных питомцах
 * @returns {number} - Текущий прогресс
 */
function checkPetAchievement(achievement, petsData) {
  if (!petsData) return 0;
  
  const title = achievement.title ? achievement.title.toLowerCase() : '';
  const description = achievement.description ? achievement.description.toLowerCase() : '';
  
  // Проверка на количество прирученных питомцев
  if (title.includes('победитель духовных питомцев') || description.includes('приручите')) {
    if (petsData.pets && Array.isArray(petsData.pets)) {
      return petsData.pets.length;
    }
    return 0;
  }
  
  // Проверка на уровень питомцев
  if (description.includes('уровень') && description.includes('питомцев')) {
    if (petsData.pets && Array.isArray(petsData.pets)) {
      // Например, достижение за питомца 10+ уровня
      const highLevelPets = petsData.pets.filter(pet => pet.level >= 10);
      return highLevelPets.length;
    }
    return 0;
  }
  
  return 0;
}

/**
 * Проверяет выполнение достижений для пользователя, используя данные напрямую из сервисов
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} Массив новых выполненных достижений
 */
exports.checkAchievementsFromServices = async function(userId) {
  try {
    console.log(`Запуск проверки достижений для пользователя ${userId} с использованием прямых сервисов`);
    
    // Получаем все достижения
    const achievements = await exports.getAllAchievements();
    if (!achievements || achievements.length === 0) {
      console.warn('Не найдено ни одного достижения для проверки');
      return [];
    }
    
    // Получаем текущий прогресс пользователя без автоматических проверок
    const userAchievements = await exports.getUserAchievementsNoCheck(userId);
    
    // Создаем карту незавершенных достижений
    const pendingAchievements = {};
    userAchievements.forEach(ua => {
      if (!ua.isCompleted) {
        pendingAchievements[ua.id] = ua;
      }
    });
    
    // Группируем достижения по категориям для эффективной проверки
    const achievementsByCategory = {};
    achievements.forEach(achievement => {
      if (!pendingAchievements[achievement.id]) return; // Пропускаем уже выполненные
      
      const category = achievement.category || 'misc';
      if (!achievementsByCategory[category]) {
        achievementsByCategory[category] = [];
      }
      achievementsByCategory[category].push(achievement);
    });
    
    // Массив для всех обновленных достижений
    const allUpdated = [];
    
    // Массив для новых выполненных достижений
    const newlyCompleted = [];
    
    // Проверяем достижения по категориям
    // Культивация
    if (achievementsByCategory['культивация'] && achievementsByCategory['культивация'].length > 0) {
      try {
        // Получаем данные о культивации
        const cultivationData = await cultivationService.getUserCultivation(userId);
        if (cultivationData) {
          for (const achievement of achievementsByCategory['культивация']) {
            // Преобразуем ID в строку для безопасных проверок
            const achievementIdStr = String(achievement.id);
            
            // Определяем прогресс на основе данных культивации
            let progress = 0;
            
            if (achievementIdStr.includes('level') || (achievement.description && achievement.description.includes('уровень культивации'))) {
              progress = cultivationData.level || 0;
            } else if (achievementIdStr.includes('realm') || (achievement.description && achievement.description.includes('царство'))) {
              progress = cultivationData.realm_level || 0;
            } else if (achievementIdStr.includes('meditation') || (achievement.description && achievement.description.includes('медитация'))) {
              progress = cultivationData.meditationTime || 0;
            } else {
              // Общий случай - используем уровень культивации
              progress = cultivationData.level || 0;
            }
            
            // Обновляем прогресс всегда, даже если он равен 0
            try {
              console.log(`Обновление прогресса достижения "${achievement.title}" для пользователя ${userId}: ${progress}/${achievement.requiredValue}`);
              const result = await exports.updateAchievementProgress(userId, achievement.id, progress);
              allUpdated.push({
                id: achievement.id,
                title: achievement.title,
                currentValue: progress,
                requiredValue: achievement.requiredValue,
                isCompleted: result.isCompleted
              });
              console.log(`Прогресс достижения "${achievement.title}" обновлен: ${progress}/${achievement.requiredValue}, выполнено: ${result.isCompleted}`);
            } catch (error) {
              console.error(`Ошибка при обновлении прогресса достижения ${achievement.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке достижений культивации:', error);
      }
    }
    
    // Техники (учитываем и русское, и английское название категории)
    if (achievementsByCategory['техники'] && achievementsByCategory['техники'].length > 0 ||
        achievementsByCategory['technique'] && achievementsByCategory['technique'].length > 0) {
      try {
        // Получаем данные о техниках (исправляем вызов на существующий метод)
        const techniques = await techniqueService.getLearnedTechniques(userId);
        if (techniques && Array.isArray(techniques)) {
          // Объединяем достижения из обеих категорий для обработки
          const techniqueAchievements = [
            ...(achievementsByCategory['техники'] || []),
            ...(achievementsByCategory['technique'] || [])
          ];
          
          console.log(`Найдено ${techniques.length} изученных техник для пользователя ${userId}`);
          console.log(`Обрабатываем ${techniqueAchievements.length} достижений, связанных с техниками`);
          
          for (const achievement of techniqueAchievements) {
            // Преобразуем ID в строку для безопасных проверок
            const achievementIdStr = String(achievement.id);
            
            // Определяем прогресс на основе данных о техниках
            let progress = 0;
            
            if (achievementIdStr.includes('count') || (achievement.description && achievement.description.includes('количество техник'))) {
              progress = techniques.length;
            } else if (achievementIdStr.includes('element') || (achievement.description && achievement.description.includes('стихи'))) {
              // Подсчет уникальных стихий
              const elementTypes = ['огонь', 'вода', 'земля', 'воздух', 'молния'];
              const uniqueElements = new Set();
              
              // Добавляем проверку на наличие техник
              if (techniques && techniques.length > 0) {
                techniques.forEach(technique => {
                  // Извлекаем элемент из разных возможных источников данных
                  let element = technique.element?.toLowerCase() || 
                               technique.damage_type?.toLowerCase() || 
                               (technique.type === 'elemental' ? technique.subtype?.toLowerCase() : null);
                  
                  // Приводим английские названия к русским
                  if (element === 'fire') element = 'огонь';
                  if (element === 'water') element = 'вода';
                  if (element === 'earth') element = 'земля';
                  if (element === 'wind' || element === 'air') element = 'воздух';
                  if (element === 'lightning') element = 'молния';
                  
                  // Добавляем элемент в множество уникальных элементов
                  if (element && elementTypes.includes(element)) {
                    uniqueElements.add(element);
                    console.log(`Обнаружен элемент "${element}" в технике ${technique.name || technique.id}`);
                  }
                });
              }
              
              progress = uniqueElements.size;
            } else if (achievementIdStr.includes('mastery') || (achievement.description && achievement.description.includes('мастерство'))) {
              progress = techniques.filter(t => t.mastery && t.mastery >= 7).length;
            } else {
              // Проверяем, является ли это достижением "Коллекционер техник"
              if ((achievement.title && achievement.title === 'Коллекционер техник') ||
                 (achievement.description && achievement.description.includes('Изучите 5 различных техник'))) {
                // Для "Коллекционер техник" - используем точное количество изученных техник
                progress = techniques.length;
                console.log(`Достижение "Коллекционер техник": текущий прогресс = ${progress}/5`);
              } else {
                // Общий случай - используем количество техник
                progress = techniques.length;
              }
            }
            
            // Обновляем прогресс всегда
            try {
              console.log(`Обновление прогресса достижения "${achievement.title}" для пользователя ${userId}: ${progress}/${achievement.requiredValue}`);
              const result = await exports.updateAchievementProgress(userId, achievement.id, progress);
              
              allUpdated.push({
                id: achievement.id,
                title: achievement.title,
                currentValue: progress,
                requiredValue: achievement.requiredValue,
                isCompleted: result.isCompleted
              });
              
              console.log(`Прогресс достижения "${achievement.title}" обновлен: ${progress}/${achievement.requiredValue}, выполнено: ${result.isCompleted}`);
            } catch (error) {
              console.error(`Ошибка при обновлении прогресса достижения ${achievement.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке достижений техник:', error);
      }
    }
    
    // Инвентарь
    if (achievementsByCategory['inventory'] && achievementsByCategory['inventory'].length > 0) {
      try {
        // Получаем данные об инвентаре
        const inventory = await inventoryService.getUserInventory(userId);
