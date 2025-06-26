/**
 * Файл с данными о квестах
 * Получает информацию о квестах через адаптер
 */

// Импортируем адаптер для работы с квестами
const QuestAdapter = require('../services/quest-adapter');

// В CommonJS нельзя деструктурировать методы из класса напрямую
// Определяем функции-обертки для методов адаптера
const adapterGetAllQuests = QuestAdapter.getAllQuests || function() { return []; };
const adapterGetQuestById = QuestAdapter.getQuestById || function() { return null; };
const adapterGetQuestsByCategory = QuestAdapter.getQuestsByCategory || function() { return []; };
const adapterGetQuestsByStatus = QuestAdapter.getQuestsByStatus || function() { return []; };
const adapterGetUserQuestProgress = QuestAdapter.getUserQuestProgress || function() { return []; };
const adapterStartQuest = QuestAdapter.startQuest || function() { return false; };
const adapterUpdateQuestProgress = QuestAdapter.updateQuestProgress || function() { return false; };
const adapterCompleteQuest = QuestAdapter.completeQuest || function() { return false; };
const adapterCreateQuest = QuestAdapter.createQuest || function() { return null; };
const adapterUpdateQuest = QuestAdapter.updateQuest || function() { return false; };
const adapterDeleteQuest = QuestAdapter.deleteQuest || function() { return false; };

// Тип квестов
const QUEST_TYPES = {
  MAIN: 'main',           // Основной сюжет
  SIDE: 'side',           // Побочные
  DAILY: 'daily',         // Ежедневные
  SPECIAL: 'special',     // Особые
  EVENT: 'event'          // Событийные
};

// Сложность квестов
const QUEST_DIFFICULTY = {
  TRIVIAL: 'trivial',     // Тривиальная
  EASY: 'easy',           // Лёгкая
  MEDIUM: 'medium',       // Средняя
  HARD: 'hard',           // Сложная
  VERY_HARD: 'very_hard', // Очень сложная
  EPIC: 'epic'            // Эпическая
};

// Кэш для хранения данных
let quests = [];

// Вспомогательная функция для преобразования объектов задач из БД
// Оставляем для обратной совместимости
function getObjectivesFromDB(quest) {
  try {
    // Предполагаем, что steps хранится как JSON в поле rewards или в отдельном поле
    const stepsData = JSON.parse(quest.steps || '[]');
    return stepsData.map(step => ({
      id: `q${quest.id}_obj${step.id}`,
      text: step.description,
      completed: step.completed || false
    }));
  } catch (e) {
    console.error('Ошибка при парсинге задач квеста:', e);
    return [];
  }
}

// Вспомогательная функция для преобразования наград из БД
// Оставляем для обратной совместимости
function getRewardsFromDB(quest) {
  try {
    const rewardsData = JSON.parse(quest.rewards || '{}');
    const rewards = [];
    
    // Добавляем опыт, если он есть
    if (rewardsData.experience) {
      rewards.push({
        type: 'experience',
        amount: rewardsData.experience,
        icon: '✨'
      });
    }
    
    // Добавляем валюту, если она есть
    if (rewardsData.currency) {
      rewards.push({
        type: 'currency',
        amount: rewardsData.currency,
        icon: '💰'
      });
    }
    
    // Добавляем предметы, если они есть
    if (rewardsData.items && Array.isArray(rewardsData.items)) {
      rewardsData.items.forEach(item => {
        rewards.push({
          type: 'item',
          id: item.id,
          name: item.name,
          amount: item.amount || 1,
          icon: item.icon || '📦'
        });
      });
    }
    
    return rewards;
  } catch (e) {
    console.error('Ошибка при парсинге наград квеста:', e);
    return [];
  }
}

/**
 * Получение всех квестов
 * @returns {Promise<Array>} Список всех квестов
 */
async function getAllQuests() {
  try {
    const allQuests = await adapterGetAllQuests();
    quests = allQuests; // Обновляем кэш
    return allQuests;
  } catch (error) {
    console.error('Ошибка при получении квестов:', error);
    return quests; // В случае ошибки возвращаем кэшированные данные
  }
}

/**
 * Получение квеста по ID
 * @param {string} id ID квеста
 * @returns {Promise<Object|null>} Объект квеста или null, если не найден
 */
async function getQuestById(id) {
  try {
    return await adapterGetQuestById(id);
  } catch (error) {
    console.error(`Ошибка при получении квеста с ID ${id}:`, error);
    // Пытаемся найти в кэше
    return quests.find(q => q.id === id) || null;
  }
}

/**
 * Получение квестов по категории
 * @param {string} category Категория квеста из QUEST_TYPES
 * @returns {Promise<Array>} Список квестов указанной категории
 */
