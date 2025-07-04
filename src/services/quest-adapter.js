/**
 * Универсальный адаптер для работы с квестами
 * Реализует согласованное API как для серверной, так и для клиентской стороны
 * Поддерживает как работу с моделями, так и через REST API
 */

// Определение браузерной среды
const isBrowserEnvironment = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Импортируем API-версию для клиента
const QuestServiceAPI = require('./quest-api');

// В браузере всегда используем API-версию
const QuestService = QuestServiceAPI;

// Создаем экземпляр для использования методов экземпляра
const serviceInstance = new (function() {
  this.getQuests = function(userId) {
    return QuestService.getQuests(userId);
  };
  
  this.acceptQuest = function(userId, questId) {
    return QuestService.acceptQuest(userId, questId);
  };
  
  this.updateQuestProgress = function(userId, questId, progress) {
    return QuestService.updateQuestProgress(userId, questId, progress);
  };
  
  this.completeQuest = function(userId, questId) {
    return QuestService.completeQuest(userId, questId);
  };
  
  // Преобразование данных для совместимости с UI
  this.normalizeQuestData = function(quest) {
    if (!quest) return null;
    
    // Убедимся, что объекты имеют все необходимые свойства
    return {
      id: quest.id,
      title: quest.title || '',
      description: quest.description || '',
      type: quest.type || 'main',
      level: quest.level || 1,
      requiredLevel: quest.required_level || quest.level || 1,
      required_level: quest.required_level || quest.level || 1, // Сохраняем оригинальное поле для совместимости
      difficulty: quest.difficulty || 'Средне',
      category: quest.category || 'основной сюжет',
      rewards: Array.isArray(quest.rewards)
        ? quest.rewards.map(r => ({
            id: r.id,
            type: r.type || 'currency',
            name: r.name || '',
            amount: r.amount || 0,
            gold: r.gold,
            silver: r.silver,
            copper: r.copper,
            icon: r.icon || '🪙'
          }))
        : [],
      objectives: Array.isArray(quest.objectives)
        ? quest.objectives.map(o => {
            // Вспомогательная функция для корректной обработки булевых значений
            const toBool = (value) => {
              if (value === null || value === undefined) return false;
              if (typeof value === 'boolean') return value;
              if (typeof value === 'number') return value !== 0;
              if (typeof value === 'string') {
                // PostgreSQL может возвращать строки 't', 'f', 'true', 'false'
                return value.toLowerCase() === 't' ||
                      value.toLowerCase() === 'true' ||
                      value === '1';
              }
              return Boolean(value);
            };
            
            return {
              id: o.id,
              text: o.objective_text || o.text || '',
              requirement_criteria: o.requirement_criteria || {},
              completed: toBool(o.completed)
            };
          })
        : [],
      status: quest.status || 'available',
      progress: quest.progress || {}
    };
  };
})();

// Экспортируем методы напрямую
const adapter = {
  // Методы сервиса
  getQuests: QuestService.getQuests,
  acceptQuest: QuestService.acceptQuest,
  updateQuestProgress: QuestService.updateQuestProgress,
  completeQuest: QuestService.completeQuest,
  
  // Экспортируем вспомогательные функции
  normalizeQuestData: serviceInstance.normalizeQuestData,
  
  // Поддержка обратной совместимости
  getInstance: function() {
    return serviceInstance;
  }
};

// Экспортируем адаптер как основной экспорт
module.exports = adapter;