import React, { useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import Button from '../ui/Button';
import styles from './MemberList.module.css';

/**
 * Компонент для отображения списка участников группы
 * @param {Object[]} members - Список участников
 * @param {string} leaderId - ID лидера группы
 * @param {string} currentUserId - ID текущего пользователя
 * @param {string} currentUserRole - Роль текущего пользователя в группе
 */
const MemberList = ({ members, leaderId, currentUserId, currentUserRole }) => {
  const { actions } = useGameContext();
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Получаем иконку и название для роли
  const getRoleInfo = (role) => {
    switch (role) {
      case 'leader':
        return { icon: '👑', name: 'Лидер' };
      case 'officer':
        return { icon: '⚔️', name: 'Офицер' };
      default:
        return { icon: '👤', name: 'Участник' };
    }
  };
  
  // Получаем иконку для специализации
  const getSpecIcon = (specialization) => {
    switch (specialization) {
      case 'damage':
        return '🔥'; // Урон
      case 'tank':
        return '🛡️'; // Защита
      case 'support':
        return '✨'; // Поддержка
      case 'control':
        return '🌀'; // Контроль
      case 'healer':
        return '💚'; // Лечение
      default:
        return '📊'; // По умолчанию
    }
  };
  
  // Получаем название для специализации
  const getSpecName = (specialization) => {
    switch (specialization) {
      case 'damage':
        return 'Урон';
      case 'tank':
        return 'Защита';
      case 'support':
        return 'Поддержка';
      case 'control':
        return 'Контроль';
      case 'healer':
        return 'Лечение';
      default:
        return 'Универсал';
    }
  };
  
  // Проверяем, может ли пользователь управлять участником
  const canManageMember = (member) => {
    // Лидер может управлять всеми
    if (currentUserRole === 'leader') {
      return true;
    }
    
    // Офицер может управлять обычными участниками
    if (currentUserRole === 'officer' && member.role === 'member') {
      return true;
    }
    
    return false;
  };
  
  // Обработчик для повышения участника до офицера
  const handlePromote = async (member) => {
    if (currentUserRole !== 'leader') {
      actions.addNotification({
        message: 'Только лидер группы может повышать участников',
        type: 'error'
      });
      return;
    }
    
    if (member.role !== 'member') {
      actions.addNotification({
        message: 'Этот участник уже имеет повышенную роль',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // В реальном приложении здесь был бы вызов API для изменения роли
      /*
      await actions.dispatch({
        type: 'UPDATE_MEMBER_ROLE',
        payload: {
          groupId: member.groupId,
          userId: member.userId,
          newRole: 'officer'
        }
      });
      */
      
      // Добавляем уведомление
      actions.addNotification({
        message: `${member.user.username} повышен до Офицера`,
        type: 'success'
      });
      
      // Сбрасываем выбранного участника
      setSelectedMember(null);
    } catch (error) {
      console.error('Ошибка при повышении участника:', error);
      actions.addNotification({
        message: `Не удалось повысить участника: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик для понижения офицера до обычного участника
  const handleDemote = async (member) => {
    if (currentUserRole !== 'leader') {
      actions.addNotification({
        message: 'Только лидер группы может понижать участников',
        type: 'error'
      });
      return;
    }
    
    if (member.role !== 'officer') {
      actions.addNotification({
        message: 'Этот участник не имеет повышенной роли',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // В реальном приложении здесь был бы вызов API для изменения роли
      /*
      await actions.dispatch({
        type: 'UPDATE_MEMBER_ROLE',
        payload: {
          groupId: member.groupId,
          userId: member.userId,
          newRole: 'member'
        }
      });
      */
      
      // Добавляем уведомление
      actions.addNotification({
        message: `${member.user.username} понижен до обычного участника`,
        type: 'success'
      });
      
      // Сбрасываем выбранного участника
      setSelectedMember(null);
    } catch (error) {
      console.error('Ошибка при понижении участника:', error);
      actions.addNotification({
        message: `Не удалось понизить участника: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик для исключения участника из группы
  const handleKick = async (member) => {
    if (!canManageMember(member)) {
      actions.addNotification({
        message: 'У вас нет прав для исключения этого участника',
        type: 'error'
      });
      return;
    }
    
    if (member.userId === leaderId) {
      actions.addNotification({
        message: 'Нельзя исключить лидера группы',
        type: 'error'
      });
      return;
    }
    
    if (!window.confirm(`Вы уверены, что хотите исключить ${member.user.username} из группы?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      // В реальном приложении здесь был бы вызов API для исключения участника
      /*
      await actions.dispatch({
        type: 'REMOVE_MEMBER',
        payload: {
          groupId: member.groupId,
          userId: member.userId
        }
      });
      */
      
      // Добавляем уведомление
      actions.addNotification({
        message: `${member.user.username} исключен из группы`,
        type: 'success'
      });
      
      // Сбрасываем выбранного участника
      setSelectedMember(null);
    } catch (error) {
      console.error('Ошибка при исключении участника:', error);
      actions.addNotification({
        message: `Не удалось исключить участника: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик для передачи лидерства
  const handleTransferLeadership = async (member) => {
    if (currentUserRole !== 'leader') {
      actions.addNotification({
        message: 'Только лидер группы может передать лидерство',
        type: 'error'
      });
      return;
    }
    
    if (member.userId === leaderId) {
      actions.addNotification({
        message: 'Вы уже являетесь лидером группы',
        type: 'error'
      });
      return;
    }
    
    if (!window.confirm(`Вы уверены, что хотите передать лидерство ${member.user.username}?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      // В реальном приложении здесь был бы вызов API для передачи лидерства
      /*
      await actions.dispatch({
        type: 'TRANSFER_LEADERSHIP',
        payload: {
          groupId: member.groupId,
          newLeaderId: member.userId
        }
      });
      */
      
      // Добавляем уведомление
      actions.addNotification({
        message: `Лидерство передано ${member.user.username}`,
        type: 'success'
      });
      
      // Сбрасываем выбранного участника
      setSelectedMember(null);
    } catch (error) {
      console.error('Ошибка при передаче лидерства:', error);
      actions.addNotification({
        message: `Не удалось передать лидерство: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.memberList}>
      {members.map(member => {
        const roleInfo = getRoleInfo(member.role);
        const isLeader = member.userId === leaderId;
        const isCurrentUser = member.userId === currentUserId;
        const canManage = canManageMember(member) && !isCurrentUser;
        
        return (
          <div 
            key={member.userId} 
            className={`${styles.memberItem} ${selectedMember?.userId === member.userId ? styles.selected : ''}`}
            onClick={() => setSelectedMember(selectedMember?.userId === member.userId ? null : member)}
          >
            <div className={styles.memberInfo}>
              <div className={styles.nameWrapper}>
                <span className={styles.role}>{roleInfo.icon}</span>
                <span className={styles.username}>
                  {member.user.username}
                  {isCurrentUser && <span className={styles.currentUser}> (Вы)</span>}
                </span>
              </div>
              
              <div className={styles.stats}>
                <span className={styles.level}>
                  Уровень {member.user.cultivationLevel}
                </span>
                <span className={styles.specialization}>
                  {getSpecIcon(member.specialization)} {getSpecName(member.specialization)}
                </span>
              </div>
            </div>
            
            {/* Действия с участником */}
            {selectedMember?.userId === member.userId && (
              <div className={styles.memberActions}>
                {isLeader && currentUserRole === 'leader' && (
                  <span className={styles.leaderNote}>Лидер группы</span>
                )}
                
                {currentUserRole === 'leader' && !isLeader && member.role === 'member' && (
                  <Button 
                    className={styles.promoteButton}
                    onClick={() => handlePromote(member)}
                    disabled={loading}
                  >
                    Повысить до офицера
                  </Button>
                )}
                
                {currentUserRole === 'leader' && member.role === 'officer' && (
                  <Button 
                    className={styles.demoteButton}
                    onClick={() => handleDemote(member)}
                    disabled={loading}
                  >
                    Понизить до участника
                  </Button>
                )}
                
                {currentUserRole === 'leader' && !isLeader && (
                  <Button 
                    className={styles.transferButton}
                    onClick={() => handleTransferLeadership(member)}
                    disabled={loading}
                  >
                    Передать лидерство
                  </Button>
                )}
                
                {canManage && (
                  <Button 
                    className={styles.kickButton}
                    onClick={() => handleKick(member)}
                    disabled={loading}
                  >
                    Исключить из группы
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MemberList;
