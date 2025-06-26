/**
 * Отладочные инструменты для работы с ресурсами
 */

// Глобальные переменные для доступа из консоли
let resourceDebugTools = {};

/**
 * Инициализирует инструменты отладки ресурсов в глобальном пространстве
 */
export function initResourceDebugTools() {
  if (typeof window === 'undefined') return;

  console.log('Инициализация инструментов отладки ресурсов...');
  
  // Функция для получения всех ресурсов из Redux-состояния
  const getResourcesFromState = () => {
    if (!window.__GAME_STATE__?.world?.resources) {
      console.error('Данные о ресурсах не найдены в состоянии игры');
      return [];
    }
    return window.__GAME_STATE__.world.resources;
  };
  
  // Функция для отображения ресурсов в консоли
  const displayResources = (resources = null) => {
    const resourcesData = resources || getResourcesFromState();
    if (!resourcesData || resourcesData.length === 0) {
      console.log('Ресурсы не найдены');
      return null;
    }
    
    console.log(`Найдено ${resourcesData.length} ресурсов:`);
    console.table(resourcesData.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      rarity: r.rarity,
      value: r.value || 0
    })));
    
    return resourcesData;
  };
  
  // Функция для отображения ресурсов определенного типа
  const displayResourcesByType = (type) => {
    const resources = getResourcesFromState();
    const filteredResources = resources.filter(r => r.type === type);
    
    console.log(`Найдено ${filteredResources.length} ресурсов типа "${type}":`);
    console.table(filteredResources.map(r => ({
      id: r.id,
      name: r.name,
      rarity: r.rarity,
      value: r.value || 0
    })));
    
    return filteredResources;
  };
  
  // Функция для отображения ресурсов определенной редкости
  const displayResourcesByRarity = (rarity) => {
    const resources = getResourcesFromState();
    const filteredResources = resources.filter(r => r.rarity === rarity);
    
    console.log(`Найдено ${filteredResources.length} ресурсов редкости "${rarity}":`);
    console.table(filteredResources.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      value: r.value || 0
    })));
    
    return filteredResources;
  };
  
  // Функция для отображения типов ресурсов
  const displayResourceTypes = () => {
    if (!window.resourceManager) {
      console.error('ResourceManager не инициализирован');
      return null;
    }
    
    const types = window.resourceManager.getResourceTypes();
    
    console.log('Типы ресурсов:');
    console.table(Object.entries(types).map(([key, value]) => ({
      key,
      value
    })));
    
    return types;
  };
  
  // Функция для отображения редкостей ресурсов
  const displayRarityTypes = () => {
    if (!window.resourceManager) {
      console.error('ResourceManager не инициализирован');
      return null;
    }
    
    const rarities = window.resourceManager.getRarityTypes();
    
    console.log('Редкости ресурсов:');
    console.table(Object.entries(rarities).map(([key, value]) => ({
      key,
      value
    })));
    
    return rarities;
  };
  
  // Функция для получения ID текущего пользователя
  const getCurrentUserId = () => {
    return window.__GAME_STATE__?.auth?.user?.id;
  };
  
  // Функция для тестирования API-запроса на получение всех ресурсов
  const testGetAllResources = async () => {
    try {
      console.log('Запрос GET /api/resources...');
      const response = await fetch('/api/resources', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const resources = await response.json();
      console.log('Получены ресурсы с сервера:', resources);
      return resources;
    } catch (error) {
      console.error('Ошибка при получении ресурсов:', error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение ресурса по ID
  const testGetResourceById = async (resourceId) => {
    if (!resourceId) {
      console.error('Необходимо указать ID ресурса');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/resources/${resourceId}...`);
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.status === 404) {
        console.error(`Ресурс с ID ${resourceId} не найден`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const resource = await response.json();
      console.log(`Получен ресурс с ID ${resourceId}:`, resource);
      return resource;
    } catch (error) {
      console.error(`Ошибка при получении ресурса с ID ${resourceId}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение ресурсов по типу
  const testGetResourcesByType = async (type) => {
    if (!type) {
      console.error('Необходимо указать тип ресурса');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/resources/type/${type}...`);
      const response = await fetch(`/api/resources/type/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const resources = await response.json();
      console.log(`Получены ресурсы типа ${type}:`, resources);
      return resources;
    } catch (error) {
      console.error(`Ошибка при получении ресурсов типа ${type}:`, error);
      return null;
    }
  };
  
  // Функция для тестирования API-запроса на получение ресурсов по редкости
  const testGetResourcesByRarity = async (rarity) => {
    if (!rarity) {
      console.error('Необходимо указать редкость ресурса');
      return null;
    }
    
    try {
      console.log(`Запрос GET /api/resources/rarity/${rarity}...`);
      const response = await fetch(`/api/resources/rarity/${rarity}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const resources = await response.json();
      console.log(`Получены ресурсы редкости ${rarity}:`, resources);
      return resources;
    } catch (error) {
      console.error(`Ошибка при получении ресурсов редкости ${rarity}:`, error);
      return null;
    }
  };
  
  // Функция для получения ресурсов для прорыва
  const testGetBreakthroughResources = (stage, level) => {
    if (!stage) {
      console.error('Необходимо указать ступень культивации');
      return null;
    }
    
    if (!level || level <= 0) {
      console.error('Необходимо указать положительный уровень культивации');
      return null;
    }
    
    try {
      console.log(`Расчет ресурсов для прорыва на ступени ${stage}, уровень ${level}...`);
      
      // Используем window.resourceManager если доступен
      if (window.resourceManager) {
        window.resourceManager.getBreakthroughResourcesDetailed(stage, level)
          .then(result => {
            console.log('Результат расчета ресурсов:', result);
            
            // Отображаем детальную информацию
            if (result.resourcesDetailed) {
              console.log('Детальная информация о ресурсах:');
              
              Object.values(result.resourcesDetailed).forEach(resource => {
                console.log(`- ${resource.name} (${resource.id}): ${resource.amount} шт.`);
              });
            }
          })
          .catch(error => {
            console.error('Ошибка при получении детальной информации о ресурсах:', error);
          });
      }
      
      // Используем ResourceService напрямую
      const requiredResources = window.ResourceService.getBreakthroughResources(stage, level);
      console.log('Ресурсы для прорыва:', requiredResources);
      return requiredResources;
    } catch (error) {
      console.error('Ошибка при расчете ресурсов для прорыва:', error);
      return null;
    }
  };
  
  // Функция для тестирования синхронизации ресурсов
  const testSynchronization = async () => {
    if (!window.dispatchEvent) {
      console.error('API событий не доступен');
      return;
    }
    
    console.log('Генерация события resources-changed...');
    window.dispatchEvent(new CustomEvent('resources-changed'));
    console.log('Событие отправлено. Компонент ResourceSynchronizer должен обновить данные.');
  };
  
  // Создаем объект с функциями отладки
  resourceDebugTools = {
    getResources: getResourcesFromState,
    displayResources,
    displayResourcesByType,
    displayResourcesByRarity,
    displayResourceTypes,
    displayRarityTypes,
    testGetAllResources,
    testGetResourceById,
    testGetResourcesByType,
    testGetResourcesByRarity,
    testGetBreakthroughResources,
    testSynchronization
  };
  
  // Экспортируем функции в глобальное пространство
  window.resourceDebug = resourceDebugTools;
  console.log('Инструменты отладки ресурсов инициализированы. Используйте window.resourceDebug для доступа.');
  console.log('Доступные методы:', Object.keys(resourceDebugTools).join(', '));
}

// Экспортируем объект с инструментами
export default resourceDebugTools;