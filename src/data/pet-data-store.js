/**
 * Хранилище данных для духовных питомцев
 * Централизует операции и обеспечивает кэширование в localStorage
 */

const SpiritPet = require('../models/spirit-pet');
const LOCAL_STORAGE_KEY = 'spirit_pets_data';

// Создаем заглушку для localStorage если он не доступен (в серверной среде)
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };
}

// Добавляем методы для корректной работы модели в браузере
if (!SpiritPet.fromJSON) {
  /**
   * Создает экземпляр питомца из JSON-объекта
   * @param {Object} data - JSON-объект с данными питомца
   * @returns {Object} - Экземпляр питомца
   */
  SpiritPet.fromJSON = function(data) {
    const pet = {
      ...data,
      // Преобразуем строковые даты в объекты Date
      lastFed: data.lastFed ? new Date(data.lastFed) : new Date(),
      lastTrained: data.lastTrained ? new Date(data.lastTrained) : null,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
    
    return pet;
  };
}

if (!SpiritPet.prototype.toJSON) {
  /**
   * Преобразует экземпляр питомца в JSON-объект
   * @returns {Object} - JSON-объект для сохранения
   */
  SpiritPet.prototype.toJSON = function() {
    return {
      ...this
    };
  };
}

class PetDataStore {
  constructor() {
    this.pets = new Map();
    this.loaded = false;
  }
  
  /**
   * Загрузка данных из localStorage
   * @returns {boolean} - Успешно ли загружены данные
   */
  loadFromStorage() {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        parsedData.forEach(petData => {
          try {
            const pet = SpiritPet.fromJSON(petData);
            this.pets.set(pet.id, pet);
          } catch (e) {
            console.warn(`Ошибка при преобразовании питомца из JSON: ${e.message}`);
          }
        });
        console.log(`Загружено ${this.pets.size} питомцев из localStorage`);
      } else {
        console.log('Данные о питомцах в localStorage не найдены');
      }
      this.loaded = true;
      return true;
    } catch (err) {
      console.error('Ошибка при загрузке данных питомцев:', err);
      // Even on error, mark as loaded to prevent infinite loading state
      this.loaded = true;
      return false;
    }
  }
  
  /**
   * Сохранение данных в localStorage
   * @returns {boolean} - Успешно ли сохранены данные
   */
  saveToStorage() {
    try {
      const dataToStore = Array.from(this.pets.values()).map(pet => pet.toJSON());
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
      return true;
    } catch (err) {
      console.error('Ошибка при сохранении данных питомцев:', err);
      return false;
    }
  }
  
  /**
   * Получение всех питомцев пользователя
   * @param {string} userId - ID пользователя
   * @returns {Array} - Массив питомцев
   */
  getPetsByUserId(userId) {
    if (!this.loaded) this.loadFromStorage();
    
    // Используем demo_user, если userId не задан
    const effectiveUserId = userId || 'demo_user';
    
    const result = [];
    this.pets.forEach(pet => {
      if (pet.userId === effectiveUserId) {
        result.push(pet);
      }
    });
    
    console.log(`Найдено ${result.length} питомцев для пользователя ${effectiveUserId}`);
    
    // Если ничего не найдено, но это первый запрос, создадим демонстрационного питомца
    if (result.length === 0 && (effectiveUserId === 'demo_user') && !this._createdDemoPet) {
      console.log('Питомцы не найдены, создаем демонстрационного питомца');
      // Устанавливаем флаг, чтобы избежать создания множества питомцев
      this._createdDemoPet = true;
      
      // В следующем запросе будет создан питомец через SpiritPetService.createPet
      // который вызовет наш метод addPet
    }
    
    return result;
  }
  
  /**
   * Получение активного питомца пользователя
   * @param {string} userId - ID пользователя
   * @returns {Object|null} - Активный питомец или null
   */
  getActivePet(userId) {
    if (!this.loaded) this.loadFromStorage();
    
    // Используем demo_user, если userId не задан
    const effectiveUserId = userId || 'demo_user';
    
    let activePet = null;
    this.pets.forEach(pet => {
      if (pet.userId === effectiveUserId && pet.isActive) {
        activePet = pet;
      }
    });
    
    return activePet;
  }
  
  /**
   * Получение питомца по ID
   * @param {string} petId - ID питомца
   * @returns {Object|null} - Питомец или null
   */
  getPetById(petId) {
    if (!this.loaded) this.loadFromStorage();
    return this.pets.get(petId) || null;
  }
  
  /**
   * Добавление нового питомца
   * @param {Object} petData - Данные питомца
   * @returns {Object} - Созданный питомец
   */
  addPet(petData) {
    if (!this.loaded) this.loadFromStorage();
    
    // Если ID не задан, генерируем его
    if (!petData.id) {
      petData.id = `pet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    // Устанавливаем текущее время для дат создания и обновления, если они не заданы
    if (!petData.createdAt) {
      petData.createdAt = new Date();
    }
    
    if (!petData.updatedAt) {
      petData.updatedAt = new Date();
    }
    
    // Устанавливаем время последнего кормления
    if (!petData.lastFed) {
      petData.lastFed = new Date();
    }
    
    const pet = petData; // Используем объект напрямую
    this.pets.set(pet.id, pet);
    this.saveToStorage();
    
    console.log(`Питомец добавлен: ${pet.name} (ID: ${pet.id})`);
    return pet;
  }
  
  /**
   * Обновление данных питомца
   * @param {string} petId - ID питомца
   * @param {Object} updates - Обновляемые данные
   * @returns {Object|null} - Обновленный питомец или null
   */
  updatePet(petId, updates) {
    if (!this.loaded) this.loadFromStorage();
    
    const pet = this.getPetById(petId);
    if (!pet) return null;
    
    Object.assign(pet, updates);
    this.saveToStorage();
    return pet;
  }
  
  /**
   * Удаление питомца
   * @param {string} petId - ID питомца
   * @returns {boolean} - Успешно ли удален питомец
   */
  removePet(petId) {
    if (!this.loaded) this.loadFromStorage();
    
    const result = this.pets.delete(petId);
    if (result) this.saveToStorage();
    return result;
  }
  
  /**
   * Активация питомца
   * @param {string} userId - ID пользователя
   * @param {string} petId - ID питомца
   * @returns {Object|null} - Активированный питомец или null
   */
  activatePet(userId, petId) {
    if (!this.loaded) this.loadFromStorage();
    
    // Используем demo_user, если userId не задан
    const effectiveUserId = userId || 'demo_user';
    
    const pets = this.getPetsByUserId(effectiveUserId);
    let activatedPet = null;
    
    // Если питомец не принадлежит пользователю, обновляем его принадлежность
    const pet = this.getPetById(petId);
    if (pet && pet.userId !== effectiveUserId) {
      console.log(`Обновляем принадлежность питомца от ${pet.userId} к ${effectiveUserId}`);
      pet.userId = effectiveUserId;
    }
    
    // Активируем целевого питомца и деактивируем остальных
    pets.forEach(pet => {
      if (pet.id === petId) {
        pet.isActive = true;
        activatedPet = pet;
      } else {
        pet.isActive = false;
      }
    });
    
    if (activatedPet) {
      console.log(`Питомец ${activatedPet.name} активирован для пользователя ${effectiveUserId}`);
    } else {
      console.warn(`Не удалось активировать питомца с ID ${petId} для пользователя ${effectiveUserId}`);
    }
    
    this.saveToStorage();
    return activatedPet;
  }
  
  /**
   * Очистка всех данных
   */
  clearAll() {
    this.pets.clear();
    this.saveToStorage();
  }
}

// Создаем и экспортируем единственный экземпляр
const petDataStore = new PetDataStore();
petDataStore.loadFromStorage(); // Предзагружаем данные

module.exports = petDataStore;
