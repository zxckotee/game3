/**
 * Константы для торговцев, используемые как клиентской, так и серверной частями
 * Этот файл выделен для устранения циклических зависимостей между модулями
 */

// Константы для типов торговцев
exports.merchantTypes = {
  WEAPON_SMITH: 'weapon_smith',
  ARMOR_SMITH: 'armor_smith',
  ALCHEMIST: 'alchemist',
  GENERAL_GOODS: 'general_goods',
  SPIRIT_STONES: 'spirit_stones',
  HERBALIST: 'herbalist',
  PET_SUPPLIES: 'pet_supplies',
  FOOD_VENDOR: 'food_vendor',
  ARTIFACT_DEALER: 'artifact_dealer',
  TECHNIQUE_SCROLLS: 'technique_scrolls'
};

// Константы для уровней редкости торговцев
exports.merchantRarityLevels = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHICAL: 'mythical'  // Добавлен для совместимости с merchant-api.js
};