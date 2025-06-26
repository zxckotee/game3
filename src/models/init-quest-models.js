/**
 * Инициализация моделей, связанных с квестами
 * Этот файл обеспечивает правильный порядок инициализации моделей,
 * чтобы избежать циклических зависимостей
 */
const connectionProvider = require('../utils/connection-provider');
const QuestCategory = require('./quest-category');
const Quest = require('./quest');
const QuestObjective = require('./quest-objective');
const QuestReward = require('./quest-reward');
const QuestProgress = require('./quest-progress');

/**
 * Функция для инициализации моделей квестов в правильном порядке
 */
async function initializeQuestModels() {
  try {
    console.log('Начало инициализации моделей квестов...');
    
    // Получаем экземпляр Sequelize
    const { db: sequelize } = await connectionProvider.getSequelizeInstance();
    
    if (!sequelize) {
      throw new Error('Не удалось получить экземпляр Sequelize');
    }
    
    // Инициализируем модели в правильном порядке
    console.log('Инициализация модели QuestCategory...');
    QuestCategory.initialize(sequelize);
    
    console.log('Инициализация модели Quest...');
    Quest.initialize(sequelize);
    
    console.log('Инициализация модели QuestReward...');
    QuestReward.initialize(sequelize);
    
    console.log('Инициализация модели QuestObjective...');
    QuestObjective.initialize(sequelize);
    
    console.log('Инициализация модели QuestProgress...');
    QuestProgress.initialize(sequelize);
    
    // Установка ассоциаций между моделями
    console.log('Установка ассоциаций между моделями...');
    const models = {
      QuestCategory,
      Quest,
      QuestObjective,
      QuestReward,
      QuestProgress,
      // Заглушка для User, который может использоваться в ассоциациях
      User: {
        prototype: { isPrototypeOf: () => true }
      }
    };
    
    QuestCategory.associate(models);
    Quest.associate(models);
    QuestObjective.associate(models);
    QuestReward.associate(models);
    QuestProgress.associate(models);
    
    console.log('Все модели квестов успешно инициализированы');
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации моделей квестов:', error);
    console.error(error.stack);
    return false;
  }
}

// Экспортируем функцию инициализации
module.exports = initializeQuestModels;

// Автоматический запуск инициализации при импорте модуля
initializeQuestModels().then(success => {
  if (success) {
    console.log('Модели квестов успешно инициализированы');
  } else {
    console.error('Не удалось инициализировать модели квестов');
  }
}).catch(error => {
  console.error('Необработанная ошибка при инициализации моделей квестов:', error);
});