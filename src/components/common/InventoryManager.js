import React, { useState, useEffect, useCallback } from 'react';
import InventoryService from '../../services/inventory-adapter';
import InventorySynchronizer from './InventorySynchronizer';

/**
 * Компонент для управления инвентарем
 * Предоставляет методы для работы с инвентарем и синхронизирует данные с сервером
 */
const InventoryManager = () => {
  // Локальное состояние вместо Redux
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  
  // Получаем ID пользователя из токена при монтировании
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Извлекаем ID пользователя из токена
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id || payload.userId || payload.sub);
      }
    } catch (error) {
      console.error('Ошибка при получении ID пользователя из токена:', error);
    }
  }, []);
  
  /**
   * Добавление предмета в инвентарь
   * @param {Object} item - Объект предмета
   * @returns {Promise<Object>} Добавленный предмет
   */
  const addItem = useCallback(async (item) => {
    if (!userId) {
      console.error('Невозможно добавить предмет: пользователь не авторизован');
      return null;
    }
    
    try {
      // Добавляем предмет через API
      const newItem = await InventoryService.addInventoryItem(userId, item);
      
      // Обновляем локальное состояние
      setItems(currentItems => [...currentItems, newItem]);
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('items-added', { 
        detail: { items: [newItem] } 
      }));
      
      return newItem;
    } catch (error) {
      console.error('Ошибка при добавлении предмета:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Удаление предмета из инвентаря
   * @param {string} itemId - ID предмета
   * @param {number} quantity - Количество для удаления
   * @returns {Promise<boolean>} Результат операции
   */
  const removeItem = useCallback(async (itemId, quantity = 1) => {
    if (!userId) {
      console.error('Невозможно удалить предмет: пользователь не авторизован');
      return false;
    }
    
    try {
      // Удаляем предмет через API
      const success = await InventoryService.removeInventoryItem(userId, itemId, quantity);
      
      if (success) {
        // Обновляем локальное состояние
        setItems(currentItems => {
          const itemIndex = currentItems.findIndex(item => item.id === itemId);
          
          if (itemIndex === -1) return currentItems;
          
          const item = currentItems[itemIndex];
          
          // Если количество предметов меньше или равно указанному, полностью удаляем предмет
          if (item.quantity <= quantity) {
            return [...currentItems.slice(0, itemIndex), ...currentItems.slice(itemIndex + 1)];
          }
          
          // Иначе уменьшаем количество
          const updatedItem = { ...item, quantity: item.quantity - quantity };
          return [
            ...currentItems.slice(0, itemIndex),
            updatedItem,
            ...currentItems.slice(itemIndex + 1)
          ];
        });
        
        // Создаем событие для уведомления других компонентов
        window.dispatchEvent(new CustomEvent('items-removed', { 
          detail: { itemId, quantity }
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Ошибка при удалении предмета:', error);
      return false;
    }
  }, [userId]);
  
  /**
   * Экипировка/снятие предмета
   * @param {string} itemId - ID предмета
   * @param {boolean} equipped - Флаг экипировки
   * @returns {Promise<Object>} Обновленный предмет
   */
  const toggleEquip = useCallback(async (itemId, equipped) => {
    if (!userId) {
      console.error('Невозможно экипировать предмет: пользователь не авторизован');
      return null;
    }
    
    try {
      // Обновляем статус экипировки через API
      const updatedItem = await InventoryService.toggleEquipItem(userId, itemId, equipped);
      
      // Обновляем локальное состояние
      if (updatedItem) {
        setItems(currentItems => {
          const itemIndex = currentItems.findIndex(item => item.id === itemId);
          
          if (itemIndex === -1) return currentItems;
          
          return [
            ...currentItems.slice(0, itemIndex),
            updatedItem,
            ...currentItems.slice(itemIndex + 1)
          ];
        });
        
        // Создаем событие для уведомления других компонентов
        window.dispatchEvent(new CustomEvent('equipment-changed', { 
          detail: { item: updatedItem }
        }));
      }
      
      return updatedItem;
    } catch (error) {
      console.error('Ошибка при экипировке/снятии предмета:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Массовое добавление предметов
   * @param {Array} items - Массив предметов для добавления
   * @returns {Promise<Object>} Результат операции
   */
  const addBatchItems = useCallback(async (itemsToAdd) => {
    if (!userId || !Array.isArray(itemsToAdd) || itemsToAdd.length === 0) {
      return { success: false, message: 'Невалидные данные для добавления' };
    }
    
    try {
      // Выполняем запрос к API для массового добавления
      const response = await fetch(`/api/users/${userId}/inventory/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ items: itemsToAdd }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при массовом добавлении предметов');
      }
      
      const result = await response.json();
      
      // Получаем успешно добавленные предметы
      const successItems = result.results
        .filter(r => r.success)
        .map(r => r.item);
      
      // Обновляем локальное состояние только если есть успешно добавленные предметы
      if (successItems.length > 0) {
        setItems(currentItems => [...currentItems, ...successItems]);
        
        // Создаем событие для уведомления других компонентов
        window.dispatchEvent(new CustomEvent('items-added', { 
          detail: { items: successItems } 
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Ошибка при массовом добавлении предметов:', error);
      return { 
        success: false, 
        error: error.message,
        totalProcessed: itemsToAdd.length,
        successCount: 0,
        failureCount: itemsToAdd.length
      };
    }
  }, [userId]);
  
  /**
   * Получение отфильтрованных предметов
   * @param {Object} filters - Объект с фильтрами
   * @returns {Promise<Array>} Отфильтрованные предметы
   */
  const getFilteredItems = useCallback(async (filters) => {
    if (!userId) {
      return [];
    }
    
    try {
      // Выполняем запрос к API для фильтрации
      const response = await fetch(`/api/users/${userId}/inventory/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(filters),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при фильтрации предметов');
      }
      
      const filteredItems = await response.json();
      return filteredItems;
    } catch (error) {
      console.error('Ошибка при фильтрации предметов:', error);
      
      // В случае ошибки, пытаемся фильтровать локально
      try {
        if (!filters) return items;
        
        return items.filter(item => {
          // Проверяем каждый фильтр
          for (const [key, value] of Object.entries(filters)) {
            if (Array.isArray(value)) {
              // Если значение фильтра - массив, проверяем включение
              if (!value.includes(item[key])) return false;
            } else if (value !== undefined && item[key] !== value) {
              // Иначе проверяем точное соответствие
              return false;
            }
          }
          return true;
        });
      } catch (localError) {
        console.error('Ошибка при локальной фильтрации:', localError);
        return [];
      }
    }
  }, [userId, items]);
  
  // Загрузка данных инвентаря при монтировании
  useEffect(() => {
    if (userId) {
      // Загружаем предметы пользователя
      const loadInventory = async () => {
        try {
          const userItems = await InventoryService.getInventoryItems(userId);
          if (userItems && Array.isArray(userItems)) {
            setItems(userItems);
          }
        } catch (error) {
          console.error('Ошибка при загрузке инвентаря:', error);
        }
      };
      
      loadInventory();
    }
  }, [userId]);
  
  // Экспортируем методы через глобальный объект для доступа из других компонентов
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      if (!window.inventoryManager) {
        window.inventoryManager = {};
      }
      
      window.inventoryManager = {
        addItem,
        removeItem,
        toggleEquip,
        addBatchItems,
        getFilteredItems,
        getItems: () => items
      };
      
      // Добавляем функции для обратной совместимости с существующим кодом
      if (!window.gameManager) {
        window.gameManager = { inventory: {} };
      } else if (!window.gameManager.inventory) {
        window.gameManager.inventory = {};
      }
      
      window.gameManager.inventory = {
        addItem,
        removeItem,
        equipItem: (itemId) => toggleEquip(itemId, true),
        unequipItem: (itemId) => toggleEquip(itemId, false),
        getItems: () => items
      };
    }
  }, [userId, items, addItem, removeItem, toggleEquip, addBatchItems, getFilteredItems]);
  
  return <InventorySynchronizer userId={userId} items={items} />;
};

export default InventoryManager;