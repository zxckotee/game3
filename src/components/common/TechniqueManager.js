import React, { useState, useEffect, useCallback } from 'react';
import TechniqueService from '../../services/technique-adapter';
import TechniqueSynchronizer from './TechniqueSynchronizer';

/**
 * Компонент для управления техниками
 * Предоставляет методы для работы с техниками и синхронизирует данные с сервером
 */
const TechniqueManager = () => {
  // Локальное состояние вместо Redux
  const [userId, setUserId] = useState(null);
  const [learnedTechniques, setLearnedTechniques] = useState([]);
  const [availableTechniques, setAvailableTechniques] = useState([]);
  
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
   * Получение всех техник
   * @returns {Promise<Array>} Массив всех техник
   */
  const getAllTechniques = useCallback(async () => {
    try {
      const techniques = await TechniqueService.getAllTechniques();
      
      // Обновляем локальное состояние
      setAvailableTechniques(techniques);
      
      // Отправляем событие с обновленными данными
      window.dispatchEvent(new CustomEvent('available-techniques-updated', { 
        detail: techniques 
      }));
      
      return techniques;
    } catch (error) {
      console.error('Ошибка при получении техник:', error);
      return null;
    }
  }, []);
  
  /**
   * Получение техники по ID
   * @param {string} techniqueId - ID техники
   * @returns {Promise<Object>} Техника
   */
  const getTechniqueById = useCallback(async (techniqueId) => {
    try {
      // Проверяем, есть ли техника в локальном состоянии
      const cachedTechnique = availableTechniques.find(tech => tech.id === techniqueId);
      if (cachedTechnique) {
        return cachedTechnique;
      }
      
      const technique = await TechniqueService.getTechniqueById(techniqueId);
      return technique;
    } catch (error) {
      console.error(`Ошибка при получении техники с ID ${techniqueId}:`, error);
      return null;
    }
  }, [availableTechniques]);
  
  /**
   * Получение техники по названию
   * @param {string} techniqueName - Название техники
   * @returns {Promise<Object>} Техника
   */
  const getTechniqueByName = useCallback(async (techniqueName) => {
    try {
      // Проверяем, есть ли техника в локальном состоянии
      const cachedTechnique = availableTechniques.find(tech => tech.name === techniqueName);
      if (cachedTechnique) {
        return cachedTechnique;
      }
      
      const technique = await TechniqueService.getTechniqueByName(techniqueName);
      return technique;
    } catch (error) {
      console.error(`Ошибка при получении техники с названием "${techniqueName}":`, error);
      return null;
    }
  }, [availableTechniques]);
  
  /**
   * Получение всех изученных техник пользователя
   * @returns {Promise<Array>} Массив изученных техник
   */
  const getLearnedTechniques = useCallback(async () => {
    if (!userId) {
      console.error('Невозможно получить изученные техники: пользователь не авторизован');
      return null;
    }
    
    try {
      const techniques = await TechniqueService.getLearnedTechniques(userId);
      
      // Обновляем локальное состояние
      setLearnedTechniques(techniques);
      
      // Отправляем событие с обновленными данными
      window.dispatchEvent(new CustomEvent('learned-techniques-updated', { 
        detail: techniques 
      }));
      
      return techniques;
    } catch (error) {
      console.error('Ошибка при получении изученных техник:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Изучение новой техники
   * @param {string} techniqueId - ID техники
   * @returns {Promise<Object>} Изученная техника
   */
  const learnTechnique = useCallback(async (techniqueId) => {
    if (!userId) {
      console.error('Невозможно изучить технику: пользователь не авторизован');
      return null;
    }
    
    try {
      const learnedTechnique = await TechniqueService.learnTechnique(userId, techniqueId);
      
      // Обновляем локальное состояние
      const updatedTechniques = [...learnedTechniques, learnedTechnique];
      setLearnedTechniques(updatedTechniques);
      
      // Отправляем событие с обновленными данными
      window.dispatchEvent(new CustomEvent('learned-techniques-updated', { 
        detail: updatedTechniques 
      }));
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('technique-learned', { 
        detail: { technique: learnedTechnique } 
      }));
      
      return learnedTechnique;
    } catch (error) {
      console.error('Ошибка при изучении техники:', error);
      return null;
    }
  }, [userId, learnedTechniques]);
  
  /**
   * Повышение уровня техники
   * @param {string} techniqueId - ID техники
   * @returns {Promise<Object>} Обновленная техника
   */
  const upgradeTechnique = useCallback(async (techniqueId) => {
    if (!userId) {
      console.error('Невозможно повысить уровень техники: пользователь не авторизован');
      return null;
    }
    
    try {
      const upgradedTechnique = await TechniqueService.upgradeTechnique(userId, techniqueId);
      
      // Обновляем локальное состояние
      const updatedTechniques = learnedTechniques.map(technique => 
        technique.id === techniqueId ? upgradedTechnique : technique
      );
      setLearnedTechniques(updatedTechniques);
      
      // Отправляем событие с обновленными данными
      window.dispatchEvent(new CustomEvent('learned-techniques-updated', { 
        detail: updatedTechniques 
      }));
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('technique-upgraded', { 
        detail: { technique: upgradedTechnique } 
      }));
      
      return upgradedTechnique;
    } catch (error) {
      console.error('Ошибка при повышении уровня техники:', error);
      return null;
    }
  }, [userId, learnedTechniques]);
  
  /**
   * Использование техники
   * @param {string} techniqueId - ID техники
   * @returns {Promise<Object>} Результат использования техники
   */
  const useTechnique = useCallback(async (techniqueId) => {
    if (!userId) {
      console.error('Невозможно использовать технику: пользователь не авторизован');
      return null;
    }
    
    // Проверяем, изучена ли техника пользователем
    const technique = learnedTechniques.find(t => t.id === techniqueId);
    if (!technique) {
      console.error(`Техника с ID ${techniqueId} не изучена пользователем`);
      return null;
    }
    
    try {
      const result = await TechniqueService.useTechnique(userId, techniqueId);
      
      // Создаем событие для уведомления других компонентов
      window.dispatchEvent(new CustomEvent('technique-used', { 
        detail: { techniqueId, result } 
      }));
      
      return result;
    } catch (error) {
      console.error('Ошибка при использовании техники:', error);
      return null;
    }
  }, [userId, learnedTechniques]);
  
  // Загрузка данных при монтировании
  useEffect(() => {
    if (availableTechniques.length === 0) {
      getAllTechniques();
    }
    
    if (userId && learnedTechniques.length === 0) {
      getLearnedTechniques();
    }
  }, [userId, availableTechniques.length, learnedTechniques.length, getAllTechniques, getLearnedTechniques]);
  
  // Экспортируем методы через глобальный объект для доступа из других компонентов
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      if (!window.techniqueManager) {
        window.techniqueManager = {};
      }
      
      window.techniqueManager = {
        getAllTechniques,
        getTechniqueById,
        getTechniqueByName,
        getLearnedTechniques,
        learnTechnique,
        upgradeTechnique,
        useTechnique,
        getAvailableTechniques: () => availableTechniques,
        getLearnedTechniquesList: () => learnedTechniques
      };
      
      // Добавляем функции для обратной совместимости с существующим кодом
      if (!window.gameManager) {
        window.gameManager = { techniques: {} };
      } else if (!window.gameManager.techniques) {
        window.gameManager.techniques = {};
      }
      
      window.gameManager.techniques = {
        ...window.techniqueManager
      };
    }
  }, [
    userId, 
    availableTechniques, 
    learnedTechniques, 
    getAllTechniques, 
    getTechniqueById, 
    getTechniqueByName, 
    getLearnedTechniques, 
    learnTechnique, 
    upgradeTechnique, 
    useTechnique
  ]);
  
  return (
    <TechniqueSynchronizer 
      userId={userId} 
      learnedTechniques={learnedTechniques} 
      availableTechniques={availableTechniques}
    />
  );
};

export default TechniqueManager;