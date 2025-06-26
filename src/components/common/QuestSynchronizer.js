import React, { useEffect } from 'react';
import QuestService, { normalizeQuestData } from '../../services/quest-adapter';

/**
 * Компонент для автоматической синхронизации квестов
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 */
const QuestSynchronizer = ({ userId, quests }) => {
  useEffect(() => {
    if (!userId) return;
    
    // Функция для обновления данных о квестах
    const synchronizeQuests = async () => {
      try {
        // Получаем квесты с сервера
        // Получаем и нормализуем данные квестов
        let userQuests = await QuestService.getQuests(userId);
        
        // Применяем нормализацию данных в зависимости от формата ответа
        if (userQuests && typeof userQuests === 'object' && !Array.isArray(userQuests)) {
          // Нормализуем каждую категорию
          if (userQuests.active) {
            userQuests.active = userQuests.active.map(quest => normalizeQuestData(quest));
          }
          if (userQuests.completed) {
            userQuests.completed = userQuests.completed.map(quest => normalizeQuestData(quest));
          }
          if (userQuests.available) {
            userQuests.available = userQuests.available.map(quest => normalizeQuestData(quest));
          }
        } else if (Array.isArray(userQuests)) {
          userQuests = userQuests.map(quest => normalizeQuestData(quest));
        }
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('quests-updated', { 
          detail: userQuests 
        }));
        
        console.log('Квесты успешно синхронизированы, получено квестов:', userQuests.length);
      } catch (error) {
        console.error('Ошибка при синхронизации квестов:', error);
      }
    };
    
    // Начальная синхронизация только если нет квестов
    if (!quests || quests.length === 0) {
      synchronizeQuests();
    }
    
    // Устанавливаем интервал обновления (каждые 5 минут)
    const intervalId = setInterval(synchronizeQuests, 300000);
    
    // Создаем обработчики событий для немедленного обновления при изменениях
    const handleQuestChange = () => synchronizeQuests();
    const handleQuestAccepted = () => synchronizeQuests();
    const handleQuestCompleted = () => synchronizeQuests();
    const handleQuestProgressUpdated = () => synchronizeQuests();
    
    // Добавляем слушатели событий
    window.addEventListener('quest-changed', handleQuestChange);
    window.addEventListener('quest-accepted', handleQuestAccepted);
    window.addEventListener('quest-completed', handleQuestCompleted);
    window.addEventListener('quest-progress-updated', handleQuestProgressUpdated);
    
    // Функция очистки при размонтировании компонента
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('quest-changed', handleQuestChange);
      window.removeEventListener('quest-accepted', handleQuestAccepted);
      window.removeEventListener('quest-completed', handleQuestCompleted);
      window.removeEventListener('quest-progress-updated', handleQuestProgressUpdated);
    };
  }, [userId, quests]);
  
  // Компонент не рендерит UI
  return null;
};

// Значения по умолчанию для пропсов
QuestSynchronizer.defaultProps = {
  quests: []
};

export default QuestSynchronizer;