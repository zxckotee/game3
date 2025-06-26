/**
 * Достижения игрока
 * Модуль использует API и адаптер для доступа к достижениям
 */

// Импортируем адаптер для доступа к API
import {
  getAllAchievements,
  getAchievementById,
  getAchievementsByCategory,
  getUserAchievements,
  updateAchievementProgress,
  claimAchievementReward,
  checkAchievements
} from '../services/achievement-api';

// Импортируем клиентскую версию для получения данных
import clientAchievements from './client-achievements';

// Экспортируем массив достижений для обратной совместимости
export const achievements = clientAchievements.achievements;

// Добавляем функции для проверки условий и расчета прогресса в клиенте
export const checkAchievementCondition = (id, state) => {
  // Получаем достижение из массива
  const achievement = achievements.find(a => a.id === id);
  if (!achievement || !achievement.condition) {
    return false;
  }
  
  // Используем оригинальный обработчик условия
  return achievement.condition(state);
};

export const calculateAchievementProgress = (id, state) => {
  // Получаем достижение из массива
  const achievement = achievements.find(a => a.id === id);
  if (!achievement || !achievement.progress) {
    return { current: 0, required: 1 };
  }
  
  // Используем оригинальный обработчик прогресса
  return achievement.progress(state);
};

/**
 * Получает уникальные категории достижений в формате для UI
 * @returns {Array} Массив объектов категорий с иконками
 */
export const getAchievementCategories = () => {
  // Получаем все уникальные категории из массива достижений
  const uniqueCategories = [...new Set(achievements.map(achievement => achievement.category))];
  
  // Форматируем категории для использования в UI
  const formattedCategories = [
    { id: 'all', name: 'все', icon: '🏆' }, // Категория "все" всегда первая
    ...uniqueCategories.map((category, index) => {
      let icon = '📜'; // Иконка по умолчанию
      
      // Определяем иконку в зависимости от категории
      if (category === 'культивация') icon = '🧘';
      if (category === 'техники') icon = '📚';
      if (category === 'исследование') icon = '🗺️';
      if (category === 'задания') icon = '📝';
      if (category === 'алхимия') icon = '⚗️';
      if (category === 'экономика') icon = '💰';
      if (category === 'социальное') icon = '👥';
      if (category === 'битвы') icon = '⚔️';
      
      return {
        id: `cat_${index}`,
        name: category,
        icon: icon
      };
    })
  ];
  
  return formattedCategories;
};

// Экспортируем готовый массив категорий для использования в UI
export const achievementCategories = getAchievementCategories();

// Экспортируем функции API для использования в других модулях
export {
  getAllAchievements,
  getAchievementById,
  getAchievementsByCategory,
  getUserAchievements,
  updateAchievementProgress,
  claimAchievementReward,
  checkAchievements
};

// Экспорт по умолчанию для обратной совместимости
export default clientAchievements;
