/**
 * Адаптер для выбора подходящей версии quests.js в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */

// Собственное определение браузерной среды, не полагаемся на sequelize-config
const isBrowserEnvironment = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const isServerEnvironment = !isBrowserEnvironment;

// Импортируем клиентскую версию для браузера
const ClientQuests = require('./client-quests');

// Определение объекта в зависимости от окружения
let Quests;

// В браузере всегда используем клиентскую версию
if (isBrowserEnvironment) {
  console.log('Используется клиентская версия квестов (браузер)');
  Quests = ClientQuests;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    console.log('Попытка загрузить серверную версию квестов');
    const ServerQuests = require('./quests');
    Quests = ServerQuests;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии quests:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    Quests = ClientQuests;
  }
}
console.log(Quests);
// Экспортируем константы и функции
const questTypes = Quests.questTypes;
const questDifficulty = Quests.questDifficulty;
const questCategories = Quests.questCategories;
const quests = Quests.quests || [];
const getAllQuests = Quests.getAllQuests;
const getQuestById = Quests.getQuestById;
const getQuestsByType = Quests.getQuestsByType;
const getAvailableQuests = Quests.getAvailableQuests;
const initQuestData = Quests.initQuestData;

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = Quests;

// Добавляем именованные экспорты для поддержки деструктуризации импорта
module.exports.questTypes = questTypes;
module.exports.questDifficulty = questDifficulty;
module.exports.questCategories = questCategories;
module.exports.quests = quests;
module.exports.getAllQuests = getAllQuests;
module.exports.getQuestById = getQuestById;
module.exports.getQuestsByType = getQuestsByType;
module.exports.getAvailableQuests = getAvailableQuests;
module.exports.initQuestData = initQuestData;