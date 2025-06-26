import React, { useState } from 'react';
import styled from 'styled-components';
import SectServiceAPI from '../../../services/sect-api';
import CultivationServiceAPI from '../../../services/cultivation-api';
import { useGame } from '../../../context/GameContext';
import { AVAILABLE_RANKS, RANK_DISPLAY_NAMES } from '../../../utils/sectRanks';

// Стили
const Container = styled.div`
  margin-top: 15px;
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
  
  &:hover {
    background: rgba(255, 80, 80, 0.3);
  }
  
  &:disabled {
    background: #333;
    border-color: #666;
    color: #666;
  }
`;

const SectionTitle = styled.h4`
  color: #d4af37;
  margin: 15px 0 10px;
  font-size: 1rem;
`;

const RankSelector = styled.select`
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #f0f0f0;
  margin-bottom: 10px;
  
  &:focus {
    outline: none;
    border-color: #ffcc00;
    box-shadow: 0 0 5px rgba(212, 175, 55, 0.5);
  }
  
  option {
    background: #222;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const InfoMessage = styled.div`
  color: #aaa;
  text-align: center;
  padding: 10px;
  font-style: italic;
  margin-bottom: 10px;
`;

const CostInfo = styled.div`
  color: #d4af37;
  margin-bottom: 10px;
  font-size: 0.9rem;
  text-align: center;
`;

const BenefitsInfo = styled.div`
  color: #aaa;
  font-size: 0.85rem;
  margin: 10px 0;
  line-height: 1.4;
