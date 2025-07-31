/**
 * Утилиты для перевода типов и редкости предметов
 */

// Переводы редкости предметов
export const RARITY_TRANSLATIONS = {
  common: 'Обычный',
  uncommon: 'Необычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythic: 'Мифический'
};

// Переводы типов предметов
export const ITEM_TYPE_TRANSLATIONS = {
  pill: 'Пилюли',
  talisman: 'Талисманы',
  weapon: 'Оружие',
  armor: 'Броня',
  accessory: 'Аксессуары',
  consumable: 'Расходуемые',
  resource: 'Ресурсы',
  pet_food: 'Корм для питомцев',
  book: 'Книги'
};

// Цвета для редкости (сохраняем существующую логику)
export const RARITY_COLORS = {
  common: '#aaa',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
  mythic: '#e619e6'
};

// Цвета границ для редкости (для InventoryTab)
export const RARITY_BORDER_COLORS = {
  common: 'rgba(102, 102, 102, 0.4)',
  uncommon: 'rgba(33, 150, 243, 0.4)',
  rare: 'rgba(156, 39, 176, 0.4)',
  epic: 'rgba(255, 152, 0, 0.4)',
  legendary: 'rgba(212, 175, 55, 0.4)',
  mythic: 'rgba(230, 25, 230, 0.4)'
};

// Цвета границ для hover эффектов (для InventoryTab)
export const RARITY_BORDER_COLORS_HOVER = {
  common: 'rgba(102, 102, 102, 0.6)',
  uncommon: 'rgba(33, 150, 243, 0.6)',
  rare: 'rgba(156, 39, 176, 0.6)',
  epic: 'rgba(255, 152, 0, 0.6)',
  legendary: 'rgba(212, 175, 55, 0.6)',
  mythic: 'rgba(230, 25, 230, 0.6)'
};

// Цвета для box-shadow эффектов (для InventoryTab)
export const RARITY_SHADOW_COLORS = {
  common: 'rgba(102, 102, 102, 0.15)',
  uncommon: 'rgba(33, 150, 243, 0.15)',
  rare: 'rgba(156, 39, 176, 0.15)',
  epic: 'rgba(255, 152, 0, 0.15)',
  legendary: 'rgba(212, 175, 55, 0.15)',
  mythic: 'rgba(230, 25, 230, 0.15)'
};

// Цвета для градиентов hover эффектов (для InventoryTab)
export const RARITY_GRADIENT_COLORS = {
  common: 'rgba(102, 102, 102, 0.1)',
  uncommon: 'rgba(33, 150, 243, 0.1)',
  rare: 'rgba(156, 39, 176, 0.1)',
  epic: 'rgba(255, 152, 0, 0.1)',
  legendary: 'rgba(212, 175, 55, 0.1)',
  mythic: 'rgba(230, 25, 230, 0.1)'
};

/**
 * Переводит английское название редкости на русский
 * @param {string} rarity - английское название редкости
 * @returns {string} русское название редкости
 */
export const translateRarity = (rarity) => {
  return RARITY_TRANSLATIONS[rarity] || rarity || 'Неизвестный';
};

/**
 * Переводит английское название типа предмета на русский
 * @param {string} itemType - английское название типа
 * @returns {string} русское название типа
 */
export const translateItemType = (itemType) => {
  return ITEM_TYPE_TRANSLATIONS[itemType] || itemType || 'Неизвестный';
};

/**
 * Получает цвет для редкости предмета
 * @param {string} rarity - редкость предмета
 * @returns {string} CSS цвет
 */
export const getRarityColor = (rarity) => {
  return RARITY_COLORS[rarity] || RARITY_COLORS.common;
};

/**
 * Получает цвет границы для редкости предмета (для InventoryTab)
 * @param {string} rarity - редкость предмета
 * @returns {string} CSS цвет границы
 */
export const getRarityBorderColor = (rarity) => {
  return RARITY_BORDER_COLORS[rarity] || RARITY_BORDER_COLORS.common;
};

/**
 * Получает цвет границы для hover эффекта
 * @param {string} rarity - редкость предмета
 * @returns {string} CSS цвет границы для hover
 */
export const getRarityBorderColorHover = (rarity) => {
  return RARITY_BORDER_COLORS_HOVER[rarity] || RARITY_BORDER_COLORS_HOVER.common;
};

/**
 * Получает цвет тени для редкости предмета
 * @param {string} rarity - редкость предмета
 * @returns {string} CSS цвет тени
 */
export const getRarityShadowColor = (rarity) => {
  return RARITY_SHADOW_COLORS[rarity] || RARITY_SHADOW_COLORS.common;
};

/**
 * Получает цвет градиента для hover эффекта
 * @param {string} rarity - редкость предмета
 * @returns {string} CSS цвет градиента
 */
export const getRarityGradientColor = (rarity) => {
  return RARITY_GRADIENT_COLORS[rarity] || RARITY_GRADIENT_COLORS.common;
};

/**
 * Получает тип валюты по редкости (сохраняем существующую логику)
 * @param {string} rarity - редкость предмета
 * @returns {string} тип валюты
 */
export const getCurrencyTypeByRarity = (rarity) => {
  switch(rarity) {
    case 'common':
    case 'uncommon':
      return 'copper';
    case 'rare':
      return 'silver';
    case 'epic':
    case 'legendary':
    case 'mythic':
      return 'gold';
    default:
      return 'copper';
  }
};