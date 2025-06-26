/**
 * API для взаимодействия с торговцами через HTTP
 * Используется в клиентской части для доступа к данным на сервере
 */

// Импортируем константы из общего файла
const { merchantTypes, merchantRarityLevels } = require('../data/merchant-constants');

// Базовый URL для API
const API_BASE_URL = '/api';

// Функция для обработки ошибок
const handleRequestError = (error, defaultValue) => {
  console.error('API Error:', error);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  }
  return defaultValue;
};

// Создаем клиент для API с использованием fetch
const api = {
  get: async (url) => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // Всегда пытаемся прочитать тело ответа, даже при статусе ошибки
      const responseText = await response.text();
      let data;
      
      try {
        // Пытаемся распарсить ответ как JSON
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        // Если ответ не является JSON, используем его как текст
        data = { message: responseText || 'Пустой ответ от сервера' };
      }
      
      // Проверяем статус после чтения тела
      if (!response.ok) {
        console.error(`API Error ${response.status} for ${url}:`, data);
        return {
          data: {
            success: false,
            message: data.message || `HTTP error! status: ${response.status}`,
            error: data
          }
        };
      }
      
      return { data };
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      return {
        data: {
          success: false,
          message: error.message || 'Произошла ошибка при получении данных',
          items: []
        }
      };
    }
  },
  post: async (url, body) => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(body),
      });
      
      // Всегда пытаемся прочитать тело ответа, даже при статусе ошибки
      const responseText = await response.text();
      let data;
      
      try {
        // Пытаемся распарсить ответ как JSON
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        // Если ответ не является JSON, используем его как текст
        data = { message: responseText || 'Пустой ответ от сервера' };
      }
      
      // Проверяем статус после чтения тела
      if (!response.ok) {
        console.error(`API Error ${response.status} for ${url}:`, data);
        return {
          data: {
            success: false,
            message: data.message || `HTTP error! status: ${response.status}`,
            error: data
          }
        };
      }
      
      return { data };
    } catch (error) {
      console.error(`Error posting to ${url}:`, error);
      return {
        data: {
          success: false,
          message: error.message || 'Произошла ошибка при отправке запроса'
        }
      };
    }
  },
  put: async (url, body) => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(body),
      });
      
      // Всегда пытаемся прочитать тело ответа, даже при статусе ошибки
      const responseText = await response.text();
      let data;
      
      try {
        // Пытаемся распарсить ответ как JSON
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        // Если ответ не является JSON, используем его как текст
        data = { message: responseText || 'Пустой ответ от сервера' };
      }
      
      // Проверяем статус после чтения тела
      if (!response.ok) {
        console.error(`API Error ${response.status} for ${url}:`, data);
        return {
          data: {
            success: false,
            message: data.message || `HTTP error! status: ${response.status}`,
            error: data
          }
        };
      }
      
      return { data };
    } catch (error) {
      console.error(`Error putting to ${url}:`, error);
      return {
        data: {
          success: false,
          message: error.message || 'Произошла ошибка при обновлении данных'
        }
      };
    }
  },
  delete: async (url) => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
      });
      
      // Всегда пытаемся прочитать тело ответа, даже при статусе ошибки
      const responseText = await response.text();
      let data;
      
      try {
        // Пытаемся распарсить ответ как JSON
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        // Если ответ не является JSON, используем его как текст
        data = { message: responseText || 'Пустой ответ от сервера' };
      }
      
      // Проверяем статус после чтения тела
      if (!response.ok) {
        console.error(`API Error ${response.status} for ${url}:`, data);
        return {
          data: {
            success: false,
            message: data.message || `HTTP error! status: ${response.status}`,
            error: data
          }
        };
      }
      
      return { data };
    } catch (error) {
      console.error(`Error deleting from ${url}:`, error);
      return {
        data: {
          success: false,
          message: error.message || 'Произошла ошибка при удалении данных'
        }
      };
    }
  }
};

/**
 * Получает всех торговцев с сервера
 * @param {number} userId - ID пользователя для получения персонализированного инвентаря
 * @returns {Promise<Array>} Промис с массивом торговцев
 */
