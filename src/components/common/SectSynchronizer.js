import React, { useEffect } from 'react';
import SectService from '../../services/sect-adapter';

/**
 * Компонент для автоматической синхронизации данных о секте
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 */
const SectSynchronizer = ({ userId, sect }) => {
  useEffect(() => {
    if (!userId) return;
    
    // Функция для обновления данных о секте
    const synchronizeSect = async () => {
      try {
        // Получаем секту пользователя
        const userSect = await SectService.getUserSect(userId);
        
        // Отправляем событие с обновленными данными
        if (userSect) {
          window.dispatchEvent(new CustomEvent('sect-updated', { 
            detail: userSect 
          }));
          
          // Получаем бонусы от секты
          try {
            const benefits = await SectService.getSectBenefits(userId);
            window.dispatchEvent(new CustomEvent('sect-benefits-updated', { 
              detail: benefits 
            }));
          } catch (error) {
            console.error('Ошибка при получении бонусов от секты:', error);
          }
          
          // Получаем ранг пользователя в секте
          try {
            const rank = await SectService.getUserSectRank(userId);
            window.dispatchEvent(new CustomEvent('sect-rank-updated', { 
              detail: rank 
            }));
          } catch (error) {
            console.error('Ошибка при получении ранга пользователя в секте:', error);
          }
        } else {
          // Если пользователь не в секте, отправляем событие об очистке
          window.dispatchEvent(new CustomEvent('sect-updated', { 
            detail: null 
          }));
        }
        
        console.log('Данные о секте успешно синхронизированы');
      } catch (error) {
        console.error('Ошибка при синхронизации данных о секте:', error);
      }
    };
    
    // Начальная синхронизация только если нет данных о секте
    if (!sect) {
      synchronizeSect();
    }
    
    // Устанавливаем интервал обновления (каждые 5 минут)
    const intervalId = setInterval(synchronizeSect, 300000);
    
    // Создаем обработчики событий для немедленного обновления при изменениях
    const handleSectChange = () => synchronizeSect();
    const handleSectJoin = () => synchronizeSect();
    const handleSectLeave = () => synchronizeSect();
    const handleSectContribute = () => synchronizeSect();
    const handleSectCreate = () => synchronizeSect();
    
    // Добавляем слушатели событий
    window.addEventListener('sect-changed', handleSectChange);
    window.addEventListener('sect-joined', handleSectJoin);
    window.addEventListener('sect-left', handleSectLeave);
    window.addEventListener('sect-contributed', handleSectContribute);
    window.addEventListener('sect-created', handleSectCreate);
    
    // Функция очистки при размонтировании компонента
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('sect-changed', handleSectChange);
      window.removeEventListener('sect-joined', handleSectJoin);
      window.removeEventListener('sect-left', handleSectLeave);
      window.removeEventListener('sect-contributed', handleSectContribute);
      window.removeEventListener('sect-created', handleSectCreate);
    };
  }, [userId, sect]);
  
  // Компонент не рендерит UI
  return null;
};

// Значения по умолчанию для пропсов
SectSynchronizer.defaultProps = {
  sect: null
};

export default SectSynchronizer;