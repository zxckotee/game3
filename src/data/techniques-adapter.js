/**
 * Адаптер для выбора подходящей версии techniques.js в зависимости от среды выполнения
 * Предотвращает включение серверного кода в клиентскую сборку
 */
const { isServerEnvironment } = require('../sequelize-config');

// Импортируем клиентскую версию для браузера
const ClientTechniques = require('./client-techniques');

// Определение объекта в зависимости от окружения
let Techniques;

// В браузере всегда используем клиентскую версию
if (!isServerEnvironment) {
  Techniques = ClientTechniques;
} else {
  // В серверном окружении используем оригинальную версию с доступом к БД
  try {
    // Используем прямой импорт на сервере
    const ServerTechniques = require('./techniques');
    Techniques = ServerTechniques;
  } catch (error) {
    console.error('Ошибка при импорте серверной версии techniques:', error);
    console.warn('Используем клиентскую версию из-за ошибки импорта');
    
    // В случае ошибки используем клиентскую версию
    Techniques = ClientTechniques;
  }
}

// Экспортируем константы и функции
const techniqueTypes = Techniques.techniqueTypes;
const techniqueElements = Techniques.techniqueElements;
const techniqueRarity = Techniques.techniqueRarity;
const techniques = Techniques.techniques || [];
const techniqueCategories = Techniques.techniqueCategories;
const elementColors = Techniques.elementColors;
const loadTechniques = Techniques.loadTechniques;
const getTechniqueById = Techniques.getTechniqueById;
const getTechniquesByType = Techniques.getTechniquesByType;
const getTechniquesByElement = Techniques.getTechniquesByElement;
const getTechniquesByRarity = Techniques.getTechniquesByRarity;
const getAvailableTechniques = Techniques.getAvailableTechniques;
const calculateTechniqueEffects = Techniques.calculateTechniqueEffects;
const initTechniqueData = Techniques.initTechniqueData;

// Экспортируем по умолчанию весь объект для совместимости с require
module.exports = Techniques;