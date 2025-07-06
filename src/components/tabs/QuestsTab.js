import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
// Импортируем константы и сервис из обновленного адаптера services
import questAdapter from '../../services/quest-adapter';

const Container = styled.div`
  display: flex;
  gap: 20px;
  height: 100%;
`;

const QuestsList = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
`;

const QuestCategories = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const CategoryButton = styled.button`
  background: ${props => props.active ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 0, 0, 0.3)'};
  color: ${props => props.active ? '#d4af37' : '#f0f0f0'};
  border: 1px solid ${props => props.active ? '#d4af37' : 'transparent'};
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.1);
    border-color: #d4af37;
  }
`;

const QuestCard = styled.div`
  background: rgba(30, 30, 30, 0.95);
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  
  &:hover {
    border-color: #d4af37;
    transform: translateX(5px);
  }
  
  ${props => props.selected && `
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.1);
  `}
`;

const QuestTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 10px 0;
  font-size: 1.1rem;
`;

const QuestInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 0.9rem;
`;

const QuestDifficulty = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  
  ${props => {
    switch (props.level) {
      case 'Легко':
        return 'background: rgba(76, 175, 80, 0.2); color: #4caf50;';
      case 'Средне':
        return 'background: rgba(255, 152, 0, 0.2); color: #ff9800;';
      case 'Сложно':
        return 'background: rgba(244, 67, 54, 0.2); color: #f44336;';
      case 'Очень сложно':
        return 'background: rgba(156, 39, 176, 0.2); color: #9c27b0;';
      default:
        return '';
    }
  }}
`;

const QuestDetails = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const DetailHeader = styled.div`
  margin-bottom: 20px;
`;

const DetailTitle = styled.h2`
  color: #d4af37;
  margin: 0 0 10px 0;
`;

const DetailDescription = styled.p`
  color: #aaa;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const Objectives = styled.div`
  margin-bottom: 20px;
`;

const Objective = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  
  ${props => props.completed && `
    color: #4caf50;
    text-decoration: line-through;
  `}
`;

const Rewards = styled.div`
  margin-top: auto;
`;

const RewardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
`;

const ActionButton = styled.button`
  background: ${props => props.disabled ? 'rgba(0, 0, 0, 0.3)' : 'rgba(212, 175, 55, 0.2)'};
  color: ${props => props.disabled ? '#666' : '#d4af37'};
  border: 1px solid ${props => props.disabled ? 'transparent' : '#d4af37'};
  padding: 12px 24px;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  margin-top: 20px;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.3);
  }