`;

/**
 * Компонент действий лидера секты
 * @param {Object} sect - Данные о секте
 * @param {Object} user - Данные о текущем пользователе
 * @param {Object} selectedMember - Выбранный член секты
 * @param {Function} onRefresh - Функция для обновления данных
 * @param {Function} showNotification - Функция для отображения уведомлений
 * @param {boolean} disabled - Флаг блокировки элементов управления
 */
function LeaderActions({ 
  sect, 
  user, 
  selectedMember, 
  onRefresh, 
  showNotification,
  disabled = false
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [newRank, setNewRank] = useState('');
  
  // Состояние и переменные для тренировки
  const [isTraining, setIsTraining] = useState(false);
  // Состояние для передачи лидерства
  const [isTransferringLeadership, setIsTransferringLeadership] = useState(false);
  const { actions } = useGame();
  const userCultivation = user.cultivation || { energy: 0 };
  const energyCost = 20;
  
  // Используем константы рангов из utils/sectRanks.js
  
  // Функция для изменения ранга члена секты
  const handleRankChange = async () => {
    if (!selectedMember || !newRank) {
      showNotification('Выберите члена секты и новый ранг', 'error');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Вызов API для изменения ранга
      await SectServiceAPI.changeMemberRank(user.id, selectedMember.userId, newRank);
      
      // Уведомление об успешном изменении ранга
      showNotification(
        `Ранг участника ${selectedMember.name} изменен на "${newRank}"`, 
        'success'
      );
      
      // Обновляем данные секты
      onRefresh();
      
      // Сбрасываем выбранный ранг
      setNewRank('');
      
    } catch (error) {
      console.error('Ошибка при изменении ранга:', error);
      showNotification(
        error.message || 'Не удалось изменить ранг участника',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Функция для исключения члена из секты
  const handleExpelMember = async () => {
    if (!selectedMember) {
      showNotification('Выберите члена секты для исключения', 'error');
      return;
    }
    
    if (!window.confirm(`Вы уверены, что хотите исключить ${selectedMember.name} из секты? Это действие нельзя отменить.`)) {
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Вызов API для исключения члена
      await SectServiceAPI.expelMember(user.id, selectedMember.userId);
      
      // Уведомление об успешном исключении
      showNotification(
        `Участник ${selectedMember.name} исключен из секты`, 
        'success'
      );
      
      // Обновляем данные секты
      onRefresh();
      
    } catch (error) {
      console.error('Ошибка при исключении члена:', error);
      showNotification(
        error.message || 'Не удалось исключить участника из секты',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Функция для передачи лидерства
  const handleTransferLeadership = async () => {
    if (!selectedMember) {
      showNotification('Выберите члена секты для передачи лидерства', 'error');
      return;
    }
    
    if (selectedMember.userId === user.id) {
      showNotification('Вы не можете передать лидерство самому себе', 'error');
      return;
    }
    
    // Подтверждение действия
    if (!window.confirm(`Вы уверены, что хотите передать лидерство пользователю ${selectedMember.name}? Вы станете старейшиной секты.`)) {
      return;
    }
    
    try {
      setIsTransferringLeadership(true);
      
      // Вызов API для передачи лидерства
      await SectServiceAPI.transferLeadership(user.id, selectedMember.userId);
      
      // Уведомление об успехе
      showNotification(
        `${selectedMember.name} теперь глава секты, а вы получили ранг старейшины`,
        'success'
      );
      
      // Обновляем данные секты
      onRefresh();
      
    } catch (error) {
      console.error('Ошибка при передаче лидерства:', error);
      showNotification(
        error.message || 'Не удалось передать лидерство',
        'error'
      );
    } finally {
      setIsTransferringLeadership(false);
    }
  };
  
  // Функция для тренировки с членом секты
  const handleTrainWithMember = async () => {
    if (!selectedMember) {
      showNotification('Выберите члена секты для тренировки', 'error');
      return;
    }
    
    // Нельзя тренироваться с самим собой
    if (selectedMember.userId === user.id) {
      showNotification('Вы не можете тренироваться с самим собой', 'error');
      return;
    }
    
    // Проверяем, достаточно ли энергии
    if (userCultivation.energy < energyCost) {
      showNotification(
        `Недостаточно духовной энергии для тренировки. Требуется: ${energyCost}`,
        'error'
      );
      return;
    }
    
    try {
      setIsTraining(true);
      
      // Вызов API для тренировки
      const result = await SectServiceAPI.trainWithMember(
        user.id,
        selectedMember.id
      );
      
      // Уведомление об успешной тренировке
      showNotification(
        result.message || `Вы успешно потренировались с ${selectedMember.name}`,
        'success'
      );
      
      // Если получен опыт, показываем дополнительное уведомление
      if (result.experienceGained) {
        showNotification(
          `Вы с напарником получили ${result.experienceGained} опыта от тренировки`,
          'info'
        );
      }
      
      // Запрашиваем обновленные данные о культивации пользователя
      try {
        const updatedCultivation = await CultivationServiceAPI.getCultivationProgress(user.id);
        
        // Обновляем данные о культивации в Redux
        if (actions.updateCultivation) {
          actions.updateCultivation(updatedCultivation);
          console.log('Данные о культивации обновлены:', updatedCultivation);
        } else {
          console.warn('Метод actions.updateCultivation недоступен');
        }
      } catch (cultivationError) {
        console.error('Ошибка при обновлении данных о культивации:', cultivationError);
      }
      
      // Обновляем данные секты
      onRefresh();
      
    } catch (error) {
      console.error('Ошибка при тренировке:', error);
      showNotification(
        error.message || 'Не удалось провести тренировку',
        'error'
      );
    } finally {
      setIsTraining(false);
    }
  };
  
  // Если нет выбранного члена секты, показываем сообщение
  if (!selectedMember) {
    return (
      <Container>
        <InfoMessage>
          Выберите члена секты для управления
        </InfoMessage>
      </Container>
    );
  }
  
  // Если выбран сам лидер, показываем сообщение
  if (selectedMember.userId === user.id) {
    return (
      <Container>
        <InfoMessage>
          Вы не можете управлять собственным рангом или исключить себя из секты
        </InfoMessage>
      </Container>
    );
  }

  return (
    <Container>
      {/* Блок тренировки - для всех членов секты, кроме самого лидера */}
      {selectedMember && selectedMember.userId !== user.id && (
        <>
          <SectionTitle>Тренировка с {selectedMember.name}</SectionTitle>
          
          <BenefitsInfo>
            Совместная тренировка позволит вам получить опыт культивации и
            повысить лояльность между вами и вашим партнером по тренировке.
          </BenefitsInfo>
          
          <CostInfo>
            Стоимость: 20 единиц энергии
          </CostInfo>
          
          <ActionButton
            onClick={handleTrainWithMember}
            disabled={
              isTraining ||
              disabled ||
              userCultivation.energy < energyCost
            }
          >
            {isTraining ? 'Тренировка...' : 'Начать тренировку'}
          </ActionButton>
        </>
      )}
      
      {/* Секция передачи лидерства */}
      {selectedMember && selectedMember.userId !== user.id && (
        <>
          <SectionTitle>Передача лидерства</SectionTitle>
          
          <ActionButton
            onClick={handleTransferLeadership}
            disabled={isTransferringLeadership || disabled}
          >
            {isTransferringLeadership ? 'Передача лидерства...' : 'Назначить главой секты'}
          </ActionButton>
        </>
      )}

      <SectionTitle>Управление рангом</SectionTitle>
      
      <RankSelector 
        value={newRank} 
        onChange={(e) => setNewRank(e.target.value)}
        disabled={isProcessing || disabled}
      >
        <option value="">Выберите новый ранг</option>
        {AVAILABLE_RANKS.map(rank => (
          <option key={rank} value={rank} disabled={rank === selectedMember.role}>
            {RANK_DISPLAY_NAMES[rank]}
          </option>
        ))}
      </RankSelector>
      
      <ActionButton 
        onClick={handleRankChange}
        disabled={isProcessing || !newRank || disabled}
      >
        {isProcessing ? 'Изменение ранга...' : 'Изменить ранг'}
      </ActionButton>
      
      <SectionTitle>Исключение из секты</SectionTitle>
      
      <DangerButton 
        onClick={handleExpelMember}
        disabled={isProcessing || disabled}
      >
        {isProcessing ? 'Исключение...' : 'Исключить из секты'}
      </DangerButton>
    </Container>
  );
}

export default LeaderActions;