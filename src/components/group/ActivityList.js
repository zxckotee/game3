import React from 'react';
import styles from './ActivityList.module.css';

/**
 * Компонент для отображения списка доступных групповых активностей
 * @param {Object[]} activities - Список активностей
 * @param {Object} selectedActivity - Выбранная активность
 * @param {Function} onSelectActivity - Обработчик выбора активности
 */
const ActivityList = ({ activities = [], selectedActivity, onSelectActivity }) => {
  // Ensure activities is always an array
  const safeActivities = Array.isArray(activities) ? activities : [];
  // Получить иконку для типа активности
  const getActivityTypeIcon = (type) => {
    switch (type) {
      case 'raid':
        return '🏰'; // Рейд
      case 'hunt':
        return '🏹'; // Охота
      case 'expedition':
        return '🧭'; // Экспедиция
      case 'tournament':
        return '🏆'; // Турнир
      case 'caravan':
        return '🐪'; // Караван
      case 'tribulation':
        return '⚡'; // Испытание стихии
      case 'craft':
        return '⚒️'; // Создание артефакта
      default:
        return '📜'; // По умолчанию
    }
  };
  
  // Получить название для типа активности
  const getActivityTypeName = (type) => {
    switch (type) {
      case 'raid':
        return 'Рейд';
      case 'hunt':
        return 'Охота';
      case 'expedition':
        return 'Экспедиция';
      case 'tournament':
        return 'Турнир';
      case 'caravan':
        return 'Караван';
      case 'tribulation':
        return 'Испытание стихии';
      case 'craft':
        return 'Создание артефакта';
      default:
        return 'Активность';
    }
  };
  
  // Получить строку с описанием сложности
  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'Легкая';
      case 'medium':
        return 'Средняя';
      case 'hard':
        return 'Тяжелая';
      case 'extreme':
        return 'Экстремальная';
      case 'legendary':
        return 'Легендарная';
      default:
        return 'Неизвестная сложность';
    }
  };
  
  // Получить класс для элемента сложности
  const getDifficultyClass = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return styles.difficultyEasy;
      case 'medium':
        return styles.difficultyMedium;
      case 'hard':
        return styles.difficultyHard;
      case 'extreme':
        return styles.difficultyExtreme;
      case 'legendary':
        return styles.difficultyLegendary;
      default:
        return '';
    }
  };
  
  return (
    <div className={styles.activityList}>
      <h3 className={styles.title}>Доступные активности</h3>
      
      {safeActivities.length === 0 ? (
        <div className={styles.emptyMessage}>
          Нет доступных активностей для вашей группы.
        </div>
      ) : (
        <ul className={styles.list}>
          {safeActivities.map(activity => (
            <li 
              key={activity.id} 
              className={`${styles.activityItem} ${selectedActivity?.id === activity.id ? styles.selected : ''}`}
              onClick={() => onSelectActivity(activity)}
            >
              <div className={styles.header}>
                <div className={styles.nameContainer}>
                  <span className={styles.typeIcon}>
                    {getActivityTypeIcon(activity.type)}
                  </span>
                  <h4 className={styles.name}>{activity.name}</h4>
                </div>
                <span className={`${styles.difficulty} ${getDifficultyClass(activity.difficulty)}`}>
                  {getDifficultyText(activity.difficulty)}
                </span>
              </div>
              
              <div className={styles.typeName}>
                {getActivityTypeName(activity.type)}
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.label}>Участники:</span>
                <span className={styles.value}>
                  {activity.minParticipants || 1}-{activity.maxParticipants || 5}
                </span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.label}>Уровень:</span>
                <span className={styles.value}>
                  {activity.minCultivationLevel || 1}+ (рек. {activity.recommendedCultivationLevel || activity.minCultivationLevel || 1}+)
                </span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.label}>Длительность:</span>
                <span className={styles.value}>
                  {activity.duration || 30} мин.
                </span>
              </div>
              
              {activity.location && (
                <div className={styles.location}>
                  <span className={styles.locationIcon}>📍</span>
                  <span className={styles.locationName}>{activity.location}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityList;
