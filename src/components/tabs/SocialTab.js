import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';
import CharacterProfileServiceAPI from '../../services/character-profile-service-api';
import CultivationServiceAPI from '../../services/cultivation-api';

// Анимации
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
`;

const Container = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  padding: 24px;
  height: 100%;
  color: #f0f0f0;
  animation: ${fadeIn} 0.6s ease-out;
`;

const RelationshipsList = styled.div`
  flex: 1;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #d4af37, #f4d03f, #d4af37);
    border-radius: 16px;
    padding: 2px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: -1;
  }
`;

const CharacterAvatar = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  flex-shrink: 0;
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;

const PlayerAvatar = styled.div`
  width: 100px;
  height: 100px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 20px;
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  overflow: hidden;
  transition: all 0.3s ease;
  flex-shrink: 0;
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(212, 175, 55, 0.5);
    box-shadow: 0 6px 16px rgba(212, 175, 55, 0.15);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 18px;
  }
`;

const RelationshipCategory = styled.div`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CategoryTitle = styled.h3`
  font-size: 16px;
  margin: 0 0 16px;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  padding: 12px 16px;
  background-color: rgba(212, 175, 55, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    animation: ${shimmer} 3s infinite;
  }
`;

const RelationshipItem = styled.div`
  padding: 16px;
  margin-bottom: 12px;
  background: ${props => props.isSelected
    ? 'linear-gradient(145deg, rgba(212, 175, 55, 0.15) 0%, rgba(244, 208, 63, 0.08) 100%)'
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.2) 0%, rgba(20, 20, 20, 0.4) 100%)'};
  border: 2px solid ${props => props.isSelected ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.1)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
  display: flex;
  align-items: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.08) 0%, rgba(244, 208, 63, 0.04) 100%);
    border-color: rgba(212, 175, 55, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(212, 175, 55, 0.1);
    
    &::before {
      left: 100%;
    }
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CharacterInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
`;

const CharacterDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const CharacterName = styled.div`
  color: #f0f0f0;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const RelationType = styled.div`
  color: #aaa;
  font-size: 12px;
  opacity: 0.8;
`;

const RelationshipLevel = styled.div`
  color: ${props => props.level >= 75 ? '#4caf50' :
    props.level >= 50 ? '#d4af37' :
    props.level >= 25 ? '#ff9800' : '#f44336'};
  font-weight: bold;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid ${props => props.level >= 75 ? '#4caf50' :
    props.level >= 50 ? '#d4af37' :
    props.level >= 25 ? '#ff9800' : '#f44336'}33;
`;

const InteractionPanel = styled.div`
  flex: 1;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #d4af37, #f4d03f, #d4af37);
    border-radius: 16px;
    padding: 2px;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: -1;
  }
`;

const CharacterHeader = styled.div`
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 2px solid rgba(212, 175, 55, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 2px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    border-radius: 1px;
  }
`;

const CharacterHeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const CharacterTitle = styled.h2`
  font-size: 24px;
  margin: 0 0 8px;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
`;

const CharacterRole = styled.div`
  color: #aaa;
  font-size: 14px;
  margin-bottom: 12px;
  opacity: 0.9;
`;

const RelationshipStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-2px);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
    
    &::before {
      left: 100%;
    }
  }
`;

const StatLabel = styled.span`
  color: #aaa;
  font-size: 14px;
  font-weight: 500;
`;

