/**
 * Модуль с константами для ресурсов
 * Выделен отдельно для предотвращения циклических зависимостей
 */

// Типы ресурсов
const RESOURCE_TYPES = {
  HERB: 'herb',
  ORE: 'ore',
  WOOD: 'wood',
  GEM: 'gem',
  SPIRITUAL: 'spiritual',
  MISC: 'misc'
};

// Уровни редкости
const RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic'
};

// Экспортируем константы
module.exports = {
  RESOURCE_TYPES,
  RARITY
};