/**
 * Сервис для работы с достижениями
 * Обрабатывает запросы от API и взаимодействует с базой данных через ORM
 *
 * АРХИТЕКТУРА ПРОВЕРКИ ДОСТИЖЕНИЙ:
 *
 * В этой системе реализован индивидуальный подход к проверке достижений,
 * где каждое достижение проверяется с помощью специализированной функции.
 *
 * 1. Основные компоненты:
 *    - achievement-checkers.js: содержит индивидуальные функции проверки для каждого достижения
 *    - checkAchievementsFromServices(): основной метод, который выполняет проверку достижений
 *
 * 2. Процесс проверки:
 *    - Каждое достижение имеет уникальный ID
 *    - Для каждого ID существует специализированная функция проверки в achievement-checkers.js
 *    - При проверке достижений система сначала пытается использовать индивидуальную
 *      функцию проверки, и только если такой функции нет - использует старый подход
 *      с проверкой по категории и названию/описанию
 *
 * 3. Преимущества подхода:
 *    - Независимость от текста названия/описания достижения
 *    - Возможность реализации сложной логики проверки для каждого достижения
 *    - Более явный и поддерживаемый код
 *    - Обратная совместимость со старым подходом
 */

const { unifiedDatabase, initializeDatabaseConnection } = require('./database-connection-manager');
let sequelize; const { Sequelize } = require('sequelize');

// Импортируем модуль с индивидуальными проверками достижений
const achievementCheckers = require('./achievement-checkers');

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
 * Получает все достижения из базы данных
 * @returns {Promise<Array>} Массив достижений
 */
exports.getAllAchievements = async function() {
  try {
    // Получаем экземпляр Sequelize 
    const  db  = await getSequelizeInstance();

    // Получаем модель Achievement напрямую через Sequelize
    const Achievement = db.model('Achievement');
    
    // Загружаем все достижения
    const achievements = await Achievement.findAll({
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });
    
    // Преобразуем в нужный формат для клиента
    const formattedAchievements = achievements.map(achievement => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      rewards: achievement.rewards,
      requiredValue: achievement.required_value,
      isHidden: achievement.is_hidden,
      displayOrder: achievement.display_order
    }));
    
    // Обновляем кэш
    achievementsCache = formattedAchievements;
    
    return formattedAchievements;
  } catch (error) {
    console.error('Ошибка при получении достижений:', error);
    // В случае ошибки возвращаем кэшированные данные
    return achievementsCache;
  }
};

/**
 * Получает достижение по ID
 * @param {string} id - ID достижения
 * @returns {Promise<Object|null>} Достижение или null, если не найдено
 */
exports.getAchievementById = async function(id) {
  try {
    // Проверяем кэш
    const cachedAchievement = achievementsCache.find(a => a.id === id);
    if (cachedAchievement) {
      return cachedAchievement;
    }
    
    // Получаем экземпляр Sequelize 
    const  db  = await getSequelizeInstance();
    
    // Получаем модель Achievement напрямую через Sequelize
    const Achievement = db.model('Achievement');
    
    // Загружаем достижение
    const achievement = await Achievement.findByPk(id);
    
    if (!achievement) {
      return null;
    }
    
    // Преобразуем в нужный формат для клиента
    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      rewards: achievement.rewards,
      requiredValue: achievement.required_value,
      isHidden: achievement.is_hidden,
      displayOrder: achievement.display_order
    };
  } catch (error) {
    console.error(`Ошибка при получении достижения с ID ${id}:`, error);
    // В случае ошибки проверяем кэш
    return achievementsCache.find(a => a.id === id) || null;
  }
};

/**
 * Получает достижения по категории
 * @param {string} category - Категория достижений
 * @returns {Promise<Array>} Массив достижений указанной категории
 */
