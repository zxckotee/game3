import React, { useState, useEffect, useCallback } from 'react';
import SectService from '../../services/sect-adapter';
import SectSynchronizer from './SectSynchronizer';

/**
 * Компонент для управления сектами
 * Предоставляет методы для работы с сектами и синхронизирует данные с сервером
 */
const SectManager = () => {
  // Локальное состояние вместо Redux
  const [userId, setUserId] = useState(null);
  const [sect, setSect] = useState(null);
  
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
  
  // При изменении userId загружаем данные о секте пользователя
  useEffect(() => {
    if (userId && !sect) {
      getUserSect().then(sectData => {
        if (sectData) {
          setSect(sectData);
        }
      });
    }
  }, [userId]);
  
  /**
   * Получение информации о секте по ID
   * @param {number} sectId - ID секты
   * @returns {Promise<Object>} Секта
   */
  const getSectById = useCallback(async (sectId) => {
    try {
      const sectData = await SectService.getSectById(sectId);
      return sectData;
    } catch (error) {
      console.error(`Ошибка при получении секты с ID ${sectId}:`, error);
      return null;
    }
  }, []);
  
  /**
   * Получение информации о секте игрока
   * @returns {Promise<Object>} Секта игрока
   */
  const getUserSect = useCallback(async () => {
    if (!userId) {
      console.error('Невозможно получить секту пользователя: пользователь не авторизован');
      return null;
    }
    
    try {
      const sectData = await SectService.getUserSect(userId);
      
      // Обновляем локальное состояние
      if (sectData) {
        setSect(sectData);
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('sect-updated', { 
          detail: sectData 
        }));
      }
      
      return sectData;
    } catch (error) {
      console.error('Ошибка при получении секты пользователя:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Создание секты
   * @param {string} sectName - Название секты
   * @returns {Promise<Object>} Созданная секта
   */
  const createSect = useCallback(async (sectName) => {
    if (!userId) {
      console.error('Невозможно создать секту: пользователь не авторизован');
      return null;
    }
    
    try {
      const sectData = await SectService.createSect(userId, sectName);
      
      // Обновляем локальное состояние
      if (sectData) {
        setSect(sectData);
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('sect-updated', { 
          detail: sectData 
        }));
      }
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('sect-created', { 
        detail: { sect: sectData } 
      }));
      
      return sectData;
    } catch (error) {
      console.error('Ошибка при создании секты:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Присоединение к секте
   * @param {number} sectId - ID секты
   * @returns {Promise<Object>} Член секты
   */
  const joinSect = useCallback(async (sectId) => {
    if (!userId) {
      console.error('Невозможно присоединиться к секте: пользователь не авторизован');
      return null;
    }
    
    try {
      const sectMember = await SectService.joinSect(userId, sectId);
      
      // Обновляем данные секты пользователя
      const sectData = await SectService.getUserSect(userId);
      if (sectData) {
        setSect(sectData);
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('sect-updated', { 
          detail: sectData 
        }));
      }
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('sect-joined', { 
        detail: { sectId, sectMember } 
      }));
      
      return sectMember;
    } catch (error) {
      console.error('Ошибка при присоединении к секте:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Внесение вклада в секту
   * @param {number} energyAmount - Количество энергии для вклада
   * @returns {Promise<Object>} Результат вклада
   */
  const contributeToSect = useCallback(async (energyAmount) => {
    if (!userId) {
      console.error('Невозможно внести вклад в секту: пользователь не авторизован');
      return null;
    }
    
    if (!sect) {
      console.error('Невозможно внести вклад: пользователь не состоит в секте');
      return null;
    }
    
    try {
      const result = await SectService.contributeToSect(userId, sect.id, energyAmount);
      
      // Обновляем данные секты после вклада
      getUserSect();
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('sect-contributed', { 
        detail: { result } 
      }));
      
      return result;
    } catch (error) {
      console.error('Ошибка при внесении вклада в секту:', error);
      return null;
    }
  }, [userId, sect, getUserSect]);
  
  /**
   * Тренировка с членом секты
   * @param {number} memberId - ID члена секты
   * @param {number} duration - Продолжительность тренировки
   * @returns {Promise<Object>} Результат тренировки
   */
  const trainWithMember = useCallback(async (memberId, duration) => {
    if (!userId) {
      console.error('Невозможно тренироваться с членом секты: пользователь не авторизован');
      return null;
    }
    
    try {
      const result = await SectService.trainWithMember(userId, memberId, duration);
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('sect-member-trained', { 
        detail: { memberId, result } 
      }));
      
      return result;
    } catch (error) {
      console.error('Ошибка при тренировке с членом секты:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Получение бонусов от секты
   * @returns {Promise<Array>} Бонусы от секты
   */
  const getSectBenefits = useCallback(async () => {
    if (!userId) {
      console.error('Невозможно получить бонусы от секты: пользователь не авторизован');
      return [];
    }
    
    try {
      const benefits = await SectService.getSectBenefits(userId);
      
      // Отправляем событие с бонусами
      window.dispatchEvent(new CustomEvent('sect-benefits-updated', { 
        detail: benefits 
      }));
      
      return benefits;
    } catch (error) {
      console.error('Ошибка при получении бонусов от секты:', error);
      return [];
    }
  }, [userId]);
  
  /**
   * Получение ранга пользователя в секте
   * @returns {Promise<Object>} Ранг и привилегии пользователя в секте
   */
  const getUserSectRank = useCallback(async () => {
    if (!userId) {
      console.error('Невозможно получить ранг в секте: пользователь не авторизован');
      return {
        inSect: false,
        rank: 'Нет',
        privileges: []
      };
    }
    
    try {
      const rank = await SectService.getUserSectRank(userId);
      
      // Отправляем событие с рангом
      window.dispatchEvent(new CustomEvent('sect-rank-updated', { 
        detail: rank 
      }));
      
      return rank;
    } catch (error) {
      console.error('Ошибка при получении ранга пользователя в секте:', error);
      return {
        inSect: false,
        rank: 'Нет',
        privileges: []
      };
    }
  }, [userId]);
  
  /**
   * Выход из секты
   * @returns {Promise<Object>} Результат выхода
   */
  const leaveSect = useCallback(async () => {
    if (!userId) {
      console.error('Невозможно выйти из секты: пользователь не авторизован');
      return null;
    }
    
    if (!sect) {
      console.error('Невозможно выйти из секты: пользователь не состоит в секте');
      return null;
    }
    
    try {
      const result = await SectService.leaveSect(userId);
      
      // Очищаем данные о секте в локальном состоянии
      if (result && result.success) {
        setSect(null);
        
        // Отправляем событие об очистке секты
        window.dispatchEvent(new CustomEvent('sect-updated', { 
          detail: null 
        }));
      }
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('sect-left', { 
        detail: { result } 
      }));
      
      return result;
    } catch (error) {
      console.error('Ошибка при выходе из секты:', error);
      return null;
    }
  }, [userId, sect]);
  
  // Экспортируем методы через глобальный объект для доступа из других компонентов
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      if (!window.sectManager) {
        window.sectManager = {};
      }
      
      window.sectManager = {
        getSectById,
        getUserSect,
        createSect,
        joinSect,
        contributeToSect,
        trainWithMember,
        getSectBenefits,
        getUserSectRank,
        leaveSect,
        getSect: () => sect
      };
      
      // Добавляем функции для обратной совместимости с существующим кодом
      if (!window.gameManager) {
        window.gameManager = { sect: {} };
      } else if (!window.gameManager.sect) {
        window.gameManager.sect = {};
      }
      
      window.gameManager.sect = {
        ...window.sectManager
      };
    }
  }, [
    userId, 
    sect, 
    getSectById, 
    getUserSect, 
    createSect, 
    joinSect, 
    contributeToSect, 
    trainWithMember, 
    getSectBenefits, 
    getUserSectRank, 
    leaveSect
  ]);
  
  return <SectSynchronizer userId={userId} sect={sect} />;
};

export default SectManager;