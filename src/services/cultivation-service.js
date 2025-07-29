const CultivationProgress = require('../models/cultivation-progress');
const User = require('../models/user');
const ResourceService = require('./resource-service');
const InventoryItem = require('../models/inventory-item');
const { getSequelizeInstance } = require('../utils/connection-provider');

// Проверяем, находимся ли мы в браузере
const isBrowser = typeof window !== 'undefined';

// Храним данные о культивации в памяти для браузера
let browserCultivationData = {};

const STAGE_CONFIG = [
 { name: 'Закалка тела', endLevel: 4 },
 { name: 'Очищение Ци', endLevel: 7 },
 { name: 'Золотое ядро', endLevel: 13 },
 { name: 'Формирование души', endLevel: Infinity }
];

/**
 * Получение требуемых ресурсов для прорыва на основе стадии и уровня
 * @param {string} stage - Текущая ступень культивации
 * @param {number} level - Текущий уровень
 * @returns {Object} - Объект с требуемыми ресурсами
 */
function getBreakthroughResources(stage, level) {
  const stageResourceSets = {
    'Закалка тела': [
      // Набор 1 (уровни 1, 4, 7, 10...)
      {
        'herb_qigathering': { name: 'Трава сбора ци', baseAmount: 5 },
        'mineral_dust': { name: 'Минеральная пыль', baseAmount: 2 }
      },
      // Набор 2 (уровни 2, 5, 8, 11...)
      {
        'herb_ironroot': { name: 'Железный корень', baseAmount: 3 },
        'water_pure': { name: 'Очищенная вода', baseAmount: 2 }
      },
      // Набор 3 (уровни 3, 6, 9, 12...)
      {
        'herb_clearflow': { name: 'Кристальный цветок', baseAmount: 4 },
        'crystal_clear': { name: 'Чистый кристалл', baseAmount: 1 }
      }
    ],
    'Очищение Ци': [
      // Набор 1
      {
        'herb_spiritbloom': { name: 'Духовный цвет', baseAmount: 4 },
        'essence_concentration': { name: 'Эссенция концентрации', baseAmount: 2 },
        'crystal_mind': { name: 'Кристалл разума', baseAmount: 1 }
      },
      // Набор 2
      {
        'herb_goldensage': { name: 'Золотой шалфей', baseAmount: 3 },
        'essence_purity': { name: 'Эссенция чистоты', baseAmount: 2 },
        'metal_celestial': { name: 'Небесный металл', baseAmount: 1 }
      },
      // Набор 3
      {
        'water_spirit': { name: 'Духовная вода', baseAmount: 5 },
        'crystal_formation': { name: 'Кристалл формирования', baseAmount: 2 }
      }
    ],
    'Золотое ядро': [
      // Набор 1
      {
        'herb_soulwhisper': { name: 'Шепот души', baseAmount: 3 },
        'essence_enlightenment': { name: 'Эссенция просветления', baseAmount: 2 },
        'crystal_soul': { name: 'Кристалл души', baseAmount: 1 }
      },
      // Набор 2
      {
        'metal_heavenly': { name: 'Небожительный металл', baseAmount: 2 },
        'essence_heaven': { name: 'Эссенция небес', baseAmount: 1 },
        'crystal_star': { name: 'Звездный кристалл', baseAmount: 1 }
      },
      // Набор 3
      {
        'feather_phoenix': { name: 'Перо феникса', baseAmount: 1 },
        'dust_stardust': { name: 'Звездная пыль', baseAmount: 3 }
      }
    ],
    'Формирование души': [
      // Набор 1
      {
        'spirit_ancient': { name: 'Древний дух', baseAmount: 1 },
        'essence_heaven': { name: 'Эссенция небес', baseAmount: 2 },
        'crystal_star': { name: 'Звездный кристалл', baseAmount: 2 }
      },
      // Набор 2
      {
        'herb_soulwhisper': { name: 'Шепот души', baseAmount: 4 },
        'essence_enlightenment': { name: 'Эссенция просветления', baseAmount: 3 },
        'dust_stardust': { name: 'Звездная пыль', baseAmount: 2 }
      },
      // Набор 3
      {
        'metal_heavenly': { name: 'Небожительный металл', baseAmount: 3 },
        'crystal_soul': { name: 'Кристалл души', baseAmount: 2 },
        'feather_phoenix': { name: 'Перо феникса', baseAmount: 1 }
      }
    ]
  };

  // Получаем наборы ресурсов для текущей стадии
  const stageSets = stageResourceSets[stage] || stageResourceSets['Закалка тела'];
  
  // Определяем какой набор использовать (циклически каждые 3 уровня)
  const setIndex = (level - 1) % 3;
  const resourceSet = stageSets[setIndex];
  
  // Вычисляем множитель на основе уровня
  const multiplier = Math.ceil(level / 3);
  
  // Формируем финальный объект ресурсов
  const finalResources = {};
  Object.keys(resourceSet).forEach(resourceId => {
    const resource = resourceSet[resourceId];
    finalResources[resourceId] = resource.baseAmount * multiplier;
  });
  
  return finalResources;
}

/**
 * Сервис для работы с данными о культивации
 */