exports.getAchievementsByCategory = async function(category) {
  try {
    // Проверяем кэш
    const cachedAchievements = achievementsCache.filter(a => a.category === category);
    if (cachedAchievements.length > 0) {
      return cachedAchievements;
    }
    
    // Получаем экземпляр Sequelize 
    const  db  = await getSequelizeInstance();
    
    // Получаем модель Achievement напрямую через Sequelize
    const Achievement = db.model('Achievement');
    
    // Загружаем достижения
    const achievements = await Achievement.findAll({
      where: { category },
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });
    
    // Преобразуем в нужный формат для клиента
    return achievements.map(achievement => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      rewards: achievement.rewards,
      requiredValue: achievement.required_value,
      isHidden: achievement.is_hidden,
      displayOrder: achievement.display_order
    }));
  } catch (error) {
    console.error(`Ошибка при получении достижений категории ${category}:`, error);
    // В случае ошибки фильтруем кэш
    return achievementsCache.filter(a => a.category === category);
  }
};

/**
 * Получает прогресс достижений для пользователя без проведения проверок
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} Массив прогресса достижений
 */
exports.getUserAchievementsNoCheck = async function(userId) {
  try {
    // Получаем экземпляр Sequelize
    const db = await getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Achievement = db.model('Achievement');
    const AchievementProgress = db.model('AchievementProgress');
    
    // Загружаем все достижения
    const allAchievements = await Achievement.findAll({
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });
    
    // Загружаем прогресс пользователя
    const userProgress = await AchievementProgress.findAll({
      where: { user_id: userId }
    });
    
    // Создаем словарь для быстрого доступа к прогрессу
    const progressMap = {};
    userProgress.forEach(progress => {
      progressMap[progress.achievement_id] = progress;
    });
    
    // Объединяем данные без проверки и автоматической выдачи наград
    return allAchievements.map(achievement => {
      const progress = progressMap[achievement.id];
      const isCompleted = progress ? progress.is_completed : false;
      
      // Не показываем скрытые невыполненные достижения
      if (achievement.is_hidden && !isCompleted) {
        return {
          id: achievement.id,
          title: '???',
          description: 'Скрытое достижение',
          icon: '🔒',
          category: achievement.category,
          isHidden: true,
          isCompleted: false,
          currentValue: 0,
          requiredValue: achievement.required_value,
          progress: 0,
          isRewarded: false,
          rewards: []
        };
      }
      
      // Получаем базовые значения прогресса
      let currentValue = progress ? progress.current_value : 0;
      const requiredValue = achievement.required_value;
      
      // Нормализуем значение для выполненных достижений
      // Если достижение выполнено, показываем не больше чем требуемое значение
      if (isCompleted && currentValue > requiredValue) {
        currentValue = requiredValue;
      }
      
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        rewards: achievement.rewards,
        isHidden: achievement.is_hidden,
        isCompleted: isCompleted,
        currentValue: currentValue,
        requiredValue: requiredValue,
        progress: requiredValue > 0 ? Math.min(100, Math.floor((currentValue / requiredValue) * 100)) : 0,
        isRewarded: progress ? progress.is_rewarded : false,
        completionDate: progress ? progress.completion_date : null
      };
    });
  } catch (error) {
    console.error(`Ошибка при получении прогресса достижений пользователя ${userId}:`, error);
    return [];
  }
};

/**
 * Получает прогресс достижений для пользователя и автоматически выдает награды за выполненные достижения
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} Массив прогресса достижений
 */