async function getQuestsByCategory(category) {
  try {
    return await adapterGetQuestsByCategory(category);
  } catch (error) {
    console.error(`Ошибка при получении квестов категории ${category}:`, error);
    // Фильтруем кэш
    return quests.filter(q => q.type === category);
  }
}

/**
 * Получение квестов по статусу
 * @param {string} status Статус квеста ('available', 'active', 'completed')
 * @param {string} userId ID пользователя
 * @returns {Promise<Array>} Список квестов с указанным статусом
 */
async function getQuestsByStatus(status, userId) {
  try {
    return await adapterGetQuestsByStatus(status, userId);
  } catch (error) {
    console.error(`Ошибка при получении квестов со статусом ${status}:`, error);
    return []; // В случае ошибки возвращаем пустой массив
  }
}

/**
 * Получение прогресса пользователя по квесту
 * @param {string} userId ID пользователя
 * @param {string} questId ID квеста
 * @returns {Promise<Object|null>} Объект прогресса или null
 */
async function getUserQuestProgress(userId, questId) {
  try {
    return await adapterGetUserQuestProgress(userId, questId);
  } catch (error) {
    console.error(`Ошибка при получении прогресса квеста ${questId} для пользователя ${userId}:`, error);
    return null;
  }
}

/**
 * Начать квест для пользователя
 * @param {string} userId ID пользователя
 * @param {string} questId ID квеста
 * @returns {Promise<Object>} Объект с результатом операции
 */
async function startQuest(userId, questId) {
  try {
    return await adapterStartQuest(userId, questId);
  } catch (error) {
    console.error(`Ошибка при начале квеста ${questId} для пользователя ${userId}:`, error);
    throw error;
  }
}

/**
 * Обновить прогресс квеста
 * @param {string} userId ID пользователя
 * @param {string} questId ID квеста
 * @param {Object} progress Объект с обновлением прогресса
 * @returns {Promise<Object>} Объект с результатом операции
 */
async function updateQuestProgress(userId, questId, progress) {
  try {
    return await adapterUpdateQuestProgress(userId, questId, progress);
  } catch (error) {
    console.error(`Ошибка при обновлении прогресса квеста ${questId} для пользователя ${userId}:`, error);
    throw error;
  }
}

/**
 * Завершить квест
 * @param {string} userId ID пользователя
 * @param {string} questId ID квеста
 * @returns {Promise<Object>} Объект с результатом операции и наградами
 */
async function completeQuest(userId, questId) {
  try {
    return await adapterCompleteQuest(userId, questId);
  } catch (error) {
    console.error(`Ошибка при завершении квеста ${questId} для пользователя ${userId}:`, error);
    throw error;
  }
}

/**
 * Создать новый квест
 * @param {Object} questData Данные квеста
 * @returns {Promise<Object>} Созданный квест
 */
async function createQuest(questData) {
  try {
    const newQuest = await adapterCreateQuest(questData);
    // Обновляем кэш
    quests.push(newQuest);
    return newQuest;
  } catch (error) {
    console.error('Ошибка при создании квеста:', error);
    throw error;
  }
}

/**
 * Обновить существующий квест
 * @param {string} id ID квеста
 * @param {Object} updates Обновляемые поля
 * @returns {Promise<Object>} Обновленный квест
 */
async function updateQuest(id, updates) {
  try {
    const updatedQuest = await adapterUpdateQuest(id, updates);
    // Обновляем кэш
    const index = quests.findIndex(q => q.id === id);
    if (index !== -1) {
      quests[index] = updatedQuest;
    }
    return updatedQuest;
  } catch (error) {
    console.error(`Ошибка при обновлении квеста с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Удалить квест
 * @param {string} id ID квеста
 * @returns {Promise<boolean>} Результат операции
 */
async function deleteQuest(id) {
  try {
    const result = await adapterDeleteQuest(id);
    // Обновляем кэш
    const index = quests.findIndex(q => q.id === id);
    if (index !== -1) {
      quests.splice(index, 1);
    }
    return result;
  } catch (error) {
    console.error(`Ошибка при удалении квеста с ID ${id}:`, error);
    throw error;
  }
}

// Инициализация кэша при загрузке модуля
(async function() {
  try {
    quests = await getAllQuests();
    console.log(`Загружено ${quests.length} квестов`);
  } catch (error) {
    console.error('Ошибка при инициализации данных квестов:', error);
  }
})();

// Экспорт функций и констант
module.exports = {
  QUEST_TYPES,
  QUEST_DIFFICULTY,
  quests,
  getAllQuests,
  getQuestById,
  getQuestsByCategory,
  getQuestsByStatus,
  getUserQuestProgress,
  startQuest,
  updateQuestProgress, 
  completeQuest,
  createQuest,
  updateQuest,
  deleteQuest,
  // Вспомогательные функции для обратной совместимости
  getObjectivesFromDB,
  getRewardsFromDB
};
