/**
 * API-сервис для работы с техниками
 * Использует HTTP запросы к серверу вместо прямого доступа к базе данных
 */

// Базовый URL API
const API_URL = '/api';

// Константы типов техник
const techniqueTypes = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SUPPORT: 'support',
  CULTIVATION: 'cultivation'
};

// Типы элементов
const elementTypes = {
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  WIND: 'wind',
  LIGHTNING: 'lightning',
  ICE: 'ice',
  LIGHT: 'light',
  DARK: 'dark',
  NEUTRAL: 'neutral'
};

// Категории техник для интерфейса
const techniqueCategories = [
  { id: 'все', name: 'все', filter: () => true },
  { id: 'attack', name: 'attack', filter: t => t.type === techniqueTypes.ATTACK },
  { id: 'defense', name: 'defense', filter: t => t.type === techniqueTypes.DEFENSE },
  { id: 'support', name: 'support', filter: t => t.type === techniqueTypes.SUPPORT },
  { id: 'cultivation', name: 'cultivation', filter: t => t.type === techniqueTypes.CULTIVATION }
];

// Цвета для элементов (для отображения)
const elementColors = {
  fire: '#ff4c4c',
  water: '#4c8cff',
  earth: '#a06c42',
  wind: '#7aeb7a',
  lightning: '#e6e64c',
  ice: '#a8e6ff',
  light: '#ffffa8',
  dark: '#aa00aa',
  neutral: '#a8a8a8'
};

/**
 * Сервис для работы с техниками через API
 */
