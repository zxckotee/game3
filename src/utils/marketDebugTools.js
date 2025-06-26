/**
 * Отладочные инструменты для работы с рынком
 */

// Глобальные переменные для доступа из консоли
let marketDebugTools = {};

/**
 * Инициализирует инструменты отладки рынка в глобальном пространстве
 */
export function initMarketDebugTools() {
  if (typeof window === 'undefined') return;

  console.log('Инициализация инструментов отладки рынка...');
  
  // Функция для получения товаров из Redux-состояния
  const getMarketItemsFromState = () => {
    if (!window.__GAME_STATE__?.market?.items) {
      console.error('Данные о товарах на рынке не найдены в состоянии игры');
      return [];
    }
    return window.__GAME_STATE__.market.items;
  };
  
  // Функция для получения товаров пользователя из Redux-состояния
  const getUserListingsFromState = () => {
    if (!window.__GAME_STATE__?.market?.userListings) {
      console.error('Данные о товарах пользователя не найдены в состоянии игры');
      return [];
    }
    return window.__GAME_STATE__.market.userListings;
  };
  
  // Функция для отображения товаров на рынке в консоли
  const displayMarketItems = (items = null) => {
    const itemsData = items || getMarketItemsFromState();
    if (!itemsData || itemsData.length === 0) {
      console.log('Товары на рынке не найдены');
      return null;
    }
    
    console.log(`Найдено ${itemsData.length} товаров на рынке:`);
    console.table(itemsData.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      price: item.price,
      quantity: item.quantity,
      seller: item.sellerName
    })));
    
    return itemsData;
  };
  
  // Функция для отображения детальной информации о товаре
  const displayItemDetails = async (itemId) => {
    if (!itemId) {
      console.error('Необходимо указать ID товара');
      return null;
    }
    
    // Используем marketManager для получения товара
    if (!window.marketManager) {
      console.error('MarketManager не инициализирован');
      return null;
    }
    
    const item = await window.marketManager.getItemById(itemId);
    
    if (!item) {
      console.error(`Товар с ID ${itemId} не найден`);
      return null;
    }
    
    console.log(`Детальная информация о товаре ID ${itemId}:`);
    console.log('Название:', item.name);
    console.log('Описание:', item.description);
    console.log('Тип:', item.type);
    console.log('Редкость:', item.rarity);
    console.log('Цена:', item.price);
    console.log('Количество:', item.quantity);
    console.log('Продавец:', item.sellerName);
    console.log('Выставлен:', new Date(item.postedAt).toLocaleString());
    
    return item;
  };
  
  // Функция для отображения товаров по типу
  const displayItemsByType = async (type) => {
    if (!type) {
      console.error('Необходимо указать тип товара');
      return null;
    }
    
    // Используем marketManager для получения товаров
    if (!window.marketManager) {
      console.error('MarketManager не инициализирован');
      return null;
    }
    
    const items = await window.marketManager.getItemsByType(type);
    
    if (!items || items.length === 0) {
      console.log(`Товары типа ${type} не найдены`);
      return [];
    }
    
    console.log(`Найдено ${items.length} товаров типа "${type}":`);
    console.table(items.map(item => ({
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      price: item.price,
      quantity: item.quantity,
      seller: item.sellerName
    })));
    
    return items;
  };
  
  // Функция для поиска товаров по критериям
  const searchItems = async (criteria = {}) => {
    // Используем marketManager для поиска товаров
    if (!window.marketManager) {
      console.error('MarketManager не инициализирован');
      return null;
    }
    
    console.log('Поиск товаров по критериям:', criteria);
    
    const items = await window.marketManager.searchItems(criteria);
    
    if (!items || items.length === 0) {
      console.log('Товары, соответствующие критериям, не найдены');
      return [];
    }
    
    console.log(`Найдено ${items.length} товаров, соответствующих критериям:`);
    console.table(items.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      price: item.price,
      quantity: item.quantity,
      seller: item.sellerName
    })));
    
    return items;
  };
  
  // Функция для отображения товаров пользователя
  const displayUserListings = async () => {
    // Используем marketManager для получения товаров пользователя
    if (!window.marketManager) {
      console.error('MarketManager не инициализирован');
      return null;
    }
    
    const listings = await window.marketManager.getUserListings();
    
    if (!listings || listings.length === 0) {
      console.log('Товары пользователя не найдены');
      return [];
    }
    
    console.log(`Найдено ${listings.length} товаров пользователя на рынке:`);
    console.table(listings.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      price: item.price,
      quantity: item.quantity,
      posted: new Date(item.postedAt).toLocaleString()
    })));
    
    return listings;
  };
  
  // Функция для получения ID текущего пользователя
  const getCurrentUserId = () => {
    return window.__GAME_STATE__?.auth?.user?.id;
  };
  
  // Функция для тестирования API-запроса на получение всех товаров
  const testGetAllItems = async () => {
    try {
      console.log('Запрос GET /api/market/items...');
      const response = await fetch('/api/market/items', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const items = await response.json();
      console.log('Получены товары с рынка:', items);
      return items;
    } catch (error) {
      console.error('Ошибка при получении товаров с рынка:', error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение товара по ID
  const testGetItemById = async (itemId) => {
    if (!itemId) {
      console.error('Необходимо указать ID товара');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/market/items/${itemId}...`);
      const response = await fetch(`/api/market/items/${itemId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.status === 404) {
        console.error(`Товар с ID ${itemId} не найден`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const item = await response.json();
      console.log(`Получен товар с ID ${itemId}:`, item);
      return item;
    } catch (error) {
      console.error(`Ошибка при получении товара с ID ${itemId}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение товаров по типу
  const testGetItemsByType = async (type) => {
    if (!type) {
      console.error('Необходимо указать тип товара');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/market/items/type/${type}...`);
      const response = await fetch(`/api/market/items/type/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const items = await response.json();
      console.log(`Получены товары типа ${type}:`, items);
      return items;
    } catch (error) {
      console.error(`Ошибка при получении товаров типа ${type}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на поиск товаров
  const testSearchItems = async (criteria = {}) => {
    try {
      // Формируем URL запроса с параметрами
      const params = new URLSearchParams();
      
      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined) {
          params.append(key, value);
        }
      }
      
      const url = `/api/market/search?${params.toString()}`;
      console.log(`Запрос GET ${url}...`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const items = await response.json();
      console.log('Результаты поиска товаров:', items);
      return items;
    } catch (error) {
      console.error('Ошибка при поиске товаров:', error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на покупку товара
  const testBuyItem = async (itemId, quantity = 1) => {
    if (!itemId) {
      console.error('Необходимо указать ID товара');
      return null;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/market/items/${itemId}/buy...`);
      const response = await fetch(`/api/market/items/${itemId}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ userId, quantity })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Результат покупки товара:`, result);
      
      // Обновляем товары на рынке и инвентарь
      window.dispatchEvent(new CustomEvent('market-items-changed'));
      window.dispatchEvent(new CustomEvent('inventory-changed'));
      
      return result;
    } catch (error) {
      console.error(`Ошибка при покупке товара:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на продажу товара
  const testSellItem = async (itemData) => {
    if (!itemData) {
      console.error('Необходимо указать данные о товаре');
      return null;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос POST /api/market/sell...`);
      const response = await fetch('/api/market/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ userId, itemData })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Результат продажи товара:`, result);
      
      // Обновляем товары на рынке и инвентарь
      window.dispatchEvent(new CustomEvent('market-items-changed'));
      window.dispatchEvent(new CustomEvent('user-listings-changed'));
      window.dispatchEvent(new CustomEvent('inventory-changed'));
      
      return result;
    } catch (error) {
      console.error(`Ошибка при продаже товара:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на отмену продажи товара
  const testCancelListing = async (itemId) => {
    if (!itemId) {
      console.error('Необходимо указать ID товара');
      return null;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос DELETE /api/market/items/${itemId}/cancel...`);
      const response = await fetch(`/api/market/items/${itemId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Результат отмены продажи товара:`, result);
      
      // Обновляем товары на рынке и инвентарь
      window.dispatchEvent(new CustomEvent('market-items-changed'));
      window.dispatchEvent(new CustomEvent('user-listings-changed'));
      window.dispatchEvent(new CustomEvent('inventory-changed'));
      
      return result;
    } catch (error) {
      console.error(`Ошибка при отмене продажи товара:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение товаров пользователя
  const testGetUserListings = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Пользователь не авторизован');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/users/${userId}/market/listings...`);
      const response = await fetch(`/api/users/${userId}/market/listings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const listings = await response.json();
      console.log(`Получены товары пользователя:`, listings);
      return listings;
    } catch (error) {
      console.error(`Ошибка при получении товаров пользователя:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение констант
  const testGetConstants = async () => {
    try {
      console.log(`Запрос GET /api/market/constants...`);
      const response = await fetch('/api/market/constants', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const constants = await response.json();
      console.log(`Получены константы:`, constants);
      
      // Выводим типы товаров
      console.group('Типы товаров:');
      console.table(Object.entries(constants.MARKET_ITEM_TYPES).map(([key, value]) => ({ key, value })));
      console.groupEnd();
      
      // Выводим опции сортировки
      console.group('Опции сортировки:');
      console.table(Object.entries(constants.SORT_OPTIONS).map(([key, value]) => ({ key, value })));
      console.groupEnd();
      
      return constants;
    } catch (error) {
      console.error(`Ошибка при получении констант:`, error);
      return null;
    }
  };
  
  // Функция для создания случайного тестового товара
  const createRandomItem = () => {
    // Константы для генерации
    const types = ['weapon', 'armor', 'pill', 'resource', 'material', 'talisman', 'accessory'];
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
    const prefixes = ['Древний', 'Духовный', 'Божественный', 'Демонический', 'Культивационный', 'Эфирный'];
    const items = ['меч', 'доспех', 'нефрит', 'камень', 'пилюля', 'эликсир', 'талисман', 'кристалл', 'материал'];
    
    // Выбираем случайные значения
    const type = types[Math.floor(Math.random() * types.length)];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const item = items[Math.floor(Math.random() * items.length)];
    const price = Math.floor(Math.random() * 1000) + 50;
    const quantity = Math.floor(Math.random() * 5) + 1;
    
    // Формируем данные о товаре
    return {
      name: `${prefix} ${item}`,
      description: `${prefix} ${item} для культивации`,
      type,
      rarity,
      price,
      quantity
    };
  };
  
  // Функция для тестирования продажи случайного товара
  const sellRandomItem = async () => {
    const itemData = createRandomItem();
    console.log('Создан случайный товар:', itemData);
    return await testSellItem(itemData);
  };
  
  // Функция для тестирования синхронизации рынка
  const testSynchronization = async () => {
    if (!window.dispatchEvent) {
      console.error('API событий не доступен');
      return;
    }
    
    console.log('Генерация события market-items-changed...');
    window.dispatchEvent(new CustomEvent('market-items-changed'));
    console.log('Генерация события user-listings-changed...');
    window.dispatchEvent(new CustomEvent('user-listings-changed'));
    console.log('События отправлены. Компонент MarketSynchronizer должен обновить данные.');
  };
  
  // Создаем объект с функциями отладки
  marketDebugTools = {
    getMarketItems: getMarketItemsFromState,
    getUserListings: getUserListingsFromState,
    displayMarketItems,
    displayItemDetails,
    displayItemsByType,
    searchItems,
    displayUserListings,
    testGetAllItems,
    testGetItemById,
    testGetItemsByType,
    testSearchItems,
    testBuyItem,
    testSellItem,
    testCancelListing,
    testGetUserListings,
    testGetConstants,
    createRandomItem,
    sellRandomItem,
    testSynchronization
  };
  
  // Экспортируем функции в глобальное пространство
  window.marketDebug = marketDebugTools;
  console.log('Инструменты отладки рынка инициализированы. Используйте window.marketDebug для доступа.');
  console.log('Доступные методы:', Object.keys(marketDebugTools).join(', '));
}

// Экспортируем объект с инструментами
export default marketDebugTools;