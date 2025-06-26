import React, { useEffect } from 'react';
import MarketService from '../../services/market-service-adapter';

/**
 * Компонент для автоматической синхронизации данных о рынке
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 */
const MarketSynchronizer = ({ userId, marketItems, userListings }) => {
  useEffect(() => {
    // Функция для обновления данных о товарах на рынке
    const synchronizeMarketItems = async () => {
      try {
        // Получаем все товары
        const itemsData = await MarketService.getAllItems();
        
        // Отправляем событие с обновленными данными
        if (itemsData && itemsData.length > 0) {
          window.dispatchEvent(new CustomEvent('market-items-updated', { 
            detail: itemsData 
          }));
          
          console.log('Данные о товарах на рынке успешно синхронизированы');
        }
      } catch (error) {
        console.error('Ошибка при синхронизации данных о товарах на рынке:', error);
      }
    };
    
    // Функция для обновления данных о товарах пользователя
    const synchronizeUserListings = async () => {
      if (!userId) return;
      
      try {
        // Получаем товары пользователя
        const userListingsData = await MarketService.getUserListings(userId);
        
        // Отправляем событие с обновленными данными
        if (userListingsData) {
          window.dispatchEvent(new CustomEvent('user-listings-updated', { 
            detail: userListingsData 
          }));
          
          console.log('Данные о товарах пользователя успешно синхронизированы');
        }
      } catch (error) {
        console.error('Ошибка при синхронизации данных о товарах пользователя:', error);
      }
    };
    
    // Начальная синхронизация только если нет данных
    if (!marketItems || marketItems.length === 0) {
      synchronizeMarketItems();
    }
    
    if (userId && (!userListings || userListings.length === 0)) {
      synchronizeUserListings();
    }
    
    // Устанавливаем интервал обновления (каждые 2 минуты для товаров, каждую минуту для товаров пользователя)
    const marketItemsIntervalId = setInterval(synchronizeMarketItems, 120000);
    const userListingsIntervalId = setInterval(synchronizeUserListings, 60000);
    
    // Создаем обработчики событий для немедленного обновления при изменениях
    const handleMarketItemsChange = () => synchronizeMarketItems();
    const handleUserListingsChange = () => synchronizeUserListings();
    const handleItemBought = () => {
      synchronizeMarketItems();
      
      // Если пользователь авторизован, также обновляем его инвентарь
      if (userId) {
        synchronizeUserListings();
        window.dispatchEvent(new CustomEvent('inventory-changed'));
      }
    };
    
    const handleItemSold = () => {
      synchronizeMarketItems();
      
      if (userId) {
        synchronizeUserListings();
        window.dispatchEvent(new CustomEvent('inventory-changed'));
      }
    };
    
    const handleListingCancelled = () => {
      synchronizeMarketItems();
      
      if (userId) {
        synchronizeUserListings();
        window.dispatchEvent(new CustomEvent('inventory-changed'));
      }
    };
    
    // Добавляем слушатели событий
    window.addEventListener('market-items-changed', handleMarketItemsChange);
    window.addEventListener('user-listings-changed', handleUserListingsChange);
    window.addEventListener('item-bought', handleItemBought);
    window.addEventListener('item-sold', handleItemSold);
    window.addEventListener('listing-cancelled', handleListingCancelled);
    
    // Функция очистки при размонтировании компонента
    return () => {
      clearInterval(marketItemsIntervalId);
      clearInterval(userListingsIntervalId);
      window.removeEventListener('market-items-changed', handleMarketItemsChange);
      window.removeEventListener('user-listings-changed', handleUserListingsChange);
      window.removeEventListener('item-bought', handleItemBought);
      window.removeEventListener('item-sold', handleItemSold);
      window.removeEventListener('listing-cancelled', handleListingCancelled);
    };
  }, [userId, marketItems, userListings]);
  
  // Компонент не рендерит UI
  return null;
};

// Значения по умолчанию для пропсов
MarketSynchronizer.defaultProps = {
  marketItems: [],
  userListings: []
};

export default MarketSynchronizer;