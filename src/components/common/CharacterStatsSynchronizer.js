import React, { useEffect } from 'react';
import CharacterStatsService from '../../services/character-stats-adapter';

/**
 * Компонент для автоматической синхронизации данных о характеристиках персонажа
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 */
const CharacterStatsSynchronizer = ({ userId }) => {
  useEffect(() => {
    if (!userId) return;
    
    // Функция для обновления данных о характеристиках персонажа
    const synchronizeCharacterStats = async () => {
      try {
        // Получаем характеристики персонажа
        const stats = await CharacterStatsService.getCharacterStats(userId);
        
        // Обновляем локальное состояние через менеджер
        if (window.characterStatsManager && stats) {
          window.dispatchEvent(new CustomEvent('character-stats-updated', { 
            detail: { stats } 
          }));
          
          console.log('Данные о характеристиках персонажа успешно синхронизированы');
        }
      } catch (error) {
        console.error('Ошибка при синхронизации данных о характеристиках персонажа:', error);
      }
    };
    
    // Начальная синхронизация
    synchronizeCharacterStats();
    
    // Устанавливаем интервал обновления (каждые 2 минуты)
    const intervalId = setInterval(synchronizeCharacterStats, 120000);
    
    // Создаем обработчики событий для немедленного обновления при изменениях
    const handleCharacterStatsChange = () => synchronizeCharacterStats();
    const handleUserLogin = () => synchronizeCharacterStats();
    const handleCultivationChange = () => synchronizeCharacterStats();
    const handleEquipmentChange = () => synchronizeCharacterStats();
    
    // Добавляем слушатели событий
    window.addEventListener('character-stats-changed', handleCharacterStatsChange);
    window.addEventListener('user-login', handleUserLogin);
    window.addEventListener('cultivation-changed', handleCultivationChange);
    window.addEventListener('equipment-changed', handleEquipmentChange);
    
    // Функция очистки при размонтировании компонента
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('character-stats-changed', handleCharacterStatsChange);
      window.removeEventListener('user-login', handleUserLogin);
      window.removeEventListener('cultivation-changed', handleCultivationChange);
      window.removeEventListener('equipment-changed', handleEquipmentChange);
    };
  }, [userId]);
  
  // Компонент не рендерит UI
  return null;
};

export default CharacterStatsSynchronizer;