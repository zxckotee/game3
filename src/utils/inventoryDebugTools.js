/**
 * Отладочные инструменты для работы с инвентарем
 */

// Глобальные переменные для доступа из консоли
let inventoryDebugTools = {};

/**
 * Инициализирует инструменты отладки инвентаря в глобальном пространстве
 */
export function initInventoryDebugTools() {
  if (typeof window === 'undefined') return;

  console.log('Инициализация инструментов отладки инвентаря...');
  
  // Функция для получения текущего инвентаря через менеджер
  const getCurrentInventory = () => {
    if (!window.inventoryManager) {
      console.error('InventoryManager не инициализирован');
      return [];
    }
    return window.inventoryManager.getItems();
  };
  
  // Функция для отображения инвентаря в консоли
  const displayInventory = (items = null) => {
    const inventoryItems = items || getCurrentInventory();
    console.log('Текущий инвентарь:');
    console.table(inventoryItems.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      quantity: item.quantity,
      equipped: item.equipped ? '✅' : '❌'
    })));
    return inventoryItems;
  };
  
  // Функция для получения ID текущего пользователя из токена
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Безопасное извлечение ID пользователя из токена
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload.userId || payload.sub;
      }
      return null;
    } catch (err) {
      console.error('Ошибка при получении ID пользователя из токена:', err);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение инвентаря
  const testGetInventory = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/users/${userId}/inventory...`);
      const response = await fetch(`/api/users/${userId}/inventory`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const items = await response.json();
      console.log('Получены предметы с сервера:', items);
      return items;
    } catch (error) {
      console.error('Ошибка при получении инвентаря:', error);
      return null;
    }
  };
  
  // Функция для тестирования добавления предмета через API
  const testAddItem = async (item) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!item || !item.name) {
      console.error('Необходимо указать корректный предмет');
      return null;
    }
    
    // Создаем тестовый предмет, если передан только строковый идентификатор
    if (typeof item === 'string') {
      item = {
        id: `test-${Date.now()}`,
        name: item,
        type: 'misc',
        rarity: 'common',
        quantity: 1,
        description: 'Тестовый предмет'
      };
    }
    
    try {
      console.log(`Запрос POST /api/users/${userId}/inventory...`);
      const response = await fetch(`/api/users/${userId}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(item)
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const newItem = await response.json();
      console.log('Предмет успешно добавлен:', newItem);
      return newItem;
    } catch (error) {
      console.error('Ошибка при добавлении предмета:', error);
      return null;
    }
  };
  
  // Функция для тестирования удаления предмета через API
  const testRemoveItem = async (itemId, quantity = 1) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return false;
    }
    
    if (!itemId) {
      console.error('Необходимо указать ID предмета');
      return false;
    }
    
    try {
      console.log(`Запрос DELETE /api/users/${userId}/inventory/${itemId}?quantity=${quantity}...`);
      const response = await fetch(`/api/users/${userId}/inventory/${itemId}?quantity=${quantity}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Результат удаления предмета:', result);
      return result.success;
    } catch (error) {
      console.error('Ошибка при удалении предмета:', error);
      return false;
    }
  };
  
  // Функция для тестирования экипировки предмета через API
  const testEquipItem = async (itemId, equipped = true) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!itemId) {
      console.error('Необходимо указать ID предмета');
      return null;
    }
    
    try {
      console.log(`Запрос PUT /api/users/${userId}/inventory/${itemId}/equip...`);
      const response = await fetch(`/api/users/${userId}/inventory/${itemId}/equip`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ equipped })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const updatedItem = await response.json();
      console.log('Предмет успешно обновлен:', updatedItem);
      return updatedItem;
    } catch (error) {
      console.error('Ошибка при экипировке предмета:', error);
      return null;
    }
  };
  
  // Функция для тестирования массового добавления предметов
  const testAddBatchItems = async (items) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      console.error('Необходимо указать массив предметов');
      return null;
    }
    
    // Если передан массив строк, преобразуем его в массив объектов
    const itemsToAdd = items.map(item => {
      if (typeof item === 'string') {
        return {
          id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: item,
          type: 'misc',
          rarity: 'common',
          quantity: 1,
          description: 'Тестовый предмет'
        };
      }
      return item;
    });
    
    try {
      console.log(`Запрос POST /api/users/${userId}/inventory/batch...`);
      const response = await fetch(`/api/users/${userId}/inventory/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ items: itemsToAdd })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Результат массового добавления:', result);
      return result;
    } catch (error) {
      console.error('Ошибка при массовом добавлении предметов:', error);
      return null;
    }
  };
  
  // Функция для тестирования фильтрации предметов
  const testFilterItems = async (filters) => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/users/${userId}/inventory/filter с фильтрами:`, filters);
      const response = await fetch(`/api/users/${userId}/inventory/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(filters)
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const items = await response.json();
      console.log('Отфильтрованные предметы:', items);
      return items;
    } catch (error) {
      console.error('Ошибка при фильтрации предметов:', error);
      return null;
    }
  };
  
  // Функция для создания тестовых предметов разных типов
  const createTestItems = (count = 5) => {
    const types = ['weapon', 'armor', 'accessory', 'resource', 'consumable', 'misc'];
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    
    const items = [];
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const rarity = rarities[Math.floor(Math.random() * rarities.length)];
      
      items.push({
        id: `test-${Date.now()}-${i}`,
        name: `Тестовый ${type} #${i+1}`,
        type,
        rarity,
        quantity: Math.floor(Math.random() * 10) + 1,
        value: Math.floor(Math.random() * 1000),
        properties: {
          description: `Тестовый предмет типа ${type}, созданный для отладки`,
          durability: Math.floor(Math.random() * 100) + 1
        }
      });
    }
    
    return items;
  };
  
  // Функция для тестирования синхронизации инвентаря
  const testSynchronization = async () => {
    if (!window.dispatchEvent) {
      console.error('API событий не доступен');
      return;
    }
    
    console.log('Генерация события inventory-changed...');
    window.dispatchEvent(new CustomEvent('inventory-changed'));
    console.log('Событие отправлено. Компонент InventorySynchronizer должен обновить инвентарь.');
  };
  
  // Функция для тестирования API через inventoryManager
  const testManagerOperations = async () => {
    if (!window.inventoryManager) {
      console.error('InventoryManager не инициализирован');
      return;
    }
    
    console.group('Тестирование API через inventoryManager');
    console.log('Получение текущего инвентаря...');
    const items = window.inventoryManager.getItems();
    console.log('Текущий инвентарь:', items);
    
    // Создаем тестовый предмет
    const testItem = {
      id: `test-${Date.now()}`,
      name: 'Тестовый предмет через Manager',
      type: 'misc',
      rarity: 'common',
      quantity: 1,
      description: 'Предмет, созданный через InventoryManager'
    };
    
    console.log('Добавление тестового предмета...');
    const addedItem = await window.inventoryManager.addItem(testItem);
    console.log('Результат добавления:', addedItem);
    
    // Получаем обновленный инвентарь
    const updatedItems = window.inventoryManager.getItems();
    console.log('Обновленный инвентарь:', updatedItems);
    
    console.groupEnd();
    
    return {
      initialItems: items,
      addedItem,
      updatedItems
    };
  };
  
  // Создаем объект с функциями отладки
  inventoryDebugTools = {
    getInventory: getCurrentInventory,
    displayInventory,
    testGetInventory,
    testAddItem,
    testRemoveItem,
    testEquipItem,
    testAddBatchItems,
    testFilterItems,
    createTestItems,
    testSynchronization,
    testManagerOperations
  };
  
  // Экспортируем функции в глобальное пространство
  window.inventoryDebug = inventoryDebugTools;
  console.log('Инструменты отладки инвентаря инициализированы. Используйте window.inventoryDebug для доступа.');
  console.log('Доступные методы:', Object.keys(inventoryDebugTools).join(', '));
}

// Экспортируем объект с инструментами
export default inventoryDebugTools;