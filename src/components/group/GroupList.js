import React from 'react';
import GroupListItem from './GroupListItem';
import styles from './GroupList.module.css';

/**
 * Компонент для отображения списка групп пользователя
 * @param {Object[]} groups - Массив групп
 * @param {Object} selectedGroup - Выбранная группа
 * @param {Function} onSelectGroup - Обработчик выбора группы
 */
const GroupList = ({ groups = [], selectedGroup, onSelectGroup }) => {
  // Убедимся, что groups всегда массив
  const safeGroups = Array.isArray(groups) ? groups : [];
  
  return (
    <div className={styles.groupList}>
      <h3 className={styles.title}>Мои группы</h3>
      
      {safeGroups.length === 0 ? (
        <div className={styles.emptyMessage}>
          У вас пока нет групп. Создайте новую группу или присоединитесь к существующей.
        </div>
      ) : (
        <ul className={styles.list}>
          {safeGroups.map(group => (
            <GroupListItem 
              key={group.id}
              group={group}
              isSelected={selectedGroup && selectedGroup.id === group.id}
              onClick={() => onSelectGroup(group)}
            />
          ))}
        </ul>
      )}
      
      <div className={styles.footer}>
        <div className={styles.helpText}>
          Группы позволяют объединяться с другими культиваторами для выполнения особых задач и получения ценных наград.
        </div>
      </div>
    </div>
  );
};

export default GroupList;
