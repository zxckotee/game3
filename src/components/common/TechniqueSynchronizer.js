import React, { useEffect } from 'react';
import TechniqueService from '../../services/technique-adapter';

/**
 * Компонент для автоматической синхронизации техник
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 */
const TechniqueSynchronizer = ({ userId, learnedTechniques, availableTechniques }) => {
  useEffect(() => {
    if (!userId) return;
    
    // Функция для обновления данных об изученных техниках
    const synchronizeLearnedTechniques = async () => {
      try {
        // Получаем изученные техники с сервера
        const learnedTechniquesData = await TechniqueService.getLearnedTechniques(userId);
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('learned-techniques-updated', { 
          detail: learnedTechniquesData 
        }));
        
        console.log('Изученные техники успешно синхронизированы');
      } catch (error) {
        console.error('Ошибка при синхронизации изученных техник:', error);
      }
    };
    
    // Функция для обновления данных о доступных техниках
    const synchronizeAvailableTechniques = async () => {
      try {
        // Получаем все техники с сервера
        const techniquesData = await TechniqueService.getAllTechniques();
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('available-techniques-updated', { 
          detail: techniquesData 
        }));
        
        console.log('Доступные техники успешно синхронизированы');
      } catch (error) {
        console.error('Ошибка при синхронизации доступных техник:', error);
      }
    };
    
    // Начальная синхронизация только если нет данных
    if (!learnedTechniques || learnedTechniques.length === 0) {
      synchronizeLearnedTechniques();
    }
    
    if (!availableTechniques || availableTechniques.length === 0) {
      synchronizeAvailableTechniques();
    }
    
    // Устанавливаем интервал обновления (каждые 3 минуты для изученных техник, каждые 15 минут для всех техник)
    const learnedTechniquesIntervalId = setInterval(synchronizeLearnedTechniques, 180000);
    const availableTechniquesIntervalId = setInterval(synchronizeAvailableTechniques, 900000);
    
    // Создаем обработчики событий для немедленного обновления при изменениях
    const handleTechniqueChange = () => synchronizeLearnedTechniques();
    const handleNewTechniqueLearned = () => synchronizeLearnedTechniques();
    const handleTechniqueUpgraded = () => synchronizeLearnedTechniques();
    const handleTechniqueUsed = (event) => {
      // Проверяем, нужно ли обновить техники после использования
      if (event.detail?.result?.techniqueUpdated) {
        synchronizeLearnedTechniques();
      }
    };
    
    // Добавляем слушатели событий
    window.addEventListener('technique-changed', handleTechniqueChange);
    window.addEventListener('technique-learned', handleNewTechniqueLearned);
    window.addEventListener('technique-upgraded', handleTechniqueUpgraded);
    window.addEventListener('technique-used', handleTechniqueUsed);
    
    // Функция очистки при размонтировании компонента
    return () => {
      clearInterval(learnedTechniquesIntervalId);
      clearInterval(availableTechniquesIntervalId);
      window.removeEventListener('technique-changed', handleTechniqueChange);
      window.removeEventListener('technique-learned', handleNewTechniqueLearned);
      window.removeEventListener('technique-upgraded', handleTechniqueUpgraded);
      window.removeEventListener('technique-used', handleTechniqueUsed);
    };
  }, [userId, learnedTechniques, availableTechniques]);
  
  // Компонент не рендерит UI
  return null;
};

// Значения по умолчанию для пропсов
TechniqueSynchronizer.defaultProps = {
  learnedTechniques: [],
  availableTechniques: []
};

export default TechniqueSynchronizer;