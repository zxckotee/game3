import React, { useState, useEffect, useCallback } from 'react';
import MarketService from '../../services/market-service-adapter';
import MarketSynchronizer from './MarketSynchronizer';

/**
 * Компонент для управления рынком
 * Предоставляет методы для работы с рынком и синхронизирует данные с сервером
 */
const MarketManager = () => {
  // Локальное состояние вместо Redux
  const [userId, setUserId] = useState(null);
  const [marketItems, setMarketItems] = useState([]);
  const [userListings, setUserListings] = useState([]);
  
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
   * Получение всех товаров на рынке
   * @returns {Promise<Array>} Массив товаров
   */
  const getAllItems = useCallback(async () => {
    try {
      const items = await MarketService.getAllItems();
      
      // Обновляем локальное состояние
      if (items && items.length > 0) {
        setMarketItems(items);
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('market-items-updated', { 
          detail: items 
        }));
      }
      
      return items;
    } catch (error) {
      console.error('Ошибка при получении товаров с рынка:', error);
      return marketItems; // Возвращаем текущие товары из состояния в случае ошибки
    }
  }, [marketItems]);
  
  /**
   * Получение товара по ID
   * @param {number} itemId - ID товара
   * @returns {Promise<Object|null>} Товар или null, если товар не найден
   */
  const getItemById = useCallback(async (itemId) => {
    try {
      // Проверяем, есть ли товар в локальном состоянии
      const cachedItem = marketItems.find(item => item.id === itemId);
      
      if (cachedItem) {
        console.log(`Использование кэшированного товара с ID ${itemId}`);
        return cachedItem;
      }
      
      // Если нет в кэше, запрашиваем через API
      const item = await MarketService.getItemById(itemId);
      return item;
    } catch (error) {
      console.error(`Ошибка при получении товара с ID ${itemId}:`, error);
      
      // Проверяем, есть ли товар в кэше для повторной попытки
      const cachedItem = marketItems.find(item => item.id === itemId);
      if (cachedItem) {
        console.log(`Использование кэшированного товара с ID ${itemId} после ошибки API`);
        return cachedItem;
      }
      
      return null;
    }
  }, [marketItems]);
  
  /**
   * Получение товаров по типу
   * @param {string} type - Тип товара
   * @returns {Promise<Array>} Массив товаров указанного типа
   */
  const getItemsByType = useCallback(async (type) => {
    try {
      // Проверяем, есть ли товары этого типа в локальном состоянии
      const cachedItems = marketItems.filter(item => item.type === type);
      
      if (cachedItems.length > 0) {
        console.log(`Использование кэшированных товаров типа ${type}`);
        return cachedItems;
      }
      
      // Если нет в кэше, запрашиваем через API
      const items = await MarketService.getItemsByType(type);
      return items;
    } catch (error) {
      console.error(`Ошибка при получении товаров типа ${type}:`, error);
      
      // В случае ошибки, фильтруем локальные данные
      return marketItems.filter(item => item.type === type);
    }
  }, [marketItems]);
  
  /**
   * Поиск товаров по критериям
   * @param {Object} criteria - Критерии поиска
   * @returns {Promise<Array>} Массив товаров, соответствующих критериям
   */
  const searchItems = useCallback(async (criteria = {}) => {
    try {
      const items = await MarketService.searchItems(criteria);
      return items;
    } catch (error) {
      console.error('Ошибка при поиске товаров:', error);
      
      // В случае ошибки, фильтруем локальные данные
      let filteredItems = [...marketItems];
      
      // Фильтрация по типу
      if (criteria.type) {
        filteredItems = filteredItems.filter(item => item.type === criteria.type);
      }
      
      // Фильтрация по редкости
      if (criteria.rarity) {
        filteredItems = filteredItems.filter(item => item.rarity === criteria.rarity);
      }
      
      // Фильтрация по цене
      if (criteria.minPrice !== undefined) {
        filteredItems = filteredItems.filter(item => item.price >= criteria.minPrice);
      }
      
      if (criteria.maxPrice !== undefined) {
        filteredItems = filteredItems.filter(item => item.price <= criteria.maxPrice);
      }
      
      // Сортировка
      if (criteria.sort) {
        const SORT_OPTIONS = MarketService.getSortOptions();
        
        switch (criteria.sort) {
          case SORT_OPTIONS.PRICE_ASC:
            filteredItems.sort((a, b) => a.price - b.price);
            break;
          case SORT_OPTIONS.PRICE_DESC:
            filteredItems.sort((a, b) => b.price - a.price);
            break;
          case SORT_OPTIONS.RARITY_ASC:
            // Сортировка по возрастанию редкости (common -> mythic)
            filteredItems.sort((a, b) => {
              const rarityOrder = {'common': 0, 'uncommon': 1, 'rare': 2, 'epic': 3, 'legendary': 4, 'mythic': 5};
              return rarityOrder[a.rarity] - rarityOrder[b.rarity];
            });
            break;
          case SORT_OPTIONS.RARITY_DESC:
            // Сортировка по убыванию редкости (mythic -> common)
            filteredItems.sort((a, b) => {
              const rarityOrder = {'common': 0, 'uncommon': 1, 'rare': 2, 'epic': 3, 'legendary': 4, 'mythic': 5};
              return rarityOrder[b.rarity] - rarityOrder[a.rarity];
            });
            break;
          case SORT_OPTIONS.NEWEST:
            filteredItems.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
            break;
          case SORT_OPTIONS.OLDEST:
            filteredItems.sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt));
            break;
        }
      }
      
      // Ограничение количества результатов
      if (criteria.limit && criteria.limit > 0) {
        filteredItems = filteredItems.slice(0, criteria.limit);
      }
      
      return filteredItems;
    }
  }, [marketItems]);
  
  /**
   * Покупка товара
   * @param {number} itemId - ID товара
   * @param {number} quantity - Количество товара для покупки
   * @returns {Promise<Object>} Результат покупки
   */
  const buyItem = useCallback(async (itemId, quantity = 1) => {
    if (!userId) {
      console.error('Невозможно купить товар: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      const result = await MarketService.buyItem(userId, itemId, quantity);
      
      // Обновляем данные после успешной покупки
      if (result && result.success) {
        // Создаем событие о покупке товара
        window.dispatchEvent(new CustomEvent('item-bought', { 
          detail: { 
            result,
            itemId,
            quantity
          } 
        }));
        
        // Обновляем товары на рынке
        getAllItems();
        
        // Обновляем инвентарь
        window.dispatchEvent(new CustomEvent('inventory-changed'));
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка при покупке товара с ID ${itemId}:`, error);
      return {
        success: false,
        message: error.message || 'Ошибка при покупке товара'
      };
    }
  }, [userId, getAllItems]);
  
  /**
   * Продажа товара
   * @param {Object} itemData - Данные о товаре
   * @returns {Promise<Object>} Результат продажи
   */
  const sellItem = useCallback(async (itemData) => {
    if (!userId) {
      console.error('Невозможно выставить товар на продажу: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      const result = await MarketService.sellItem(userId, itemData);
      
      // Обновляем данные после успешной продажи
      if (result && result.success) {
        // Создаем событие о продаже товара
        window.dispatchEvent(new CustomEvent('item-sold', { 
          detail: { 
            result,
            itemData
          } 
        }));
        
        // Обновляем товары на рынке
        getAllItems();
        
        // Обновляем товары пользователя
        getUserListings();
        
        // Обновляем инвентарь
        window.dispatchEvent(new CustomEvent('inventory-changed'));
      }
      
      return result;
    } catch (error) {
      console.error('Ошибка при выставлении товара на продажу:', error);
      return {
        success: false,
        message: error.message || 'Ошибка при выставлении товара на продажу'
      };
    }
  }, [userId, getAllItems]);
  
  /**
   * Отмена продажи товара
   * @param {number} itemId - ID товара
   * @returns {Promise<Object>} Результат отмены продажи
   */
  const cancelListing = useCallback(async (itemId) => {
    if (!userId) {
      console.error('Невозможно отменить продажу товара: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      const result = await MarketService.cancelListing(userId, itemId);
      
      // Обновляем данные после успешной отмены продажи
      if (result && result.success) {
        // Создаем событие об отмене продажи
        window.dispatchEvent(new CustomEvent('listing-cancelled', { 
          detail: { 
            result,
            itemId
          } 
        }));
        
        // Обновляем товары на рынке
        getAllItems();
        
        // Обновляем товары пользователя
        getUserListings();
        
        // Обновляем инвентарь
        window.dispatchEvent(new CustomEvent('inventory-changed'));
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка при отмене продажи товара с ID ${itemId}:`, error);
      return {
        success: false,
        message: error.message || 'Ошибка при отмене продажи товара'
      };
    }
  }, [userId, getAllItems]);
  
  /**
   * Получение товаров пользователя, выставленных на продажу
   * @returns {Promise<Array>} Массив товаров пользователя
   */
  const getUserListings = useCallback(async () => {
    if (!userId) {
      console.error('Невозможно получить товары: пользователь не авторизован');
      return [];
    }
    
    try {
      const listings = await MarketService.getUserListings(userId);
      
      // Обновляем локальное состояние
      if (listings) {
        setUserListings(listings);
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('user-listings-updated', { 
          detail: listings 
        }));
      }
      
      return listings;
    } catch (error) {
      console.error('Ошибка при получении товаров пользователя:', error);
      return userListings; // Возвращаем текущие товары из состояния в случае ошибки
    }
  }, [userId, userListings]);
  
  /**
   * Получение констант типов товаров
   * @returns {Object} Объект с типами товаров
   */
  const getItemTypes = useCallback(() => {
    return MarketService.getItemTypes();
  }, []);
  
  /**
   * Получение констант опций сортировки
   * @returns {Object} Объект с опциями сортировки
   */
  const getSortOptions = useCallback(() => {
    return MarketService.getSortOptions();
  }, []);
  
  // Загрузка данных при монтировании
  useEffect(() => {
    if (userId) {
      // Загружаем товары с рынка
      getAllItems();
      // Загружаем товары пользователя
      getUserListings();
    }
  }, [userId, getAllItems, getUserListings]);
  
  // Экспортируем методы через глобальный объект для доступа из других компонентов
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.marketManager) {
        window.marketManager = {};
      }
      
      window.marketManager = {
        getAllItems,
        getItemById,
        getItemsByType,
        searchItems,
        buyItem,
        sellItem,
        cancelListing,
        getUserListings,
        getItemTypes,
        getSortOptions,
        getItems: () => marketItems,
        getUserItems: () => userListings
      };
      
      // Добавляем функции для обратной совместимости с существующим кодом
      if (!window.gameManager) {
        window.gameManager = { market: {} };
      } else if (!window.gameManager.market) {
        window.gameManager.market = {};
      }
      
      window.gameManager.market = {
        ...window.marketManager
      };
    }
  }, [
    getAllItems, 
    getItemById, 
    getItemsByType, 
    searchItems, 
    buyItem, 
    sellItem, 
    cancelListing, 
    getUserListings, 
    getItemTypes, 
    getSortOptions,
    marketItems,
    userListings
  ]);
  
  return <MarketSynchronizer userId={userId} marketItems={marketItems} userListings={userListings} />;
};

export default MarketManager;