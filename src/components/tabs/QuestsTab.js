import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
// Импортируем константы и сервис из обновленного адаптера services
import { quests as defaultQuests, questCategories, normalizeQuestData } from '../../services/quest-adapter';
// Импортируем функцию проверки подзадач по ID
import { checkQuestObjective } from '../../utils/quest-objective-checker';
// Импортируем сервис для работы с квестами
import questService from '../../services/quest-adapter';

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
  const questService = require('../../services/quest-adapter');
  const [selectedCategory, setSelectedCategory] = useState('все');
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questsData, setQuestsData] = useState({ active: [], completed: [], available: [] });
  
  // Получаем данные о квестах как из Redux, так и из QuestManager
  useEffect(() => {
    // Функция для получения данных о квестах
    const fetchQuestsData = () => {
      try {
        // Пытаемся получить данные из QuestManager (новый API-подход)
        if (window.questManager && window.questManager.getQuestsList) {
          // Получаем квесты и нормализуем их структуру
          let quests = window.questManager.getQuestsList() || [];
          quests = Array.isArray(quests) ? quests.map(quest => normalizeQuestData(quest)) : [];
          
          // Разделяем квесты по статусу (используем API-данные для всех категорий)
          const active = quests.filter(q => q.status === 'active');
          const completed = quests.filter(q => q.status === 'completed');
          const available = quests.filter(q => q.status === 'available');
          
          setQuestsData({ active, completed, available });
        } else {
          // Запасной вариант - пытаемся использовать данные из Redux если они доступны
          const completed = state.player.progress?.quests?.completed || [];
          const active = state.player.progress?.quests?.active || [];
          
          // Для доступных квестов используем API данные, если они есть в стейте
          // Иначе показываем все квесты из defaultQuests, которых нет в active и completed
          let available = [];
          if (state.player.progress?.quests?.available) {
            available = state.player.progress.quests.available;
          } else {
            available = defaultQuests.filter(q =>
              !completed.find(cq => cq.id === q.id) &&
              !active.find(aq => aq.id === q.id)
            );
          }
          
          setQuestsData({ active, completed, available });
        }
      } catch (error) {
        console.error('Ошибка при получении данных о квестах:', error);
        // В случае ошибки используем безопасные пустые массивы
        // В случае ошибки показываем безопасные данные
        // Пытаемся получить данные из API, если доступны, или используем defaultQuests
        const available = window.questManager?.getQuestsList?.()?.filter?.(q => q.status === 'available') || defaultQuests;
        setQuestsData({ active: [], completed: [], available });
      }
    };
    
    // Получаем данные при монтировании компонента
    fetchQuestsData();
    
    // Подписываемся на события обновления квестов
    const handleQuestsUpdated = () => fetchQuestsData();
    window.addEventListener('quests-updated', handleQuestsUpdated);
    window.addEventListener('quest-accepted', handleQuestsUpdated);
    window.addEventListener('quest-completed', handleQuestsUpdated);
    window.addEventListener('quest-progress-updated', handleQuestsUpdated);
    
    return () => {
      // Отписываемся от событий при размонтировании
      window.removeEventListener('quests-updated', handleQuestsUpdated);
      window.removeEventListener('quest-accepted', handleQuestsUpdated);
      window.removeEventListener('quest-completed', handleQuestsUpdated);
      window.removeEventListener('quest-progress-updated', handleQuestsUpdated);
    };
  }, [state.player.progress?.quests]);
  
  // Объединяем квесты из всех источников
  const allQuests = [
    ...questsData.available,
    ...questsData.active,
    ...questsData.completed
  ];
  
  const filteredQuests = allQuests.filter(quest => 
    selectedCategory === 'все' || quest.category === selectedCategory
  );
  
  const handleQuestSelect = (quest) => {
    setSelectedQuest(quest);
  };
  
  const handleAcceptQuest = () => {
    if (selectedQuest) {
      // Проверяем уровень игрока
      if (state.player.cultivation.level < selectedQuest.requiredLevel) {
        // Используем Redux action или окно уведомления
        if (actions.addNotification) {
          actions.addNotification({
            message: `Требуется уровень культивации ${selectedQuest.requiredLevel}`,
            type: 'error'
          });
        } else {
          console.warn(`Требуется уровень культивации ${selectedQuest.requiredLevel}`);
        }
        return;
      }
      
      // Пытаемся использовать QuestManager (новый API-подход)
      if (window.questManager && window.questManager.acceptQuest) {
        window.questManager.acceptQuest(selectedQuest.id)
          .then(() => {
            // Показываем уведомление
            if (actions.addNotification) {
              actions.addNotification({
                message: `Вы приняли задание "${selectedQuest.title}"`,
                type: 'success'
              });
            }
          })
          .catch(error => {
            console.error('Ошибка при принятии задания:', error);
            if (actions.addNotification) {
              actions.addNotification({
                message: 'Ошибка при принятии задания',
                type: 'error'
              });
            }
          });
      } else {
        // Запасной вариант - используем Redux action
        if (actions.acceptQuest) {
          actions.acceptQuest(selectedQuest.id);
          if (actions.addNotification) {
            actions.addNotification({
              message: `Вы приняли задание "${selectedQuest.title}"`,
              type: 'success'
            });
          }
        }
      }
    }
  };
  
  const handleCompleteQuest = () => {
    if (selectedQuest) {
      if (!selectedQuest?.objectives?.every?.(obj => obj.completed)) {
        // Используем Redux action или окно уведомления
        if (actions.addNotification) {
          actions.addNotification({
            message: 'Сначала выполните все цели задания',
            type: 'error'
          });
        } else {
          console.warn('Сначала выполните все цели задания');
        }
        return;
      }
      
      // Пытаемся использовать QuestManager (новый API-подход)
      if (window.questManager && window.questManager.completeQuest) {
        window.questManager.completeQuest(selectedQuest.id)
          .then(() => {
            // Показываем уведомление
            if (actions.addNotification) {
              actions.addNotification({
                message: `Вы завершили задание "${selectedQuest.title}"`,
                type: 'success'
              });
            }
          })
          .catch(error => {
            console.error('Ошибка при завершении задания:', error);
            if (actions.addNotification) {
              actions.addNotification({
                message: 'Ошибка при завершении задания',
                type: 'error'
              });
            }
          });
      } else {
        // Запасной вариант - используем Redux action
        if (actions.completeQuest) {
          actions.completeQuest(selectedQuest.id);
          if (actions.addNotification) {
            actions.addNotification({
              message: `Вы завершили задание "${selectedQuest.title}"`,
              type: 'success'
            });
          }
        }
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

  // Эта функция перенесена в модуль quest-objective-checker.js

  // Эта функция перенесена в модуль quest-objective-checker.js

  // Проверка выполнения требования полностью перенесена в модуль quest-objective-checker.js

  // Проверка выполнения подзадач при выборе квеста
  useEffect(() => {
    if (selectedQuest?.objectives && Array.isArray(selectedQuest.objectives)) {
      // Создаем объект для отслеживания изменений
      const updatedProgress = {};
      let changed = false;
      
      // Проверяем каждую подзадачу
      selectedQuest.objectives.forEach(objective => {
        // Проверяем каждую незавершенную подзадачу
        if (!objective.completed && objective.id) {
          // Проверяем выполнение по ID подзадачи
          const isCompleted = checkQuestObjective(objective.id, state);
          
          if (isCompleted) {
            updatedProgress[objective.id] = true;
            changed = true;
            objective.completed = true; // Обновляем локальное состояние
            console.log(`Автоматически отмечена как выполненная цель: ${objective.text}`);
          }
        }
      });
      
      // Если есть изменения - отправляем на сервер
      if (changed && questService && questService.updateQuestProgress) {
        questService.updateQuestProgress(state.player?.id, selectedQuest.id, updatedProgress)
          .then(() => console.log("Прогресс подзадач успешно обновлен"))
          .catch(err => console.error("Ошибка при обновлении прогресса:", err));
      }
    }
  }, [selectedQuest, state]);

  const canCompleteQuest = selectedQuest &&
    selectedQuest.status === 'active' &&
    Array.isArray(selectedQuest?.objectives) &&
    selectedQuest.objectives.length > 0 &&
    selectedQuest.objectives.every(obj => toBool(obj.completed));
  
  return (
    <Container>
      <QuestsList>
        <QuestCategories>
          {Array.isArray(questCategories) ? questCategories.map(category => (
            <CategoryButton
              key={category.id}
              active={selectedCategory === category.name}
              onClick={() => setSelectedCategory(category.name)}
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
                {quest.status === 'available' && `Уровень ${quest.required_level || quest.requiredLevel || 1}`}
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
                    {isCompleted ? '✓' : '○'} {objective.text || 'Цель задания'}
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
              disabled={state.player.cultivation.level < selectedQuest.requiredLevel}
            >
              {state.player.cultivation.level < selectedQuest.requiredLevel 
                ? `Требуется уровень ${selectedQuest.requiredLevel}` 
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