`;

function QuestsTab() {
  const { state, actions } = useGame();
  const [selectedCategory, setSelectedCategory] = useState('все');
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questsData, setQuestsData] = useState({ active: [], completed: [], available: [] });
  const [questCategories, setQuestCategories] = useState([]);

  const fetchQuestsData = async () => {
    if (!state.player?.id) return;
    try {
      const data = await questAdapter.getQuests(state.player.id);
      if (data) {
        setQuestsData(data);
      }
    } catch (error) {
      console.error('Ошибка при получении данных о квестах:', error);
      setQuestsData({ active: [], completed: [], available: [] });
    }
  };

  const fetchQuestConfig = async () => {
    try {
      // Предполагается, что у нас будет такой эндпоинт
      const response = await fetch('/api/quests/config');
      const config = await response.json();
      setQuestCategories(config.categories || []);
    } catch (error) {
      console.error('Ошибка при получении конфигурации квестов:', error);
      setQuestCategories([{id: 'все', name: 'все'}, {id: 'main', name: 'основной сюжет'}]); // fallback
    }
  };

  useEffect(() => {
    fetchQuestsData();
    fetchQuestConfig();
  }, [state.player?.id]);
  
  // Объединяем квесты из всех источников
  const allQuests = [
    ...questsData.available,
    ...questsData.active,
    ...questsData.completed
  ];
  
  const filteredQuests = allQuests.filter(quest => {
    if (selectedCategory === 'все') {
      return true;
    }
    if (selectedCategory === 'side') {
      return quest.category === 'side' || quest.category === 'sect';
    }
    return quest.category === selectedCategory;
  }).sort((a, b) => {
    // Сортировка по уровню в порядке возрастания
    const levelA = a.required_level || 0;
    const levelB = b.required_level || 0;
    return levelA - levelB;
  });
  
  const handleQuestSelect = (quest) => {
    setSelectedQuest(quest);
  };
  
  const handleAcceptQuest = async () => {
    if (selectedQuest && state.player?.id) {
      if (state.player.cultivation.level < selectedQuest.required_level) {
        actions.addNotification({
          message: `Требуется уровень культивации ${selectedQuest.required_level}`,
          type: 'error'
        });
        return;
      }
      
      try {
        const response = await questAdapter.acceptQuest(state.player.id, selectedQuest.id);
        if (response.success === false) {
          actions.addNotification({
            message: response.message,
            type: 'info'
          });
        } else {
          actions.addNotification({
            message: `Вы приняли задание "${selectedQuest.title}"`,
            type: 'success'
          });
          fetchQuestsData(); // Обновляем данные
        }
      } catch (error) {
        console.error('Ошибка при принятии задания:', error);
        actions.addNotification({
          message: error.message || 'Ошибка при принятии задания',
          type: 'error'
        });
      }
    }
  };
  
  const handleCompleteQuest = async () => {
    if (selectedQuest && state.player?.id) {
      if (!canCompleteQuest) {
        actions.addNotification({
          message: 'Сначала выполните все цели задания',
          type: 'error'
        });
        return;
      }
      
      try {
        await questAdapter.completeQuest(state.player.id, selectedQuest.id);
        actions.addNotification({
          message: `Вы завершили задание "${selectedQuest.title}"`,
          type: 'success'
        });
        fetchQuestsData(); // Обновляем данные
      } catch (error) {
        console.error('Ошибка при завершении задания:', error);
        actions.addNotification({
          message: error.message || 'Ошибка при завершении задания',
          type: 'error'
        });
      }
    }
  };
  
  // Вспомогательная функция для корректной обработки булевых значений
  const toBool = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      // PostgreSQL может возвращать строки 't', 'f', 'true', 'false'
      return value.toLowerCase() === 't' ||
             value.toLowerCase() === 'true' ||
             value === '1';
    }
    return Boolean(value);
  };


  const canCompleteQuest = selectedQuest &&
    selectedQuest.status === 'active' &&
    Array.isArray(selectedQuest?.objectives) &&
    selectedQuest.objectives.length > 0 &&
    selectedQuest.objectives.every(obj => toBool(obj.completed));

  const hasActiveQuest = questsData.active && questsData.active.length > 0;
  
  return (
    <Container>
      <QuestsList>
        <QuestCategories>
          {Array.isArray(questCategories) ? questCategories.map(category => (
            <CategoryButton
              key={category.id}
              active={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
            </CategoryButton>
          )) : (<div>Нет доступных категорий</div>)}
        </QuestCategories>
        
        {Array.isArray(filteredQuests) ? filteredQuests.map(quest => (
          <QuestCard
            key={quest.id}
            selected={selectedQuest?.id === quest.id}
            onClick={() => handleQuestSelect(quest)}
          >
            <QuestTitle>{quest.title}</QuestTitle>
            <div>{quest.description}</div>
            <QuestInfo>
              <QuestDifficulty level={quest.difficulty}>
                {quest.difficulty}
              </QuestDifficulty>
              <span>
                {quest.status === 'completed' && 'Завершено'}
                {quest.status === 'active' && 'В процессе'}
                {quest.status === 'available' && `Уровень ${quest.required_level || 1}`}
              </span>
            </QuestInfo>
          </QuestCard>
        )) : <div>Нет доступных заданий</div>}
      </QuestsList>   
      
      {selectedQuest && (
        <QuestDetails>
          <DetailHeader>
            <DetailTitle>{selectedQuest.title}</DetailTitle>
            <QuestDifficulty level={selectedQuest.difficulty}>
              {selectedQuest.difficulty}
            </QuestDifficulty>
          </DetailHeader>
          
          <DetailDescription>{selectedQuest.description}</DetailDescription>
          
          <Objectives>
            <h3>Цели:</h3>
            {selectedQuest?.objectives && Array.isArray(selectedQuest.objectives) ?
              selectedQuest.objectives.map((objective, index) => {
                // Используем нашу функцию toBool для корректной обработки разных форматов
                const isCompleted = toBool(objective.completed);
                return (
                  <Objective
                    key={objective.id || `objective-${index}`}
                    completed={isCompleted}
                  >
                    {isCompleted ? '✓' : '○'} {objective.text || 'Цель задания'} {objective.progressText && `(${objective.progressText})`}
                  </Objective>
                );
              })
             : (<div>Нет целей для этого задания</div>)}
          </Objectives>
          
          <Rewards>
            <h3>Награды:</h3>
            {selectedQuest?.rewards && Array.isArray(selectedQuest.rewards) ?
              selectedQuest.rewards.map((reward, index) => (
                <RewardItem key={reward.id || `reward-${index}`}>
                  <span>{reward.icon || '🪙'}</span>
                  {reward.type === 'currency' && (
                    // Проверяем, есть ли отдельные поля для валюты
                    (reward.gold || reward.silver || reward.copper) ?
                      [
                        reward.gold && `${reward.gold} золота`,
                        reward.silver && `${reward.silver} серебра`,
                        reward.copper && `${reward.copper} меди`
                      ].filter(Boolean).join(', ')
                    :
                    // Иначе используем amount
                    (typeof reward.amount === 'object' && reward.amount !== null)
                      ? Object.entries(reward.amount || {}).map(([currency, value]) => {
                          let name = currency;
                          if (currency === 'gold') name = 'золота';
                          if (currency === 'silver') name = 'серебра';
                          if (currency === 'copper') name = 'меди';
                          return `${value} ${name}`;
                        }).join(', ')
                      : `${reward.amount || 0} золота`
                  )}
                  {reward.type === 'experience' && `${reward.amount || 0} опыта`}
                  {reward.type === 'item' && (reward.name || 'Предмет')}
                  {reward.type === 'technique' && (reward.name || 'Техника')}
                </RewardItem>
              )) : <div>Нет наград для этого задания</div>}
          </Rewards>
          
          {selectedQuest.status === 'available' ? (
            <ActionButton 
              onClick={handleAcceptQuest}
              disabled={hasActiveQuest || state.player.cultivation.level < selectedQuest.required_level}
            >
              {hasActiveQuest
                ? 'Завершите текущее задание'
                : state.player.cultivation.level < selectedQuest.required_level
                  ? `Требуется уровень ${selectedQuest.required_level}`
                  : 'Принять задание'}
            </ActionButton>
          ) : selectedQuest.status === 'active' && (
            <ActionButton 
              onClick={handleCompleteQuest}
              disabled={!canCompleteQuest}
            >
              {canCompleteQuest ? 'Завершить задание' : 'Выполните все цели'}
            </ActionButton>
          )}
        </QuestDetails>
      )}
    </Container>
  );
}

export default QuestsTab;
