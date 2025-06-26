import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { 
  fetchGroupActivities,
  setCurrentActivity,
  createActivityInstance,
  startActivity,
  fetchGroupActivityInstances
} from '../../context/actions/groupActions';
import MemberList from './MemberList';
import ActivityList from './ActivityList';
import ActivityDetails from './ActivityDetails';
import ActivityInstance from './ActivityInstance';
import Button from '../ui/Button';
import styles from './GroupDetails.module.css';

/**
 * Компонент для отображения деталей группы и управления активностями
 * @param {Object} group - Данные группы
 * @param {Array} activityInstances - Экземпляры активностей группы
 * @param {Function} onRefresh - Функция для обновления данных группы
 */
const GroupDetails = ({ group, activityInstances = [], onRefresh }) => {
  const { state, actions } = useGame();
  const { user } = state.player;
  const { activities, currentActivity } = state.groups || { 
    activities: [], 
    currentActivity: null
  };
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'activities', 'active_activities', 'details'
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Обеспечиваем, что массивы определены
  const members = Array.isArray(group.members) ? group.members : [];
  const safeActivityInstances = Array.isArray(activityInstances) ? activityInstances : [];
  
  // Определяем роль пользователя в группе
  const userRole = members.find(m => m.userId === user.id)?.role || 'member';
  const isLeaderOrOfficer = userRole === 'leader' || userRole === 'officer';

  // Загружаем доступные активности при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'activities' && (!activities || activities.length === 0)) {
      loadActivities();
    }
    
    if (activeTab === 'active_activities' && onRefresh) {
      onRefresh();
    }
  }, [activeTab]);

  
  // Загрузка доступных активностей
  const loadActivities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Фильтр активностей по уровню группы
      const cultivationLevels = members.map(m => m.user?.cultivationLevel || 1);
      const filters = {
        minCultivationLevel: cultivationLevels.length > 0 ? Math.min(...cultivationLevels) : 1
      };
      
      await actions.dispatch(fetchGroupActivities(filters));
    } catch (err) {
      console.error('Ошибка при загрузке активностей:', err);
      setError('Не удалось загрузить доступные активности');
    } finally {
      setLoading(false);
    }
  };

  // Обработка выбора активности
  const handleSelectActivity = (activity) => {
    actions.dispatch(setCurrentActivity(activity));
  };

  // Обработка создания экземпляра активности
  const handleCreateActivityInstance = async (activityId, difficulty, options) => {
    if (!isLeaderOrOfficer) {
      actions.addNotification({
        message: 'Только лидер или офицер группы может создавать активности',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const instance = await actions.dispatch(
        createActivityInstance(group.id, activityId, difficulty, options, user.id)
      );
      
      actions.addNotification({
        message: `Активность "${instance.activityType.name}" создана`,
        type: 'success'
      });
      
      return instance;
    } catch (err) {
      console.error('Ошибка при создании активности:', err);
      setError(`Не удалось создать активность: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Обработка запуска активности
  const handleStartActivity = async (instanceId) => {
    if (!isLeaderOrOfficer) {
      actions.addNotification({
        message: 'Только лидер или офицер группы может запустить активность',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const instance = await actions.dispatch(startActivity(instanceId, user.id));
      
      actions.addNotification({
        message: `Активность "${instance.activityType.name}" запущена`,
        type: 'success'
      });
      
      return instance;
    } catch (err) {
      console.error('Ошибка при запуске активности:', err);
      setError(`Не удалось запустить активность: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Обработчик для покидания группы
  const handleLeaveGroup = () => {
    if (userRole === 'leader' && group.members.length > 1) {
      // Если пользователь - лидер и есть другие участники, нужно предупредить
      if (!window.confirm('Вы уверены? Лидерство будет передано другому участнику, если вы покинете группу.')) {
        return;
      }
    }
    
    // Покидаем группу через actions
    actions.dispatch({
      type: 'LEAVE_GROUP',
      payload: { groupId: group.id, userId: user.id }
    });
    
    actions.addNotification({
      message: `Вы покинули группу "${group.name}"`,
      type: 'info'
    });
  };

  // Обработчик завершения взаимодействия с экземпляром активности
  const handleActivityInstanceComplete = () => {
    setSelectedInstance(null);
    if (onRefresh) {
      onRefresh(); // Перезагружаем список после изменений
    }
  };

  return (
    <div className={styles.groupDetails}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <h3 className={styles.title}>{group.name}</h3>
          {group.isPrivate && (
            <span className={styles.privateLabel}>Закрытая</span>
          )}
        </div>
        
        <div className={styles.actions}>
          {userRole === 'leader' && (
            <Button 
              className={styles.editButton}
              onClick={() => {/* Функция редактирования группы */}}
            >
              Редактировать
            </Button>
          )}
          
          <Button 
            className={styles.leaveButton}
            onClick={handleLeaveGroup}
          >
            Покинуть группу
          </Button>
        </div>
      </div>
      
      {group.description && (
        <div className={styles.description}>{group.description}</div>
      )}
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'members' ? styles.active : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Участники ({members.length}/{group.maxMembers || 10})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'activities' ? styles.active : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          Доступные активности
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'active_activities' ? styles.active : ''}`}
          onClick={() => setActiveTab('active_activities')}
        >
          Текущие активности
          {safeActivityInstances.filter(i => i.status === 'in_progress' || i.status === 'preparing').length > 0 && (
            <span className={styles.badge}>
              {safeActivityInstances.filter(i => i.status === 'in_progress' || i.status === 'preparing').length}
            </span>
          )}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Информация
        </button>
      </div>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      <div className={styles.tabContent}>
        {loading ? (
          <div className={styles.loading}>
            Загрузка...
          </div>
        ) : (
          <>
            {activeTab === 'members' && (
              <MemberList 
                members={members} 
                leaderId={group.leaderId} 
                currentUserId={user.id}
                currentUserRole={userRole}
              />
            )}
            
            {activeTab === 'activities' && (
              <div className={styles.activitiesContainer}>
                <ActivityList 
                  activities={activities || []} 
                  selectedActivity={currentActivity}
                  onSelectActivity={handleSelectActivity}
                />
                
                {currentActivity && (
                  <ActivityDetails 
                    activity={currentActivity}
                    group={group}
                    onCreateActivityInstance={handleCreateActivityInstance}
                    onStartActivity={handleStartActivity}
                    canManageActivities={isLeaderOrOfficer}
                  />
                )}
              </div>
            )}
            
            {activeTab === 'active_activities' && (
              <div className={styles.activeActivitiesContainer}>
                {!selectedInstance ? (
                  safeActivityInstances.length > 0 ? (
                    <div className={styles.instancesList}>
                      <h4 className={styles.sectionTitle}>Активности группы</h4>
                      
                      {safeActivityInstances
                        .filter(instance => instance && (instance.status === 'in_progress' || instance.status === 'preparing'))
                        .map(instance => (
                          <div 
                            key={instance.id} 
                            className={styles.instanceItem}
                            onClick={() => setSelectedInstance(instance)}
                          >
                            <div className={styles.instanceHeader}>
                              <div className={styles.instanceTitle}>
                                {instance.activityType?.name || 'Активность группы'}
                              </div>
                              <div className={`${styles.instanceStatus} ${
                                instance.status === 'in_progress' ? styles.statusInProgress :
                                instance.status === 'preparing' ? styles.statusPreparing :
                                instance.status === 'completed' ? styles.statusCompleted :
                                instance.status === 'failed' ? styles.statusFailed :
                                styles.statusAbandoned
                              }`}>
                                {instance.status === 'in_progress' ? 'В процессе' :
                                instance.status === 'preparing' ? 'Подготовка' :
                                instance.status === 'completed' ? 'Завершена' :
                                instance.status === 'failed' ? 'Провалена' :
                                'Отменена'}
                              </div>
                            </div>
                            
                            <div className={styles.instanceInfo}>
                              <div className={styles.instanceDetail}>
                                <span className={styles.instanceLabel}>Сложность:</span>
                                <span className={styles.instanceValue}>
                                  {instance.difficulty === 'easy' ? 'Легкая' :
                                  instance.difficulty === 'medium' ? 'Средняя' :
                                  instance.difficulty === 'hard' ? 'Тяжелая' :
                                  instance.difficulty === 'extreme' ? 'Экстремальная' :
                                  'Легендарная'}
                                </span>
                              </div>
                              
                              <div className={styles.instanceDetail}>
                                <span className={styles.instanceLabel}>Участники:</span>
                                <span className={styles.instanceValue}>
                                  {instance.participants.length}
                                </span>
                              </div>
                              
                              {instance.status === 'in_progress' && (
                                <div className={styles.instanceDetail}>
                                  <span className={styles.instanceLabel}>Прогресс:</span>
                                  <span className={styles.instanceValue}>
                                    {Math.round(instance.progress || 0)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      
                      {safeActivityInstances
                        .filter(instance => instance && (instance.status === 'in_progress' || instance.status === 'preparing'))
                        .length === 0 && (
                        <div className={styles.emptyMessage}>
                          В данный момент у группы нет активных мероприятий.
                        </div>
                      )}
                      
                      <h4 className={styles.sectionTitle}>История активностей</h4>
                      
                      {safeActivityInstances
                        .filter(instance => instance && instance.status && 
                               instance.status !== 'in_progress' && 
                               instance.status !== 'preparing')
                        .slice(0, 5) // Показываем только последние 5 завершенных активностей
                        .map(instance => (
                          <div 
                            key={instance.id} 
                            className={styles.instanceItem}
                            onClick={() => setSelectedInstance(instance)}
                          >
                            <div className={styles.instanceHeader}>
                              <div className={styles.instanceTitle}>
                                {instance.activityType?.name || 'Активность группы'}
                              </div>
                              <div className={`${styles.instanceStatus} ${
                                instance.status === 'completed' ? styles.statusCompleted :
                                instance.status === 'failed' ? styles.statusFailed :
                                styles.statusAbandoned
                              }`}>
                                {instance.status === 'completed' ? 'Завершена' :
                                instance.status === 'failed' ? 'Провалена' :
                                'Отменена'}
                              </div>
                            </div>
                            
                            <div className={styles.instanceDetail}>
                              <span className={styles.instanceLabel}>Дата:</span>
                              <span className={styles.instanceValue}>
                                {new Date(instance.completedAt || instance.abandonedAt || instance.startedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      
                      {safeActivityInstances
                        .filter(instance => instance && instance.status && 
                               instance.status !== 'in_progress' && 
                               instance.status !== 'preparing')
                        .length === 0 && (
                        <div className={styles.emptyMessage}>
                          История активностей пуста.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.emptyMessage}>
                      У группы пока нет активностей. Перейдите на вкладку "Доступные активности", 
                      чтобы создать вашу первую групповую активность.
                    </div>
                  )
                ) : (
                  <ActivityInstance 
                    instance={selectedInstance}
                    onComplete={handleActivityInstanceComplete}
                  />
                )}
              </div>
            )}
            
            {activeTab === 'details' && (
              <div className={styles.groupInfo}>
                <div className={styles.infoSection}>
                  <h4 className={styles.sectionTitle}>Общая информация</h4>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Создана:</span>
                    <span className={styles.value}>
                      {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Тип группы:</span>
                    <span className={styles.value}>
                      {group.isPrivate ? 'Закрытая (только по приглашениям)' : 'Открытая'}
                    </span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Требуемый уровень:</span>
                    <span className={styles.value}>
                      Уровень {group.minCultivationLevel}+
                    </span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Одобрение для вступления:</span>
                    <span className={styles.value}>
                      {group.requiresApproval ? 'Требуется' : 'Не требуется'}
                    </span>
                  </div>
                </div>
                
                <div className={styles.infoSection}>
                  <h4 className={styles.sectionTitle}>Статистика группы</h4>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Завершенные активности:</span>
                    <span className={styles.value}>
                      {Array.isArray(group.activityInstances) ? 
                        group.activityInstances.filter(a => a && a.status === 'completed').length : 0}
                    </span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Проваленные активности:</span>
                    <span className={styles.value}>
                      {Array.isArray(group.activityInstances) ? 
                        group.activityInstances.filter(a => a && a.status === 'failed').length : 0}
                    </span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Текущие активности:</span>
                    <span className={styles.value}>
                      {Array.isArray(group.activityInstances) ? 
                        group.activityInstances.filter(a => a && (a.status === 'in_progress' || a.status === 'preparing')).length : 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GroupDetails;
