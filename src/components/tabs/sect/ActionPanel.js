import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import SectServiceAPI from '../../../services/sect-adapter';
import LeaderActions from './LeaderActions';
import MemberActions from './MemberActions';
import { clearCache, getSectCacheKey } from '../../../utils/cacheUtils';
import { useGame } from '../../../context/GameContext';
import CultivationServiceAPI from '../../../services/cultivation-api';

// Стили
const Container = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
`;

const Title = styled.h3`
  color: #d4af37;
  margin: 0 0 15px;
  font-size: 1.1rem;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 10px;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #d4af37;
  font-size: 0.9rem;
  cursor: pointer;
  margin-bottom: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.3);
  }
  
  &:disabled {
    background: #333;
    border-color: #666;
    color: #666;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(ActionButton)`
  background: rgba(255, 80, 80, 0.2);
  border-color: #ff5050;
  color: #ff5050;
  margin-top: 20px;
  
  &:hover {
    background: rgba(255, 80, 80, 0.3);
  }
  
  &:disabled {
    background: #333;
    border-color: #666;
    color: #666;
  }
`;

/**
 * Компонент панели действий с сектой
 * @param {Object} sect - Данные о секте
 * @param {Object} user - Данные о текущем пользователе
 * @param {boolean} isLeader - Флаг лидера секты
 * @param {Object} selectedMember - Выбранный член секты
 * @param {Function} onRefresh - Функция для обновления данных
 * @param {Function} showNotification - Функция для отображения уведомлений
 */
function ActionPanel({
  sect,
  user,
  isLeader,
  selectedMember,
  onRefresh,
  showNotification
}) {
  const [isContributing, setIsContributing] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Получаем контекст и действия для обновления состояния Redux
  const { actions } = useGame();
  
  // Получаем данные о культивации пользователя
  const userCultivation = user.cultivation || { energy: 0 };
  
  // Функция для внесения вклада в секту
  const handleContribute = async () => {
    const energyAmount = 20; // Фиксированное количество энергии
    
    if (userCultivation.energy < energyAmount) {
      showNotification('Недостаточно духовной энергии для вклада', 'error');
      return;
    }
    
    try {
      setIsContributing(true);
      
      // Вызов API для внесения вклада
      const result = await SectServiceAPI.contributeToSect(user.id, sect.id, energyAmount);
      
      // Уведомление об успешном вкладе
      showNotification(
        result.message || 'Вы внесли вклад в развитие секты',
        'success'
      );
      
      // Если секта повысила уровень, показываем особое уведомление
      if (result.leveledUp) {
        showNotification(
          `Секта "${sect.name}" достигла ${result.newLevel} уровня!`,
          'achievement'
        );
      }
      
      // Обновляем данные культивации через API и Redux
      try {
        // Получаем обновленные данные культивации
        const updatedCultivation = await CultivationServiceAPI.getCultivationProgress(user.id);
        
        // Обновляем данные культивации в Redux
        if (actions.updateCultivation) {
          actions.updateCultivation(updatedCultivation);
          console.log('Данные о культивации обновлены:', updatedCultivation);
        } else {
          console.warn('Метод actions.updateCultivation недоступен');
        }
      } catch (cultivationError) {
        console.error('Ошибка при обновлении данных о культивации:', cultivationError);
      }
      
      // Обновление данных о секте через Redux не требуется,
      // т.к. функция onRefresh уже обновляет данные в UI
      
      // Очищаем кеш секты перед обновлением
      clearCache(getSectCacheKey(user.id));
      
      // Обновляем данные секты через переданную функцию обновления
      if (onRefresh) {
        onRefresh();
      }
      
    } catch (error) {
      console.error('Ошибка при внесении вклада:', error);
      showNotification(
        error.message || 'Не удалось внести вклад в секту',
        'error'
      );
    } finally {
      setIsContributing(false);
    }
  };

  // Функция для выхода из секты
  const handleLeaveSect = async () => {
    if (!window.confirm('Вы уверены, что хотите покинуть секту? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      setIsLeaving(true);
      
      // Дополнительная проверка, состоит ли пользователь в секте
      if (!sect || !sect.id) {
        showNotification('Вы не состоите в секте', 'info');
        setIsLeaving(false);
        return;
      }
      
      // Вызов API для выхода из секты
      const result = await SectServiceAPI.leaveSect(user.id);
      
      if (result && result.success) {
        // Очищаем кеш перед обновлением
        try {
          clearCache(getSectCacheKey(user.id));
          console.log('Кэш секты очищен');
        } catch (cacheError) {
          console.warn('Ошибка при очистке кэша:', cacheError);
        }
        
        showNotification(result.message || 'Вы успешно покинули секту', 'success');
        
        // Ожидаем небольшую задержку перед обновлением интерфейса
        // чтобы пользователь успел заметить уведомление
        setTimeout(() => {
          if (onRefresh) {
            onRefresh();
          }
        }, 500);
      } else {
        // Обрабатываем ошибки от API
        // Если пользователь уже не состоит в секте, считаем это успешным сценарием
        if (result && result.error && result.error.includes('не состоит в секте')) {
          clearCache(getSectCacheKey(user.id));
          showNotification('Вы уже покинули секту', 'info');
          
          if (onRefresh) {
            onRefresh();
          }
          return;
        }
        
        showNotification(
          result && result.error ? result.error : 'Не удалось покинуть секту',
          'error'
        );
        setIsLeaving(false);
      }
    } catch (error) {
      console.error('Ошибка при выходе из секты:', error);
      
      // Если ошибка связана с тем, что пользователь не состоит в секте,
      // считаем это успешным сценарием
      if (error && error.message && error.message.includes('не состоит в секте')) {
        clearCache(getSectCacheKey(user.id));
        showNotification('Вы уже покинули секту', 'info');
        
        if (onRefresh) {
          onRefresh();
        }
        return;
      }
      
      showNotification(
        error.message || 'Не удалось покинуть секту',
        'error'
      );
      setIsLeaving(false);
    }
  };

  return (
    <Container>
      <Title>Действия</Title>
      
      {/* Общее действие для всех членов секты - внесение вклада */}
      <ActionButton 
        onClick={handleContribute} 
        disabled={isContributing || isLeaving || userCultivation.energy < 20}
      >
        {isContributing ? 'Внесение вклада...' : 'Внести вклад (20 энергии)'}
      </ActionButton>
      
      {/* Компонент действий в зависимости от роли пользователя */}
      {isLeader ? (
        <LeaderActions 
          sect={sect}
          user={user}
          selectedMember={selectedMember}
          onRefresh={onRefresh}
          showNotification={showNotification}
          disabled={isContributing || isLeaving}
        />
      ) : (
        <MemberActions 
          sect={sect}
          user={user}
          selectedMember={selectedMember}
          onRefresh={onRefresh}
          showNotification={showNotification}
          disabled={isContributing || isLeaving}
        />
      )}
      
      {/* Кнопка выхода из секты */}
      <DangerButton 
        onClick={handleLeaveSect}
        disabled={isContributing || isLeaving}
      >
        {isLeaving ? 'Выход из секты...' : 'Покинуть секту'}
      </DangerButton>
    </Container>
  );
}

// Мемоизируем компонент для предотвращения ненужных ререндеров
export default React.memo(ActionPanel, (prevProps, nextProps) => {
  // Проверяем только изменение свойств, которые должны вызывать ререндер
  return (
    prevProps.sect?.id === nextProps.sect?.id &&
    prevProps.user?.id === nextProps.user?.id &&
    prevProps.isLeader === nextProps.isLeader &&
    prevProps.selectedMember?.id === nextProps.selectedMember?.id &&
    // Не сравниваем функции onRefresh и showNotification, так как они могут меняться
    true
  );
});