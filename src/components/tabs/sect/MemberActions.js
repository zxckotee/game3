import React, { useState } from 'react';
import styled from 'styled-components';
import SectServiceAPI from '../../../services/sect-api';
import CultivationServiceAPI from '../../../services/cultivation-api';
import { useGame } from '../../../context/GameContext';

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

const SectionTitle = styled.h4`
  color: #d4af37;
  margin: 15px 0 10px;
  font-size: 1rem;
`;

const InfoMessage = styled.div`
  color: #aaa;
  text-align: center;
  padding: 10px;
  font-style: italic;
  margin-bottom: 10px;
`;

const DurationSelector = styled.select`
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
 * Компонент действий обычного члена секты
 * @param {Object} sect - Данные о секте
 * @param {Object} user - Данные о текущем пользователе
 * @param {Object} selectedMember - Выбранный член секты
 * @param {Function} onRefresh - Функция для обновления данных
 * @param {Function} showNotification - Функция для отображения уведомлений
 * @param {boolean} disabled - Флаг блокировки элементов управления
 */
function MemberActions({
  sect,
  user,
  selectedMember,
  onRefresh,
  showNotification,
  disabled = false
}) {
  const [isTraining, setIsTraining] = useState(false);
  // Получаем контекст игры для доступа к dispatch
  const { actions } = useGame();
  
  // Получаем данные о культивации пользователя
  const userCultivation = user.cultivation || { energy: 0 };
  
  // Фиксированная стоимость тренировки
  const energyCost = 20;
  
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
          Выберите члена секты для взаимодействия
        </InfoMessage>
      </Container>
    );
  }
  
  // Если выбран сам пользователь, показываем сообщение
  if (selectedMember.user_id === user.id) {
    return (
      <Container>
        <InfoMessage>
          Вы не можете тренироваться с самим собой
        </InfoMessage>
      </Container>
    );
  }

  return (
    <Container>
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
        {isTraining ? 'Тренировка...' : 'Тренироваться'}
      </ActionButton>
    </Container>
  );
}

export default MemberActions;