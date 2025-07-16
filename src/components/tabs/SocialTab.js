import React, { useState } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import CharacterProfileServiceAPI from '../../services/character-profile-service-api';

const Container = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
`;

const RelationshipsList = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 10px;
  height: 100%;
  overflow-y: auto;
`;

const RelationshipCategory = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CategoryTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 10px;
  font-size: 1.1rem;
  padding: 5px 10px;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 4px;
`;

const RelationshipItem = styled.div`
  padding: 10px;
  margin-bottom: 5px;
  background: ${props => props.isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  border: 1px solid ${props => props.isSelected ? '#d4af37' : 'transparent'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.1);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CharacterInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CharacterName = styled.div`
  color: #f0f0f0;
  margin-bottom: 5px;
`;

const RelationType = styled.div`
  color: #aaa;
  font-size: 0.8rem;
`;

const RelationshipLevel = styled.div`
  color: ${props => props.level >= 75 ? '#4caf50' :
    props.level >= 50 ? '#d4af37' :
    props.level >= 25 ? '#ff9800' : '#f44336'};
`;

const InteractionPanel = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
`;

const CharacterHeader = styled.div`
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
`;

const CharacterTitle = styled.h2`
  color: #d4af37;
  margin: 0 0 5px;
`;

const CharacterRole = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 10px;
`;

const RelationshipStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
`;

const StatLabel = styled.span`
  color: #aaa;
`;

const StatValue = styled.span`
  color: #f0f0f0;
`;

const InteractionsList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const InteractionButton = styled.button`
  width: 100%;
  padding: 10px;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #d4af37;
  font-size: 0.9rem;
  cursor: pointer;
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

const EventLog = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
`;

const EventTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 10px;
`;

const EventList = styled.div`
  color: #f0f0f0;
  font-size: 0.9rem;
  line-height: 1.4;
  
  > div {
    margin-bottom: 5px;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    &:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
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
  // Сначала проверяем social.relationships (новый формат)
  let relationships = state?.player?.social?.relationships;
  
  // Если social.relationships отсутствует или пуст, пробуем использовать старый формат player.relationships
  if (!relationships || (Array.isArray(relationships) && relationships.length === 0)) {
    relationships = state?.player?.relationships;
    console.log('Используем отношения из player.relationships:', relationships);
  }
  
  // Если всё ещё нет данных, используем defaultRelationships
  if (!relationships) {
    relationships = defaultRelationships;
    console.log('Используем defaultRelationships');
  }
  
  // Убедимся, что relationships - это массив
  if (!Array.isArray(relationships)) {
    // Если это объект, преобразуем его в массив
    relationships = typeof relationships === 'object' && relationships !== null 
      ? Object.values(relationships) 
      : defaultRelationships;
    
    console.log('Relationships преобразованы из объекта в массив:', relationships);
  }
  
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
  
  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
  };
  
  const handleInteraction = async (type) => {
    if (!selectedCharacter) return;

    const energyCost = {
      chat: 5,
      gift: 10,
      train: 20,
      quest: 30
    }[type];

    if ((cultivation.energy || 0) < energyCost) {
      actions.addNotification({
        message: 'Недостаточно духовной энергии для взаимодействия',
        type: 'error'
      });
      return;
    }

    // Оптимистично тратим энергию на клиенте
    actions.updateCultivation({
      energy: (cultivation.energy || 0) - energyCost
    });

    try {
      const result = await CharacterProfileServiceAPI.handleInteraction(selectedCharacter.id, type);

      if (result.success) {
        // Обновляем состояние через новый, надежный action
        actions.updateRelationship(result.updatedRelationship);

        // Обновляем локальное состояние для перерисовки
        setSelectedCharacter(result.updatedRelationship);

        actions.addNotification({
          message: result.message,
          type: 'success'
        });
      } else {
        // Если сервер вернул ошибку, откатываем списание энергии
        actions.updateCultivation({
          energy: cultivation.energy // Возвращаем исходное значение
        });
        actions.addNotification({
          message: result.message || 'Произошла ошибка взаимодействия',
          type: 'error'
        });
      }
    } catch (error) {
      // В случае ошибки сети, также откатываем списание энергии
      actions.updateCultivation({
        energy: cultivation.energy // Возвращаем исходное значение
      });
      actions.addNotification({
        message: error.message || 'Ошибка сети при взаимодействии',
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
                  <CharacterInfo>
                    <div>
                      <CharacterName>{character.name}</CharacterName>
                      <RelationType>{character.role}</RelationType>
                    </div>
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
              <CharacterTitle>{selectedCharacter.name}</CharacterTitle>
              <CharacterRole>{selectedCharacter.role}</CharacterRole>
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
