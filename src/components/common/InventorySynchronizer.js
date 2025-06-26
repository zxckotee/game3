import React, { useEffect, useCallback } from 'react';
import InventoryService from '../../services/inventory-adapter';

/**
 * Компонент для автоматической синхронизации инвентаря
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 * и выполняет принудительную синхронизацию при выходе из игры
 */
const InventorySynchronizer = ({ userId, items }) => {
  // Вынесем функцию синхронизации в useCallback для переиспользования
  const synchronizeInventory = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('Запуск синхронизации инвентаря для пользователя:', userId);
      
      // Получаем инвентарь с сервера
      const serverItems = await InventoryService.getInventoryItems(userId);
      
      // Отправляем событие с обновленными данными
      window.dispatchEvent(new CustomEvent('inventory-updated', {
        detail: { items: serverItems }
      }));
      
      console.log('Инвентарь успешно синхронизирован, получено предметов:', serverItems.length);
      return serverItems;
    } catch (error) {
      console.error('Ошибка при синхронизации инвентаря:', error);
      return null;
    }
  }, [userId]);
  
  // Эта функция больше не используется для автоматического сохранения инвентаря
  // Инвентарь теперь сохраняется только при выходе из игры через apiService.saveGameState(state, true)
  const saveLocalInventoryToServer = useCallback(async () => {
    // Функция сохранена для обратной совместимости, но фактически ничего не делает
    // Теперь инвентарь сохраняется централизованно через api.js с флагом isExiting=true
    console.log('[Deprecated] Запрос сохранения инвентаря через InventorySynchronizer - операция переехала в api.saveGameState');
  }, []);
  
  useEffect(() => {
    if (!userId) return;
    
    // При изменении userId всегда запускаем синхронизацию инвентаря
    // Это гарантирует, что при смене пользователя (новая регистрация или вход)
    // будет загружен правильный инвентарь
    console.log(`[InventorySynchronizer] Обнаружено изменение userId: ${userId}, запуск синхронизации инвентаря`);
    synchronizeInventory();
    
    // Больше не устанавливаем интервал обновления - чтение инвентаря с сервера по-прежнему работает
    // но сохранение происходит только при выходе из игры через главный API
    
    // Создаем обработчики событий для обновления интерфейса при изменениях
    // Они только получают данные с сервера, но не отправляют изменения на сервер
    const handleInventoryChange = () => synchronizeInventory();
    const handleEquipmentChange = () => synchronizeInventory();
    const handleItemsAdded = () => synchronizeInventory();
    const handleItemsRemoved = () => synchronizeInventory();
    
    // Обработчик события очистки инвентаря
    const handleClearInventory = () => {
      console.log('[InventorySynchronizer] Получено событие очистки инвентаря');
      // Отправляем событие с пустым массивом предметов
      window.dispatchEvent(new CustomEvent('inventory-updated', {
        detail: { items: [] }
      }));
    };
    
    // Убираем обработчик beforeunload, так как он теперь добавлен в GamePage.js
    // и использует централизованное сохранение через api.saveGameState
    
    // Добавляем слушатели событий только для обновления интерфейса
    window.addEventListener('inventory-changed', handleInventoryChange);
    window.addEventListener('equipment-changed', handleEquipmentChange);
    window.addEventListener('items-added', handleItemsAdded);
    window.addEventListener('items-removed', handleItemsRemoved);
    window.addEventListener('clear-inventory', handleClearInventory);
    
    // Также добавляем обработчик для события выхода из игры или разлогина
    window.addEventListener('game-exit', saveLocalInventoryToServer);
    window.addEventListener('logout', saveLocalInventoryToServer);
    
    // Функция очистки при размонтировании компонента
    return () => {
      window.removeEventListener('inventory-changed', handleInventoryChange);
      window.removeEventListener('equipment-changed', handleEquipmentChange);
      window.removeEventListener('items-added', handleItemsAdded);
      window.removeEventListener('items-removed', handleItemsRemoved);
      window.removeEventListener('clear-inventory', handleClearInventory);
      window.removeEventListener('game-exit', saveLocalInventoryToServer);
      window.removeEventListener('logout', saveLocalInventoryToServer);
    };
  }, [userId, items, synchronizeInventory, saveLocalInventoryToServer]);
  
  // Компонент не рендерит UI
  return null;
};

// Значения по умолчанию для пропсов
InventorySynchronizer.defaultProps = {
  items: []
};

export default InventorySynchronizer;