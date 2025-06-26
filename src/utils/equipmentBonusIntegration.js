/**
 * Интеграция системы бонусов экипировки с контекстом игры
 * Этот файл содержит функции для подключения нашей системы бонусов к существующему игровому контексту
 */
import { initializeBonusSystem, debugBonusSystem } from './equipmentBonusInitializer';
import { updatePlayerEquipmentBonuses } from './equipmentStateUpdater';
import { isWorkingOffline, initOfflineMode } from './equipmentOfflineMode';

/**
 * Интегрирует систему бонусов с контекстом игры
 * @param {Object} gameContext - Контекст игры (объект, содержащий state и actions)
 */
export function integrateWithGameContext(gameContext) {
  if (!gameContext || !gameContext.state || !gameContext.actions) {
    console.error('[equipmentBonusIntegration] Невозможно интегрировать: контекст игры недоступен или неполный');
    return;
  }
  
  console.log('[equipmentBonusIntegration] Интеграция системы бонусов с контекстом игры');
  
  // Проверяем, работаем ли в автономном режиме
  if (isWorkingOffline()) {
    console.log('[equipmentBonusIntegration] Работа в автономном режиме');
    initOfflineMode(gameContext);
  }
  
  // Расширяем actions контекста игры
  const originalDispatch = gameContext.actions.dispatch;
  
  // Проверяем наличие действий, связанных с экипировкой
  if (!gameContext.actions.equipItem) {
    console.log('[equipmentBonusIntegration] Добавление действия equipItem в контекст игры');
    
    // Добавляем действие для экипировки предмета
    gameContext.actions.equipItem = (item) => {
      console.log('[equipmentBonusIntegration] Вызов equipItem для', item?.name || item?.id);
      
      try {
        // В автономном режиме используем упрощенную версию
        if (isWorkingOffline()) {
          originalDispatch({
            type: 'EQUIP_ITEM',
            payload: { 
              itemId: item.id,
              itemType: item.type,
              armorType: item.properties?.armorType || item.armorType
            }
          });
        } else {
          const { equipItemWithType } = require('../actions/inventory-actions');
          originalDispatch(equipItemWithType(item));
        }
        
        // Обновляем бонусы после экипировки
        setTimeout(() => {
          updatePlayerEquipmentBonuses(gameContext.state, originalDispatch);
        }, 50);
      } catch (error) {
        console.error('[equipmentBonusIntegration] Ошибка при экипировке предмета:', error);
        
        // В случае ошибки всё равно пытаемся экипировать предмет
        originalDispatch({
          type: 'EQUIP_ITEM',
          payload: { 
            itemId: item.id,
            itemType: item.type
          }
        });
        
        // И обновить бонусы
        setTimeout(() => {
          updatePlayerEquipmentBonuses(gameContext.state, originalDispatch);
        }, 50);
      }
    };
  }
  
  // Добавляем действие для снятия предмета, если оно отсутствует
  if (!gameContext.actions.unequipItem) {
    console.log('[equipmentBonusIntegration] Добавление действия unequipItem в контекст игры');
    
    gameContext.actions.unequipItem = (itemId) => {
      console.log('[equipmentBonusIntegration] Вызов unequipItem для', itemId);
      
      try {
        // В автономном режиме используем упрощенную версию
        if (isWorkingOffline()) {
          originalDispatch({
            type: 'UNEQUIP_ITEM',
            payload: { itemId }
          });
        } else {
          const { unequipItem } = require('../actions/inventory-actions');
          originalDispatch(unequipItem(itemId));
        }
        
        // Обновляем бонусы после снятия
        setTimeout(() => {
          updatePlayerEquipmentBonuses(gameContext.state, originalDispatch);
        }, 50);
      } catch (error) {
        console.error('[equipmentBonusIntegration] Ошибка при снятии предмета:', error);
        
        // В случае ошибки всё равно пытаемся снять предмет
        originalDispatch({
          type: 'UNEQUIP_ITEM',
          payload: { itemId }
        });
        
        // И обновить бонусы
        setTimeout(() => {
          updatePlayerEquipmentBonuses(gameContext.state, originalDispatch);
        }, 50);
      }
    };
  }
  
  // Добавляем действие для явного применения бонусов экипировки
  if (!gameContext.actions.applyEquipmentBonuses) {
    console.log('[equipmentBonusIntegration] Добавление действия applyEquipmentBonuses в контекст игры');
    
    gameContext.actions.applyEquipmentBonuses = () => {
      console.log('[equipmentBonusIntegration] Вызов applyEquipmentBonuses');
      
      // Обновляем бонусы
      return updatePlayerEquipmentBonuses(gameContext.state, originalDispatch);
    };
  }
  
  console.log('[equipmentBonusIntegration] Интеграция завершена успешно');
  
  // Инициализируем систему бонусов
  console.log('[equipmentBonusIntegration] Запуск инициализации системы бонусов');
  initializeBonusSystem(gameContext.state, originalDispatch);
  
  // Выводим отладочную информацию
  setTimeout(() => {
    debugBonusSystem(gameContext.state);
  }, 100);
}

/**
 * Обновляет бонусы экипировки при загрузке компонента
 * Эту функцию следует вызывать в useEffect компонентов, связанных с экипировкой
 * @param {Object} gameContext - Контекст игры (объект, содержащий state и actions)
 */
export function updateBonusesOnMount(gameContext) {
  if (!gameContext || !gameContext.state || !gameContext.actions) {
    console.error('[equipmentBonusIntegration] Невозможно обновить бонусы: контекст игры недоступен или неполный');
    return;
  }
  
  console.log('[equipmentBonusIntegration] Обновление бонусов при монтировании компонента');
  
  // Проверяем, работаем ли в автономном режиме
  if (isWorkingOffline()) {
    console.log('[equipmentBonusIntegration] Обновление бонусов в автономном режиме');
  }
  
  // Обновляем бонусы
  updatePlayerEquipmentBonuses(gameContext.state, gameContext.actions.dispatch);
}

export default {
  integrateWithGameContext,
  updateBonusesOnMount
};