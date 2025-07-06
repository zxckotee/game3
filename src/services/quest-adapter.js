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

// Экспортируем методы напрямую
const adapter = {
  // Методы сервиса
  getQuests: QuestService.getQuests,
  acceptQuest: QuestService.acceptQuest,
  updateQuestProgress: QuestService.updateQuestProgress,
  completeQuest: QuestService.completeQuest,
  checkQuestEvent: QuestService.checkQuestEvent
};

// Экспортируем адаптер как основной экспорт
module.exports = adapter;