exports.getUserAchievements = async function(userId) {
  try {
    // Получаем экземпляр Sequelize
    const db = await getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Achievement = db.model('Achievement');
    const AchievementProgress = db.model('AchievementProgress');
    
    // Проверяем выполнение достижений на основе текущего состояния
    try {
      await exports.checkAchievementsFromServices(userId);
    } catch (checkError) {
      console.error(`Ошибка при проверке достижений для пользователя ${userId}:`, checkError);
      // Продолжаем выполнение даже при ошибке проверки
    }
    
    // Загружаем все достижения
    const allAchievements = await Achievement.findAll({
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });
    
    // Загружаем прогресс пользователя
    const userProgress = await AchievementProgress.findAll({
      where: { user_id: userId }
    });
    
    // Создаем словарь для быстрого доступа к прогрессу
    const progressMap = {};
    userProgress.forEach(progress => {
      progressMap[progress.achievement_id] = progress;
    });
    
    // Проверяем и выдаем награды за выполненные, но не награжденные достижения
    for (const achievement of allAchievements) {
      const progress = progressMap[achievement.id];
      
      // Проверяем, выполнено ли достижение, но не выдана ли награда
      if (progress && progress.is_completed && !progress.is_rewarded) {
        try {
          console.log(`Автоматическая выдача награды за достижение ${achievement.id} для пользователя ${userId}`);
          
          // Парсим награды из JSON строки
          const rewards = typeof achievement.rewards === 'string'
            ? JSON.parse(achievement.rewards)
            : achievement.rewards;
          
          // Обрабатываем награду
          const rewardResult = await processAchievementReward(userId, achievement.id, rewards);
          
          if (rewardResult.success || rewardResult.partial_success) {
            // Обновляем статус награды в базе данных
            await progress.update({ is_rewarded: true }, { transaction: null });
            console.log(`Успешно выдана награда за достижение ${achievement.id}`);
          } else {
            console.error(`Ошибка при выдаче награды за достижение ${achievement.id}:`, rewardResult.error || rewardResult.message);
          }
        } catch (rewardError) {
          console.error(`Ошибка при автоматической выдаче награды за достижение ${achievement.id}:`, rewardError);
          // Не прерываем основной процесс в случае ошибки с наградой
        }
      }
    }
    
    // Объединяем данные
    return allAchievements.map(achievement => {
      const progress = progressMap[achievement.id];
      const isCompleted = progress ? progress.is_completed : false;
      
      // Не показываем скрытые невыполненные достижения
      if (achievement.is_hidden && !isCompleted) {
        return {
          id: achievement.id,
          title: '???',
          description: 'Скрытое достижение',
          icon: '🔒',
          category: achievement.category,
          isHidden: true,
          isCompleted: false,
          currentValue: 0,
          requiredValue: achievement.required_value,
          progress: 0,
          isRewarded: false,
          rewards: []  // Добавляем пустой массив наград для предотвращения ошибки map()
        };
      }
      
      // Получаем базовые значения прогресса
      let currentValue = progress ? progress.current_value : 0;
      const requiredValue = achievement.required_value;
      
      // Нормализуем значение для выполненных достижений
      // Если достижение выполнено, показываем не больше чем требуемое значение
      if (isCompleted && currentValue > requiredValue) {
        currentValue = requiredValue;
      }
      
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        rewards: achievement.rewards,
        isHidden: achievement.is_hidden,
        isCompleted: isCompleted,
        currentValue: currentValue,
        requiredValue: requiredValue,
        progress: requiredValue > 0 ? Math.min(100, Math.floor((currentValue / requiredValue) * 100)) : 0,
        isRewarded: progress ? progress.is_rewarded : false,
        completionDate: progress ? progress.completion_date : null
      };
    });
  } catch (error) {
    console.error(`Ошибка при получении прогресса достижений пользователя ${userId}:`, error);
    return [];
  }
};

/**
 * Обновляет прогресс достижения для пользователя
 * @param {string} userId - ID пользователя
 * @param {string} achievementId - ID достижения
 * @param {number} value - Новое значение прогресса
 * @returns {Promise<Object>} Обновленный прогресс достижения
 */