class TechniqueServiceAPI {
  /**
   * Получает все техники
   * @returns {Promise<Array>} Промис с массивом техник
   */
  static async getAllTechniques() {
    try {
      const response = await fetch(`${API_URL}/techniques`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      // Получаем сырые данные от сервера
      const techniques = await response.json();
      
      // Обогащаем данные дополнительными методами и свойствами
      return techniques.map(technique => this.enrichTechnique(technique));
    } catch (error) {
      console.error('Ошибка при получении техник с сервера:', error);
      return [];
    }
  }
  
  /**
   * Обогащает объект техники дополнительными методами и свойствами
   * @param {Object} technique - Объект техники с сервера
   * @returns {Object} Обогащенный объект техники
   */
  static enrichTechnique(technique) {
    if (!technique) return null;
    
    // Создаем новый объект с преобразованными именами свойств
    const enriched = {
      id: technique.id,
      name: technique.name,
      description: technique.description,
      icon: technique.icon,
      
      // Преобразуем snake_case в camelCase
      type: technique.type,
      element: technique.element,
      damage: technique.damage,
      damageType: technique.damage_type,
      energyCost: technique.energy_cost,
      cooldown: technique.cooldown,
      maxLevel: technique.max_level,
      requiredLevel: technique.required_level,
      healing: technique.healing,
      
      // Оригинальные поля тоже сохраняем для совместимости
      energy_cost: technique.energy_cost,
      damage_type: technique.damage_type,
      max_level: technique.max_level,
      required_level: technique.required_level
    };
    
    // Добавляем функцию расчета стоимости улучшения
    enriched.upgradeCost = (targetLevel) => {
      const level = targetLevel || 1;
      
      // Расчет для изучения (уровень 1)
      if (level === 1) {
        return {
          experience: 75,
          currency: {
            gold: 100,
            silver: 0,
            copper: 0
          },
          spiritStones: 0
        };
      }
      
      // Расчет для улучшения (уровень 2+)
      return {
        experience: 50 * level,
        currency: {
          gold: 100 + 20 * level,
          silver: 0,
          copper: 0
        },
        spiritStones: level
      };
    };
    
    // Добавляем метод вычисления урона на основе уровня
    enriched.calculateDamage = (level) => {
      const lvl = level || 1;
      return enriched.damage ? Math.floor(enriched.damage * (1 + 0.1 * (lvl - 1))) : 0;
    };
    
    // Обогащаем эффекты, если они есть
    if (technique.effects && Array.isArray(technique.effects)) {
      // Преобразуем эффекты техники
      enriched.effects = technique.effects
        .filter(effect => effect && effect !== null)
        .map(effect => ({
          id: effect.id,
          name: effect.name,
          description: effect.description,
          duration: effect.duration,
          damage: effect.damage,
          damageType: effect.damage_type,
          healing: effect.healing,
          stats: effect.stats || {}
        }));
    } else {
      enriched.effects = [];
    }
    
    console.log('Обогащенная техника:', enriched);
    return enriched;
  }

  /**
   * Получает технику по ID
   * @param {string} id - ID техники
   * @returns {Promise<Object>} Промис с данными техники
   */
  static async getTechniqueById(id) {
    try {
      const response = await fetch(`${API_URL}/techniques/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Ошибка при получении техники с ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Получает технику по имени
   * @param {string} name - Имя техники
   * @returns {Promise<Object>} Промис с данными техники
   */
  static async getTechniqueByName(name) {
    try {
      const response = await fetch(`${API_URL}/techniques/by-name/${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Ошибка при получении техники с именем ${name}:`, error);
      return null;
    }
  }

  /**
   * Получает техники по типу
   * @param {string} type - Тип техники
   * @returns {Promise<Array>} Промис с массивом техник указанного типа
   */
  static async getTechniquesByType(type) {
    try {
      const response = await fetch(`${API_URL}/techniques/type/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Ошибка при получении техник типа ${type}:`, error);
      return [];
    }
  }

  /**
   * Получает все изученные техники пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} Промис с массивом изученных техник
   */
  static async getUserTechniques(userId) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/techniques`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Ошибка при получении техник пользователя ${userId}:`, error);
      return [];
    }
  }
  
  /**
   * Получает все изученные техники пользователя (алиас для getUserTechniques для обратной совместимости)
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} Промис с массивом изученных техник
   */
  static async getLearnedTechniques(userId) {
    try {
      return await this.getUserTechniques(userId);
    } catch (error) {
      console.error(`Ошибка при получении изученных техник пользователя ${userId}:`, error);
      return [];
    }
  }
  
  /**
   * Получает доступные для изучения техники пользователя
   * @param {number} userId - ID пользователя
   * @param {number} userLevel - Уровень пользователя
   * @returns {Promise<Array>} Промис с массивом доступных техник
   */
  static async getAvailableTechniques(userId, userLevel) {
    try {
      // Сначала получаем все техники
      const allTechniques = await TechniqueServiceAPI.getAllTechniques();
      
      // Затем получаем изученные техники пользователя
      const learnedTechniques = await TechniqueServiceAPI.getLearnedTechniques(userId);
      const learnedIds = learnedTechniques.map(t => t.id);
      
      // Фильтруем техники, которые подходят пользователю по уровню и еще не изучены
      return allTechniques.filter(technique => {
        const isLevelOk = !technique.requiredLevel || technique.requiredLevel <= userLevel;
        const isNotLearned = !learnedIds.includes(technique.id);
        return isLevelOk && isNotLearned;
      });
    } catch (error) {
      console.error(`Ошибка при получении доступных техник для пользователя ${userId}:`, error);
      return [];
    }
  }

  /**
   * Изучает новую технику
   * @param {number} userId - ID пользователя
   * @param {string} techniqueId - ID техники
   * @param {Object} data - Дополнительные данные (например, стоимость)
   * @returns {Promise<Object>} Промис с результатом операции
   */
  static async learnTechnique(userId, techniqueId, data = {}) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/techniques/${techniqueId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Ошибка при изучении техники ${techniqueId}:`, error);
      throw error;
    }
  }

  /**
   * Улучшает уровень техники
   * @param {number} userId - ID пользователя
   * @param {string} techniqueId - ID техники
   * @param {Object} data - Дополнительные данные (например, стоимость)
   * @returns {Promise<Object>} Промис с результатом операции
   */
  static async upgradeTechnique(userId, techniqueId, data = {}) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/techniques/${techniqueId}/upgrade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Ошибка при улучшении техники ${techniqueId}:`, error);
      throw error;
    }
  }
  // Нестатические методы для обратной совместимости
  getUserTechniques(userId) {
    return TechniqueServiceAPI.getUserTechniques(userId);
  }
  
  getLearnedTechniques(userId) {
    return TechniqueServiceAPI.getLearnedTechniques(userId);
  }
  
  getAllTechniques() {
    return TechniqueServiceAPI.getAllTechniques();
  }
  
  getTechniqueById(id) {
    return TechniqueServiceAPI.getTechniqueById(id);
  }
  
  getTechniqueByName(name) {
    return TechniqueServiceAPI.getTechniqueByName(name);
  }
  
  getAvailableTechniques(userId, userLevel) {
    return TechniqueServiceAPI.getAvailableTechniques(userId, userLevel);
  }
  
  learnTechnique(userId, techniqueId, data) {
    return TechniqueServiceAPI.learnTechnique(userId, techniqueId, data);
  }
  
  upgradeTechnique(userId, techniqueId, targetLevel, data) {
    return TechniqueServiceAPI.upgradeTechnique(userId, techniqueId, data);
  }
}

// Создаем экземпляр для использования в качестве синглтона
const techniqueServiceInstance = new TechniqueServiceAPI();

// Экспортируем экземпляр, класс API и константы
module.exports = techniqueServiceInstance;
module.exports.TechniqueServiceAPI = TechniqueServiceAPI; // Экспортируем класс для тех, кто хочет создать свой экземпляр
module.exports.techniqueTypes = techniqueTypes;
module.exports.elementTypes = elementTypes;
module.exports.elementColors = elementColors;
module.exports.techniqueCategories = techniqueCategories;