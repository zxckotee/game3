/**
 * Модуль для инициализации системы бонусов экипировки при загрузке игры
 */
import { initializeEquipmentBonuses } from './equipmentStateUpdater';

/**
 * Инициализирует систему бонусов экипировки
 * @param {Object} gameState - Текущее состояние игры
 * @param {Function} dispatch - Функция dispatch для обновления состояния
 */
export function initializeBonusSystem(gameState, dispatch) {
  console.log('[equipmentBonusInitializer] Запуск инициализации системы бонусов экипировки');
  
  // Проверяем доступность состояния игры
  if (!gameState || !gameState.player) {
    console.warn('[equipmentBonusInitializer] Невозможно инициализировать: состояние игры недоступно');
    return;
  }
  
  // Проверяем доступность функции dispatch
  if (!dispatch) {
    console.warn('[equipmentBonusInitializer] Невозможно инициализировать: функция dispatch недоступна');
    return;
  }
  
  // Выводим информацию о состоянии игры
  console.log('[equipmentBonusInitializer] Состояние инвентаря доступно:', !!gameState.player.inventory);
  console.log('[equipmentBonusInitializer] Предметы в инвентаре:', gameState.player.inventory?.items?.length || 0);
  
  try {
    // Инициализируем бонусы экипировки
    const bonuses = initializeEquipmentBonuses(gameState, dispatch);
    
    console.log('[equipmentBonusInitializer] Инициализация завершена успешно');
    console.log('[equipmentBonusInitializer] Рассчитанные бонусы:', JSON.stringify(bonuses));
    
    return bonuses;
  } catch (error) {
    console.error('[equipmentBonusInitializer] Ошибка при инициализации бонусов:', error);
  }
}

/**
 * Проверяет и выводит в консоль детальную информацию о состоянии бонусов
 * @param {Object} gameState - Текущее состояние игры
 */
export function debugBonusSystem(gameState) {
  console.log('[equipmentBonusInitializer] === ОТЛАДКА СИСТЕМЫ БОНУСОВ ===');
  
  if (!gameState || !gameState.player) {
    console.warn('[equipmentBonusInitializer] Состояние игры недоступно');
    return;
  }
  
  // Проверяем наличие бонусов экипировки в состоянии
  const equipmentBonuses = gameState.player.equipmentBonuses;
  if (equipmentBonuses) {
    console.log('[equipmentBonusInitializer] Бонусы экипировки найдены в состоянии игрока');
    console.log('[equipmentBonusInitializer] Бонусы характеристик:', equipmentBonuses.stats);
    
    // Проверяем конкретные значения
    console.log('[equipmentBonusInitializer] Бонус силы:', equipmentBonuses.stats.strength);
    console.log('[equipmentBonusInitializer] Бонус физического урона:', equipmentBonuses.combat.physicalDamage);
    
    // Выводим информацию о ненулевых бонусах
    let hasNonZeroValues = false;
    
    // Проверяем базовые характеристики
    Object.entries(equipmentBonuses.stats).forEach(([stat, value]) => {
      if (value !== 0) {
        hasNonZeroValues = true;
        console.log(`[equipmentBonusInitializer] Ненулевой бонус: ${stat} = ${value}`);
      }
    });
    
    // Проверяем боевые характеристики
    Object.entries(equipmentBonuses.combat).forEach(([stat, value]) => {
      if (value !== 0) {
        hasNonZeroValues = true;
        console.log(`[equipmentBonusInitializer] Ненулевой бонус: ${stat} = ${value}`);
      }
    });
    
    if (!hasNonZeroValues) {
      console.warn('[equipmentBonusInitializer] Все бонусы равны нулю, возможно, система не работает корректно');
    }
  } else {
    console.warn('[equipmentBonusInitializer] Бонусы экипировки отсутствуют в состоянии игрока');
  }
  
  // Проверяем наличие экипированных предметов и их эффектов
  const inventory = gameState.player.inventory;
  if (inventory && inventory.items) {
    const equippedItems = inventory.items.filter(item => item.equipped);
    console.log(`[equipmentBonusInitializer] Экипированные предметы: ${equippedItems.length}`);
    
    equippedItems.forEach(item => {
      console.log(`[equipmentBonusInitializer] Предмет: ${item.name || item.id}`);
      if (item.effects && Array.isArray(item.effects)) {
        console.log(`[equipmentBonusInitializer] Эффекты (${item.effects.length}):`);
        item.effects.forEach((effect, index) => {
          console.log(`[equipmentBonusInitializer] Эффект #${index + 1}: тип=${effect.type}, цель=${effect.target}, значение=${effect.value}`);
        });
      } else {
        console.warn(`[equipmentBonusInitializer] У предмета ${item.name || item.id} нет эффектов`);
      }
    });
  } else {
    console.warn('[equipmentBonusInitializer] Инвентарь недоступен или не содержит предметов');
  }
  
  console.log('[equipmentBonusInitializer] === КОНЕЦ ОТЛАДКИ СИСТЕМЫ БОНУСОВ ===');
}

export default {
  initializeBonusSystem,
  debugBonusSystem
};