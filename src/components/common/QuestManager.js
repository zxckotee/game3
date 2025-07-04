import React, { useState, useEffect, useCallback } from 'react';
import QuestService from '../../services/quest-adapter';
import QuestSynchronizer from './QuestSynchronizer';

/**
 * Компонент для управления квестами
 * Предоставляет методы для работы с квестами и синхронизирует данные с сервером
 */
const QuestManager = () => {
  // Локальное состояние вместо Redux
  const [userId, setUserId] = useState(null);
  const [quests, setQuests] = useState([]);
  
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
   * Получение всех заданий пользователя
   * @returns {Promise<Array>} Массив заданий
   */
  const getQuests = useCallback(async () => {
    if (!userId) {
      console.error('Невозможно получить задания: пользователь не авторизован');
      return [];
    }
    
    try {
      // Получаем данные квестов и нормализуем их для совместимости с UI
      let userQuests = await QuestService.getQuests(userId);
      
      // Если userQuests - объект с массивами категорий (active, completed, available)
      if (userQuests && typeof userQuests === 'object' && !Array.isArray(userQuests)) {
        // Просто объединяем все квесты в один массив
        const allQuests = [
          ...(userQuests.active || []),
          ...(userQuests.completed || []),
          ...(userQuests.available || [])
        ];
        userQuests = allQuests;
      } else if (!Array.isArray(userQuests)) {
        // Если неизвестный формат, используем пустой массив
        console.error('Неизвестный формат данных квестов:', userQuests);
        userQuests = [];
      }
      
      // Обновляем локальное состояние
      setQuests(userQuests);
      
      // Отправляем событие с обновленными данными
      window.dispatchEvent(new CustomEvent('quests-updated', { 
        detail: userQuests 
      }));
      
      return userQuests;
    } catch (error) {
      console.error('Ошибка при получении заданий:', error);
      return [];
    }
  }, [userId]);
  
  /**
   * Принятие задания
   * @param {string} questId - ID задания
   * @returns {Promise<Object>} Задание
   */
  const acceptQuest = useCallback(async (questId) => {
    if (!userId) {
      console.error('Невозможно принять задание: пользователь не авторизован');
      return null;
    }
    
    try {
      let quest = await QuestService.acceptQuest(userId, questId);
      
      // Обновляем локальное состояние
      setQuests(currentQuests => {
        // Находим индекс задания, если оно уже есть в списке
        const questIndex = currentQuests.findIndex(q => q.id === questId);
        
        // Если задание уже есть, обновляем его, иначе добавляем новое
        if (questIndex !== -1) {
          return [
            ...currentQuests.slice(0, questIndex),
            quest,
            ...currentQuests.slice(questIndex + 1)
          ];
        } else {
          return [...currentQuests, quest];
        }
      });
      
      // Отправляем событие с данными принятого задания
      window.dispatchEvent(new CustomEvent('quest-accepted', { 
        detail: { quest } 
      }));
      
      return quest;
    } catch (error) {
      console.error('Ошибка при принятии задания:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Обновление прогресса задания
   * @param {string} questId - ID задания
   * @param {Object} progress - Прогресс задания
   * @returns {Promise<Object>} Обновленное задание
   */
  const updateQuestProgress = useCallback(async (questId, progress) => {
    if (!userId) {
      console.error('Невозможно обновить прогресс задания: пользователь не авторизован');
      return null;
    }
    
    try {
      let updatedQuest = await QuestService.updateQuestProgress(userId, questId, progress);
      
      // Обновляем локальное состояние
      setQuests(currentQuests => {
        const questIndex = currentQuests.findIndex(q => q.id === questId);
        
        if (questIndex !== -1) {
          return [
            ...currentQuests.slice(0, questIndex),
            updatedQuest,
            ...currentQuests.slice(questIndex + 1)
          ];
        }
        
        return currentQuests;
      });
      
      // Отправляем событие с данными обновленного задания
      window.dispatchEvent(new CustomEvent('quest-progress-updated', { 
        detail: { quest: updatedQuest } 
      }));
      
      return updatedQuest;
    } catch (error) {
      console.error('Ошибка при обновлении прогресса задания:', error);
      return null;
    }
  }, [userId]);
  
  /**
   * Завершение задания
   * @param {string} questId - ID задания
   * @returns {Promise<Object>} Завершенное задание
   */
  const completeQuest = useCallback(async (questId) => {
    if (!userId) {
      console.error('Невозможно завершить задание: пользователь не авторизован');
      return null;
    }
    
    try {
      let completedQuest = await QuestService.completeQuest(userId, questId);
      
      // Обновляем локальное состояние
      setQuests(currentQuests => {
        const questIndex = currentQuests.findIndex(q => q.id === questId);
        
        if (questIndex !== -1) {
          return [
            ...currentQuests.slice(0, questIndex),
            completedQuest,
            ...currentQuests.slice(questIndex + 1)
          ];
        }
        
        return currentQuests;
      });
      
      // Отправляем событие с данными завершенного задания
      window.dispatchEvent(new CustomEvent('quest-completed', { 
        detail: { quest: completedQuest } 
      }));
      
      return completedQuest;
    } catch (error) {
      console.error('Ошибка при завершении задания:', error);
      return null;
    }
  }, [userId]);
  
  // Загрузка данных при монтировании
  useEffect(() => {
    if (userId) {
      getQuests();
    }
  }, [userId, getQuests]);
  
  // Экспортируем методы через глобальный объект для доступа из других компонентов
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      if (!window.questManager) {
        window.questManager = {};
      }
      
      window.questManager = {
        getQuests,
        acceptQuest,
        updateQuestProgress,
        completeQuest,
        getQuestsList: () => quests,
        getQuest: (questId) => {
          const quest = quests.find(q => q.id === questId);
          return quest || null;
        }
      };
      
      // Добавляем функции для обратной совместимости с существующим кодом
      if (!window.gameManager) {
        window.gameManager = { quests: {} };
      } else if (!window.gameManager.quests) {
        window.gameManager.quests = {};
      }
      
      window.gameManager.quests = {
        ...window.questManager
      };
    }
  }, [userId, quests, getQuests, acceptQuest, updateQuestProgress, completeQuest]);
  
  // Компонент не рендерит никакого UI
  return <QuestSynchronizer userId={userId} quests={quests} />;
};

export default QuestManager;