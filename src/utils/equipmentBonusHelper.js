/**
 * Вспомогательные функции для работы с бонусами экипировки
 */

import { calculateEquipmentBonusesFromInventory, createEmptyBonusStructure } from './equipmentBonusCalculator';

/**
 * Гарантирует, что предмет имеет рассчитанные бонусы
 * Если у предмета нет рассчитанных бонусов, они будут созданы на основе эффектов
 * @param {Object} item - Предмет
 * @returns {Object} - Предмет с гарантированными бонусами
 */
export function ensureItemHasCalculatedBonuses(item) {
  if (!item) return item;
  
  // Если у предмета уже есть предрассчитанные бонусы, возвращаем как есть
  if (item.calculatedBonuses) {
    console.log(`[equipmentBonusHelper] Предмет ${item.name || item.id} уже имеет предрассчитанные бонусы`);
    return item;
  }
  
  console.log(`[equipmentBonusHelper] Расчет бонусов для предмета ${item.name || item.id}`);
  
  // Если есть эффекты, рассчитываем бонусы на лету
  if (item.effects && Array.isArray(item.effects)) {
    console.log(`[equipmentBonusHelper] У предмета найдены эффекты: ${item.effects.length}`);
    
    // Используем нашу утилиту для расчета бонусов
    // Создаем временный массив с одним предметом
    const tempItem = { ...item, equipped: true };
    const calculatedBonuses = calculateEquipmentBonusesFromInventory([tempItem]);
    
    // Проверяем результаты расчета
    console.log(`[equipmentBonusHelper] Рассчитанные бонусы:`, JSON.stringify(calculatedBonuses));
    console.log(`[equipmentBonusHelper] Бонус силы: ${calculatedBonuses.stats.strength}`);
    console.log(`[equipmentBonusHelper] Бонус физического урона: ${calculatedBonuses.combat.physicalDamage}`);
    
    // Добавляем рассчитанные бонусы к предмету
    return {
      ...item,
      calculatedBonuses
    };
  }
  
  // Если эффектов нет, возвращаем предмет с пустыми бонусами
  console.log(`[equipmentBonusHelper] У предмета нет эффектов, создаем пустые бонусы`);
  return {
    ...item,
    calculatedBonuses: createEmptyBonusStructure()
  };
}

// Экспортируем функцию под другим именем для обратной совместимости
export const ensureEquipmentHasCalculatedBonuses = ensureItemHasCalculatedBonuses;

/**
 * Извлекает отображаемое имя характеристики
 * @param {string} statName - Техническое имя характеристики
 * @returns {string} - Отображаемое имя
 */
export function getStatDisplayName(statName) {
  const displayNames = {
    // Базовые характеристики
    'strength': 'Сила',
    'dexterity': 'Ловкость',
    'vitality': 'Выносливость',
    'intelligence': 'Интеллект',
    'perception': 'Восприятие',
    'luck': 'Удача',
    
    // Боевые характеристики
    'physicalDamage': 'Физический урон',
    'magicDamage': 'Магический урон',
    'physicalDefense': 'Физическая защита',
    'magicDefense': 'Магическая защита',
    'critChance': 'Шанс крит. удара',
    'critDamage': 'Урон от крит. удара',
    'dodgeChance': 'Шанс уклонения',
    
    // Характеристики культивации
    'energyMax': 'Макс. энергия',
    'energyRegen': 'Восст. энергии',
    'comprehensionRate': 'Скорость понимания',
    'breakthroughChance': 'Шанс прорыва',
    
    // Стихийные бонусы
    'fire': 'Огонь',
    'water': 'Вода',
    'earth': 'Земля',
    'air': 'Воздух',
    'light': 'Свет',
    'dark': 'Тьма'
  };
  
  return displayNames[statName] || statName;
}

/**
 * Форматирует значение характеристики для отображения
 * @param {string} statName - Имя характеристики
 * @param {number} value - Значение
 * @returns {string} - Форматированное значение
 */
export function formatStatValue(statName, value) {
  // Если значение 0, просто возвращаем "0"
  if (value === 0) return '0';
  
  // Добавляем "+" для положительных значений
  const prefix = value > 0 ? '+' : '';
  
  // Для некоторых характеристик добавляем суффикс
  const percentStats = ['critChance', 'critDamage', 'dodgeChance', 'comprehensionRate', 'breakthroughChance'];
  
  if (percentStats.includes(statName)) {
    return `${prefix}${value}%`;
  }
  
  const regenStats = ['energyRegen'];
  if (regenStats.includes(statName)) {
    return `${prefix}${value}/час`;
  }
  
  return `${prefix}${value}`;
}

/**
 * Выводит отладочную информацию о бонусах предмета
 * @param {Object} item - Предмет
 */
export function debugItemBonuses(item) {
  if (!item) {
    console.log(`[equipmentBonusHelper] Невозможно отладить бонусы: предмет не предоставлен`);
    return;
  }
  
  console.log(`[equipmentBonusHelper] === ОТЛАДКА БОНУСОВ ПРЕДМЕТА ===`);
  console.log(`[equipmentBonusHelper] Предмет: ${item.name || item.id}`);
  console.log(`[equipmentBonusHelper] Тип: ${item.type}`);
  console.log(`[equipmentBonusHelper] Экипирован: ${item.equipped ? 'Да' : 'Нет'}`);
  
  if (item.effects && Array.isArray(item.effects)) {
    console.log(`[equipmentBonusHelper] Эффекты: ${item.effects.length}`);
    item.effects.forEach((effect, index) => {
      console.log(`[equipmentBonusHelper] Эффект #${index + 1}:`);
      console.log(`[equipmentBonusHelper] - Тип: ${effect.type}`);
      console.log(`[equipmentBonusHelper] - Цель: ${effect.target}`);
      console.log(`[equipmentBonusHelper] - Значение: ${effect.value}`);
    });
  } else {
    console.log(`[equipmentBonusHelper] У предмета нет эффектов`);
  }
  
  // Рассчитываем бонусы на лету
  const itemWithBonuses = ensureItemHasCalculatedBonuses(item);
  
  if (itemWithBonuses.calculatedBonuses) {
    console.log(`[equipmentBonusHelper] Рассчитанные бонусы:`);
    console.log(`[equipmentBonusHelper] Бонусы характеристик:`, itemWithBonuses.calculatedBonuses.stats);
    console.log(`[equipmentBonusHelper] Боевые бонусы:`, itemWithBonuses.calculatedBonuses.combat);
    console.log(`[equipmentBonusHelper] Бонусы культивации:`, itemWithBonuses.calculatedBonuses.cultivation);
    console.log(`[equipmentBonusHelper] Стихийные бонусы:`, itemWithBonuses.calculatedBonuses.elemental);
    console.log(`[equipmentBonusHelper] Особые эффекты:`, itemWithBonuses.calculatedBonuses.special);
  } else {
    console.log(`[equipmentBonusHelper] Не удалось рассчитать бонусы`);
  }
  
  console.log(`[equipmentBonusHelper] === КОНЕЦ ОТЛАДКИ БОНУСОВ ===`);
}

export default {
  ensureItemHasCalculatedBonuses,
  ensureEquipmentHasCalculatedBonuses,
  getStatDisplayName,
  formatStatValue,
  debugItemBonuses
};
