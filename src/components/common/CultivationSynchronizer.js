import React, { useEffect } from 'react';
import CultivationService from '../../services/cultivation-adapter';

/**
 * Компонент для автоматической синхронизации данных культивации
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 */
const CultivationSynchronizer = ({ userId, cultivation }) => {
  useEffect(() => {
    if (!userId) return;
    
    // Функция для обновления данных культивации
    const synchronizeCultivation = async () => {
      try {
        // Получаем данные культивации с сервера
        const cultivationData = await CultivationService.getCultivationProgress(userId);
        
        // Отправляем событие с обновленными данными
        window.dispatchEvent(new CustomEvent('cultivation-updated', { 
          detail: cultivationData 
        }));
        
        console.log('Данные культивации успешно синхронизированы');
      } catch (error) {
        console.error('Ошибка при синхронизации данных культивации:', error);
      }
    };
    
    // Начальная синхронизация только если нет данных культивации
    if (!cultivation) {
      synchronizeCultivation();
    }
    
    // Устанавливаем интервал обновления (каждые 2 минуты)
    // Культивация меняется реже, чем инвентарь, поэтому интервал больше
    const intervalId = setInterval(synchronizeCultivation, 120000);
    
    // Создаем обработчики событий для немедленного обновления при изменениях
    const handleCultivationChange = (event) => {
      // Если у события есть данные, обрабатываем их напрямую
      if (event && event.detail && event.detail.bottleneckProgress !== undefined) {
        console.log('CultivationSynchronizer: получено событие с данными bottleneckProgress =',
          event.detail.bottleneckProgress);
        
        // Напрямую обновляем Redux-состояние, если доступен диспетчер
        if (window.__GAME_DISPATCH__) {
          window.__GAME_DISPATCH__({
            type: 'UPDATE_CULTIVATION',
            payload: {
              bottleneckProgress: event.detail.bottleneckProgress,
              // Если есть requiredBottleneckProgress, тоже обновляем
              ...(event.detail.requiredBottleneckProgress !== undefined && {
                requiredBottleneckProgress: event.detail.requiredBottleneckProgress
              })
            }
          });
          
          // Проверяем обновление Redux-состояния
          setTimeout(() => {
            const currentState = window.__GAME_STATE__?.player?.cultivation;
            console.log('CultivationSynchronizer: bottleneckProgress в Redux после события =',
              currentState?.bottleneckProgress);
          }, 50);
          
        } else {
          console.warn('CultivationSynchronizer: Redux dispatch недоступен');
          // Если диспетчер недоступен, синхронизируем традиционным способом
          synchronizeCultivation();
        }
      } else {
        // Если данных нет, делаем полную синхронизацию
        synchronizeCultivation();
      }
    };
    
    const handleBreakthroughComplete = () => synchronizeCultivation();
    const handleTribulationComplete = () => synchronizeCultivation();
    const handleInsightGained = () => synchronizeCultivation();
    
    // Добавляем слушатели событий
    window.addEventListener('cultivation-changed', handleCultivationChange);
    window.addEventListener('breakthrough-complete', handleBreakthroughComplete);
    window.addEventListener('tribulation-complete', handleTribulationComplete);
    window.addEventListener('insight-gained', handleInsightGained);
    
    // Функция очистки при размонтировании компонента
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('cultivation-changed', handleCultivationChange);
      window.removeEventListener('breakthrough-complete', handleBreakthroughComplete);
      window.removeEventListener('tribulation-complete', handleTribulationComplete);
      window.removeEventListener('insight-gained', handleInsightGained);
    };
  }, [userId, cultivation]);
  
  // Компонент не рендерит UI
  return null;
};

// Значения по умолчанию для пропсов
CultivationSynchronizer.defaultProps = {
  cultivation: null
};

export default CultivationSynchronizer;