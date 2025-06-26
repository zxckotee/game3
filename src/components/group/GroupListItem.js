import React from 'react';
import styles from './GroupListItem.module.css';

/**
 * Компонент для отображения элемента списка групп
 * @param {Object} group - Данные группы
 * @param {boolean} isSelected - Выбрана ли группа
 * @param {Function} onClick - Обработчик клика
 */
const GroupListItem = ({ group, isSelected, onClick }) => {
  // Определяем роль пользователя в группе
  const getUserRole = (memberId) => {
    const member = group.members.find(m => m.userId === memberId);
    return member ? member.role : null;
  };
  
  // Получаем иконку в зависимости от роли пользователя
  const getRoleIcon = (role) => {
    switch (role) {
      case 'leader':
        return '👑'; // Лидер
      case 'officer':
        return '⚔️'; // Офицер
      default:
        return '👤'; // Обычный участник
    }
  };
  
  // Определяем количество участников в группе
  const memberCount = group.members ? group.members.length : 0;
  
  // Проверяем, есть ли у группы текущая активность
  const hasActiveActivity = group.activityInstances && 
    group.activityInstances.some(instance => 
      instance.status === 'preparing' || instance.status === 'in_progress');
  
  return (
    <li 
      className={`${styles.groupItem} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.header}>
        <h4 className={styles.groupName}>{group.name}</h4>
        {hasActiveActivity && (
          <div className={styles.activityBadge}>
            Активность
          </div>
        )}
      </div>
      
      <div className={styles.infoRow}>
        <span className={styles.label}>Участники:</span>
        <span className={styles.value}>{memberCount}/{group.maxMembers}</span>
      </div>
      
      <div className={styles.infoRow}>
        <span className={styles.label}>Тип:</span>
        <span className={styles.value}>
          {group.isPrivate ? 'Закрытая' : 'Открытая'}
        </span>
      </div>
      
      <div className={styles.infoRow}>
        <span className={styles.label}>Лидер:</span>
        <span className={styles.value}>
          {group.leader ? group.leader.username : 'Не указан'}
        </span>
      </div>
      
      {/* Отображаем информацию о последней активности, если она есть */}
      {group.activityInstances && group.activityInstances.length > 0 && (
        <div className={styles.activityInfo}>
          <div className={styles.activityName}>
            {group.activityInstances[0].activityType?.name || 'Активность'}
          </div>
          <div className={styles.activityStatus}>
            {group.activityInstances[0].status === 'in_progress' ? 'В процессе' : 
             group.activityInstances[0].status === 'preparing' ? 'Подготовка' :
             group.activityInstances[0].status === 'completed' ? 'Завершена' :
             group.activityInstances[0].status === 'failed' ? 'Провалена' : 'Отменена'}
          </div>
        </div>
      )}
    </li>
  );
};

export default GroupListItem;
