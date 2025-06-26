import React, { useEffect } from 'react';
import EffectsService from '../../services/effects-service-adapter';

/**
 * Компонент для автоматической синхронизации эффектов
 * Не рендерит видимый UI, только выполняет периодическую синхронизацию
 */
const EffectsSynchronizer = ({ userId, effects }) => {
  useEffect(() => {
    if (!userId) return;
    
    // Функция для обновления эффектов
    const updateEffects = async () => {
      try {
        // Получаем эффекты и отправляем событие с обновленными эффектами
        const updatedEffects = await EffectsService.getAllEffects(userId);
        
        if (updatedEffects) {
          // Отправляем событие для обновления эффектов во всех компонентах
          window.dispatchEvent(new CustomEvent('effects-updated', { 
            detail: updatedEffects 
          }));
        }
      } catch (error) {
        console.error('Ошибка при синхронизации эффектов:', error);
      }
    };
    
    // Начальное обновление только если нет эффектов
    if (!effects || effects.length === 0) {
      updateEffects();
    }
    
    // Устанавливаем интервал обновления (не слишком частый)
    const intervalId = setInterval(updateEffects, 60000); // раз в минуту
    
    // Создаем обработчики событий для немедленного обновления при изменениях
    const handleWeatherChange = () => updateEffects();
    const handleSectChange = () => updateEffects();
    const handleTechniqueChange = () => updateEffects();
    const handlePetChange = () => updateEffects();
    const handleEquipmentChange = () => updateEffects();
    const handleItemUsed = () => updateEffects(); // Для предметов с эффектами
    const handleSkillUsed = () => updateEffects(); // Для навыков с эффектами
    
    // Добавляем слушатели событий
    window.addEventListener('weather-changed', handleWeatherChange);
    window.addEventListener('sect-changed', handleSectChange);
    window.addEventListener('technique-changed', handleTechniqueChange);
    window.addEventListener('pet-changed', handlePetChange);
    window.addEventListener('equipment-changed', handleEquipmentChange);
    window.addEventListener('item-used', handleItemUsed);
    window.addEventListener('skill-used', handleSkillUsed);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('weather-changed', handleWeatherChange);
      window.removeEventListener('sect-changed', handleSectChange);
      window.removeEventListener('technique-changed', handleTechniqueChange);
      window.removeEventListener('pet-changed', handlePetChange);
      window.removeEventListener('equipment-changed', handleEquipmentChange);
      window.removeEventListener('item-used', handleItemUsed);
      window.removeEventListener('skill-used', handleSkillUsed);
    };
  }, [userId, effects]);
  
  return null; // Этот компонент не рендерит UI
};

// Значения по умолчанию для пропсов
EffectsSynchronizer.defaultProps = {
  effects: []
};

export default EffectsSynchronizer;