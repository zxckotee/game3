/**
 * Утилиты для обновления состояния игры, связанного с экипировкой
 */

import { calculateEquipmentBonusesFromInventory } from './equipmentBonusCalculator';
import { updateEquipmentBonuses as updateEquipmentBonusesAction } from '../actions/inventory-actions';

/**
 * Обновляет бонусы экипировки в состоянии игрока
 * @param {Object} state - Текущее состояние игры
 * @param {Function} dispatch - Функция dispatch для обновления состояния
 * @returns {Object} - Рассчитанные бонусы экипировки
 */
export function updatePlayerEquipmentBonuses(state, dispatch) {
  // Проверяем наличие инвентаря
  if (!state.player || !state.player.inventory || !state.player.inventory.items) {
    console.warn('[equipmentStateUpdater] Невозможно обновить бонусы: инвентарь недоступен');
    return null;
  }
  
  console.log('[equipmentStateUpdater] Запуск обновления бонусов экипировки');
  
  // Выводим информацию о предметах в инвентаре
  console.log(`[equipmentStateUpdater] Всего предметов: ${state.player.inventory.items.length}`);
  const equippedItems = state.player.inventory.items.filter(item => item.equipped);
  console.log(`[equipmentStateUpdater] Экипированные предметы: ${equippedItems.length}`);
  
  // Выводим детальную информацию о эффектах предметов
  equippedItems.forEach(item => {
    console.log(`[equipmentStateUpdater] Предмет: ${item.name || item.id}`);
    if (item.effects && Array.isArray(item.effects)) {
      console.log(`[equipmentStateUpdater] - Количество эффектов: ${item.effects.length}`);
      console.log(`[equipmentStateUpdater] - Эффекты:`, JSON.stringify(item.effects));
    } else {
      console.log(`[equipmentStateUpdater] - Эффекты отсутствуют или не в массиве`);
    }
  });
  
  // Рассчитываем бонусы на основе экипированных предметов
  const equipmentBonuses = calculateEquipmentBonusesFromInventory(state.player.inventory.items);
  
  console.log('[equipmentStateUpdater] Бонусы рассчитаны:', JSON.stringify(equipmentBonuses));
  
  // Выводим полные данные для отладки
  console.log('[equipmentStateUpdater] Бонусы силы:', equipmentBonuses.stats.strength);
  console.log('[equipmentStateUpdater] Бонусы физического урона:', equipmentBonuses.combat.physicalDamage);
  
  // Обновляем состояние с новыми бонусами, если доступен dispatch
  if (dispatch) {
    try {
      // Используем action creator для создания правильного действия
      dispatch(updateEquipmentBonusesAction(equipmentBonuses));
      console.log('[equipmentStateUpdater] Состояние обновлено с новыми бонусами');
    } catch (error) {
      console.error('[equipmentStateUpdater] Ошибка при обновлении состояния:', error);
    }
  } else {
    console.warn('[equipmentStateUpdater] Dispatch недоступен, состояние не обновлено');
  }
  
  return equipmentBonuses;
}

/**
 * Обработчик события экипировки предмета
 * @param {Object} state - Текущее состояние игры
 * @param {Function} dispatch - Функция dispatch для обновления состояния
 * @param {string} itemId - ID предмета для экипировки
 */
