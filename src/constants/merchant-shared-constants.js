/**
 * Общие константы для работы с торговцами
 * Этот файл используется всеми модулями для предотвращения циклических зависимостей
 */

// Типы торговцев
const merchantTypes = {
  WEAPONS: 'weapons',
  ARMOR: 'armor',
  POTIONS: 'potions',
  SCROLLS: 'scrolls',
  GENERAL: 'general',
  BLACKSMITH: 'blacksmith',
  ALCHEMIST: 'alchemist',
  MYSTIC: 'mystic'
};

// Уровни редкости торговцев
const merchantRarityLevels = {
  COMMON: 1,     // Обычный торговец
  UNCOMMON: 2,   // Необычный торговец
  RARE: 3,       // Редкий торговец
  LEGENDARY: 4,  // Легендарный торговец
  MYTHICAL: 5    // Мифический торговец
};

module.exports = {
  merchantTypes,
  merchantRarityLevels
};