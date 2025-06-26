/**
 * Тесты для адаптера ресурсов
 * Проверяют работу адаптера в разных средах (браузер/сервер)
 */

// Импортируем адаптер ресурсов
import * as ResourceAdapter from '../services/resource-adapter';

// Глобальный объект для хранения результатов тестов
const testResults = {};

// Получаем информацию о том, в каком окружении выполняется тест
const isServerEnvironment = typeof window === 'undefined';

/**
 * Функция для запуска всех тестов
 */
export async function runResourceAdapterTests() {
  console.log('Запуск тестов адаптера ресурсов...');
  console.log(`Окружение: ${isServerEnvironment ? 'Сервер (Node.js)' : 'Клиент (браузер)'}`);

  try {
    // Тест 1: Проверяем существование экспортированных констант
    await testConstants();

    // Тест 2: Проверяем методы получения ресурсов
    await testResourceMethods();

    // Тест 3: Проверяем методы модификации ресурсов (могут не работать в браузере)
    await testModificationMethods();

    console.log('Все тесты адаптера ресурсов завершены!');
    return testResults;
  } catch (error) {
    console.error('Ошибка при выполнении тестов:', error);
    testResults.error = error.message;
    return testResults;
  }
}

/**
 * Тест для проверки констант
 */
async function testConstants() {
  console.log('Тест 1: Проверка экспортированных констант');
  
  try {
    // Проверяем наличие констант
    const hasResourceTypes = typeof ResourceAdapter.RESOURCE_TYPES === 'object';
    const hasRarity = typeof ResourceAdapter.RARITY === 'object';
    
    testResults.constants = {
      hasResourceTypes,
      hasRarity,
      resourceTypesCount: hasResourceTypes ? Object.keys(ResourceAdapter.RESOURCE_TYPES).length : 0,
      rarityCount: hasRarity ? Object.keys(ResourceAdapter.RARITY).length : 0
    };
    
    console.log('Результат теста 1:', testResults.constants);
  } catch (error) {
    console.error('Ошибка в тесте 1:', error);
    testResults.constants = { error: error.message };
  }
}

/**
 * Тест для проверки методов получения ресурсов
 */
async function testResourceMethods() {
  console.log('Тест 2: Проверка методов получения ресурсов');
  
  try {
    // Проверяем наличие методов
    const hasGetAllResources = typeof ResourceAdapter.getAllResources === 'function';
    const hasGetResourceById = typeof ResourceAdapter.getResourceById === 'function';
    const hasGetResourcesByType = typeof ResourceAdapter.getResourcesByType === 'function';
    const hasGetResourcesByRarity = typeof ResourceAdapter.getResourcesByRarity === 'function';
    
    testResults.resourceMethods = {
      hasGetAllResources,
      hasGetResourceById,
      hasGetResourcesByType,
      hasGetResourcesByRarity
    };
    
    // Если методы существуют, пробуем вызвать их
    if (hasGetAllResources) {
      try {
        const resources = await ResourceAdapter.getAllResources();
        testResults.resourceMethods.allResourcesCount = Array.isArray(resources) ? resources.length : 'не массив';
      } catch (error) {
        testResults.resourceMethods.allResourcesError = error.message;
      }
    }
    
    if (hasGetResourceById) {
      try {
        // Пробуем получить ресурс по ID (используем тестовый ID)
        const resource = await ResourceAdapter.getResourceById('spirit_stone');
        testResults.resourceMethods.resourceById = resource ? true : false;
        testResults.resourceMethods.resourceIdName = resource ? resource.name : 'не найден';
      } catch (error) {
        testResults.resourceMethods.resourceByIdError = error.message;
      }
    }
    
    console.log('Результат теста 2:', testResults.resourceMethods);
  } catch (error) {
    console.error('Ошибка в тесте 2:', error);
    testResults.resourceMethods = { error: error.message };
  }
}

/**
 * Тест для проверки методов модификации ресурсов
 */
async function testModificationMethods() {
  console.log('Тест 3: Проверка методов модификации ресурсов');
  
  try {
    // Проверяем наличие методов
    const hasAddNewResource = typeof ResourceAdapter.addNewResource === 'function';
    const hasUpdateResource = typeof ResourceAdapter.updateResource === 'function';
    
    testResults.modificationMethods = {
      hasAddNewResource,
      hasUpdateResource
    };
    
    // В браузере эти методы должны быть, но могут быть реализованы как заглушки
    // На сервере они должны работать
    if (hasAddNewResource && isServerEnvironment) {
      try {
        // Создаем тестовый ресурс только в среде тестирования
        // В реальном приложении нужна проверка прав доступа
        const testResourceId = `test_resource_${Date.now()}`;
        const newResource = await ResourceAdapter.addNewResource({
          id: testResourceId,
          name: 'Тестовый ресурс',
          type: ResourceAdapter.RESOURCE_TYPES.MATERIAL,
          rarity: ResourceAdapter.RARITY.COMMON,
          description: 'Ресурс для тестирования',
          value: 1
        });
        
        testResults.modificationMethods.addResourceSuccess = newResource ? true : false;
        
        // Если ресурс успешно создан, пробуем обновить его
        if (newResource && hasUpdateResource) {
          const updatedResource = await ResourceAdapter.updateResource(testResourceId, {
            description: 'Обновленное описание для теста'
          });
          
          testResults.modificationMethods.updateResourceSuccess = updatedResource ? true : false;
        }
      } catch (error) {
        testResults.modificationMethods.modificationError = error.message;
      }
    }
    
    console.log('Результат теста 3:', testResults.modificationMethods);
  } catch (error) {
    console.error('Ошибка в тесте 3:', error);
    testResults.modificationMethods = { error: error.message };
  }
}

// Запускаем тесты автоматически при импорте в браузере
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    runResourceAdapterTests()
      .then(results => {
        console.log('Результаты тестов:', results);
        if (typeof window.displayTestResults === 'function') {
          window.displayTestResults('resource-adapter', results);
        }
      })
      .catch(error => {
        console.error('Ошибка при запуске тестов:', error);
      });
  });
}

// Экспортируем функцию для запуска тестов
export default { runResourceAdapterTests };