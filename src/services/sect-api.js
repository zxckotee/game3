/**
 * API-сервис для работы с сектами
 * Использует HTTP запросы к серверу вместо прямого доступа к базе данных
 */

// Базовый URL API
const API_URL = '/api';

/**
 * Сервис для работы с сектами через API
 */
class SectServiceAPI {
  /**
   * Получение информации о секте по ID
   * @param {number} sectId - ID секты
   * @returns {Promise<Object>} - Секта
   */
  static async getSectById(sectId) {
    try {
      // Проверка на корректность ID - должен быть числом
      console.log(`getSectById вызван с параметром: ${sectId}, тип: ${typeof sectId}`);
      
      if (isNaN(parseInt(sectId)) || String(sectId) === 'available') {
        console.error(`Некорректный ID секты: ${sectId}`);
        throw new Error(`Некорректный ID секты: ${sectId}`);
      }
      
      const response = await fetch(`${API_URL}/sects/${sectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Секта с ID ${sectId} не найдена`);
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка при получении секты с ID ${sectId}`);
      }

      const sect = await response.json();
      return sect;
    } catch (error) {
      console.error(`Ошибка при получении секты с ID ${sectId}:`, error);
      throw error;
    }
  }
  
  /**
   * Получение информации о секте игрока
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Секта игрока
   */
  static async getUserSect(userId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/sect`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.status === 404) {
        // Пользователь не состоит в секте
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении секты пользователя');
      }

      const sect = await response.json();
      return sect;
    } catch (error) {
      console.error('Ошибка при получении секты пользователя:', error);
      throw error;
    }
  }
  
  /**
   * Создание секты
   * @param {number} userId - ID пользователя
   * @param {string} sectName - Название секты
   * @returns {Promise<Object>} - Созданная секта
   */
  static async createSect(userId, sectName) {
    try {
      const response = await fetch(`${API_URL}/sects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ userId, name: sectName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании секты');
      }

      const sect = await response.json();
      return sect;
    } catch (error) {
      console.error('Ошибка при создании секты:', error);
      throw error;
    }
  }
  
  /**
   * Присоединение к секте
   * @param {number} userId - ID пользователя
   * @param {number} sectId - ID секты
   * @returns {Promise<Object>} - Член секты
   */
  static async joinSect(userId, sectId) {
    try {
      // Проверка и логирование sectId
      console.log(`SectServiceAPI.joinSect вызван с sectId=${sectId}, тип: ${typeof sectId}`);
      
      // Проверка, чтобы избежать передачи 'available' в запрос
      if (sectId === 'available' || isNaN(parseInt(sectId))) {
        console.error(`Попытка вызова joinSect с некорректным ID: ${sectId}`);
        throw new Error(`Некорректный ID секты: ${sectId}`);
      }
      
      const response = await fetch(`${API_URL}/sects/${sectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при присоединении к секте');
      }

      const sectMember = await response.json();
      return sectMember;
    } catch (error) {
      console.error('Ошибка при присоединении к секте:', error);
      throw error;
    }
  }
  
  /**
   * Внесение вклада в секту
   * @param {number} userId - ID пользователя
   * @param {number} sectId - ID секты
   * @param {number} energyAmount - Количество энергии для вклада
   * @returns {Promise<Object>} - Результат вклада
   */
  static async contributeToSect(userId, sectId, energyAmount) {
    try {
      const response = await fetch(`${API_URL}/sects/${sectId}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ userId, energyAmount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при внесении вклада в секту');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при внесении вклада в секту:', error);
      throw error;
    }
  }
  
  /**
   * Тренировка с членом секты
   * @param {number} userId - ID пользователя
   * @param {number} memberId - ID члена секты
   * @param {number} duration - Продолжительность тренировки
   * @returns {Promise<Object>} - Результат тренировки
   */
  static async trainWithMember(userId, memberId) {
    try {
      const response = await fetch(`${API_URL}/sects/members/${memberId}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при тренировке с членом секты');
      }
      console.error(memberId);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при тренировке с членом секты:', error);
      throw error;
    }
  }
  
  /**
   * Получение бонусов от секты
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Бонусы от секты
   */
  static async getSectBenefits(userId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/sect/benefits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.status === 404) {
        // Пользователь не состоит в секте
        return [];
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении бонусов от секты');
      }

      const benefits = await response.json();
      return benefits;
    } catch (error) {
      console.error('Ошибка при получении бонусов от секты:', error);
      throw error;
    }
  }
  
  /**
   * Получение ранга пользователя в секте
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Ранг и привилегии пользователя в секте
   */
  static async getUserSectRank(userId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/sect/rank`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.status === 404) {
        // Пользователь не состоит в секте
        return {
          inSect: false,
          rank: 'Нет',
          privileges: []
        };
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении ранга пользователя в секте');
      }

      const rank = await response.json();
      return rank;
    } catch (error) {
      console.error('Ошибка при получении ранга пользователя в секте:', error);
      throw error;
    }
  }

  /**
   * Выход из секты
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Результат выхода
   */
  static async leaveSect(userId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/sect/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при выходе из секты');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при выходе из секты:', error);
      throw error;
    }
  }

  /**
   * Получение списка доступных сект для вступления
   * @returns {Promise<Array>} - Список доступных сект
   */
  static async getAvailableSects() {
    try {
      const response = await fetch(`${API_URL}/sects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении списка доступных сект');
      }

      const sects = await response.json();
      return sects;
    } catch (error) {
      console.error('Ошибка при получении списка доступных сект:', error);
      throw error;
    }
  }

  /**
   * Изменение ранга члена секты (только для лидера секты)
   * @param {number} leaderId - ID лидера секты
   * @param {number} memberId - ID члена секты
   * @param {string} newRank - Новый ранг
   * @returns {Promise<Object>} - Обновленный член секты
   */
  static async changeMemberRank(leaderId, memberId, newRank) {
    try {
      const response = await fetch(`${API_URL}/sects/members/${memberId}/rank`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ leaderId, newRank }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при изменении ранга члена секты');
      }

      const updatedMember = await response.json();
      return updatedMember;
    } catch (error) {
      console.error('Ошибка при изменении ранга члена секты:', error);
      throw error;
    }
  }

  /**
   * Исключение члена секты (только для лидера секты)
   * @param {number} leaderId - ID лидера секты
   * @param {number} memberId - ID члена секты
   * @returns {Promise<Object>} - Результат исключения
   */
  static async expelMember(leaderId, memberId) {
    try {
      const response = await fetch(`${API_URL}/sects/members/${memberId}/expel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ leaderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при исключении члена из секты');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при исключении члена из секты:', error);
      throw error;
    }
  }

  /**
   * Передача звания главы секты другому участнику
   * @param {number} currentLeaderId - ID текущего главы секты
   * @param {number} newLeaderId - ID нового главы секты
   * @returns {Promise<Object>} - Результат операции
   */
  static async transferLeadership(currentLeaderId, newLeaderId) {
    try {
      const response = await fetch(`${API_URL}/sects/transfer-leadership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ currentLeaderId, newLeaderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при передаче лидерства');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Ошибка при передаче лидерства:', error);
      throw error;
    }
  }
}
// SectServiceAPI.getUserSect(61).then((result) => console.log(result)); //для теста
// Экспортируем класс через CommonJS
module.exports = SectServiceAPI;

// Экспортируем отдельные методы для совместимости
module.exports.getSectById = SectServiceAPI.getSectById;
module.exports.getUserSect = SectServiceAPI.getUserSect;
module.exports.createSect = SectServiceAPI.createSect;
module.exports.joinSect = SectServiceAPI.joinSect;
module.exports.contributeToSect = SectServiceAPI.contributeToSect;
module.exports.trainWithMember = SectServiceAPI.trainWithMember;
module.exports.getSectBenefits = SectServiceAPI.getSectBenefits;
module.exports.getUserSectRank = SectServiceAPI.getUserSectRank;
module.exports.leaveSect = SectServiceAPI.leaveSect;
module.exports.getAvailableSects = SectServiceAPI.getAvailableSects;
module.exports.changeMemberRank = SectServiceAPI.changeMemberRank;
module.exports.expelMember = SectServiceAPI.expelMember;