const StatValue = styled.span`
  color: #f0f0f0;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const InteractionsList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const InteractionButton = styled.button`
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(145deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.15) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  color: #d4af37;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.3) 0%, rgba(244, 208, 63, 0.2) 100%);
    border-color: rgba(212, 175, 55, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(212, 175, 55, 0.2);
    animation: ${pulse} 2s infinite;
    
    &::before {
      left: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
  }
  
  &:disabled {
    background: linear-gradient(145deg, rgba(60, 60, 60, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
    border-color: rgba(100, 100, 100, 0.3);
    color: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    animation: none;
  }
`;

const EventLog = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid rgba(212, 175, 55, 0.2);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: 0;
    width: 60px;
    height: 2px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    border-radius: 1px;
  }
`;

const EventTitle = styled.h3`
  font-size: 18px;
  margin: 0 0 16px;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
`;

const EventList = styled.div`
  color: #f0f0f0;
  font-size: 14px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
  
  /* Стилизация скроллбара */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    border-radius: 3px;
    transition: all 0.3s ease;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #f4d03f, #d4af37);
  }
  
  > div {
    margin-bottom: 12px;
    padding: 12px 16px;
    background: linear-gradient(145deg, rgba(0, 0, 0, 0.2) 0%, rgba(20, 20, 20, 0.4) 100%);
    border: 1px solid rgba(212, 175, 55, 0.1);
    border-radius: 8px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.05), transparent);
      transition: left 0.5s ease;
    }
    
    &:hover {
      border-color: rgba(212, 175, 55, 0.2);
      transform: translateX(4px);
      
      &::before {
        left: 100%;
      }
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

// Примерные данные для отношений, если они отсутствуют в состоянии
const defaultRelationships = [
  { id: 'master_li', name: 'Мастер Ли', role: 'Наставник', level: 80, events: [], image: '/assets/images/npc/master_li.png' },
  { id: 'merchant_chen', name: 'Торговец Чен', role: 'Торговец', level: 40, events: [], image: '/assets/images/npc/merchant_chen.png' },
  { id: 'lady_yun', name: 'Госпожа Юнь', role: 'Торговец', level: 40, events: [], image: '/assets/images/npc/lady_yun.png' },
  { id: 'elder_zhang', name: 'Старейшина Чжан', role: 'Торговец', level: 60, events: [], image: '/assets/images/npc/elder_zhang.png' },
  { id: 'merchant_zhao', name: 'Торговец Чжао', role: 'Торговец', level: 30, events: [], image: '/assets/images/npc/merchant_zhao.png' },
  { id: 'village_chief_wang', name: 'Староста деревни Ванг', role: 'Лидер общины', level: 50, events: [], image: '/assets/images/npc/village_chief_wang.png' },
  { id: 'hermit_feng', name: 'Загадочный отшельник Фэн', role: 'Отшельник', level: 20, events: [], image: '/assets/images/npc/hermit_feng.png' }
];

function SocialTab() {
  const { state, actions } = useGame();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  
  // Получаем данные об отношениях с проверкой на существование
  console.log('[SocialTab] Текущее состояние игрока:', state?.player);
  console.log('[SocialTab] social.relationships:', state?.player?.social?.relationships);
  console.log('[SocialTab] player.relationships:', state?.player?.relationships);
  
  // Сначала проверяем social.relationships (новый формат)
  let relationships = state?.player?.social?.relationships;
  
  // Если social.relationships отсутствует или пуст, пробуем использовать старый формат player.relationships
  if (!relationships || (Array.isArray(relationships) && relationships.length === 0)) {
    relationships = state?.player?.relationships;
    console.log('[SocialTab] Используем отношения из player.relationships:', relationships);
  }
  
  // Если всё ещё нет данных, используем defaultRelationships
  if (!relationships) {
    relationships = defaultRelationships;
    console.log('[SocialTab] Используем defaultRelationships');
  }
  
  // Убедимся, что relationships - это массив
  if (!Array.isArray(relationships)) {
    // Если это объект, преобразуем его в массив
    relationships = typeof relationships === 'object' && relationships !== null
      ? Object.values(relationships)
      : defaultRelationships;
    
    console.log('[SocialTab] Relationships преобразованы из объекта в массив:', relationships);
  }
  
  console.log('[SocialTab] Финальный массив relationships:', relationships);
  
  const cultivation = state?.player?.cultivation || {};
  
  const relationshipCategories = {
    friends: {
      title: 'Друзья',
      characters: Array.isArray(relationships) ? relationships.filter(r => r && typeof r === 'object' && typeof r.level === 'number' && r.level >= 75) : []
    },
    allies: {
      title: 'Союзники',
      characters: Array.isArray(relationships) ? relationships.filter(r => r && typeof r === 'object' && typeof r.level === 'number' && r.level >= 50 && r.level < 75) : []
    },
    neutral: {
      title: 'Нейтральные',
      characters: Array.isArray(relationships) ? relationships.filter(r => r && typeof r === 'object' && typeof r.level === 'number' && r.level >= 25 && r.level < 50) : []
    },
    enemies: {
      title: 'Враги',
      characters: Array.isArray(relationships) ? relationships.filter(r => r && typeof r === 'object' && typeof r.level === 'number' && r.level < 25) : []
    }
  };
  
  // Эффект для синхронизации selectedCharacter с обновленными данными из Redux
  useEffect(() => {
    if (selectedCharacter && Array.isArray(relationships)) {
      const updatedCharacter = relationships.find(rel => rel.id === selectedCharacter.id);
      if (updatedCharacter && updatedCharacter !== selectedCharacter) {
        console.log('[SocialTab] Синхронизация selectedCharacter с Redux:', updatedCharacter);
        setSelectedCharacter(updatedCharacter);
      }
    }
  }, [relationships, selectedCharacter]);

  const handleCharacterClick = (character) => {
    console.log('[SocialTab] Выбран персонаж:', character);
    setSelectedCharacter(character);
  };
  
  const handleInteraction = async (type) => {
    if (!selectedCharacter) return;

    try {
      console.log('[SocialTab] Начинаем взаимодействие с NPC:', selectedCharacter.id, 'тип:', type);
      
      // Вызываем серверный метод, который сам проверит энергию и выполнит все операции
      const result = await CharacterProfileServiceAPI.handleInteraction(selectedCharacter.id, type);
      console.log('[SocialTab] Получен результат взаимодействия:', result);

      if (result.success) {
        // ВАЖНО: Обновляем ВСЕ relationships сразу, чтобы избежать race condition с middleware
        if (result.allRelationships && actions.updateSocialRelationships) {
          console.log('[SocialTab] Обновляем все relationships с новыми событиями:', result.allRelationships);
          actions.updateSocialRelationships(result.allRelationships);
          
          // Находим обновленного персонажа в новом массиве для синхронизации локального состояния
          const updatedCharacterFromArray = result.allRelationships.find(rel => rel.id === selectedCharacter.id);
          if (updatedCharacterFromArray) {
            console.log('[SocialTab] Синхронизируем локальное состояние с Redux:', updatedCharacterFromArray);
            setSelectedCharacter(updatedCharacterFromArray);
          } else {
            console.warn('[SocialTab] Не удалось найти обновленного персонажа в массиве relationships');
            // Fallback: используем данные из result.updatedRelationship
            setSelectedCharacter(result.updatedRelationship);
          }
        } else {
          console.warn('[SocialTab] Отсутствуют allRelationships или updateSocialRelationships action');
          // Обновляем локальное состояние для перерисовки
          setSelectedCharacter(result.updatedRelationship);
        }

        // Обновляем данные культивации через API и Redux (как в SectTab)
        try {
          // Получаем обновленные данные культивации
          const updatedCultivation = await CultivationServiceAPI.getCultivationProgress(state?.player?.id || 1);
          
          // Обновляем данные культивации в Redux
          if (actions.updateCultivation) {
            actions.updateCultivation(updatedCultivation);
            console.log('Данные о культивации обновлены после взаимодействия с NPC:', updatedCultivation);
          } else {
            console.warn('Метод actions.updateCultivation недоступен');
          }
        } catch (cultivationError) {
          console.error('Ошибка при обновлении данных о культивации:', cultivationError);
          // Если не удалось получить обновленные данные, используем данные из ответа сервера
          actions.updateCultivation({
            energy: result.newEnergy
          });
        }

        // Показываем уведомление об успехе
        actions.addNotification({
          message: result.message,
          type: 'success'
        });
      } else {
        // Показываем ошибку от сервера
        actions.addNotification({
          message: result.message || 'Произошла ошибка при взаимодействии',
          type: 'error'
        });
      }
    } catch (error) {
      // Обрабатываем ошибки сети
      actions.addNotification({
        message: 'Ошибка сети при взаимодействии с персонажем',
        type: 'error'
      });
      console.error('Ошибка при взаимодействии:', error);
    }
  };
  
  return (
    <Container>
      <RelationshipsList>
        {Object.entries(relationshipCategories).map(([key, category]) => (
          category.characters.length > 0 && (
            <RelationshipCategory key={key}>
              <CategoryTitle>{category.title}</CategoryTitle>
              {category.characters.map(character => (
                <RelationshipItem
                  key={character.id}
                  isSelected={selectedCharacter && selectedCharacter.id === character.id}
                  onClick={() => handleCharacterClick(character)}
                >
                  <CharacterAvatar>
                    {character.image ? (
                      <img src={character.image} alt={character.name} />
                    ) : (
                      '👤'
                    )}
                  </CharacterAvatar>
                  <CharacterInfo>
                    <CharacterDetails>
                      <CharacterName>{character.name}</CharacterName>
                      <RelationType>{character.role}</RelationType>
                    </CharacterDetails>
                    <RelationshipLevel level={character.level}>
                      {character.level}
                    </RelationshipLevel>
                  </CharacterInfo>
                </RelationshipItem>
              ))}
            </RelationshipCategory>
          )
        ))}
      </RelationshipsList>
      
      <InteractionPanel>
        {selectedCharacter ? (
          <>
            <CharacterHeader>
              <PlayerAvatar>
                {selectedCharacter.image ? (
                  <img src={selectedCharacter.image} alt={selectedCharacter.name} />
                ) : (
                  '👤'
                )}
              </PlayerAvatar>
              <CharacterHeaderInfo>
                <CharacterTitle>{selectedCharacter.name}</CharacterTitle>
                <CharacterRole>{selectedCharacter.role}</CharacterRole>
              </CharacterHeaderInfo>
            </CharacterHeader>
            
            <RelationshipStats>
              <StatItem>
                <StatLabel>Отношение</StatLabel>
                <StatValue>{selectedCharacter.level}/100</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Статус</StatLabel>
                <StatValue>
                  {selectedCharacter.level >= 75 ? 'Друг' :
                   selectedCharacter.level >= 50 ? 'Союзник' :
                   selectedCharacter.level >= 25 ? 'Нейтральный' : 'Враг'}
                </StatValue>
              </StatItem>
            </RelationshipStats>
            
            <InteractionsList>
              <InteractionButton
                onClick={() => handleInteraction('chat')}
                disabled={(cultivation.energy || 0) < 5}
              >
                Беседа (5 энергии)
              </InteractionButton>
              <InteractionButton
                onClick={() => handleInteraction('gift')}
                disabled={(cultivation.energy || 0) < 10}
              >
                Подарок (10 энергии)
              </InteractionButton>
              <InteractionButton
                onClick={() => handleInteraction('train')}
                disabled={(cultivation.energy || 0) < 20}
              >
                Тренировка (20 энергии)
              </InteractionButton>
              <InteractionButton
                onClick={() => handleInteraction('quest')}
                disabled={(cultivation.energy || 0) < 30}
              >
                Задание (30 энергии)
              </InteractionButton>
            </InteractionsList>
            
            <EventLog>
              <EventTitle>История взаимодействий</EventTitle>
              <EventList>
                {selectedCharacter.events && selectedCharacter.events.map((event, index) => (
                  <div key={index}>{event}</div>
                ))}
                {(!selectedCharacter.events || selectedCharacter.events.length === 0) && (
                  <div>У вас пока нет истории взаимодействий с этим персонажем</div>
                )}
              </EventList>
            </EventLog>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#aaa' }}>
            Выберите персонажа для взаимодействия
          </div>
        )}
      </InteractionPanel>
    </Container>
  );
}

export default SocialTab;
