import React, { useEffect } from 'react';
import * as SpiritPetService from '../../services/spirit-pet-service-api';

/**
 * Компонент для автоматической синхронизации данных о духовных питомцах
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 */
const SpiritPetSynchronizer = ({ userId, userPets, petTypes }) => {
  useEffect(() => {
    if (!userId) return;
    
    // Функция для обновления данных о типах питомцев
    const synchronizePetTypes = async () => {
      try {
        // Получаем все типы питомцев
        const petTypesData = await SpiritPetService.fetchAllPetTypes();
        
        // Отправляем событие с обновленными данными
        if (petTypesData && petTypesData.length > 0) {
          window.dispatchEvent(new CustomEvent('pet-types-updated', { 
            detail: petTypesData 
          }));
          
          console.log('Данные о типах духовных питомцев успешно синхронизированы');
        }
      } catch (error) {
        console.error('Ошибка при синхронизации данных о типах духовных питомцев:', error);
      }
    };
    
    // Функция для обновления данных о питомцах пользователя
    const synchronizeUserPets = async () => {
      try {
        // Получаем питомцев пользователя
        const userPetsData = await SpiritPetService.fetchUserPets(userId);
        
        // Отправляем событие с обновленными данными
        if (userPetsData) {
          window.dispatchEvent(new CustomEvent('user-pets-updated', { 
            detail: userPetsData 
          }));
          
          console.log('Данные о духовных питомцах пользователя успешно синхронизированы');
        }
      } catch (error) {
        console.error('Ошибка при синхронизации данных о духовных питомцах пользователя:', error);
      }
    };
    
    // Начальная синхронизация только если нет данных
    if (!petTypes || petTypes.length === 0) {
      synchronizePetTypes();
    }
    
    if (!userPets || userPets.length === 0) {
      synchronizeUserPets();
    }
    
    // Устанавливаем интервал обновления (каждые 5 минут для типов питомцев, каждую минуту для питомцев пользователя)
    const petTypesIntervalId = setInterval(synchronizePetTypes, 300000);
    const userPetsIntervalId = setInterval(synchronizeUserPets, 60000);
    
    // Создаем обработчики событий для немедленного обновления при изменениях
    const handlePetTypesChange = () => synchronizePetTypes();
    const handleUserPetsChange = () => synchronizeUserPets();
    const handlePetUpdated = (event) => {
      const updatedPet = event.detail?.pet;
      
      if (updatedPet) {
        // Отправляем событие с обновленным питомцем
        window.dispatchEvent(new CustomEvent('specific-pet-updated', { 
          detail: updatedPet 
        }));
      } else {
        // Если нет данных о конкретном питомце, обновляем всех
        synchronizeUserPets();
      }
    };
    
    // Обработчик для событий поиска ресурсов питомцем
    const handlePetForaging = (event) => {
      // Синхронизируем питомцев после возвращения с поиска
      if (event.detail?.returnTime) {
        const now = Date.now();
        const returnTime = new Date(event.detail.returnTime).getTime();
        const timeUntilReturn = returnTime - now;
        
        if (timeUntilReturn > 0) {
          // Устанавливаем таймер на обновление после возвращения питомца
          setTimeout(() => {
            synchronizeUserPets();
          }, timeUntilReturn + 1000); // +1 секунда для гарантии
        } else {
          // Если питомец уже должен был вернуться, обновляем сразу
          synchronizeUserPets();
        }
      }
    };
    
    // Добавляем слушатели событий
    window.addEventListener('pet-types-changed', handlePetTypesChange);
    window.addEventListener('user-pets-changed', handleUserPetsChange);
    window.addEventListener('pet-updated', handlePetUpdated);
    window.addEventListener('pet-renamed', handlePetUpdated);
    window.addEventListener('pet-trained', handlePetUpdated);
    window.addEventListener('pet-fed', handlePetUpdated);
    window.addEventListener('pet-skill-learned', handlePetUpdated);
    window.addEventListener('pet-foraging', handlePetForaging);
    
    // Функция очистки при размонтировании компонента
    return () => {
      clearInterval(petTypesIntervalId);
      clearInterval(userPetsIntervalId);
      window.removeEventListener('pet-types-changed', handlePetTypesChange);
      window.removeEventListener('user-pets-changed', handleUserPetsChange);
      window.removeEventListener('pet-updated', handlePetUpdated);
      window.removeEventListener('pet-renamed', handlePetUpdated);
      window.removeEventListener('pet-trained', handlePetUpdated);
      window.removeEventListener('pet-fed', handlePetUpdated);
      window.removeEventListener('pet-skill-learned', handlePetUpdated);
      window.removeEventListener('pet-foraging', handlePetForaging);
    };
  }, [userId, petTypes, userPets]);
  
  // Компонент не рендерит UI
  return null;
};

// Значения по умолчанию для пропсов
SpiritPetSynchronizer.defaultProps = {
  userPets: [],
  petTypes: []
};

export default SpiritPetSynchronizer;