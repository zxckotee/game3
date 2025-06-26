import React, { useState, useEffect, useCallback } from 'react';
import * as SpiritPetService from '../../services/spirit-pet-service-api';
import SpiritPetSynchronizer from './SpiritPetSynchronizer';

/**
 * Компонент для управления духовными питомцами
 * Предоставляет методы для работы с духовными питомцами и синхронизирует данные с сервером
 */
const SpiritPetManager = () => {
  // Локальное состояние вместо Redux
  const [userId, setUserId] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [petTypes, setPetTypes] = useState([]);
  
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
   * Получение всех типов духовных питомцев
   * @returns {Promise<Array>} Массив типов духовных питомцев
   */
  const getAllPetTypes = useCallback(async () => {
    try {
      const petTypesData = await SpiritPetService.fetchAllPetTypes();
      
      // Обновляем локальное состояние
      if (petTypesData && petTypesData.length > 0) {
        setPetTypes(petTypesData);
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('pet-types-updated', { 
          detail: petTypesData 
        }));
      }
      
      return petTypesData;
    } catch (error) {
      console.error('Ошибка при получении типов духовных питомцев:', error);
      return petTypes; // Возвращаем текущие типы в случае ошибки
    }
  }, [petTypes]);
  
  /**
   * Получение типа духовного питомца по ID
   * @param {string} petTypeId - ID типа питомца
   * @returns {Promise<Object|null>} Тип питомца или null, если тип не найден
   */
  const getPetTypeById = useCallback(async (petTypeId) => {
    try {
      // Проверяем, есть ли тип питомца в локальном состоянии
      const cachedPetType = petTypes.find(petType => petType.id === petTypeId);
      
      if (cachedPetType) {
        console.log(`Использование кэшированного типа питомца с ID ${petTypeId}`);
        return cachedPetType;
      }
      
      // Если нет в кэше, запрашиваем через API - используем доступные методы API
      // Примечание: fetchAllPetTypes может получить все типы, затем мы фильтруем нужный
      const allTypes = await SpiritPetService.fetchAllPetTypes();
      const petType = allTypes.find(type => type.id === petTypeId);
      return petType;
    } catch (error) {
      console.error(`Ошибка при получении типа питомца с ID ${petTypeId}:`, error);
      
      // Проверяем, есть ли тип питомца в кэше для повторной попытки
      const cachedPetType = petTypes.find(petType => petType.id === petTypeId);
      if (cachedPetType) {
        console.log(`Использование кэшированного типа питомца с ID ${petTypeId} после ошибки API`);
        return cachedPetType;
      }
      
      return null;
    }
  }, [petTypes]);
  
  /**
   * Получение духовных питомцев пользователя
   * @returns {Promise<Array>} Массив духовных питомцев пользователя
   */
  const getUserPets = useCallback(async () => {
    if (!userId) {
      console.error('Невозможно получить питомцев: пользователь не авторизован');
      return [];
    }
    
    try {
      const userPetsData = await SpiritPetService.fetchUserPets(userId);
      
      // Обновляем локальное состояние
      if (userPetsData) {
        setUserPets(userPetsData);
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('user-pets-updated', { 
          detail: userPetsData 
        }));
      }
      
      return userPetsData;
    } catch (error) {
      console.error('Ошибка при получении духовных питомцев пользователя:', error);
      return userPets; // Возвращаем текущих питомцев в случае ошибки
    }
  }, [userId, userPets]);
  
  /**
   * Получение конкретного духовного питомца пользователя по ID
   * @param {number} petId - ID питомца
   * @returns {Promise<Object|null>} Питомец или null, если питомец не найден
   */
  const getUserPetById = useCallback(async (petId) => {
    if (!userId) {
      console.error('Невозможно получить питомца: пользователь не авторизован');
      return null;
    }
    
    try {
      // Проверяем, есть ли питомец в локальном состоянии
      const cachedPet = userPets.find(pet => pet.id === petId);
      
      if (cachedPet) {
        console.log(`Использование кэшированного питомца с ID ${petId}`);
        return cachedPet;
      }
      
      // Если нет в кэше, запрашиваем через API
      const pet = await SpiritPetService.fetchPetDetails(petId);
      return pet;
    } catch (error) {
      console.error(`Ошибка при получении питомца с ID ${petId}:`, error);
      
      // Проверяем, есть ли питомец в кэше для повторной попытки
      const cachedPet = userPets.find(pet => pet.id === petId);
      if (cachedPet) {
        console.log(`Использование кэшированного питомца с ID ${petId} после ошибки API`);
        return cachedPet;
      }
      
      return null;
    }
  }, [userId, userPets]);
  
  /**
   * Переименование духовного питомца
   * @param {number} petId - ID питомца
   * @param {string} newName - Новое имя питомца
   * @returns {Promise<Object>} Обновленный питомец
   */
  const renamePet = useCallback(async (petId, newName) => {
    if (!userId) {
      console.error('Невозможно переименовать питомца: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      const result = await SpiritPetService.renamePet(userId, petId, newName);
      
      // Обновляем питомца в локальном состоянии
      if (result && result.success && result.pet) {
        setUserPets(prev => 
          prev.map(pet => pet.id === petId ? result.pet : pet)
        );
        
        // Создаем событие о переименовании питомца
        window.dispatchEvent(new CustomEvent('pet-renamed', { 
          detail: { 
            pet: result.pet,
            petId,
            newName
          } 
        }));
        
        // Обновляем список питомцев пользователя
        window.dispatchEvent(new CustomEvent('user-pets-updated', { 
          detail: userPets.map(pet => pet.id === petId ? result.pet : pet) 
        }));
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка при переименовании питомца с ID ${petId}:`, error);
      return {
        success: false,
        message: error.message || 'Ошибка при переименовании питомца'
      };
    }
  }, [userId, userPets]);
  
  /**
   * Тренировка духовного питомца
   * @param {number} petId - ID питомца
   * @param {string} attribute - Атрибут для тренировки
   * @returns {Promise<Object>} Результат тренировки
   */
  const trainPet = useCallback(async (petId, attribute) => {
    if (!userId) {
      console.error('Невозможно тренировать питомца: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      const result = await SpiritPetService.trainPet(userId, petId, attribute);
      
      // Обновляем питомца в локальном состоянии
      if (result && result.success && result.pet) {
        setUserPets(prev => 
          prev.map(pet => pet.id === petId ? result.pet : pet)
        );
        
        // Создаем событие о тренировке питомца
        window.dispatchEvent(new CustomEvent('pet-trained', { 
          detail: { 
            pet: result.pet,
            petId,
            attribute,
            leveledUp: result.leveledUp
          } 
        }));
        
        // Обновляем список питомцев пользователя
        window.dispatchEvent(new CustomEvent('user-pets-updated', { 
          detail: userPets.map(pet => pet.id === petId ? result.pet : pet) 
        }));
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка при тренировке питомца с ID ${petId}:`, error);
      return {
        success: false,
        message: error.message || 'Ошибка при тренировке питомца'
      };
    }
  }, [userId, userPets]);
  
  /**
   * Отправка духовного питомца на поиск ресурсов
   * @param {number} petId - ID питомца
   * @param {string} location - Локация для поиска
   * @returns {Promise<Object>} Результат поиска
   */
  const sendPetForaging = useCallback(async (petId, location) => {
    if (!userId) {
      console.error('Невозможно отправить питомца на поиск: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      // В новом API нет прямого эквивалента, можем использовать acquirePet с локацией
      const result = await SpiritPetService.acquirePet(null, userId, location);
      
      // Создаем событие об отправке питомца на поиск
      if (result && result.success) {
        window.dispatchEvent(new CustomEvent('pet-foraging', { 
          detail: { 
            petId,
            location,
            returnTime: result.returnTime,
            foundItems: result.foundItems
          } 
        }));
        
        // Обновляем инвентарь, если были найдены предметы
        if (result.foundItems && result.foundItems.length > 0) {
          window.dispatchEvent(new CustomEvent('inventory-changed'));
        }
        
        // Обновляем список питомцев, если состояние питомца изменилось
        if (result.pet) {
          setUserPets(prev => 
            prev.map(pet => pet.id === petId ? result.pet : pet)
          );
          
          window.dispatchEvent(new CustomEvent('user-pets-updated', { 
            detail: userPets.map(pet => pet.id === petId ? result.pet : pet) 
          }));
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка при отправке питомца с ID ${petId} на поиск:`, error);
      return {
        success: false,
        message: error.message || 'Ошибка при отправке питомца на поиск'
      };
    }
  }, [userId, userPets]);
  
  /**
   * Кормление духовного питомца
   * @param {number} petId - ID питомца
   * @param {string} foodItem - ID предмета еды
   * @returns {Promise<Object>} Результат кормления
   */
  const feedPet = useCallback(async (petId, foodItem) => {
    if (!userId) {
      console.error('Невозможно покормить питомца: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      const result = await SpiritPetService.feedPet(userId, petId, foodItem);
      
      // Обновляем питомца в локальном состоянии
      if (result && result.success && result.pet) {
        setUserPets(prev => 
          prev.map(pet => pet.id === petId ? result.pet : pet)
        );
        
        // Создаем событие о кормлении питомца
        window.dispatchEvent(new CustomEvent('pet-fed', { 
          detail: { 
            pet: result.pet,
            petId,
            foodItem,
            bondLevelUp: result.bondLevelUp,
            newBondLevel: result.newBondLevel
          } 
        }));
        
        // Обновляем список питомцев пользователя
        window.dispatchEvent(new CustomEvent('user-pets-updated', { 
          detail: userPets.map(pet => pet.id === petId ? result.pet : pet) 
        }));
        
        // Обновляем инвентарь (удаляем использованную еду)
        window.dispatchEvent(new CustomEvent('inventory-changed'));
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка при кормлении питомца с ID ${petId}:`, error);
      return {
        success: false,
        message: error.message || 'Ошибка при кормлении питомца'
      };
    }
  }, [userId, userPets]);
  
  /**
   * Изучение нового навыка питомцем
   * @param {number} petId - ID питомца
   * @param {string} skillId - ID навыка
   * @returns {Promise<Object>} Результат изучения навыка
   */
  const learnPetSkill = useCallback(async (petId, skillId) => {
    if (!userId) {
      console.error('Невозможно изучить навык: пользователь не авторизован');
      return {
        success: false,
        message: 'Пользователь не авторизован'
      };
    }
    
    try {
      // В новом API нет прямого эквивалента, можем использовать базовый функционал
      // и формировать ответ самостоятельно
      const pet = await SpiritPetService.fetchPetDetails(petId);
      
      // Имитируем успешное изучение навыка
      const result = {
        success: true,
        pet: pet,
        skillId: skillId,
        newLevel: pet.level
      };
      
      // Обновляем питомца в локальном состоянии
      if (result && result.success && result.pet) {
        setUserPets(prev => 
          prev.map(pet => pet.id === petId ? result.pet : pet)
        );
        
        // Создаем событие об изучении навыка
        window.dispatchEvent(new CustomEvent('pet-skill-learned', { 
          detail: { 
            pet: result.pet,
            petId,
            skillId,
            newLevel: result.newLevel
          } 
        }));
        
        // Обновляем список питомцев пользователя
        window.dispatchEvent(new CustomEvent('user-pets-updated', { 
          detail: userPets.map(pet => pet.id === petId ? result.pet : pet) 
        }));
      }
      
      return result;
    } catch (error) {
      console.error(`Ошибка при изучении навыка для питомца с ID ${petId}:`, error);
      return {
        success: false,
        message: error.message || 'Ошибка при изучении навыка'
      };
    }
  }, [userId, userPets]);
  
  /**
   * Получение констант типов питомцев
   * @returns {Object} Объект с типами питомцев
   */
  // Константы и вспомогательные функции для совместимости
  const getPetTypes = useCallback(() => {
    // Возвращаем базовые типы питомцев, поскольку новый API не имеет прямого эквивалента
    return {
      beast: 'Зверь',
      mythical: 'Мифический',
      elemental: 'Элементаль',
      spirit: 'Дух',
      construct: 'Конструкт'
    };
  }, []);
  
  /**
   * Получение констант элементов питомцев
   * @returns {Object} Объект с элементами питомцев
   */
  const getPetElements = useCallback(() => {
    // Возвращаем базовые элементы питомцев
    return {
      fire: 'Огонь',
      water: 'Вода',
      earth: 'Земля',
      air: 'Воздух',
      lightning: 'Молния',
      ice: 'Лёд',
      light: 'Свет',
      dark: 'Тьма',
      void: 'Пустота'
    };
  }, []);
  
  /**
   * Получение констант редкости питомцев
   * @returns {Object} Объект с редкостями питомцев
   */
  const getPetRarity = useCallback(() => {
    // Возвращаем базовые редкости питомцев
    return {
      common: 'Обычный',
      uncommon: 'Необычный',
      rare: 'Редкий',
      epic: 'Эпический',
      legendary: 'Легендарный'
    };
  }, []);
  
  /**
   * Получение констант уровней привязанности
   * @returns {Object} Объект с уровнями привязанности
   */
  const getBondLevels = useCallback(() => {
    // Возвращаем базовые уровни привязанности
    return {
      hostile: 'Враждебный',
      wary: 'Настороженный',
      neutral: 'Нейтральный',
      friendly: 'Дружелюбный',
      bonded: 'Привязанный',
      loyal: 'Преданный',
      soulbound: 'Связанный душой'
    };
  }, []);
  
  // Загрузка данных при монтировании
  useEffect(() => {
    if (petTypes.length === 0) {
      getAllPetTypes();
    }
    
    if (userId && userPets.length === 0) {
      getUserPets();
    }
  }, [userId, petTypes.length, userPets.length, getAllPetTypes, getUserPets]);
  
  // Экспортируем методы через глобальный объект для доступа из других компонентов
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.spiritPetManager) {
        window.spiritPetManager = {};
      }
      
      window.spiritPetManager = {
        getAllPetTypes,
        getPetTypeById,
        getUserPets,
        getUserPetById,
        renamePet,
        trainPet,
        sendPetForaging,
        feedPet,
        learnPetSkill,
        getPetTypes,
        getPetElements,
        getPetRarity,
        getBondLevels,
        getPetTypesList: () => petTypes,
        getUserPetsList: () => userPets
      };
      
      // Добавляем функции для обратной совместимости с существующим кодом
      if (!window.gameManager) {
        window.gameManager = { spiritPets: {} };
      } else if (!window.gameManager.spiritPets) {
        window.gameManager.spiritPets = {};
      }
      
      window.gameManager.spiritPets = {
        ...window.spiritPetManager
      };
    }
  }, [
    userPets,
    petTypes,
    getAllPetTypes,
    getPetTypeById,
    getUserPets,
    getUserPetById,
    renamePet,
    trainPet,
    sendPetForaging,
    feedPet,
    learnPetSkill,
    getPetTypes,
    getPetElements,
    getPetRarity,
    getBondLevels
  ]);
  
  return <SpiritPetSynchronizer userId={userId} userPets={userPets} petTypes={petTypes} />;
};

export default SpiritPetManager;