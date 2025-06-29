const CultivationProgress = require('../models/cultivation-progress');
const User = require('../models/user');
const ResourceService = require('./resource-service');

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
  static async updateCultivationProgress(userId, data) {
    console.log(`[CULTIVATION SERVICE] updateCultivationProgress: ${userId} ${JSON.stringify(data)}`);
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
          where: { userId }
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
          });
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
        await cultivation.update(updateData);
        console.log(`[CULTIVATION SERVICE] updateCultivationProgress ${updateData} `);
        
        // Получаем обновленные данные
        cultivation = await CultivationProgress.findOne({
          where: { userId }
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
   * Выполнение трибуляции
   * @param {number} userId - ID пользователя
   * @param {Object} tribulationResult - Результат прохождения трибуляции
   */
  static async completeTribulation(userId, tribulationResult) {
    console.log(`[CULTIVATION SERVICE] completeTribulation ${user}: ${tribulationResult}`);
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
    try {
      const checkResult = await this.checkBreakthroughPossibility(userId);
      if (!checkResult.canBreakthrough) {
        return {
          success: false,
          message: 'Невозможно выполнить прорыв',
          missingRequirements: checkResult.missingRequirements
        };
      }

      const cultivation = await CultivationProgress.findOne({ where: { userId } });
      if (!cultivation) {
        return { success: false, message: 'Данные о культивации не найдены' };
      }

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

      const updateData = {
        level: newLevel,
        stage: newStage,
        experience: 0,
        experienceToNextLevel: newExperienceToNextLevel,
        bottleneckProgress: 0,
        maxEnergy: newMaxEnergy,
        energy: newMaxEnergy,
        tribulationCompleted: false
      };

      const requirements = this.generateBreakthroughRequirements(newStage, newLevel);
      updateData.requiredBottleneckProgress = (cultivation.requiredBottleneckProgress || 100) + requirements.bottleneckProgress;

      await cultivation.update(updateData);

      const user = await User.findByPk(userId);
      if (user) {
        await user.update({ cultivation_level: newLevel });
      }

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
        isNewStage: isNewStage
      };
    } catch (error) {
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
