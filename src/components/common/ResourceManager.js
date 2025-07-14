import React, { useState, useEffect, useCallback } from 'react';
import ResourceService from '../../services/resource-adapter';
import ResourceSynchronizer from './ResourceSynchronizer';

/**
 * Компонент для управления ресурсами
 * Предоставляет методы для работы с ресурсами и синхронизирует данные с сервером
 */
const ResourceManager = () => {
  // Локальное состояние вместо Redux
  const [userId, setUserId] = useState(null);
  const [resources, setResources] = useState([]);
  
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
   * Получение всех ресурсов
   * @returns {Promise<Array>} Массив ресурсов
   */
  const getAllResources = useCallback(async () => {
    try {
      const resourcesData = await ResourceService.getAllResources();
      
      // Обновляем локальное состояние
      if (resourcesData && resourcesData.length > 0) {
        setResources(resourcesData);
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('resources-updated', { 
          detail: resourcesData 
        }));
      }
      
      return resourcesData;
    } catch (error) {
      // Подавляем ошибки получения ресурсов
      return resources; // Возвращаем текущие ресурсы из состояния в случае ошибки
    }
  }, [resources]);
  
  /**
   * Получение ресурса по ID
   * @param {string} resourceId - ID ресурса
   * @returns {Promise<Object|null>} Ресурс или null, если ресурс не найден
   */
  const getResourceById = useCallback(async (resourceId) => {
    try {
      // Проверяем, есть ли ресурс в локальном состоянии
      const cachedResource = resources.find(resource => resource.id === resourceId);
      
      if (cachedResource) {
        console.log(`Использование кэшированного ресурса с ID ${resourceId}`);
        return cachedResource;
      }
      
      // Если нет в кэше, запрашиваем через API
      const resource = await ResourceService.getResourceById(resourceId);
      return resource;
    } catch (error) {
      // Проверяем, есть ли ресурс в кэше для повторной попытки
      const cachedResource = resources.find(resource => resource.id === resourceId);
      if (cachedResource) {
        return cachedResource;
      }
      
      return null;
    }
  }, [resources]);
  
  /**
   * Получение ресурсов по типу
   * @param {string} type - Тип ресурса
   * @returns {Promise<Array>} Массив ресурсов указанного типа
   */
  const getResourcesByType = useCallback(async (type) => {
    try {
      // Проверяем, есть ли ресурсы этого типа в локальном состоянии
      const cachedResources = resources.filter(resource => resource.type === type);
      
      if (cachedResources.length > 0) {
        console.log(`Использование кэшированных ресурсов типа ${type}`);
        return cachedResources;
      }
      
      // Если нет в кэше, запрашиваем через API
      const filteredResources = await ResourceService.getResourcesByType(type);
      return filteredResources;
    } catch (error) {
      // В случае ошибки, фильтруем локальные данные
      return resources.filter(resource => resource.type === type);
    }
  }, [resources]);
  
  /**
   * Получение ресурсов по редкости
   * @param {string} rarity - Редкость ресурса
   * @returns {Promise<Array>} Массив ресурсов указанной редкости
   */
  const getResourcesByRarity = useCallback(async (rarity) => {
    try {
      // Проверяем, есть ли ресурсы этой редкости в локальном состоянии
      const cachedResources = resources.filter(resource => resource.rarity === rarity);
      
      if (cachedResources.length > 0) {
        console.log(`Использование кэшированных ресурсов редкости ${rarity}`);
        return cachedResources;
      }
      
      // Если нет в кэше, запрашиваем через API
      const filteredResources = await ResourceService.getResourcesByRarity(rarity);
      return filteredResources;
    } catch (error) {
      // В случае ошибки, фильтруем локальные данные
      return resources.filter(resource => resource.rarity === rarity);
    }
  }, [resources]);
  
  /**
   * Получение ресурсов, необходимых для прорыва
   * @param {string} stage - Ступень культивации
   * @param {number} level - Уровень культивации
   * @returns {Promise<Object>} Объект с данными о необходимых ресурсах и их деталями
   */
  const getBreakthroughResourcesDetailed = useCallback(async (stage, level) => {
    try {
      // Получаем требуемые ресурсы (ID и количество)
      const requiredResourcesMap = ResourceService.getBreakthroughResources(stage, level);
      
      // Преобразуем в формат с детальной информацией
      const requiredResourcesDetailed = {};
      
      // Получаем детальные данные о каждом ресурсе
      for (const [resourceId, amount] of Object.entries(requiredResourcesMap)) {
        const resourceDetails = await getResourceById(resourceId);
        
        requiredResourcesDetailed[resourceId] = {
          id: resourceId,
          name: resourceDetails ? resourceDetails.name : resourceId,
          amount: amount,
          details: resourceDetails || null
        };
      }
      
      return {
        resourcesMap: requiredResourcesMap,
        resourcesDetailed: requiredResourcesDetailed
      };
    } catch (error) {
      return {
        resourcesMap: {},
        resourcesDetailed: {}
      };
    }
  }, [getResourceById]);
  
  /**
   * Получение константных данных о типах ресурсов
   * @returns {Object} Объект с типами ресурсов
   */
  const getResourceTypes = useCallback(() => {
    return ResourceService.getResourceTypes();
  }, []);
  
  /**
   * Получение константных данных о редкостях ресурсов
   * @returns {Object} Объект с редкостями ресурсов
   */
  const getRarityTypes = useCallback(() => {
    return ResourceService.getRarityTypes();
  }, []);
  
  // Загрузка ресурсов при монтировании
  useEffect(() => {
    if (!resources || resources.length === 0) {
      getAllResources();
    }
  }, [resources, getAllResources]);
  
  // Экспортируем методы через глобальный объект для доступа из других компонентов
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.resourceManager) {
        window.resourceManager = {};
      }
      
      window.resourceManager = {
        getAllResources,
        getResourceById,
        getResourcesByType,
        getResourcesByRarity,
        getBreakthroughResourcesDetailed,
        getResourceTypes,
        getRarityTypes,
        getResources: () => resources
      };
      
      // Добавляем функции для обратной совместимости с существующим кодом
      if (!window.gameManager) {
        window.gameManager = { resources: {} };
      } else if (!window.gameManager.resources) {
        window.gameManager.resources = {};
      }
      
      window.gameManager.resources = {
        ...window.resourceManager
      };
    }
  }, [
    resources,
    getAllResources,
    getResourceById,
    getResourcesByType,
    getResourcesByRarity,
    getBreakthroughResourcesDetailed,
    getResourceTypes,
    getRarityTypes
  ]);
  
  return <ResourceSynchronizer userId={userId} resources={resources} />;
};

export default ResourceManager;