class CultivationService {
  /**
   * Получение данных о культивации пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Данные о культивации
   */
  static async getCultivationProgress(userId) {
    try {
      //console.log(`[CULTIVATION SERVICE] getCultivationProgress: ${userId}`);
      if (isBrowser) {
        // В браузере используем объект в памяти
        if (!browserCultivationData[userId]) {
          // Если данных нет, создаем исходные данные
          browserCultivationData[userId] = {
            userId,
            stage: 'Закалка тела',
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,
            breakthroughProgress: 0,
            dailyCultivationLimit: 1000,
            dailyCultivationUsed: 0,
            lastCultivationReset: new Date(),
            energy: 100,
            maxEnergy: 100,
            tribulationCompleted: false,
            insightPoints: 0,
            bottleneckProgress: 0,
            requiredBottleneckProgress: 100,
            lastInsightTime: new Date(),
            cultivationEfficiency: 1.0
          };
        }
        
        // Возвращаем данные из памяти
        const cultivation = browserCultivationData[userId];
        
        return {
          stage: cultivation.stage,
          level: cultivation.level,
          experience: cultivation.experience,
          experienceToNextLevel: cultivation.experienceToNextLevel,
          energy: cultivation.energy,
          maxEnergy: cultivation.maxEnergy,
          tribulationCompleted: cultivation.tribulationCompleted,
          insightPoints: cultivation.insightPoints,
          bottleneckProgress: cultivation.bottleneckProgress,
          requiredBottleneckProgress: cultivation.requiredBottleneckProgress,
          cultivationEfficiency: cultivation.cultivationEfficiency
        };
      } else {
        // На сервере используем базу данных
        // Проверяем, есть ли запись о культивации для пользователя
        let cultivation = await CultivationProgress.findOne({
          where: { userId }
        });
        
        // Если записи нет, создаем новую с начальными значениями
        if (!cultivation) {
          // Проверка существования пользователя перед созданием записи о культивации
          const user = await User.findByPk(userId);
          if (!user) {
            console.error(`Пользователь с ID ${userId} не найден`);
            throw new Error(`Пользователь с ID ${userId} не найден`);
          }
          
          cultivation = await CultivationProgress.create({
            userId,
            stage: 'Закалка тела',
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,
            breakthroughProgress: 0,
            dailyCultivationLimit: 1000,
            dailyCultivationUsed: 0,
            lastCultivationReset: new Date(),
            energy: 100,
            maxEnergy: 100,
            tribulationCompleted: false,
            insightPoints: 0,
            bottleneckProgress: 0,
            requiredBottleneckProgress: 100,
            lastInsightTime: new Date(),
            cultivationEfficiency: 1.0
          });
        }
        
        // Преобразуем данные для клиента
        return {
          stage: cultivation.stage,
          level: cultivation.level,
          experience: cultivation.experience,
          experienceToNextLevel: cultivation.experienceToNextLevel,
          energy: cultivation.energy,
          maxEnergy: cultivation.maxEnergy,
          tribulationCompleted: cultivation.tribulationCompleted,
          insightPoints: cultivation.insightPoints,
          bottleneckProgress: cultivation.bottleneckProgress,
          requiredBottleneckProgress: cultivation.requiredBottleneckProgress,
          cultivationEfficiency: cultivation.cultivationEfficiency
        };
      }
    } catch (error) {
      console.error('Ошибка при получении данных о культивации:', error);
      throw error;
    }
  }
  
