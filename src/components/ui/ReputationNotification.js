/**
 * Компонент для отображения уведомлений об изменении репутации
 */
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import ReputationBadge from './ReputationBadge';

// Анимация появления
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Анимация исчезновения
const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
`;

// Стили компонента
const NotificationContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  width: 350px;
  max-width: 90vw;
  animation: ${props => props.closing ? fadeOut : fadeIn} 0.5s ease-in-out;
`;

const NotificationCard = styled.div`
  background-color: #1f293d;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-left: 4px solid ${props => {
    if (props.change > 0) return '#65a880';
    if (props.change < 0) return '#c94c4c';
    return '#8b9bb4';
  }};
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const NotificationTitle = styled.div`
  font-weight: 600;
  color: #e0e0e0;
  font-size: 1.1rem;
`;

const NotificationClose = styled.button`
  background: none;
  border: none;
  color: #8899ab;
  cursor: pointer;
  font-size: 1.2rem;
  
  &:hover {
    color: #c5c5c5;
  }
`;

const NotificationContent = styled.div`
  margin-bottom: 10px;
  color: #b8c5d9;
`;

const NotificationFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EntityInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a5a5c9;
  font-size: 0.9rem;
`;

const ChangeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChangeValue = styled.div`
  color: ${props => {
    if (props.change > 0) return '#65a880';
    if (props.change < 0) return '#c94c4c';
    return '#8b9bb4';
  }};
  font-weight: 600;
`;

const ProgressContainer = styled.div`
  height: 4px;
  background-color: #2d3b55;
  border-radius: 2px;
  margin-top: 10px;
  overflow: hidden;
`;

const Progress = styled.div`
  height: 100%;
  width: ${props => `${props.progress}%`};
  background-color: ${props => {
    if (props.type === 'positive') return '#65a880';
    if (props.type === 'negative') return '#c94c4c';
    return '#4e8ac7';
  }};
  transition: width 0.1s linear;
`;

/**
 * Компонент уведомления об изменении репутации
 * @param {Object} props - Свойства компонента
 * @param {Object} props.notification - Данные уведомления
 * @param {Function} props.onClose - Функция закрытия уведомления
 * @param {number} props.duration - Длительность отображения в мс (по умолчанию 5000)
 * @returns {JSX.Element} - Визуальный компонент
 */
const ReputationNotification = ({ notification, onClose, duration = 5000 }) => {
  const [progress, setProgress] = useState(100);
  const [isClosing, setIsClosing] = useState(false);
  const interval = 100; // Интервал обновления прогресса
  
  useEffect(() => {
    // Расчет инкремента для прогресса
    const decrement = (interval / duration) * 100;
    
    // Запускаем таймер для обновления прогресса
    const timer = setInterval(() => {
      setProgress(prev => {
        // Если прогресс закончился, начинаем закрытие
        if (prev <= 0) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        return prev - decrement;
      });
    }, interval);
    
    // Очистка при размонтировании
    return () => clearInterval(timer);
  }, [duration]);
  
  // Обработчик закрытия
  const handleClose = () => {
    if (isClosing) return;
    
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 500); // Подождать окончания анимации
  };
  
  // Получение отображаемого имени сферы
  const getSphereDisplayName = (sphere) => {
    const sphereNames = {
      'general': 'Общая',
      'combat': 'Боевая слава',
      'trade': 'Торговая',
      'spiritual': 'Духовная',
      'alchemy': 'Алхимическая',
      'political': 'Политическая'
    };
    
    return sphereNames[sphere] || sphere;
  };
  
  // Определение типа изменения для цветовой схемы
  const getChangeType = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };
  
  // Полное заголовок уведомления
  const getNotificationTitle = () => {
    const { entityType, entityName, change } = notification;
    let prefix = '';
    
    if (change > 0) {
      prefix = 'Репутация повышена';
    } else if (change < 0) {
      prefix = 'Репутация понижена';
    } else {
      prefix = 'Изменение репутации';
    }
    
    return `${prefix}${entityName ? `: ${entityName}` : ''}`;
  };
  
  return (
    <NotificationContainer closing={isClosing}>
      <NotificationCard change={notification.change}>
        <NotificationHeader>
          <NotificationTitle>
            {getNotificationTitle()}
          </NotificationTitle>
          <NotificationClose onClick={handleClose}>
            ×
          </NotificationClose>
        </NotificationHeader>
        
        <NotificationContent>
          {notification.reason}
        </NotificationContent>
        
        <NotificationFooter>
          <EntityInfo>
            {getSphereDisplayName(notification.sphere)}
          </EntityInfo>
          
          <ChangeInfo>
            <ChangeValue change={notification.change}>
              {notification.change > 0 ? `+${notification.change}` : notification.change}
            </ChangeValue>
            
            {notification.newLevel && notification.oldLevel && notification.newLevel !== notification.oldLevel && (
              <ReputationBadge level={notification.newLevel} />
            )}
          </ChangeInfo>
        </NotificationFooter>
        
        <ProgressContainer>
          <Progress 
            progress={progress} 
            type={getChangeType(notification.change)} 
          />
        </ProgressContainer>
      </NotificationCard>
    </NotificationContainer>
  );
};

/**
 * Компонент-обертка для управления множественными уведомлениями
 */
export const ReputationNotificationsManager = () => {
  const [notifications, setNotifications] = useState([]);
  
  // Добавление нового уведомления
  const addNotification = (notification) => {
    const id = Date.now(); // Уникальный ID для уведомления
    setNotifications(prev => [...prev, { ...notification, id }]);
  };
  
  // Удаление уведомления
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };
  
  return (
    <>
      {notifications.map(notif => (
        <ReputationNotification 
          key={notif.id}
          notification={notif}
          onClose={() => removeNotification(notif.id)}
        />
      ))}
    </>
  );
};

export default ReputationNotification;
