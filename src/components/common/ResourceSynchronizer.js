import React, { useEffect } from 'react';
import ResourceService from '../../services/resource-adapter';

/**
 * Компонент для автоматической синхронизации данных о ресурсах
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 */
const ResourceSynchronizer = ({ userId, resources }) => {
  useEffect(() => {
    // Функция для обновления данных о ресурсах
    const synchronizeResources = async () => {
      try {
        // Получаем все ресурсы
        const resourcesData = await ResourceService.getAllResources();
        
        // Отправляем событие с обновленными данными
        if (resourcesData && resourcesData.length > 0) {
          window.dispatchEvent(new CustomEvent('resources-updated', { 
            detail: resourcesData 
          }));
          
          console.log('Данные о ресурсах успешно синхронизированы');
        }
      } catch (error) {
        console.error('Ошибка при синхронизации данных о ресурсах:', error);
      }
    };
    
    // Начальная синхронизация, только если ресурсы еще не загружены
    if (!resources || resources.length === 0) {
      synchronizeResources();
    }
    
    // Устанавливаем интервал обновления (раз в 30 минут, так как ресурсы обновляются редко)
    const intervalId = setInterval(synchronizeResources, 1800000);
    
    // Создаем обработчики событий для немедленного обновления при изменениях
    const handleResourceChange = () => synchronizeResources();
    const handleInventoryChange = () => synchronizeResources(); // Синхронизируем при изменении инвентаря
    const handleMarketChange = () => synchronizeResources(); // Синхронизируем при изменении рынка
    
    // Добавляем слушатели событий
    window.addEventListener('resources-changed', handleResourceChange);
    window.addEventListener('inventory-changed', handleInventoryChange); // Добавляем слушатель инвентаря
    window.addEventListener('market-items-changed', handleMarketChange); // Добавляем слушатель рынка
    
    // Функция очистки при размонтировании компонента
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resources-changed', handleResourceChange);
      window.removeEventListener('inventory-changed', handleInventoryChange);
      window.removeEventListener('market-items-changed', handleMarketChange);
    };
  }, [resources, userId]);
  
  // Компонент не рендерит UI
  return null;
};

// Значения по умолчанию для пропсов
ResourceSynchronizer.defaultProps = {
  resources: [],
  userId: null
};

export default ResourceSynchronizer;