export function handleEquipItem(state, dispatch, itemId) {
  if (!dispatch) {
    console.error('[equipmentStateUpdater] Функция dispatch не предоставлена');
    return;
  }
  
  if (!itemId) {
    console.error('[equipmentStateUpdater] ID предмета не предоставлен');
    return;
  }
  
  console.log(`[equipmentStateUpdater] Экипировка предмета: ${itemId}`);
  
  // Находим предмет в инвентаре
  const item = state.player?.inventory?.items?.find(i => i.id === itemId || i.itemId === itemId);
  
  if (!item) {
    console.error(`[equipmentStateUpdater] Предмет с ID ${itemId} не найден в инвентаре`);
    return;
  }
  
  console.log(`[equipmentStateUpdater] Найден предмет для экипировки: ${item.name || item.id}`);
  
  // Находим соответствующий action creator из нового файла actions/inventory-actions.js
  // Импортируем действие для экипировки предмета
  try {
    const { equipItemWithType } = require('../actions/inventory-actions');
    
    // Экипируем предмет с определением типа
    dispatch(equipItemWithType(item));
    
    console.log(`[equipmentStateUpdater] Предмет успешно экипирован: ${item.name || item.id}`);
    
    // После изменения экипировки обновляем бонусы
    // Используем setTimeout, чтобы дать состоянию обновиться
    setTimeout(() => {
      updatePlayerEquipmentBonuses(state, dispatch);
    }, 50);
    
  } catch (error) {
    console.error('[equipmentStateUpdater] Ошибка при экипировке предмета:', error);
    
    // Запасной вариант, если импорт не работает
    try {
      dispatch({
        type: 'EQUIP_ITEM',
        payload: { 
          itemId,
          itemType: item.type,
          armorType: item.properties?.armorType || item.armorType
        }
      });
      
      // После изменения экипировки обновляем бонусы
      setTimeout(() => {
        updatePlayerEquipmentBonuses(state, dispatch);
      }, 50);
      
    } catch (innerError) {
      console.error('[equipmentStateUpdater] Критическая ошибка при экипировке предмета:', innerError);
    }
  }
}

/**
 * Обработчик события снятия предмета
 * @param {Object} state - Текущее состояние игры
 * @param {Function} dispatch - Функция dispatch для обновления состояния
 * @param {string} itemId - ID предмета для снятия
 */
export function handleUnequipItem(state, dispatch, itemId) {
  if (!dispatch) {
    console.error('[equipmentStateUpdater] Функция dispatch не предоставлена');
    return;
  }
  
  if (!itemId) {
    console.error('[equipmentStateUpdater] ID предмета не предоставлен');
    return;
  }
  
  console.log(`[equipmentStateUpdater] Снятие предмета: ${itemId}`);
  
  // Снимаем предмет
  try {
    const { unequipItem } = require('../actions/inventory-actions');
    dispatch(unequipItem(itemId));
  } catch (error) {
    console.error('[equipmentStateUpdater] Ошибка при импорте action creator:', error);
    
    // Запасной вариант
    dispatch({
      type: 'UNEQUIP_ITEM',
      payload: { itemId }
    });
  }
  
  console.log(`[equipmentStateUpdater] Предмет успешно снят: ${itemId}`);
  
  // После изменения экипировки обновляем бонусы
  // Используем setTimeout, чтобы дать состоянию обновиться
  setTimeout(() => {
    updatePlayerEquipmentBonuses(state, dispatch);
  }, 50);
}

/**
 * Инициализирует бонусы экипировки при загрузке игры
 * @param {Object} state - Текущее состояние игры
 * @param {Function} dispatch - Функция dispatch для обновления состояния
 */
export function initializeEquipmentBonuses(state, dispatch) {
  console.log('[equipmentStateUpdater] Инициализация бонусов экипировки');
  
  if (!state.player || !state.player.inventory || !state.player.inventory.items) {
    console.warn('[equipmentStateUpdater] Невозможно инициализировать бонусы: инвентарь недоступен');
    return null;
  }
  
  // Выводим информацию о предметах в инвентаре
  console.log(`[equipmentStateUpdater] Всего предметов при инициализации: ${state.player.inventory.items.length}`);
  const equippedItems = state.player.inventory.items.filter(item => item.equipped);
  console.log(`[equipmentStateUpdater] Экипированные предметы при инициализации: ${equippedItems.length}`);
  
  // Детальная информация для отладки
  equippedItems.forEach(item => {
    console.log(`[equipmentStateUpdater] Предмет: ${item.name || item.id}`);
    if (item.effects && Array.isArray(item.effects)) {
      console.log(`[equipmentStateUpdater] - Количество эффектов: ${item.effects.length}`);
      item.effects.forEach((effect, index) => {
        console.log(`[equipmentStateUpdater] -- Эффект ${index + 1}:`, JSON.stringify(effect));
      });
    } else {
      console.log(`[equipmentStateUpdater] - Эффекты отсутствуют или не в массиве`);
    }
  });
  
  return updatePlayerEquipmentBonuses(state, dispatch);
}

export default {
  updatePlayerEquipmentBonuses,
  handleEquipItem,
  handleUnequipItem,
  initializeEquipmentBonuses
};