async function getAllMerchants(userId = null) {
  try {
    // Используем идентификатор текущего пользователя, если доступен
    if (!userId) {
      const currentUser = window.currentUser || { id: 1 };
      userId = currentUser.id;
    }
    
    // Добавляем userId как параметр запроса
    const response = await api.get(`/merchants?userId=${userId}`);
    console.log('Получены данные о торговцах:', response.data.length);
    
    if (response.data && response.data.length > 0) {
      // Проверяем наличие items у первого торговца
      const firstMerchant = response.data[0];
      console.log(`Торговец ${firstMerchant.name} имеет ${firstMerchant.items ? firstMerchant.items.length : 0} товаров`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении торговцев с сервера:', error);
    return [];
  }
}

/**
 * Получает торговца по ID
 * @param {string} id - ID торговца
 * @param {number} userId - ID пользователя для получения персонализированного инвентаря
 * @returns {Promise<Object>} Промис с данными торговца
 */
async function getMerchantById(id, userId = null) {
  try {
    // Используем идентификатор текущего пользователя, если доступен
    if (!userId) {
      const currentUser = window.currentUser || { id: 1 };
      userId = currentUser.id;
    }
    
    const response = await api.get(`/merchants/${id}?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении торговца с ID ${id}:`, error);
    return null;
  }
}

/**
 * Получает торговцев по типу
 * @param {string} type - Тип торговца
 * @param {number} userId - ID пользователя для получения персонализированного инвентаря
 * @returns {Promise<Array>} Промис с массивом торговцев указанного типа
 */
async function getMerchantsByType(type, userId = null) {
  try {
    // Используем идентификатор текущего пользователя, если доступен
    if (!userId) {
      const currentUser = window.currentUser || { id: 1 };
      userId = currentUser.id;
    }
    
    const response = await api.get(`/merchants/type/${type}?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении торговцев типа ${type}:`, error);
    return [];
  }
}

/**
 * Получает инвентарь торговца по его ID
 * @param {number} merchantId - Идентификатор торговца
 * @param {number} userId - ID пользователя для получения персонализированного инвентаря
 * @returns {Promise<Array>} Промис с массивом предметов торговца
 */
async function getMerchantInventory(merchantId, userId = null) {
  try {
    // Используем идентификатор текущего пользователя, если доступен
    if (!userId) {
      const currentUser = window.currentUser || { id: 1 };
      userId = currentUser.id;
    }
    
    const response = await api.get(`/merchants/${merchantId}/inventory?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении инвентаря торговца с ID ${merchantId}:`, error);
    return [];
  }
}

/**
 * Обновляет количество предмета у торговца для конкретного пользователя
 * @param {number} merchantId - ID торговца
 * @param {string} itemId - ID предмета
 * @param {number} userId - ID пользователя
 * @param {number} quantity - Количество для изменения
 * @param {string} action - Тип операции: 'set', 'add', или 'subtract'
 * @returns {Promise<Object>} Результат операции
 */
async function updateMerchantItemQuantity(merchantId, itemId, userId = null, quantity, action = 'set') {
  try {
    // Используем идентификатор текущего пользователя, если доступен
    if (!userId) {
      const currentUser = window.currentUser || { id: 1 };
      userId = currentUser.id;
    }
    
    // Подробное логирование параметров
    console.log('Отправляем запрос на обновление товара у торговца с параметрами:', {
      merchantId,
      itemId,
      userId,
      quantity,
      action
    });
    
    // Проверяем, что все параметры имеют корректные значения
    if (!merchantId) {
      console.error('Ошибка: merchantId отсутствует или равен 0');
      return { success: false, message: 'merchantId отсутствует или равен 0' };
    }
    
    if (!itemId) {
      console.error('Ошибка: itemId отсутствует');
      return { success: false, message: 'itemId отсутствует' };
    }
    
    if (quantity === undefined || quantity === null) {
      console.error('Ошибка: quantity отсутствует');
      return { success: false, message: 'quantity отсутствует' };
    }
    
    const response = await api.post(`/merchants/${merchantId}/update-inventory`, {
      itemId,
      userId,
      quantity,
      action
    });
    
    // Расширенное логирование ответа
    if (response.data.success) {
      console.log('Успешно обновлено количество предмета у торговца:', {
        merchantId,
        itemId,
        newQuantity: response.data.item?.quantity,
        success: response.data.success
      });
    } else {
      console.error('Ошибка при обновлении предмета:', {
        merchantId,
        itemId,
        error: response.data.message || 'Неизвестная ошибка',
        response: response.data
      });
    }
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении количества предмета ${itemId} у торговца ${merchantId}:`, error);
    return { success: false, message: error.message || 'Произошла ошибка при обновлении' };
  }
}

/**
 * Покупает предмет у торговца и обновляет инвентарь пользователя
 * @param {number} merchantId - ID торговца
 * @param {string} itemId - ID предмета
 * @param {number} userId - ID пользователя
 * @param {number} quantity - Количество предметов для покупки
 * @returns {Promise<Object>} Результат операции
 */
async function buyItemFromMerchant(merchantId, itemId, userId = null, quantity = 1) {
  try {
    // Используем идентификатор текущего пользователя, если доступен
    if (!userId) {
      const currentUser = window.currentUser || { id: 1 };
      userId = currentUser.id;
    }
    
    console.log('Отправляем запрос на покупку товара у торговца с параметрами:', {
      merchantId,
      itemId,
      userId,
      quantity
    });
    
    const response = await api.post(`/merchants/${merchantId}/buy`, {
      itemId,
      userId,
      quantity
    });
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при покупке предмета ${itemId} у торговца ${merchantId}:`, error);
    return { success: false, message: error.message || 'Произошла ошибка при покупке предмета' };
  }
}

/**
 * Продает предмет торговцу и обновляет инвентарь пользователя
 * @param {number} merchantId - ID торговца
 * @param {Object} itemData - Данные о предмете
 * @param {number} userId - ID пользователя
 * @param {number} quantity - Количество предметов для продажи
 * @returns {Promise<Object>} Результат операции
 */
async function sellItemToMerchant(merchantId, itemData, userId = null, quantity = 1) {
  try {
    // Используем идентификатор текущего пользователя, если доступен
    if (!userId) {
      const currentUser = window.currentUser || { id: 1 };
      userId = currentUser.id;
    }
    
    console.log('Отправляем запрос на продажу товара торговцу с параметрами:', {
      merchantId,
      itemData,
      userId,
      quantity
    });
    
    const response = await api.post(`/merchants/${merchantId}/sell`, {
      itemData,
      userId,
      quantity
    });
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при продаже предмета торговцу ${merchantId}:`, error);
    return { success: false, message: error.message || 'Произошла ошибка при продаже предмета' };
  }
}

/**
 * Экспорт API через CommonJS
 */
module.exports = {
  merchantTypes,
  merchantRarityLevels,
  getAllMerchants,
  getMerchantById,
  getMerchantsByType,
  getMerchantInventory,
  updateMerchantItemQuantity,
  buyItemFromMerchant,
  sellItemToMerchant
};