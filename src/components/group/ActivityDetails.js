import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import Button from '../ui/Button';
import styles from './ActivityDetails.module.css';

/**
 * Компонент для отображения деталей активности и создания экземпляра
 * @param {Object} activity - Данные активности
 * @param {Object} group - Данные группы
 * @param {Function} onCreateActivityInstance - Обработчик создания экземпляра
 * @param {Function} onStartActivity - Обработчик запуска активности
 * @param {boolean} canManageActivities - Может ли пользователь управлять активностями
 */
const ActivityDetails = ({ 
  activity, 
  group, 
  onCreateActivityInstance, 
  onStartActivity, 
  canManageActivities 
}) => {
  const { state } = useGame();
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [specialOptions, setSpecialOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdInstance, setCreatedInstance] = useState(null);
  
  // Массив доступных сложностей
  const difficulties = ['easy', 'medium', 'hard', 'extreme', 'legendary'];
  
  // Названия сложностей на русском
  const difficultyLabels = {
    'easy': 'Легкая',
    'medium': 'Средняя',
    'hard': 'Тяжелая',
    'extreme': 'Экстремальная',
    'legendary': 'Легендарная'
  };
  
  // Названия типов активностей на русском
  const activityTypeLabels = {
    'raid': 'Рейд',
    'hunt': 'Охота',
    'expedition': 'Экспедиция',
    'tournament': 'Турнир',
    'caravan': 'Караван',
    'tribulation': 'Испытание стихии',
    'craft': 'Создание артефакта'
  };
  
  // Формирование подходящих классов CSS для индикатора сложности
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
  
  // Обработчик создания экземпляра активности
  const handleCreateInstance = async () => {
    if (!canManageActivities) {
      return;
    }
    
    setLoading(true);
    
    try {
      const instance = await onCreateActivityInstance(
        activity.id, 
        selectedDifficulty, 
        specialOptions
      );
      
      setCreatedInstance(instance);
    } catch (error) {
      console.error('Ошибка при создании активности:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик запуска активности
  const handleStartActivity = async () => {
    if (!canManageActivities || !createdInstance) {
      return;
    }
    
    setLoading(true);
    
    try {
      await onStartActivity(createdInstance.id);
    } catch (error) {
      console.error('Ошибка при запуске активности:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Проверка условий для запуска активности
  const canStartActivity = () => {
    // Проверка достаточного количества участников в группе
    const hasEnoughMembers = group.members.length >= activity.minParticipants;
    
    // Проверка минимального уровня культивации участников
    const allMembersHaveRequiredLevel = group.members.every(
      member => member.user.cultivationLevel >= activity.minCultivationLevel
    );
    
    // Проверка наличия у группы активных активностей того же типа
    const hasActiveInstanceOfSameType = group.activityInstances && 
      group.activityInstances.some(instance => 
        instance.activityId === activity.id && 
        (instance.status === 'preparing' || instance.status === 'in_progress')
      );
    
    // Проверка для легендарной сложности - все участники должны иметь уровень 6+
    const legendaryRequirementsMet = selectedDifficulty !== 'legendary' || 
      group.members.every(member => member.user.cultivationLevel >= 6);
    
    return hasEnoughMembers && 
      allMembersHaveRequiredLevel && 
      !hasActiveInstanceOfSameType && 
      legendaryRequirementsMet;
  };
  
  // Формирование текста причины невозможности запуска
  const getStartDisabledReason = () => {
    if (!canManageActivities) {
      return 'Только лидер или офицер группы может запускать активности';
    }
    
    if (group.members.length < activity.minParticipants) {
      return `Требуется минимум ${activity.minParticipants} участников`;
    }
    
    if (!group.members.every(member => member.user.cultivationLevel >= activity.minCultivationLevel)) {
      return `Все участники должны иметь уровень культивации не ниже ${activity.minCultivationLevel}`;
    }
    
    if (selectedDifficulty === 'legendary' && 
        !group.members.every(member => member.user.cultivationLevel >= 6)) {
      return 'Для Легендарной сложности все участники должны иметь уровень 6+';
    }
    
    if (group.activityInstances && 
        group.activityInstances.some(instance => 
          instance.activityId === activity.id && 
          (instance.status === 'preparing' || instance.status === 'in_progress'))) {
      return 'У группы уже есть активная активность этого типа';
    }
    
    return '';
  };
  
  // Опции для разных типов активностей
  const renderSpecialOptions = () => {
    switch (activity.type) {
      case 'raid':
        return (
          <div className={styles.optionGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={specialOptions.useTimeLimit || false}
                onChange={e => setSpecialOptions({
                  ...specialOptions,
                  useTimeLimit: e.target.checked
                })}
                disabled={loading || createdInstance !== null}
              />
              <span className={styles.checkboxText}>Ограничение по времени (бонус к наградам +20%)</span>
            </label>
          </div>
        );
        
      case 'hunt':
        return (
          <div className={styles.optionGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={specialOptions.wildHunt || false}
                onChange={e => setSpecialOptions({
                  ...specialOptions,
                  wildHunt: e.target.checked
                })}
                disabled={loading || createdInstance !== null}
              />
              <span className={styles.checkboxText}>Дикая охота (редкие существа, повышенный риск)</span>
            </label>
          </div>
        );
        
      case 'expedition':
        return (
          <div className={styles.optionGroup}>
            <label className={styles.radioLabel}>
              <input 
                type="radio" 
                name="expeditionFocus"
                value="combat"
                checked={specialOptions.expeditionFocus === 'combat'}
                onChange={() => setSpecialOptions({
                  ...specialOptions,
                  expeditionFocus: 'combat'
                })}
                disabled={loading || createdInstance !== null}
              />
              <span className={styles.radioText}>Боевой фокус (больше сражений)</span>
            </label>
            
            <label className={styles.radioLabel}>
              <input 
                type="radio" 
                name="expeditionFocus"
                value="exploration"
                checked={specialOptions.expeditionFocus === 'exploration'}
                onChange={() => setSpecialOptions({
                  ...specialOptions,
                  expeditionFocus: 'exploration'
                })}
                disabled={loading || createdInstance !== null}
              />
              <span className={styles.radioText}>Исследовательский фокус (поиск ресурсов)</span>
            </label>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={styles.activityDetails}>
      <div className={styles.header}>
        <h3 className={styles.title}>{activity.name}</h3>
        <div className={styles.type}>
          {activityTypeLabels[activity.type] || activity.type}
        </div>
      </div>
      
      <div className={styles.description}>
        {activity.description}
      </div>
      
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Параметры активности</h4>
        
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Участники:</span>
            <span className={styles.value}>
              {activity.minParticipants}-{activity.maxParticipants}
              {group.members.length < activity.minParticipants && (
                <span className={styles.warning}>
                  ⚠️ В группе недостаточно участников
                </span>
              )}
            </span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Мин. уровень культивации:</span>
            <span className={styles.value}>
              {activity.minCultivationLevel}
              {!group.members.every(m => m.user.cultivationLevel >= activity.minCultivationLevel) && (
                <span className={styles.warning}>
                  ⚠️ Не все участники соответствуют требованиям
                </span>
              )}
            </span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Продолжительность:</span>
            <span className={styles.value}>
              {activity.duration} мин.
            </span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Перезарядка:</span>
            <span className={styles.value}>
              {activity.cooldown >= 1440 
                ? `${Math.floor(activity.cooldown / 1440)} дн.` 
                : activity.cooldown >= 60 
                  ? `${Math.floor(activity.cooldown / 60)} ч.` 
                  : `${activity.cooldown} мин.`}
            </span>
          </div>
          
          {activity.location && (
            <div className={styles.infoItem}>
              <span className={styles.label}>Локация:</span>
              <span className={styles.value}>{activity.location}</span>
            </div>
          )}
        </div>
      </div>
      
      {!createdInstance ? (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Выбор сложности</h4>
          
          <div className={styles.difficultySelector}>
            {difficulties.map(diff => (
              <button
                key={diff}
                className={`${styles.diffButton} ${selectedDifficulty === diff ? styles.selected : ''} ${getDifficultyClass(diff)}`}
                onClick={() => setSelectedDifficulty(diff)}
                disabled={loading}
              >
                {difficultyLabels[diff]}
              </button>
            ))}
          </div>
          
          {selectedDifficulty === 'legendary' && (
            <div className={styles.legendaryWarning}>
              ⚠️ Для Легендарной сложности все участники должны иметь уровень культивации 6+
            </div>
          )}
          
          {renderSpecialOptions()}
          
          <div className={styles.rewards}>
            <h4 className={styles.sectionTitle}>Возможные награды:</h4>
            
            <div className={styles.rewardsList}>
              <div className={styles.rewardItem}>
                <span className={styles.rewardIcon}>🔮</span>
                <span className={styles.rewardName}>Опыт культивации</span>
                <span className={styles.rewardBonus}>
                  {selectedDifficulty === 'easy' && '-20%'}
                  {selectedDifficulty === 'hard' && '+30%'}
                  {selectedDifficulty === 'extreme' && '+70%'}
                  {selectedDifficulty === 'legendary' && '+150%'}
                </span>
              </div>
              
              {activity.rewardStructure?.resources?.length > 0 && (
                <div className={styles.rewardItem}>
                  <span className={styles.rewardIcon}>🌿</span>
                  <span className={styles.rewardName}>Редкие ресурсы</span>
                  <span className={styles.rewardBonus}>
                    {selectedDifficulty === 'easy' && '-20%'}
                    {selectedDifficulty === 'hard' && '+30%'}
                    {selectedDifficulty === 'extreme' && '+70%'}
                    {selectedDifficulty === 'legendary' && '+150%'}
                  </span>
                </div>
              )}
              
              {activity.rewardStructure?.items?.length > 0 && (
                <div className={styles.rewardItem}>
                  <span className={styles.rewardIcon}>📦</span>
                  <span className={styles.rewardName}>Предметы</span>
                  <span className={styles.rewardBonus}>
                    {selectedDifficulty === 'easy' && 'Обычные'}
                    {selectedDifficulty === 'medium' && 'Необычные'}
                    {selectedDifficulty === 'hard' && 'Редкие'}
                    {selectedDifficulty === 'extreme' && 'Эпические'}
                    {selectedDifficulty === 'legendary' && 'Легендарные'}
                  </span>
                </div>
              )}
              
              {activity.rewardStructure?.reputation?.length > 0 && (
                <div className={styles.rewardItem}>
                  <span className={styles.rewardIcon}>👑</span>
                  <span className={styles.rewardName}>Репутация</span>
                  <span className={styles.rewardBonus}>
                    {selectedDifficulty === 'easy' && '-20%'}
                    {selectedDifficulty === 'hard' && '+30%'}
                    {selectedDifficulty === 'extreme' && '+70%'}
                    {selectedDifficulty === 'legendary' && '+150%'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.actions}>
            <Button 
              onClick={handleCreateInstance}
              disabled={!canManageActivities || loading || !canStartActivity()}
              className={styles.createButton}
            >
              {loading ? 'Создание...' : 'Создать активность'}
            </Button>
            
            {!canManageActivities && (
              <div className={styles.permissionMessage}>
                Только лидер или офицер группы может создавать активности
              </div>
            )}
            
            {canManageActivities && !canStartActivity() && (
              <div className={styles.warning}>
                {getStartDisabledReason()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Созданная активность</h4>
          
          <div className={styles.createdActivity}>
            <div className={styles.createdInfo}>
              <span className={styles.createdLabel}>Тип:</span>
              <span className={styles.createdValue}>
                {activityTypeLabels[activity.type] || activity.type}
              </span>
            </div>
            
            <div className={styles.createdInfo}>
              <span className={styles.createdLabel}>Сложность:</span>
              <span className={`${styles.createdValue} ${getDifficultyClass(createdInstance.difficulty)}`}>
                {difficultyLabels[createdInstance.difficulty] || createdInstance.difficulty}
              </span>
            </div>
            
            <div className={styles.createdInfo}>
              <span className={styles.createdLabel}>Статус:</span>
              <span className={styles.createdValue}>
                {createdInstance.status === 'preparing' ? 'Подготовка' : 
                 createdInstance.status === 'in_progress' ? 'В процессе' : 
                 createdInstance.status === 'completed' ? 'Завершена' : 
                 createdInstance.status === 'failed' ? 'Провалена' : 'Отменена'}
              </span>
            </div>
            
            <div className={styles.createdInfo}>
              <span className={styles.createdLabel}>Участники:</span>
              <span className={styles.createdValue}>
                {createdInstance.participants.length}
              </span>
            </div>
          </div>
          
          <div className={styles.actions}>
            <Button 
              onClick={handleStartActivity}
              disabled={!canManageActivities || loading || createdInstance.status !== 'preparing'}
              className={styles.startButton}
            >
              {loading ? 'Запуск...' : 'Начать активность'}
            </Button>
            
            {createdInstance.status !== 'preparing' && (
              <div className={styles.warning}>
                Эта активность уже запущена или завершена
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDetails;