  /**
   * Обновление данных о культивации пользователя
   * @param {number} userId - ID пользователя
   * @param {Object} data - Новые данные о культивации
   * @returns {Promise<Object>} - Обновленные данные о культивации
   */
  static async updateCultivationProgress(userId, data, options = {}) {
    console.log(`[CULTIVATION SERVICE] updateCultivationProgress: ${userId} ${JSON.stringify(data)}`);
    const { transaction } = options;
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        if (!browserCultivationData[userId]) {
          // Если данных нет, создаем исходные данные
          browserCultivationData[userId] = {
            userId,
            stage: 'Закалка тела',
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,
            breakthroughProgress: 0,
            dailyCultivationLimit: 1000,
            dailyCultivationUsed: 0,
            lastCultivationReset: new Date(),
            energy: 100,
            maxEnergy: 100,
            tribulationCompleted: false,
            insightPoints: 0,
            bottleneckProgress: 0,
            requiredBottleneckProgress: 100,
            lastInsightTime: new Date(),
            cultivationEfficiency: 1.0
          };
        }
        
        // Обновляем данные в памяти
        if (data.stage !== undefined && data.stage !== null) {
          browserCultivationData[userId].stage = typeof data.stage === 'string' ? data.stage : 'Закалка тела';
        }
        
        if (data.level !== undefined) {
          browserCultivationData[userId].level = data.level;
        }
        
        if (data.experience !== undefined) {
          // Устанавливаем значение, но не больше максимального
          browserCultivationData[userId].experience = Math.min(
            data.experience,
            browserCultivationData[userId].experienceToNextLevel
          );
        }
        
        if (data.experienceToNextLevel !== undefined) {
          browserCultivationData[userId].experienceToNextLevel = data.experienceToNextLevel;
        }
        
        if (data.energy !== undefined) {
          // Устанавливаем значение, но не больше максимального
          browserCultivationData[userId].energy = Math.min(
            data.energy,
            browserCultivationData[userId].maxEnergy
          );
        }
        
        if (data.maxEnergy !== undefined) {
          browserCultivationData[userId].maxEnergy = data.maxEnergy;
        }
        
        if (data.tribulationCompleted !== undefined) {
          browserCultivationData[userId].tribulationCompleted = data.tribulationCompleted;
        }
        
        if (data.insightPoints !== undefined) {
          browserCultivationData[userId].insightPoints = data.insightPoints;
        }
        
        if (data.bottleneckProgress !== undefined) {
          // Устанавливаем значение, но не больше максимального
          browserCultivationData[userId].bottleneckProgress = Math.min(
            data.bottleneckProgress,
            browserCultivationData[userId].requiredBottleneckProgress
          );
        }
        
        if (data.requiredBottleneckProgress !== undefined) {
          browserCultivationData[userId].requiredBottleneckProgress = data.requiredBottleneckProgress;
        }
        
        if (data.cultivationEfficiency !== undefined) {
          browserCultivationData[userId].cultivationEfficiency = data.cultivationEfficiency;
        }
        
        // Возвращаем обновленные данные
        const cultivation = browserCultivationData[userId];
        
        return {
          stage: cultivation.stage,
          level: cultivation.level,
          experience: cultivation.experience,
          experienceToNextLevel: cultivation.experienceToNextLevel,
          energy: cultivation.energy,
          maxEnergy: cultivation.maxEnergy,
          tribulationCompleted: cultivation.tribulationCompleted,
          insightPoints: cultivation.insightPoints,
          bottleneckProgress: cultivation.bottleneckProgress,
          requiredBottleneckProgress: cultivation.requiredBottleneckProgress,
          cultivationEfficiency: cultivation.cultivationEfficiency
        };
      } else {
        // На сервере используем базу данных
        // Получаем текущие данные о культивации
        let cultivation = await CultivationProgress.findOne({
          where: { userId },
          transaction
        });
        
        // Если записи нет, создаем новую
        if (!cultivation) {
          // Проверка существования пользователя перед созданием записи о культивации
          const user = await User.findByPk(userId);
          if (!user) {
            console.error(`Пользователь с ID ${userId} не найден`);
            throw new Error(`Пользователь с ID ${userId} не найден`);
          }
          
          cultivation = await CultivationProgress.create({
            userId,
            stage: 'Закалка тела',
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,
            breakthroughProgress: 0,
            dailyCultivationLimit: 1000,
            dailyCultivationUsed: 0,
            lastCultivationReset: new Date(),
            energy: 100,
            maxEnergy: 100,
            tribulationCompleted: false,
            insightPoints: 0,
            bottleneckProgress: 0,
            requiredBottleneckProgress: 100,
            lastInsightTime: new Date(),
            cultivationEfficiency: 1.0
          }, { transaction });
        }
        
        // Преобразуем данные из клиента в формат базы данных
        const updateData = {};
        
        // Простое копирование незащищенных полей
        const simpleFields = ['stage', 'level', 'experienceToNextLevel', 'maxEnergy', 'tribulationCompleted', 'insightPoints', 'requiredBottleneckProgress', 'cultivationEfficiency'];
        simpleFields.forEach(field => {
          if (data[field] !== undefined) {
            updateData[field] = data[field];
          }
        });

        // Обновление полей с ограничением максимального значения
        if (data.experience !== undefined) {
          updateData.experience = Math.min(data.experience, cultivation.experienceToNextLevel);
        }

        if (data.energy !== undefined) {
          updateData.energy = Math.min(data.energy, cultivation.maxEnergy);
        }

        if (data.bottleneckProgress !== undefined) {
          updateData.bottleneckProgress = Math.min(data.bottleneckProgress, cultivation.requiredBottleneckProgress);
        }
        
        //console.log(`[CULTIVATION SERVICE] updateCultivationProgress: ${userId} ${JSON.stringify(updateData)}`);
        // Обновляем данные
        await cultivation.update(updateData, { transaction });
        console.log(`[CULTIVATION SERVICE] updateCultivationProgress ${updateData} `);
        
        // Получаем обновленные данные
        cultivation = await CultivationProgress.findOne({
          where: { userId },
          transaction
        });
        
        // Преобразуем данные для клиента
        return {
          stage: cultivation.stage,
          level: cultivation.level,
          experience: cultivation.experience,
          experienceToNextLevel: cultivation.experienceToNextLevel,
          energy: cultivation.energy,
          maxEnergy: cultivation.maxEnergy,
          tribulationCompleted: cultivation.tribulationCompleted,
          insightPoints: cultivation.insightPoints,
          bottleneckProgress: cultivation.bottleneckProgress,
          requiredBottleneckProgress: cultivation.requiredBottleneckProgress,
          cultivationEfficiency: cultivation.cultivationEfficiency
        };
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных о культивации:', error);
      throw error;
    }
  }
  
  /**
   * Генерация требований для прорыва на следующий уровень
   * @param {string} stage - Текущая ступень культивации
   * @param {number} level - Текущий уровень в ступени
   * @returns {Object} - Требования для прорыва
   */
  static generateBreakthroughRequirements(stage, level) {
    const requirements = {
      tribulation: null,
      bottleneckProgress: 0
    };
    
    // Определяем требуемый прогресс "бутылочного горлышка" в зависимости от ступени и уровня
    switch(stage) {
      case 'Закалка тела':
        requirements.bottleneckProgress = level * 10;
        break;
      case 'Очищение Ци':
        requirements.bottleneckProgress = level * 15;
        break;
      case 'Золотое ядро':
        requirements.bottleneckProgress = level * 20;
        break;
      case 'Формирование души':
        requirements.bottleneckProgress = level * 25;
        break;
      default:
        requirements.bottleneckProgress = level * 10;
    }
    
    // Определяем тип трибуляции в зависимости от ступени и уровня
    if (level === 3 || level === 6 || level === 9) {
      switch(stage) {
        case 'Закалка тела':
          requirements.tribulation = {
            type: 'физическая',
            difficulty: level * 10,
            description: 'Испытание на выносливость и силу тела'
          };
          break;
          
        case 'Очищение Ци':
          requirements.tribulation = {
            type: 'энергетическая',
            difficulty: level * 15,
            description: 'Испытание на контроль энергии и меридианов'
          };
          break;
          
        case 'Золотое ядро':
          requirements.tribulation = {
            type: 'грозовая',
            difficulty: level * 20,
            description: 'Испытание на стойкость перед стихийными силами'
          };
          break;
          
        case 'формирование души':
          requirements.tribulation = {
            type: 'духовная',
            difficulty: level * 25,
            description: 'Испытание на силу духа и ментальную стойкость'
          };
          break;
          
        default:
          requirements.tribulation = {
            type: 'базовая',
            difficulty: level * 10,
            description: 'Базовое испытание культивации'
          };
      }
    }
    
    return requirements;
  }
  
  /**
   * Проверка возможности прорыва на следующий уровень
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Результат проверки
   */
  static async checkBreakthroughPossibility(userId) {
    try {
      let cultivation;
      
      if (isBrowser) {
        // В браузере используем объект в памяти
        cultivation = browserCultivationData[userId];
        
        if (!cultivation) {
          return {
            canBreakthrough: false,
            requirements: null,
            missingRequirements: null,
            message: 'Данные о культивации не найдены'
          };
        }
      } else {
        // На сервере используем базу данных
        cultivation = await CultivationProgress.findOne({
          where: { userId }
        });
        
        if (!cultivation) {
          return {
            canBreakthrough: false,
            requirements: null,
            missingRequirements: null,
            message: 'Данные о культивации не найдены'
          };
        }
      }
      
      // Проверяем базовые требования (опыт и энергия)
      const hasEnoughExperience = cultivation.experience >= cultivation.experienceToNextLevel;
      const hasEnoughEnergy = cultivation.energy >= cultivation.maxEnergy * 0.8;
      
      // Проверяем прохождение трибуляции, если она требуется
      const needsTribulation = (cultivation.level === 3 || cultivation.level === 6 || cultivation.level === 9);
      const passedTribulation = !needsTribulation || cultivation.tribulationCompleted;
      
      // Проверяем прогресс "бутылочного горлышка"
      const passedBottleneck = cultivation.bottleneckProgress >= cultivation.requiredBottleneckProgress;
      
      // Формируем результат проверки
      const canBreakthrough = hasEnoughExperience && hasEnoughEnergy;
      
      // Формируем список недостающих требований
      const missingRequirements = [];
      
      if (!hasEnoughExperience) {
        missingRequirements.push(`Недостаточно опыта (${cultivation.experience}/${cultivation.experienceToNextLevel})`);
      }
      
      if (!hasEnoughEnergy) {
        missingRequirements.push(`Недостаточно энергии (требуется 80% от максимума)`);
      }
      
      return {
        canBreakthrough,
        missingRequirements,
        message: canBreakthrough
          ? 'Вы готовы к прорыву!'
          : 'Для прорыва необходимо выполнить дополнительные требования'
      };
    } catch (error) {
      console.error('Ошибка при проверке возможности прорыва:', error);
      throw error;
    }
  }

  /**
   * Проверка ресурсов для прорыва
   * @param {number} userId - ID пользователя
   * @param {Object} requiredResources - Требуемые ресурсы
   * @returns {Promise<Object>} - Результат проверки ресурсов
   */
  static async checkResourceRequirements(userId, requiredResources) {
    try {
      const missingResources = [];
      let hasAllResources = true;

      for (const [resourceId, requiredAmount] of Object.entries(requiredResources)) {
        // Ищем предмет в инвентаре напрямую через модель
        const inventoryItem = await InventoryItem.findOne({
          where: {
            userId: userId,
            itemId: resourceId
          }
        });
        
        const currentAmount = inventoryItem ? inventoryItem.quantity : 0;
        
        if (currentAmount < requiredAmount) {
          hasAllResources = false;
          missingResources.push(`${resourceId}: ${currentAmount}/${requiredAmount}`);
        }
      }

      return { hasAllResources, missingResources };
    } catch (error) {
      console.error('Ошибка при проверке ресурсов:', error);
      return { hasAllResources: false, missingResources: ['Ошибка при проверке ресурсов'] };
    }
  }

  /**
   * Расходование ресурсов для прорыва
   * @param {number} userId - ID пользователя
   * @param {Object} requiredResources - Ресурсы для расходования
   * @returns {Promise<boolean>} - Успешность операции
   */
  static async consumeBreakthroughResources(userId, requiredResources) {
    try {
      for (const [resourceId, requiredAmount] of Object.entries(requiredResources)) {
        // Находим предмет в инвентаре
        const inventoryItem = await InventoryItem.findOne({
          where: {
            userId: userId,
            itemId: resourceId
          }
        });
        
        if (!inventoryItem || inventoryItem.quantity < requiredAmount) {
          throw new Error(`Недостаточно ресурса ${resourceId}`);
        }
        
        // Уменьшаем количество или удаляем предмет
        const newQuantity = inventoryItem.quantity - requiredAmount;
        if (newQuantity <= 0) {
          await inventoryItem.destroy();
        } else {
          await inventoryItem.update({ quantity: newQuantity });
        }
      }
      return true;
    } catch (error) {
      console.error('Ошибка при расходовании ресурсов:', error);
      throw error;
    }
  }

  /**
   * Полная проверка всех требований для прорыва
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Результат проверки всех требований
   */
  static async checkBreakthroughRequirements(userId) {
    try {
      // 1. Получаем данные культивации
      let cultivation;
      
      if (isBrowser) {
        cultivation = browserCultivationData[userId];
        if (!cultivation) {
          return { canBreakthrough: false, message: 'Данные о культивации не найдены' };
        }
      } else {
        cultivation = await CultivationProgress.findOne({ where: { userId } });
        if (!cultivation) {
          return { canBreakthrough: false, message: 'Данные о культивации не найдены' };
        }
      }

      const missingRequirements = [];

      // 2. Проверяем опыт
      const hasEnoughExperience = cultivation.experience >= cultivation.experienceToNextLevel;
      if (!hasEnoughExperience) {
        missingRequirements.push(`Недостаточно опыта (${cultivation.experience}/${cultivation.experienceToNextLevel})`);
      }

      // 3. Проверяем энергию (80% от максимума)
      const requiredEnergy = Math.floor(cultivation.maxEnergy * 0.8);
      const hasEnoughEnergy = cultivation.energy >= requiredEnergy;
      if (!hasEnoughEnergy) {
        missingRequirements.push(`Недостаточно энергии (${cultivation.energy}/${requiredEnergy})`);
      }

      // 4. Проверяем бутылочное горлышко
      const passedBottleneck = cultivation.bottleneckProgress >= cultivation.requiredBottleneckProgress;
      if (!passedBottleneck) {
        missingRequirements.push(`Не пройдено бутылочное горлышко (${cultivation.bottleneckProgress}/${cultivation.requiredBottleneckProgress})`);
      }

      // 5. Проверяем трибуляцию (если требуется)
      const needsTribulation = (cultivation.level === 3 || cultivation.level === 6 || cultivation.level === 9);
      const passedTribulation = !needsTribulation || cultivation.tribulationCompleted;
      if (!passedTribulation) {
        missingRequirements.push('Не пройдена трибуляция');
      }

      // 6. Проверяем ресурсы через InventoryService
      const requiredResources = getBreakthroughResources(cultivation.stage, cultivation.level);
      const resourceCheckResults = await this.checkResourceRequirements(userId, requiredResources);
      
      if (!resourceCheckResults.hasAllResources) {
        missingRequirements.push(...resourceCheckResults.missingResources);
      }

      const canBreakthrough = missingRequirements.length === 0;

      return {
        canBreakthrough,
        missingRequirements,
        requiredResources,
        message: canBreakthrough ? 'Готов к прорыву!' : 'Не выполнены требования для прорыва'
      };
    } catch (error) {
      console.error('Ошибка при проверке требований для прорыва:', error);
      return {
        canBreakthrough: false,
        message: 'Произошла ошибка при проверке требований',
        missingRequirements: ['Системная ошибка']
      };
    }
  }
  
  /**
   * Выполнение трибуляции
   * @param {number} userId - ID пользователя
   * @param {Object} tribulationResult - Результат прохождения трибуляции
   */
  static async completeTribulation(userId, tribulationResult) {
    console.log(`[CULTIVATION SERVICE] completeTribulation ${userId}: ${JSON.stringify(tribulationResult)}`);
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        const cultivation = browserCultivationData[userId];
        
        if (!cultivation) {
          return {
            success: false,
            message: 'Данные о культивации не найдены'
          };
        }
        
        // Проверяем успешность прохождения трибуляции
        if (tribulationResult.success) {
          // Обновляем статус трибуляции
          cultivation.tribulationCompleted = true;
          
          // Возвращаем результат
          return {
            success: true,
            message: 'Трибуляция успешно пройдена!',
            rewards: tribulationResult.rewards || {}
          };
        } else {
          // Если трибуляция не пройдена, возвращаем сообщение об ошибке
          return {
            success: false,
            message: tribulationResult.message || 'Трибуляция не пройдена',
            penalties: tribulationResult.penalties || {}
          };
        }
      } else {
        // На сервере используем базу данных
        const cultivation = await CultivationProgress.findOne({
          where: { userId }
        });
        
        if (!cultivation) {
          return {
            success: false,
            message: 'Данные о культивации не найдены'
          };
        }
        
        // Проверяем успешность прохождения трибуляции
        if (tribulationResult.success) {
          // Обновляем статус трибуляции
          await cultivation.update({
            tribulationCompleted: true
          });
          
          // Возвращаем результат
          return {
            success: true,
            message: 'Трибуляция успешно пройдена!',
            rewards: tribulationResult.rewards || {}
          };
        } else {
          // Если трибуляция не пройдена, возвращаем сообщение об ошибке
          return {
            success: false,
            message: tribulationResult.message || 'Трибуляция не пройдена',
            penalties: tribulationResult.penalties || {}
          };
        }
      }
    } catch (error) {
      console.error('Ошибка при выполнении трибуляции:', error);
      throw error;
    }
  }
  
  /**
   * Увеличение прогресса "бутылочного горлышка"
   * @param {number} userId - ID пользователя
   * @param {number} amount - Количество прогресса для добавления
   * @returns {Promise<Object>} - Обновленные данные о культивации
   */
  static async increaseBottleneckProgress(userId, amount) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        const cultivation = browserCultivationData[userId];
        
        if (!cultivation) {
          return {
            success: false,
            message: 'Данные о культивации не найдены'
          };
        }
        
        // Увеличиваем прогресс "бутылочного горлышка"
        const newProgress = Math.min(
          cultivation.bottleneckProgress + amount,
          cultivation.requiredBottleneckProgress
        );
        
        // Обновляем данные в памяти
        cultivation.bottleneckProgress = newProgress;
        
        // Проверяем, достигнут ли максимальный прогресс
        const isCompleted = newProgress >= cultivation.requiredBottleneckProgress;
        
        // Возвращаем результат
        return {
          success: true,
          bottleneckProgress: newProgress,
          requiredBottleneckProgress: cultivation.requiredBottleneckProgress,
          isCompleted,
          message: isCompleted 
            ? 'Вы преодолели "бутылочное горлышко"!' 
            : `Прогресс увеличен (${newProgress}/${cultivation.requiredBottleneckProgress})`
        };
      } else {
        // На сервере используем базу данных
        const cultivation = await CultivationProgress.findOne({
          where: { userId }
        });
        
        if (!cultivation) {
          return {
            success: false,
            message: 'Данные о культивации не найдены'
          };
        }
        
        // Увеличиваем прогресс "бутылочного горлышка"
        const newProgress = Math.min(
          cultivation.bottleneckProgress + amount,
          cultivation.requiredBottleneckProgress
        );
        
        // Обновляем данные
        await cultivation.update({
          bottleneckProgress: newProgress
        });
        
        // Проверяем, достигнут ли максимальный прогресс
        const isCompleted = newProgress >= cultivation.requiredBottleneckProgress;
        
        // Возвращаем результат
        return {
          success: true,
          bottleneckProgress: newProgress,
          requiredBottleneckProgress: cultivation.requiredBottleneckProgress,
          isCompleted,
          message: isCompleted 
            ? 'Вы преодолели "бутылочное горлышко"!' 
            : `Прогресс увеличен (${newProgress}/${cultivation.requiredBottleneckProgress})`
        };
      }
    } catch (error) {
      console.error('Ошибка при увеличении прогресса "бутылочного горлышка":', error);
      throw error;
    }
  }
  
  /**
   * Получение прозрения
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Результат получения прозрения
   */
  static async gainInsight(userId) {
    try {
      if (isBrowser) {
        // В браузере используем объект в памяти
        const cultivation = browserCultivationData[userId];
        
        if (!cultivation) {
          return {
            success: false,
            message: 'Данные о культивации не найдены'
          };
        }
        
        // Проверяем, прошло ли достаточно времени с последнего прозрения
        const now = new Date();
        const lastInsightTime = new Date(cultivation.lastInsightTime);
        const hoursSinceLastInsight = (now - lastInsightTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastInsight < 24) {
          return {
            success: false,
            message: 'Вы недавно получили прозрение. Попробуйте позже.',
            hoursRemaining: 24 - hoursSinceLastInsight
          };
        }
        
        // Генерируем случайное прозрение
        const insightType = Math.floor(Math.random() * 4);
        let insightEffect = {};
        let insightMessage = '';
        
        switch (insightType) {
          case 0: // Увеличение эффективности культивации
            const efficiencyBonus = 0.1 + Math.random() * 0.2; // 10-30% бонус
            insightEffect = {
              cultivationEfficiency: Math.min(cultivation.cultivationEfficiency + efficiencyBonus, 2.0)
            };
            insightMessage = `Вы получили прозрение! Эффективность культивации увеличена на ${Math.floor(efficiencyBonus * 100)}%.`;
            break;
            
          case 1: // Увеличение прогресса "бутылочного горлышка"
            const bottleneckBonus = Math.floor(cultivation.requiredBottleneckProgress * (0.1 + Math.random() * 0.2)); // 10-30% прогресса
            insightEffect = {
              bottleneckProgress: Math.min(cultivation.bottleneckProgress + bottleneckBonus, cultivation.requiredBottleneckProgress)
            };
            insightMessage = `Вы получили прозрение! Прогресс "бутылочного горлышка" увеличен на ${bottleneckBonus} единиц.`;
            break;
            
          case 2: // Увеличение опыта культивации
            const experienceBonus = Math.floor(cultivation.experienceToNextLevel * (0.1 + Math.random() * 0.2)); // 10-30% опыта
            insightEffect = {
              experience: cultivation.experience + experienceBonus
            };
            insightMessage = `Вы получили прозрение! Получено ${experienceBonus} единиц опыта культивации.`;
            break;
            
          case 3: // Увеличение максимальной энергии
            const energyBonus = Math.floor(cultivation.maxEnergy * (0.05 + Math.random() * 0.1)); // 5-15% энергии
            insightEffect = {
              maxEnergy: cultivation.maxEnergy + energyBonus,
              energy: cultivation.energy + energyBonus
            };
            insightMessage = `Вы получили прозрение! Максимальная энергия увеличена на ${energyBonus} единиц.`;
            break;
        }
        
        // Обновляем данные в памяти
        if (insightEffect.cultivationEfficiency !== undefined) {
          cultivation.cultivationEfficiency = insightEffect.cultivationEfficiency;
        }
        
        if (insightEffect.bottleneckProgress !== undefined) {
          cultivation.bottleneckProgress = insightEffect.bottleneckProgress;
        }
        
        if (insightEffect.experience !== undefined) {
          cultivation.experience = insightEffect.experience;
        }
        
        if (insightEffect.maxEnergy !== undefined) {
          cultivation.maxEnergy = insightEffect.maxEnergy;
          cultivation.energy = insightEffect.energy;
        }
        
        cultivation.insightPoints = (cultivation.insightPoints || 0) + 1;
        cultivation.lastInsightTime = now;
        
        // Возвращаем результат
        return {
          success: true,
          message: insightMessage,
          effect: insightEffect
        };
      } else {
        // На сервере используем базу данных
        const cultivation = await CultivationProgress.findOne({
          where: { userId }
        });
        
        if (!cultivation) {
          return {
            success: false,
            message: 'Данные о культивации не найдены'
          };
        }
        
        // Проверяем, прошло ли достаточно времени с последнего прозрения
        const now = new Date();
        const lastInsightTime = new Date(cultivation.lastInsightTime);
        const hoursSinceLastInsight = (now - lastInsightTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastInsight < 24) {
          return {
            success: false,
            message: 'Вы недавно получили прозрение. Попробуйте позже.',
            hoursRemaining: 24 - hoursSinceLastInsight
          };
        }
        
        // Генерируем случайное прозрение
        const insightType = Math.floor(Math.random() * 4);
        let insightEffect = {};
        let insightMessage = '';
        
        switch (insightType) {
          case 0: // Увеличение эффективности культивации
            const efficiencyBonus = 0.1 + Math.random() * 0.2; // 10-30% бонус
            insightEffect = {
              cultivationEfficiency: Math.min(cultivation.cultivationEfficiency + efficiencyBonus, 2.0)
            };
            insightMessage = `Вы получили прозрение! Эффективность культивации увеличена на ${Math.floor(efficiencyBonus * 100)}%.`;
            break;
            
          case 1: // Увеличение прогресса "бутылочного горлышка"
            const bottleneckBonus = Math.floor(cultivation.requiredBottleneckProgress * (0.1 + Math.random() * 0.2)); // 10-30% прогресса
            insightEffect = {
              bottleneckProgress: Math.min(cultivation.bottleneckProgress + bottleneckBonus, cultivation.requiredBottleneckProgress)
            };
            insightMessage = `Вы получили прозрение! Прогресс "бутылочного горлышка" увеличен на ${bottleneckBonus} единиц.`;
            break;
            
          case 2: // Увеличение опыта культивации
            const experienceBonus = Math.floor(cultivation.experienceToNextLevel * (0.1 + Math.random() * 0.2)); // 10-30% опыта
            insightEffect = {
              experience: cultivation.experience + experienceBonus
            };
            insightMessage = `Вы получили прозрение! Получено ${experienceBonus} единиц опыта культивации.`;
            break;
            
          case 3: // Увеличение максимальной энергии
            const energyBonus = Math.floor(cultivation.maxEnergy * (0.05 + Math.random() * 0.1)); // 5-15% энергии
            insightEffect = {
              maxEnergy: cultivation.maxEnergy + energyBonus,
              energy: cultivation.energy + energyBonus
            };
            insightMessage = `Вы получили прозрение! Максимальная энергия увеличена на ${energyBonus} единиц.`;
            break;
        }
        
        // Обновляем данные о культивации
        await cultivation.update({
          ...insightEffect,
          insightPoints: cultivation.insightPoints + 1,
          lastInsightTime: now
        });
        
        // Возвращаем результат
        return {
          success: true,
          message: insightMessage,
          effect: insightEffect
        };
      }
    } catch (error) {
      console.error('Ошибка при получении прозрения:', error);
      throw error;
    }
  }
  
  /**
   * Выполнение прорыва на следующий уровень культивации
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Результат прорыва
   */
  static async performBreakthrough(userId) {
    // Получаем экземпляр sequelize
    const { db: sequelize } = await getSequelizeInstance();
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Проверяем все требования (включая ресурсы)
      const checkResult = await this.checkBreakthroughRequirements(userId);
      
      if (!checkResult.canBreakthrough) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Невозможно выполнить прорыв',
          missingRequirements: checkResult.missingRequirements
        };
      }

      // 2. Получаем данные культивации в рамках транзакции
      const cultivation = await CultivationProgress.findOne({
        where: { userId },
        transaction
      });
      
      if (!cultivation) {
        await transaction.rollback();
        return { success: false, message: 'Данные о культивации не найдены' };
      }

      // 3. Вычисляем новые параметры
      const previousLevel = cultivation.level;
      const previousStage = cultivation.stage;
      
      const newLevel = previousLevel + 1;
      let newStage = previousStage;

      const currentStageConfig = STAGE_CONFIG.find(s => s.name === previousStage);
      if (currentStageConfig && newLevel > currentStageConfig.endLevel) {
        const currentStageIndex = STAGE_CONFIG.findIndex(s => s.name === previousStage);
        const nextStageConfig = STAGE_CONFIG[currentStageIndex + 1];
        if (nextStageConfig) {
          newStage = nextStageConfig.name;
        }
      }
      
      const newExperienceToNextLevel = newLevel * 100;
      const energyBonus = Math.floor(cultivation.maxEnergy * 0.1);
      const newMaxEnergy = cultivation.maxEnergy + energyBonus;

      // 4. Расходуем ресурсы
      await this.consumeBreakthroughResources(userId, checkResult.requiredResources);

      // 5. Расходуем опыт и энергию, обновляем данные культивации
      const requiredEnergy = Math.floor(cultivation.maxEnergy * 0.8);
      const updateData = {
        level: newLevel,
        stage: newStage,
        experience: 0, // Сбрасываем опыт после прорыва
        experienceToNextLevel: newExperienceToNextLevel,
        bottleneckProgress: 0, // Сбрасываем прогресс бутылочного горлышка
        energy: cultivation.energy - requiredEnergy, // Расходуем энергию
        maxEnergy: newMaxEnergy,
        tribulationCompleted: false // Сбрасываем статус трибуляции
      };

      const requirements = this.generateBreakthroughRequirements(newStage, newLevel);
      updateData.requiredBottleneckProgress = (cultivation.requiredBottleneckProgress || 100) + requirements.bottleneckProgress;

      await cultivation.update(updateData, { transaction });

      // 6. Обновляем уровень пользователя
      const user = await User.findByPk(userId, { transaction });
      if (user) {
        await user.update({ cultivation_level: newLevel }, { transaction });
      }

      // 7. Проверка квестов на достижение уровня после прорыва
      const QuestService = require('./quest-service');
      const completedReachLevelQuests = await QuestService.checkQuestEvent(userId, 'REACH_LEVEL', { level: newLevel });
      for (const questId of completedReachLevelQuests) {
        await QuestService.completeQuest(userId, questId);
      }

      // 8. Подтверждаем транзакцию
      await transaction.commit();

      const isNewStage = previousStage !== newStage;
      let message = isNewStage
        ? `Поздравляем! Вы достигли нового этапа культивации: ${newStage} (уровень ${newLevel})!`
        : `Поздравляем! Вы успешно совершили прорыв на уровень ${newLevel}!`;

      return {
        success: true,
        message: message,
        previousState: { stage: previousStage, level: previousLevel },
        newState: { stage: newStage, level: newLevel },
        bonuses: { maxEnergy: energyBonus },
        statPoints: 5,
        isNewStage: isNewStage,
        consumedResources: checkResult.requiredResources
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Ошибка при выполнении прорыва:', error);
      throw error;
    }
  }
}

module.exports = CultivationService;

// Экспортируем отдельные методы для совместимости
module.exports.getCultivationProgress = CultivationService.getCultivationProgress;
module.exports.updateCultivationProgress = CultivationService.updateCultivationProgress;
module.exports.checkBreakthroughPossibility = CultivationService.checkBreakthroughPossibility;
module.exports.completeTribulation = CultivationService.completeTribulation;
module.exports.increaseBottleneckProgress = CultivationService.increaseBottleneckProgress;
module.exports.gainInsight = CultivationService.gainInsight;
module.exports.generateBreakthroughRequirements = CultivationService.generateBreakthroughRequirements;
module.exports.performBreakthrough = CultivationService.performBreakthrough;
module.exports.checkBreakthroughRequirements = CultivationService.checkBreakthroughRequirements;
module.exports.checkResourceRequirements = CultivationService.checkResourceRequirements;
module.exports.consumeBreakthroughResources = CultivationService.consumeBreakthroughResources;
module.exports.getBreakthroughResources = getBreakthroughResources;