exports.updateAchievementProgress = async function(userId, achievementId, value) {
  try {
    // Список достижений с особой логикой обновления прогресса
    const specialAchievements = {
      10: "Мудрец секты" // ID 10 теперь для "Мудрец секты" вместо ID 5
    };
    
    // Проверяем, требует ли достижение особой обработки
    if (specialAchievements[achievementId]) {
      console.log(`Пропускаем обновление прогресса для достижения "${specialAchievements[achievementId]}" (ID: ${achievementId}), оно обновляется напрямую`);
      
      // Получаем текущий прогресс, но не меняем его
      const db = await getSequelizeInstance();
      const AchievementProgress = db.model('AchievementProgress');
      const Achievement = db.model('Achievement');
      
      const achievement = await Achievement.findByPk(achievementId);
      const progress = await AchievementProgress.findOne({
        where: { user_id: userId, achievement_id: achievementId }
      });
      
      if (!progress) {
        return {
          id: 0,
          userId: userId,
          achievementId: achievementId,
          currentValue: 0,
          requiredValue: achievement ? achievement.required_value : 1,
          isCompleted: false,
          isRewarded: false,
          completionDate: null,
          progress: 0
        };
      }
      
      return {
        id: progress.id,
        userId: progress.user_id,
        achievementId: progress.achievement_id,
        currentValue: progress.current_value,
        requiredValue: achievement ? achievement.required_value : 1,
        isCompleted: progress.is_completed,
        isRewarded: progress.is_rewarded,
        completionDate: progress.completion_date,
        progress: achievement ? Math.min(100, Math.floor((progress.current_value / achievement.required_value) * 100)) : 0
      };
    }
    
    // Получаем экземпляр Sequelize
    const  db  = await getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Achievement = db.model('Achievement');
    const AchievementProgress = db.model('AchievementProgress');
    
    // Начинаем транзакцию
    const transaction = await db.transaction();
    
    try {
      // Получаем достижение
      const achievement = await Achievement.findByPk(achievementId, { transaction });
      if (!achievement) {
        await transaction.rollback();
        throw new Error(`Достижение с ID ${achievementId} не найдено`);
      }
      
      // Находим или создаем запись прогресса
      let [progress, created] = await AchievementProgress.findOrCreate({
        where: { user_id: userId, achievement_id: achievementId },
        defaults: {
          current_value: value,
          is_completed: value >= achievement.required_value,
          is_rewarded: false,
          completion_date: value >= achievement.required_value ? new Date() : null
        },
        transaction
      });
      
      // Если запись существует, обновляем ее
      if (!created) {
        const wasCompleted = progress.is_completed;
        const isNowCompleted = value >= achievement.required_value;
        
        await progress.update({
          current_value: value,
          is_completed: isNowCompleted,
          completion_date: !wasCompleted && isNowCompleted ? new Date() : progress.completion_date
        }, { transaction });
      }
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      // Возвращаем обновленный прогресс
      return {
        id: progress.id,
        userId: progress.user_id,
        achievementId: progress.achievement_id,
        currentValue: progress.current_value,
        requiredValue: achievement.required_value,
        isCompleted: progress.is_completed,
        isRewarded: progress.is_rewarded,
        completionDate: progress.completion_date,
        progress: Math.min(100, Math.floor((progress.current_value / achievement.required_value) * 100))
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error(`Ошибка при обновлении прогресса достижения ${achievementId} для пользователя ${userId}:`, error);
    throw error;
  }
};

/**
 * Выдает награду за достижение
 * @param {string} userId - ID пользователя
 * @param {string} achievementId - ID достижения
 * @returns {Promise<Object>} Информация о выданной награде
 */
exports.claimAchievementReward = async function(userId, achievementId) {
  try {
    // Получаем экземпляр Sequelize
    const db  = await getSequelizeInstance();
    
    // Получаем модели напрямую через Sequelize
    const Achievement = db.model('Achievement');
    const AchievementProgress = db.model('AchievementProgress');
    
    // Начинаем транзакцию
    const transaction = await db.transaction();
    
    try {
      // Получаем достижение
      const achievement = await Achievement.findByPk(achievementId, { transaction });
      if (!achievement) {
        await transaction.rollback();
        throw new Error(`Достижение с ID ${achievementId} не найдено`);
      }
      
      // Получаем прогресс пользователя
      const progress = await AchievementProgress.findOne({
        where: { user_id: userId, achievement_id: achievementId },
        transaction
      });
      
      // Проверяем, выполнено ли достижение и не выдана ли уже награда
      if (!progress || !progress.is_completed) {
        await transaction.rollback();
        throw new Error('Достижение не выполнено');
      }
      
      if (progress.is_rewarded) {
        await transaction.rollback();
        throw new Error('Награда уже получена');
      }
      
      // Парсим награды из JSON строки
      const rewards = typeof achievement.rewards === 'string'
        ? JSON.parse(achievement.rewards)
        : achievement.rewards;
        
      console.log(`Обработка наград для достижения ${achievementId} пользователя ${userId}`);
      
      // Обрабатываем награду - вызываем processAchievementReward для фактической выдачи наград
      const rewardResult = await processAchievementReward(userId, achievementId, rewards);
      
      if (!rewardResult.success && !rewardResult.partial_success) {
        await transaction.rollback();
        throw new Error('Ошибка при выдаче награды: ' + (rewardResult.message || 'Неизвестная ошибка'));
      }
      
      // Определяем, какие ресурсы были обновлены на основе результатов выдачи наград
      const updatedResources = {
        inventory: false,
        profile: false,
        cultivation: false
      };
      
      // Анализируем результаты выдачи наград для определения обновленных ресурсов
      if (rewardResult.results) {
        rewardResult.results.forEach(result => {
          if (result.type === 'currency' && result.success) {
            updatedResources.profile = true;
          } else if (result.type === 'item' && result.success) {
            updatedResources.inventory = true;
          } else if (result.type === 'experience' && result.success) {
            updatedResources.cultivation = true;
          }
        });
      }
      
      // Отмечаем, что награда выдана
      await progress.update({ is_rewarded: true }, { transaction });
      
      // Фиксируем транзакцию
      await transaction.commit();
      
      console.log(`Награда успешно выдана и зафиксирована для достижения ${achievementId}`);
      
      // Возвращаем информацию о награде и обновленных ресурсах
      return {
        userId,
        achievementId,
        rewards: achievement.rewards,
        isRewarded: true,
        updatedResources
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error(`Ошибка при выдаче награды за достижение ${achievementId} для пользователя ${userId}:`, error);
    throw error;
  }
};

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
    
    // Получаем список невыполненных достижений
    const achievementsToCheck = achievements.filter(achievement =>
      pendingAchievements[achievement.id]
    );
    
    console.log(`Найдено ${achievementsToCheck.length} невыполненных достижений для проверки`);
    
    // Массив для всех обновленных достижений
    const allUpdated = [];
    
    // Массив для новых выполненных достижений
    const newlyCompleted = [];
    
    // Проверяем каждое невыполненное достижение
    for (const achievement of achievementsToCheck) {
      try {
        let progress = 0;
        
        // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Всегда пытаемся использовать специализированную функцию из achievementCheckers
        // Проверяем разные варианты ID (строка или число)
        const achievementId = achievement.id;
        const checker = achievementCheckers[achievementId] || achievementCheckers[String(achievementId)] || achievementCheckers[Number(achievementId)];
        
        if (checker) {
          // Используем специализированную функцию
          console.log(`Используем специализированную функцию из achievementCheckers для достижения "${achievement.title}" (ID: ${achievementId})`);
          progress = await checker(userId);
          console.log(await achievementCheckers[7](userId));
          // Отладочный вывод для важных достижений
          if (achievement.id === 5) {
            console.log(`Прогресс достижения "Гранд-мастер культивации": ${progress}/10`);
          }
          
          if (achievement.id == 7 || String(achievement.id) == '7') {
            console.log(`DEBUG: Прогресс достижения "Победитель духовных питомцев" из специализированной функции: ${progress}/5`);
          }
        } else {
          // ВАЖНО: Выводим предупреждение, если для достижения нет специализированной функции
          console.warn(`ВНИМАНИЕ: Для достижения "${achievement.title}" (ID: ${achievementId}) не найдена специализированная функция проверки. Используем устаревшую проверку по категории.`);
          
          // Если специализированной функции нет, используем стандартную логику проверки по категории
          console.log(`Используем стандартную проверку по категории для достижения "${achievement.title}" (ID: ${achievement.id})`);
          
          // Определяем категорию достижения
          const category = achievement.category || 'misc';
          
          // Применяем соответствующую функцию проверки в зависимости от категории
          switch (category.toLowerCase()) {
            case 'культивация':
            case 'cultivation':
              const cultivationData = await cultivationService.getCultivationProgress(userId);
              progress = checkCultivationAchievement(achievement, cultivationData);
              break;
              
            case 'техники':
            case 'technique':
              const techniques = await techniqueService.getLearnedTechniques(userId);
              progress = checkTechniqueAchievement(achievement, techniques);
              break;
              
            case 'алхимия':
            case 'alchemy':
              const alchemyData = await alchemyService.getUserAlchemyItems(userId);
              progress = checkAlchemyAchievement(achievement, alchemyData);
              break;
              
            case 'битвы':
            case 'combat':
              const pvpData = await pvpService.getUserStats(userId);
              progress = checkCombatAchievement(achievement, pvpData);
              break;
              
            case 'социальное':
            case 'social':
              const profileData = await characterProfileService.getProfile(userId);
              const sectData = await sectService.getUserSect(userId);
              progress = checkSocialAchievement(achievement, profileData, sectData);
              break;
              
            case 'экономика':
            case 'economy':
              const inventoryEconomy = await inventoryService.getUserInventory(userId);
              const profileEconomy = await characterProfileService.getProfile(userId);
              const tradeData = await merchantService.getTradeHistory(userId);
              progress = checkEconomyAchievement(achievement, profileEconomy, inventoryEconomy, tradeData);
              break;
              
            case 'исследование':
            case 'exploration':
              const locationsData = await questService.getUserProgress(userId);
              const inventoryExploration = await inventoryService.getUserInventory(userId);
              progress = checkExplorationAchievement(achievement, locationsData, inventoryExploration);
              break;
              
            case 'питомцы':
            case 'pet':
              const petsData = await spiritPetService.getPets(userId);
              progress = checkPetAchievement(achievement, petsData);
              break;
              
            case 'квесты':
            case 'quests':
              const questsData = await questService.getQuests(userId);
              progress = checkQuestAchievement(achievement, questsData);
              break;
              
            default:
              console.warn(`Неизвестная категория достижения: ${category}`);
              progress = 0;
          }
        }
        
        // Пропускаем обновление прогресса, если функция проверки вернула -1 (специальное значение)
        if (progress === -1) {
          console.log(`Пропускаем обновление прогресса для достижения "${achievement.title}" (ID: ${achievement.id}), так как оно обновляется напрямую`);
          continue; // Переходим к следующему достижению
        }
        
        // Обновляем прогресс достижения с нормализацией значения
        console.log(`Обновление прогресса достижения "${achievement.title}": ${progress}/${achievement.requiredValue}`);
        
        // НОВОЕ: Нормализуем значение прогресса, если достижение выполнено
        const normalizedProgress = (progress >= achievement.requiredValue) ? achievement.requiredValue : progress;
        
        // Обновляем с нормализованным значением
        const result = await exports.updateAchievementProgress(userId, achievement.id, normalizedProgress);
        
        // Добавляем в список обновленных достижений
        allUpdated.push({
          id: achievement.id,
          title: achievement.title,
          currentValue: progress,
          requiredValue: achievement.requiredValue,
          isCompleted: result.isCompleted
        });
        
        // Если достижение было только что выполнено, добавляем его в список новых выполненных
        if (result.isCompleted && !userAchievements.find(ua => ua.id === achievement.id && ua.isCompleted)) {
          newlyCompleted.push({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            rewards: achievement.rewards
          });
        }
      } catch (error) {
        console.error(`Ошибка при проверке достижения ${achievement.id} (${achievement.title}):`, error);
      }
    }
    
    
    console.log(`Проверка достижений завершена. Новых выполненных достижений: ${newlyCompleted.length}`);
    return newlyCompleted;
  } catch (error) {
    console.error(`Ошибка при проверке достижений для пользователя ${userId}:`, error);
    return [];
  }
};

/**
 * Проверяет выполнение достижений для пользователя на основе текущего состояния
 * @param {string} userId - ID пользователя
 * @param {Object} state - Состояние игры (опционально)
 * @returns {Promise<Array>} Массив новых выполненных достижений
 */
exports.checkAchievements = async function(userId, state) {
  try {
    // Если state не передан или пустой объект, используем новый метод с прямыми сервисами
    if (!state || Object.keys(state).length === 0) {
      console.log(`Параметр state не передан, используем прямые сервисы для проверки достижений пользователя ${userId}`);
      return await exports.checkAchievementsFromServices(userId);
    }
    
    // Иначе используем старый метод для обратной совместимости
    console.log(`Выполняем проверку достижений для пользователя ${userId} на основе переданного состояния игры`);
    
    // Получаем все достижения
    const achievements = await exports.getAllAchievements();
    
    // Получаем текущий прогресс пользователя
    const userAchievements = await exports.getUserAchievements(userId);
    
    // Создаем карту незавершенных достижений
    const pendingAchievements = {};
    userAchievements.forEach(ua => {
      if (!ua.isCompleted) {
        pendingAchievements[ua.id] = ua;
      }
    });
    
    // Массив для новых достижений
    const newlyCompleted = [];
    
    // Проверяем каждое достижение
    for (const achievement of achievements) {
      if (pendingAchievements[achievement.id]) {
        // Определяем, как проверять достижение на основе его ID или категории
        let progress = 0;
        
        switch (achievement.id) {
          case 'ach1': // Первые шаги
            if (state && state.player && state.player.cultivation) {
              progress = state.player.cultivation.level || 0;
            }
            break;
            
          case 'ach2': // Коллекционер техник
            if (state && state.player && state.player.techniques) {
              progress = Array.isArray(state.player.techniques) ? state.player.techniques.length : 0;
            }
            break;
            
          case 'ach3': // Исследователь
            if (state && state.player && state.player.progress && state.player.progress.discoveries) {
              const discoveries = state.player.progress.discoveries;
              if (typeof discoveries === 'object' && discoveries !== null) {
                progress = Object.keys(discoveries).filter(key => discoveries[key]).length;
              }
            }
            break;
            
          // Добавьте другие достижения по мере необходимости
          
          default:
            // Используем существующие функции проверки по категориям
            if (achievement.category === 'cultivation' && state.player && state.player.cultivation) {
              progress = checkCultivationAchievement(achievement, state.player.cultivation);
            } else if (achievement.category === 'technique' && state.player && state.player.techniques) {
              progress = checkTechniqueAchievement(achievement, state.player.techniques);
            } else if (achievement.category === 'combat' && state.player && state.player.pvp) {
              progress = checkCombatAchievement(achievement, state.player.pvp);
            } else if (achievement.category === 'exploration' && state.player) {
              progress = checkExplorationAchievement(
                achievement,
                state.player.locations,
                state.player.inventory
              );
            } else {
              // Если не знаем, как проверить, пропускаем
              continue;
            }
        }
        
        // Если есть прогресс, обновляем его
        if (progress > 0) {
          try {
            const result = await exports.updateAchievementProgress(userId, achievement.id, progress);
            
            // Если достижение было выполнено, добавляем его в список
            if (result.isCompleted && !pendingAchievements[achievement.id].isCompleted) {
              newlyCompleted.push({
                id: achievement.id,
                title: achievement.title,
                description: achievement.description,
                icon: achievement.icon,
                rewards: achievement.rewards
              });
            }
          } catch (error) {
            console.error(`Ошибка при обновлении прогресса достижения ${achievement.id}:`, error);
          }
        }
      }
    }
    
    return newlyCompleted;
  } catch (error) {
    console.error(`Ошибка при проверке достижений для пользователя ${userId}:`, error);
    return [];
  }
};

/**
 * Создает новое достижение (только для администраторов)
 * @param {Object} achievementData - Данные о достижении
 * @returns {Promise<Object>} Созданное достижение
 */
exports.createAchievement = async function(achievementData) {
  try {
    // Получаем экземпляр Sequelize 
    const db = await getSequelizeInstance();
    
    // Получаем модель Achievement напрямую через Sequelize
    const Achievement = db.model('Achievement');
    
    // Создаем достижение
    const achievement = await Achievement.create({
      id: achievementData.id,
      title: achievementData.title,
      description: achievementData.description,
      icon: achievementData.icon,
      category: achievementData.category,
      rewards: achievementData.rewards,
      required_value: achievementData.requiredValue || 1,
      is_hidden: achievementData.isHidden || false,
      display_order: achievementData.displayOrder || 0
    });
    
    // Обновляем кэш
    achievementsCache = [];
    
    // Возвращаем созданное достижение
    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      rewards: achievement.rewards,
      requiredValue: achievement.required_value,
      isHidden: achievement.is_hidden,
      displayOrder: achievement.display_order
    };
  } catch (error) {
    console.error('Ошибка при создании достижения:', error);
    throw error;
  }
};

/**
 * Обновляет достижение (только для администраторов)
 * @param {string} id - ID достижения
 * @param {Object} updates - Обновления для достижения
 * @returns {Promise<Object|null>} Обновленное достижение или null, если не найдено
 */
exports.updateAchievement = async function(id, updates) {
  try {
    // Получаем экземпляр Sequelize 
    const db = await getSequelizeInstance();
    
    // Получаем модель Achievement напрямую через Sequelize
    const Achievement = db.model('Achievement');
    
    // Проверяем существование достижения
    const achievement = await Achievement.findByPk(id);
    if (!achievement) {
      return null;
    }
    
    // Обновляем достижение
    await achievement.update({
      title: updates.title !== undefined ? updates.title : achievement.title,
      description: updates.description !== undefined ? updates.description : achievement.description,
      icon: updates.icon !== undefined ? updates.icon : achievement.icon,
      category: updates.category !== undefined ? updates.category : achievement.category,
      rewards: updates.rewards !== undefined ? updates.rewards : achievement.rewards,
      required_value: updates.requiredValue !== undefined ? updates.requiredValue : achievement.required_value,
      is_hidden: updates.isHidden !== undefined ? updates.isHidden : achievement.is_hidden,
      display_order: updates.displayOrder !== undefined ? updates.displayOrder : achievement.display_order
    });
    
    // Обновляем кэш
    achievementsCache = [];
    
    // Возвращаем обновленное достижение
    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      rewards: achievement.rewards,
      requiredValue: achievement.required_value,
      isHidden: achievement.is_hidden,
      displayOrder: achievement.display_order
    };
  } catch (error) {
    console.error(`Ошибка при обновлении достижения с ID ${id}:`, error);
    return null;
  }
};

/**
 * Удаляет достижение (только для администраторов)
 * @param {string} id - ID достижения
 * @returns {Promise<boolean>} true, если удалено успешно
 */
exports.deleteAchievement = async function(id) {
  try {
    // Получаем экземпляр Sequelize 
    const db = await getSequelizeInstance();
    
    // Получаем модель Achievement напрямую через Sequelize
    const Achievement = db.model('Achievement');
    
    // Проверяем существование достижения
    const achievement = await Achievement.findByPk(id);
    if (!achievement) {
      return false;
    }
    
    // Удаляем достижение
    await achievement.destroy();
    
    // Обновляем кэш
    achievementsCache = achievementsCache.filter(a => a.id !== id);
    
    return true;
  } catch (error) {
    console.error(`Ошибка при удалении достижения с ID ${id}:`, error);
    return false;
  }
};