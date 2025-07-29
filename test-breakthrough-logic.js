// Тестирование логики прорыва
const path = require('path');

// Мокаем браузерную среду
global.window = undefined;

// Мокаем sequelize для тестирования
const mockSequelize = {
  transaction: async () => ({
    commit: async () => console.log('Transaction committed'),
    rollback: async () => console.log('Transaction rolled back')
  })
};

// Мокаем InventoryService
const mockInventoryService = {
  checkInventoryItem: async (userId, itemId, quantity) => {
    console.log(`Проверка ресурса: ${itemId} x${quantity} для пользователя ${userId}`);
    // Симулируем наличие ресурсов
    return { success: true, item: { quantity: quantity + 5 } };
  },
  removeInventoryItem: async (userId, itemId, quantity) => {
    console.log(`Расходование ресурса: ${itemId} x${quantity} для пользователя ${userId}`);
    return true;
  },
  getInventoryItems: async (userId) => {
    return [
      { itemId: 'herb_qigathering', quantity: 10 },
      { itemId: 'mineral_dust', quantity: 5 }
    ];
  }
};

// Мокаем модели
const mockCultivationProgress = {
  findOne: async ({ where, transaction }) => ({
    userId: where.userId,
    stage: 'Закалка тела',
    level: 1,
    experience: 100,
    experienceToNextLevel: 100,
    energy: 100,
    maxEnergy: 100,
    bottleneckProgress: 100,
    requiredBottleneckProgress: 100,
    tribulationCompleted: false,
    update: async (data, options) => {
      console.log('Обновление данных культивации:', data);
      return true;
    }
  })
};

const mockUser = {
  findByPk: async (userId, options) => ({
    userId,
    update: async (data, options) => {
      console.log('Обновление пользователя:', data);
      return true;
    }
  })
};

// Подменяем модули
require.cache[require.resolve('./src/services/inventory-service')] = {
  exports: mockInventoryService
};

require.cache[require.resolve('./src/models/cultivation-progress')] = {
  exports: mockCultivationProgress
};

require.cache[require.resolve('./src/models/user')] = {
  exports: mockUser
};

require.cache[require.resolve('./src/sequelize-config')] = {
  exports: { sequelize: mockSequelize }
};

// Мокаем quest-service
require.cache[require.resolve('./src/services/quest-service')] = {
  exports: {
    checkQuestEvent: async () => [],
    completeQuest: async () => true
  }
};

// Теперь загружаем наш сервис
const CultivationService = require('./src/services/cultivation-service');

async function testBreakthroughLogic() {
  console.log('=== ТЕСТИРОВАНИЕ ЛОГИКИ ПРОРЫВА ===\n');
  
  const userId = 1;
  
  try {
    // 1. Тестируем функцию получения ресурсов
    console.log('1. Тестирование getBreakthroughResources:');
    const resources1 = CultivationService.getBreakthroughResources('Закалка тела', 1);
    console.log('Ресурсы для уровня 1:', resources1);
    
    const resources2 = CultivationService.getBreakthroughResources('Закалка тела', 4);
    console.log('Ресурсы для уровня 4:', resources2);
    
    const resources3 = CultivationService.getBreakthroughResources('Очищение Ци', 2);
    console.log('Ресурсы для Очищение Ци, уровень 2:', resources3);
    console.log();
    
    // 2. Тестируем проверку требований
    console.log('2. Тестирование checkBreakthroughRequirements:');
    const checkResult = await CultivationService.checkBreakthroughRequirements(userId);
    console.log('Результат проверки:', checkResult);
    console.log();
    
    // 3. Тестируем проверку ресурсов
    console.log('3. Тестирование checkResourceRequirements:');
    const resourceCheck = await CultivationService.checkResourceRequirements(userId, resources1);
    console.log('Проверка ресурсов:', resourceCheck);
    console.log();
    
    // 4. Тестируем полный прорыв
    console.log('4. Тестирование performBreakthrough:');
    const breakthroughResult = await CultivationService.performBreakthrough(userId);
    console.log('Результат прорыва:', breakthroughResult);
    console.log();
    
    console.log('=== ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ УСПЕШНО ===');
    
  } catch (error) {
    console.error('Ошибка при тестировании:', error);
  }
}

// Запускаем тесты
testBreakthroughLogic();