/**
 * Файл с индивидуальными функциями проверки достижений
 * Каждая функция соответствует конкретному достижению и реализует его специфическую логику проверки
 */

// Импортируем необходимые сервисы
const cultivationService = require('./cultivation-service');
const techniqueService = require('./technique-service');
const alchemyService = require('./alchemy-service');
const inventoryService = require('./inventory-service');
const pvpService = require('./pvp-service');
const sectService = require('./sect-service');
const spiritPetService = require('./spirit-pet-service');
const resourceService = require('./resource-service');

/**
 * Объект с функциями проверки для каждого достижения
 * Ключи - идентификаторы достижений из базы данных
 * Значения - асинхронные функции, принимающие userId и возвращающие текущий прогресс
 */
const achievementCheckers = {
  // 1. Первые шаги (Достигните 1-го уровня культивации)
  1: async function checkFirstSteps(userId) {
    try {
      const cultivationData = await cultivationService.getCultivationProgress(userId);
      return cultivationData.level || 0;
    } catch (error) {
      console.error('Ошибка при проверке достижения "Первые шаги":', error);
      return 0;
    }
  },

  // 2. Коллекционер техник (Изучите 5 различных техник)
  2: async function checkTechniqueCollector(userId) {
    try {
      const techniques = await techniqueService.getLearnedTechniques(userId);
      return techniques && Array.isArray(techniques) ? techniques.length : 0;
    } catch (error) {
      console.error('Ошибка при проверке достижения "Коллекционер техник":', error);
      return 0;
    }
  },

  // 3. Мастер алхимии (Создайте 10 алхимических предметов)
  3: async function checkAlchemyMaster(userId) {
    try {
      // Получаем модели через modelRegistry
      const modelRegistry = require('../models/registry');
      await modelRegistry.initializeRegistry();
      
      // Получаем доступ к таблице achievement_progress
      const AchievementProgress = modelRegistry.getModel('AchievementProgress');
      
      // Ищем запись прогресса для достижения "Мастер алхимии" (ID 3)
      const progress = await AchievementProgress.findOne({
        where: {
          user_id: userId,
          achievement_id: 3
        },
        attributes: ['current_value']
      });
      
      // Возвращаем текущее значение прогресса или 0, если запись не найдена
      return progress ? progress.current_value : 0;
    } catch (error) {
      console.error('Ошибка при проверке достижения "Мастер алхимии":', error);
      return 0;
    }
  },

  // 4. Воин (Победите 30 врагов) 
  4: async function checkWarrior(userId) {
    try {
      const pvpData = await pvpService.getUserRatings(userId);
      var total_wins = 0;
      for (var i in pvpData){
        total_wins += parseInt(pvpData[i].wins);
      }
      //console.log(`${pvpData}, ${total_wins}`);
      return pvpData && total_wins ? total_wins : 0;
    } catch (error) {
      console.error('Ошибка при проверке достижения "Воин":', error);
      return 0;
    }
  },

  // 5. Гранд-мастер культивации (Достигните 10-го уровня культивации)
  5: async function checkGrandMaster(userId) {
    try {
      const cultivationData = await cultivationService.getCultivationProgress(userId);
      return cultivationData.level || 0;
    } catch (error) {
      console.error('Ошибка при проверке достижения "Гранд-мастер культивации":', error);
      return 0;
    }
  },

  // 6. Мастер медитации (Проведите в медитации 24 часа)
  6: async function checkMeditationMaster(userId) {
    try {
      const cultivationData = await cultivationService.getCultivationProgress(userId);
      return cultivationData.meditationTime || 0;
    } catch (error) {
      console.error('Ошибка при проверке достижения "Мастер медитации":', error);
      return 0;
    }
  },

  // 7. Победитель духовных питомцев (Приручите 5 духовных питомцев)
  7: async function checkPetTamer(userId) {
    try {
      const petsData = await spiritPetService.getPetsByUserId(userId);
      if (petsData && petsData.pets && Array.isArray(petsData.pets)) {
        return petsData.pets.length;
      }
      return 0;
    } catch (error) {
      console.error('Ошибка при проверке достижения "Победитель духовных питомцев":', error);
      return 0;
    }
  },

  // 8. Бессмертный культиватор (Достигните 20-го уровня культивации)
  8: async function checkImmortalCultivator(userId) {
    try {
      const cultivationData = await cultivationService.getCultivationProgress(userId);
      return cultivationData.level || 0;
    } catch (error) {
      console.error('Ошибка при проверке достижения "Бессмертный культиватор":', error);
      return 0;
    }
  },

  // 9. Собиратель редкостей (Соберите 5 легендарных предметов)
  9: async function checkRarityCollector(userId) {
    try {
      const inventory = await inventoryService.getInventoryItems(userId);
      if (inventory && Array.isArray(inventory)) {
        return inventory.filter(item => item.rarity === 'legendary').length;
      }
      return 0;
    } catch (error) {
      console.error('Ошибка при проверке достижения "Собиратель редкостей":', error);
      return 0;
    }
  }
};

module.exports = achievementCheckers;