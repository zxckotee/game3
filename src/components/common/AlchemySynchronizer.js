import React, { useEffect } from 'react';
import AlchemyService from '../../services/alchemy-service-adapter';

/**
 * Компонент для автоматической синхронизации данных алхимии
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 */
const AlchemySynchronizer = ({ userId, recipesData, userItemsData }) => {
  useEffect(() => {
    if (!userId) return;
    
    // Функция для обновления данных о рецептах
    const synchronizeRecipes = async () => {
      try {
        // Получаем все рецепты
        const recipesData = await AlchemyService.getAllRecipes();
        
        // Отправляем событие с обновленными данными
        if (recipesData && recipesData.length > 0) {
          window.dispatchEvent(new CustomEvent('alchemy-recipes-updated', { 
            detail: recipesData 
          }));
          
          console.log('Данные о рецептах алхимии успешно синхронизированы');
        }
      } catch (error) {
        console.error('Ошибка при синхронизации данных о рецептах алхимии:', error);
      }
    };
    
    // Функция для обновления данных о предметах алхимии пользователя
    const synchronizeUserItems = async () => {
      try {
        // Получаем предметы пользователя
        const userItemsData = await AlchemyService.getUserAlchemyItems(userId);
        
        // Отправляем событие с обновленными данными
        if (userItemsData) {
          window.dispatchEvent(new CustomEvent('user-alchemy-items-updated', { 
            detail: userItemsData 
          }));
          
          console.log('Данные о предметах алхимии пользователя успешно синхронизированы');
        }
      } catch (error) {
        console.error('Ошибка при синхронизации данных о предметах алхимии пользователя:', error);
      }
    };
    
    // Начальная синхронизация
    if (!recipesData || recipesData.length === 0) {
      synchronizeRecipes();
    }
    
    if (!userItemsData || userItemsData.length === 0) {
      synchronizeUserItems();
    }
    
    // Устанавливаем интервал обновления (каждые 5 минут для рецептов, каждую минуту для предметов)
    const recipesIntervalId = setInterval(synchronizeRecipes, 300000);
    const userItemsIntervalId = setInterval(synchronizeUserItems, 60000);
    
    // Создаем обработчики событий для немедленного обновления при изменениях
    const handleRecipesChange = () => synchronizeRecipes();
    const handleUserItemsChange = () => synchronizeUserItems();
    const handleItemCrafted = () => {
      synchronizeUserItems();
      // После создания предмета обновляем и инвентарь
      window.dispatchEvent(new CustomEvent('inventory-changed'));
    };
    
    // Добавляем слушатели событий
    window.addEventListener('alchemy-recipes-changed', handleRecipesChange);
    window.addEventListener('alchemy-items-changed', handleUserItemsChange);
    window.addEventListener('alchemy-item-crafted', handleItemCrafted);
    
    // Функция очистки при размонтировании компонента
    return () => {
      clearInterval(recipesIntervalId);
      clearInterval(userItemsIntervalId);
      window.removeEventListener('alchemy-recipes-changed', handleRecipesChange);
      window.removeEventListener('alchemy-items-changed', handleUserItemsChange);
      window.removeEventListener('alchemy-item-crafted', handleItemCrafted);
    };
  }, [userId, recipesData, userItemsData]);
  
  // Компонент не рендерит UI
  return null;
};

// Значения по умолчанию для пропсов
AlchemySynchronizer.defaultProps = {
  recipesData: [],
  userItemsData: []
};

export default AlchemySynchronizer;