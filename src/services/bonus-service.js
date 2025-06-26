/**
 * Сервис для работы с бонусами предметов экипировки
 * Централизованная точка доступа ко всем операциям с бонусами
 */

/**
 * Получение предрассчитанных бонусов предмета
 * @param {Object} item - Предмет экипировки
 * @returns {Object|null} - Предрассчитанные бонусы или null
 */
function getItemBonuses(item) {
  if (!item) return null;
  
  // Возвращаем только предрассчитанные бонусы, никаких вычислений
  return item.calculatedBonuses || null;
}

/**
 * Расчет суммарных бонусов от всех экипированных предметов
 * @param {Array|Object} equippedItems - Массив или объект с экипированными предметами
 * @returns {Object} - Суммарные бонусы экипировки
 */
function getEquipmentTotalBonuses(equippedItems) {
  // Создаем базовую структуру бонусов
  const totalBonuses = {
    stats: { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, perception: 0, luck: 0 },
    combat: { physicalDamage: 0, magicDamage: 0, physicalDefense: 0, magicDefense: 0, critChance: 0, critDamage: 0, dodgeChance: 0 },
    cultivation: { energyMax: 0, energyRegen: 0, comprehensionRate: 0, breakthroughChance: 0 },
    elemental: { fire: 0, water: 0, earth: 0, air: 0, light: 0, dark: 0 },
    special: []
  };
  
  // Подготавливаем массив предметов, независимо от того, что передано - массив или объект
  const itemsArray = Array.isArray(equippedItems) 
    ? equippedItems 
    : Object.values(equippedItems).filter(item => item !== null);
  
  // Получаем массив предрассчитанных бонусов для всех предметов
  const bonusesArray = itemsArray
    .map(item => item.calculatedBonuses)
    .filter(bonuses => bonuses !== null && bonuses !== undefined);
  
  // Суммируем все бонусы
  return aggregateBonuses(bonusesArray, totalBonuses);
}

/**
 * Суммирование массива бонусов в единую структуру
 * @param {Array} bonusesArray - Массив объектов бонусов
 * @param {Object} baseBonuses - Базовая структура для суммирования
 * @returns {Object} - Суммарные бонусы
 */
function aggregateBonuses(bonusesArray, baseBonuses = null) {
  // Используем переданную базовую структуру или создаем новую
  const result = baseBonuses || {
    stats: { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, perception: 0, luck: 0 },
    combat: { physicalDamage: 0, magicDamage: 0, physicalDefense: 0, magicDefense: 0, critChance: 0, critDamage: 0, dodgeChance: 0 },
    cultivation: { energyMax: 0, energyRegen: 0, comprehensionRate: 0, breakthroughChance: 0 },
    elemental: { fire: 0, water: 0, earth: 0, air: 0, light: 0, dark: 0 },
    special: []
  };
  
  // Проходим по всем объектам бонусов
  bonusesArray.forEach(bonuses => {
    if (!bonuses) return;
    
    // Суммируем базовые характеристики
    Object.keys(result.stats).forEach(stat => {
      if (bonuses.stats && bonuses.stats[stat] !== undefined) {
        result.stats[stat] += bonuses.stats[stat];
      }
    });
    
    // Суммируем боевые характеристики
    Object.keys(result.combat).forEach(stat => {
      if (bonuses.combat && bonuses.combat[stat] !== undefined) {
        result.combat[stat] += bonuses.combat[stat];
      }
    });
    
    // Суммируем характеристики культивации
    Object.keys(result.cultivation).forEach(stat => {
      if (bonuses.cultivation && bonuses.cultivation[stat] !== undefined) {
        result.cultivation[stat] += bonuses.cultivation[stat];
      }
    });
    
    // Суммируем стихийные бонусы
    Object.keys(result.elemental).forEach(element => {
      if (bonuses.elemental && bonuses.elemental[element] !== undefined) {
        result.elemental[element] += bonuses.elemental[element];
      }
    });
    
    // Добавляем особые эффекты
    if (bonuses.special && Array.isArray(bonuses.special)) {
      result.special = [...result.special, ...bonuses.special];
    }
  });
  
  return result;
}

/**
 * Проверка, имеет ли предмет предрассчитанные бонусы
 * @param {Object} item - Предмет для проверки
 * @returns {boolean} - true, если есть предрассчитанные бонусы
 */
function hasCalculatedBonuses(item) {
  return item && item.calculatedBonuses !== undefined && item.calculatedBonuses !== null;
}

/**
 * Создание пустой структуры бонусов
 * @returns {Object} - Пустая структура бонусов
 */
function createEmptyBonusStructure() {
  return {
    stats: { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, perception: 0, luck: 0 },
    combat: { physicalDamage: 0, magicDamage: 0, physicalDefense: 0, magicDefense: 0, critChance: 0, critDamage: 0, dodgeChance: 0 },
    cultivation: { energyMax: 0, energyRegen: 0, comprehensionRate: 0, breakthroughChance: 0 },
    elemental: { fire: 0, water: 0, earth: 0, air: 0, light: 0, dark: 0 },
    special: []
  };
}

module.exports = {
  getItemBonuses,
  getEquipmentTotalBonuses,
  aggregateBonuses,
  hasCalculatedBonuses,
  createEmptyBonusStructure
};
