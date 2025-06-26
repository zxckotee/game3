import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { 
  fetchUserGroups, 
  setCurrentGroup, 
  createGroup,
  fetchGroupActivities,
  fetchGroupActivityInstances,
  fetchUserInvitations,
  respondToInvitation
} from '../../context/actions/groupActions';
import GroupList from '../group/GroupList';
import GroupDetails from '../group/GroupDetails';
import CreateGroupForm from '../group/CreateGroupForm';
import ActivityInstance from '../group/ActivityInstance';
import Button from '../ui/Button';
import styles from './GroupsTab.module.css';

/**
 * Компонент вкладки для работы с группами и групповыми активностями
 */
const GroupsTab = () => {
  const { state, actions } = useGame();
  const { user } = state.player;
  const { 
    list: groups, 
    currentGroup, 
    currentActivity, 
    activityInstances,
    invitations
  } = state.groups || { 
    list: [], 
    currentGroup: null, 
    currentActivity: null,
    activityInstances: [],
    invitations: []
  };
  
  // Обеспечиваем, что все массивы определены
  const safeGroups = Array.isArray(groups) ? groups : [];
  const safeActivityInstances = Array.isArray(activityInstances) ? activityInstances : [];
  const safeInvitations = Array.isArray(invitations) ? invitations : [];
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загружаем группы пользователя, приглашения и доступные активности при монтировании компонента
  useEffect(() => {
    if (user && user.id) {
      loadUserGroups();
      loadUserInvitations();
    }
  }, [user]);

  // Обновляем приглашения каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && user.id) {
        loadUserInvitations();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Загрузка приглашений пользователя
  const loadUserInvitations = useCallback(async () => {
    try {
      await actions.dispatch(fetchUserInvitations(user.id));
    } catch (err) {
      console.error('Ошибка при загрузке приглашений:', err);
      actions.addNotification({
        message: 'Не удалось загрузить приглашения',
        type: 'error'
      });
    }
  }, [user, actions]);

  // Обработка ответа на приглашение
  const handleInvitationResponse = useCallback(async (invitationId, accept) => {
    try {
      await actions.dispatch(respondToInvitation(invitationId, accept, user.id));
      actions.addNotification({
        message: `Приглашение ${accept ? 'принято' : 'отклонено'}`,
        type: 'success'
      });
      loadUserInvitations();
      if (accept) {
        loadUserGroups(); // Обновляем список групп если приняли приглашение
      }
    } catch (err) {
      console.error('Ошибка при обработке приглашения:', err);
      actions.addNotification({
        message: `Не удалось ${accept ? 'принять' : 'отклонить'} приглашение`,
        type: 'error'
      });
    }
  }, [user, actions, loadUserInvitations]);

  // Когда выбирается группа, загружаем её активности
  useEffect(() => {
    if (currentGroup && currentGroup.id) {
      loadGroupActivities(currentGroup.id);
    }
  }, [currentGroup]);

  // Загрузка групп пользователя
  const loadUserGroups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await actions.dispatch(fetchUserGroups(user.id));
      
      // Также загружаем доступные активности
      await actions.dispatch(fetchGroupActivities());
    } catch (err) {
      console.error('Ошибка при загрузке групп:', err);
      setError('Не удалось загрузить группы. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };
  
  // Загрузка активностей группы
  const loadGroupActivities = async (groupId) => {
    setLoading(true);
    
    try {
      // Получаем экземпляры активностей группы
      await actions.dispatch(fetchGroupActivityInstances(groupId));
    } catch (err) {
      console.error('Ошибка при загрузке активностей группы:', err);
      actions.addNotification({
        message: 'Не удалось загрузить активности группы',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Обработка создания новой группы
  const handleCreateGroup = async (groupData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Проверка на наличие ID пользователя перед созданием группы
      if (!user || !user.id) {
        throw new Error('Информация о пользователе недоступна. Пожалуйста, обновите страницу и попробуйте снова.');
      }
      
      await actions.dispatch(createGroup(groupData, user.id));
      setShowCreateForm(false);
      
      // Уведомление о создании группы
      actions.addNotification({
        message: `Группа "${groupData.name}" успешно создана`,
        type: 'success'
      });
    } catch (err) {
      console.error('Ошибка при создании группы:', err);
      setError(`Не удалось создать группу: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Обработка выбора группы
  const handleSelectGroup = (group) => {
    actions.dispatch(setCurrentGroup(group));
  };

  return (
    <div className={styles.groupsTab}>
      <div className={styles.header}>
        <h2>Группы культиваторов</h2>
        {!showCreateForm && (
          <Button 
            onClick={() => setShowCreateForm(true)}
            className={styles.createButton}
            disabled={loading}
          >
            Создать группу
          </Button>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {showCreateForm ? (
        <CreateGroupForm 
          onSubmit={handleCreateGroup} 
          onCancel={() => setShowCreateForm(false)} 
          loading={loading}
        />
      ) : (
        <div className={styles.content}>
          {/* Уведомления о новых приглашениях */}
          {safeInvitations.length > 0 && (
            <div className={styles.invitations}>
              <h3>Новые приглашения ({safeInvitations.length})</h3>
              <ul>
                {safeInvitations.map(invite => (
                  <li key={invite.id} className={styles.invitation}>
                    <div>
                      <strong>{invite.group?.name}</strong> от {invite.inviter?.name}
                      {invite.message && <p>{invite.message}</p>}
                    </div>
                    <div className={styles.invitationActions}>
                      <Button 
                        onClick={() => handleInvitationResponse(invite.id, true)}
                        small
                        primary
                      >
                        Принять
                      </Button>
                      <Button 
                        onClick={() => handleInvitationResponse(invite.id, false)}
                        small
                        secondary
                      >
                        Отклонить
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {loading ? (
            <div className={styles.loading}>
              Загрузка групп...
            </div>
          ) : (
            <>
              {/* Если есть активная групповая активность, показываем её */}
              {currentActivity && currentActivity.status && currentActivity.status !== 'completed' && currentActivity.status !== 'failed' && (
                <ActivityInstance 
                  instance={currentActivity}
                  onComplete={() => loadUserGroups()}
                  onUpdate={() => {
                    if (currentGroup) {
                      loadGroupActivities(currentGroup.id);
                    }
                  }}
                />
              )}
              
              {/* Если нет активной активности, показываем список групп и детали */}
              {(!currentActivity || !currentActivity.status || currentActivity.status === 'completed' || currentActivity.status === 'failed') && (
                <>
                  <div className={styles.groupList}>
                    <GroupList 
                      groups={safeGroups} 
                      selectedGroup={currentGroup} 
                      onSelectGroup={handleSelectGroup} 
                    />
                  </div>
                  
                  {currentGroup && (
                    <div className={styles.groupDetails}>
                      <GroupDetails 
                        group={currentGroup} 
                        activityInstances={safeActivityInstances}
                        onRefresh={() => {
                          if (currentGroup && currentGroup.id) {
                            loadGroupActivities(currentGroup.id);
                          }
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupsTab;
