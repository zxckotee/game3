import React, { useState, useEffect, useContext } from 'react';
import styled, { keyframes, css } from 'styled-components';

// Импортируем функции из обновленного API-клиента
import {
  fetchUserPets,
  fetchActivePet,
  fetchPetDetails,
  activatePet,
  feedPet,
  trainPet,
  checkPetsStatus,
  acquirePet,
  fetchPetCombatBonuses,
  fetchPetFood,
  fetchPetConstants,
  renamePet
} from '../../services/spirit-pet-service-api';

// Импортируем GameContext для получения userId
import { GameContext } from '../../context/GameContext';

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

// Styled Components
const SpiritPetsContainer = styled.div`
  padding: 24px;
  color: #f0f0f0;
  animation: ${fadeIn} 0.6s ease-out;
  min-height: 100vh;
`;

const TabHeader = styled.div`
  margin-bottom: 32px;
  text-align: center;
`;

const TabTitle = styled.h2`
  font-size: 28px;
  margin: 0 0 16px 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
`;

const TabDescription = styled.p`
  font-size: 16px;
  color: #aaa;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
`;

const ErrorMessage = styled.div`
  background: linear-gradient(145deg, rgba(231, 76, 60, 0.1) 0%, rgba(192, 57, 43, 0.1) 100%);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  color: #e74c3c;
  text-align: center;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #aaa;
  font-size: 18px;
`;

const PetsSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 24px;
  margin: 0 0 20px 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
`;

const PetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const NoItemsMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #777;
  font-style: italic;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
`;

// Styled Components для карточек питомцев
const PetCardContainer = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
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
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transform: rotate(45deg);
    animation: ${shimmer} 3s infinite;
    pointer-events: none;
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2);
    animation: ${pulse} 2s infinite;
  }
  
  ${props => props.isActive && css`
    border-color: rgba(212, 175, 55, 0.6);
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
    
    &::before {
      background: linear-gradient(45deg, #f4d03f, #d4af37, #f4d03f);
    }
  `}
`;

const PetCardHeader = styled.div`
  background: linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2));
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  position: relative;
`;

const PetName = styled.h3`
  margin: 0 0 8px 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
  font-weight: bold;
`;

const PetType = styled.div`
  color: #aaa;
  font-size: 14px;
`;

const ActiveBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  color: #000;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
`;

const PetStatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin: 16px 0;
`;

const PetStat = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(212, 175, 55, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
  }
`;

const StatName = styled.div`
  color: #aaa;
  font-size: 12px;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  color: #d4af37;
  font-size: 18px;
  font-weight: bold;
`;

const PetIndicators = styled.div`
  margin: 16px 0;
`;

const PetIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
`;

const IndicatorName = styled.span`
  color: #aaa;
  font-size: 14px;
  min-width: 80px;
`;

const IndicatorBarContainer = styled.div`
  flex: 1;
  height: 8px;
  background: rgba(40, 40, 40, 0.8);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const IndicatorBar = styled.div`
  height: 100%;
  background: ${props => {
    if (props.type === 'hunger') {
      return props.value < 30
        ? 'linear-gradient(45deg, #e74c3c, #c0392b)'
        : 'linear-gradient(45deg, #2ecc71, #27ae60)';
    }
    if (props.type === 'loyalty') {
      return props.value < 50
        ? 'linear-gradient(45deg, #e74c3c, #c0392b)'
        : 'linear-gradient(45deg, #2ecc71, #27ae60)';
    }
    return 'linear-gradient(45deg, #d4af37, #f4d03f)';
  }};
  width: ${props => props.value}%;
  transition: width 0.3s ease;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: ${shimmer} 2s infinite;
  }
`;

const IndicatorValue = styled.span`
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  min-width: 40px;
  text-align: right;
`;

const PetActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

const PetActionButton = styled.button`
  background: ${props => {
    switch(props.variant) {
      case 'activate':
        return 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2))';
      case 'feed':
        return 'linear-gradient(45deg, rgba(46, 204, 113, 0.2), rgba(39, 174, 96, 0.2))';
      case 'train':
        return 'linear-gradient(45deg, rgba(52, 152, 219, 0.2), rgba(41, 128, 185, 0.2))';
      case 'details':
        return 'linear-gradient(45deg, rgba(155, 89, 182, 0.2), rgba(142, 68, 173, 0.2))';
      default:
        return 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)';
    }
  }};
  color: ${props => {
    switch(props.variant) {
      case 'activate': return '#d4af37';
      case 'feed': return '#2ecc71';
      case 'train': return '#3498db';
      case 'details': return '#9b59b6';
      default: return '#aaa';
    }
  }};
  border: 1px solid ${props => {
    switch(props.variant) {
      case 'activate': return 'rgba(212, 175, 55, 0.4)';
      case 'feed': return 'rgba(46, 204, 113, 0.4)';
      case 'train': return 'rgba(52, 152, 219, 0.4)';
      case 'details': return 'rgba(155, 89, 182, 0.4)';
      default: return 'rgba(212, 175, 55, 0.2)';
    }
  }};
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  flex: 1;
  min-width: 80px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    
    &::before {
      left: 100%;
    }
  }
  
  &:disabled {
    background: rgba(60, 60, 60, 0.3);
    border-color: rgba(100, 100, 100, 0.3);
    color: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;


// Styled Components для модальных окон
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  
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

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
`;

const ModalTitle = styled.h3`
  margin: 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
  font-weight: bold;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: #aaa;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(212, 175, 55, 0.2);
    color: #d4af37;
  }
`;

const ModalBody = styled.div`
  color: #f0f0f0;
`;

const AcquirePetSection = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
`;

const AcquirePetNote = styled.p`
  color: #aaa;
  font-size: 14px;
  margin: 16px 0 0 0;
  line-height: 1.4;
`;

const NoPetsMessage = styled.div`
  text-align: center;
  padding: 40px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  
  p {
    color: #aaa;
    font-size: 18px;
    margin-bottom: 24px;
  }
`;

const PetsContainer = styled.div`
  margin-bottom: 32px;
`;

const PetCardBody = styled.div`
  padding: 0;
`;

const PetInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PetLevel = styled.div`
  color: #d4af37;
  font-weight: bold;
  font-size: 16px;
`;

const PetEvolution = styled.div`
  color: #aaa;
  font-size: 14px;
`;

const PetElement = styled.span`
  color: #bbb;
  margin-left: 8px;
`;

const ExpBarContainer = styled.div`
  position: relative;
  background: rgba(40, 40, 40, 0.8);
  border-radius: 8px;
  height: 12px;
  margin-bottom: 16px;
  overflow: hidden;
`;

const ExpBar = styled.div`
  height: 100%;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  width: ${props => props.width}%;
  transition: width 0.3s ease;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: ${shimmer} 2s infinite;
  }
`;

const ExpText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
`;

const StatItem = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 6px;
  padding: 8px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(212, 175, 55, 0.4);
    transform: translateY(-2px);
  }
`;

const IndicatorsContainer = styled.div`
  margin-bottom: 16px;
`;

const IndicatorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const LoyaltyWarning = styled.div`
  color: ${props => props.isLow ? '#e74c3c' : '#e67e22'};
  font-size: 12px;
  font-weight: bold;
  margin-top: 8px;
  text-align: center;
  padding: 6px;
  border: 1px solid ${props => props.isLow ? '#e74c3c' : '#e67e22'};
  border-radius: 4px;
  background: ${props => props.isLow ? 'rgba(231, 76, 60, 0.1)' : 'rgba(230, 126, 34, 0.1)'};
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const AcquirePetButton = styled.button`
  background: linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2));
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
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
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, rgba(212, 175, 55, 0.3), rgba(244, 208, 63, 0.3));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    
    &::before {
      left: 100%;
    }
  }
  
  &:disabled {
    background: rgba(60, 60, 60, 0.3);
    border-color: rgba(100, 100, 100, 0.3);
    color: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Компонент модального окна для кормления питомца
const PetFeedingModal = ({ pet, onClose, onSelect, petFood = [], loading = false }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Кормление питомца {pet.customName || pet.petType?.name || pet.pet?.name || pet.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>Выберите еду для питомца:</p>
          
          {loading ? (
            <p>Загрузка доступной еды...</p>
          ) : petFood.filter(food => food.quantity > 0).length > 0 ? (
            <div className="food-items-list">
              {petFood.filter(food => food.quantity > 0).map(food => (
                <div 
                  key={food.id} 
                  className="food-item"
                  onClick={() => !loading && onSelect(pet.id, food.id)}
                  style={{
                    padding: '10px',
                    margin: '5px 0',
                    border: '1px solid #444',
                    borderRadius: '5px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    background: 'rgba(30, 30, 30, 0.7)',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!loading) e.currentTarget.style.background = 'rgba(80, 80, 80, 0.7)';
                  }}
                  onMouseOut={(e) => {
                    if (!loading) e.currentTarget.style.background = 'rgba(30, 30, 30, 0.7)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold', color: (() => {
                      switch(food.rarity) {
                        case 'common': return '#aaa';
                        case 'uncommon': return '#1eff00';
                        case 'rare': return '#0070dd';
                        case 'epic': return '#a335ee';
                        case 'legendary': return '#ff8000';
                        default: return '#aaa';
                      }
                    })() }}>{food.name}</span>
                    <span>x{food.quantity || 1}</span>
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#aaa', marginTop: '3px' }}>{food.description}</div>
                  <div style={{ display: 'flex', marginTop: '5px' }}>
                    <div style={{ 
                      flex: 1, 
                      color: '#2ecc71', 
                      fontSize: '0.9em' 
                    }}>
                      Сытость: +{food.nutritionValue || 25}%
                    </div>
                    <div style={{ 
                      flex: 1, 
                      color: '#e67e22', 
                      fontSize: '0.9em' 
                    }}>
                      Лояльность: +{food.loyaltyBonus || 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-food-message" style={{ color: '#e74c3c' }}>
              У вас нет еды для питомцев. Вы можете купить её у Старого Чена на рынке.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент модального окна для тренировки питомца
const PetTrainingModal = ({ pet, onClose, onTrain, loading = false }) => {
  // Используем безопасный доступ к свойствам
  const petName = pet.customName || pet.petType?.name || pet.pet?.name || pet.name;
  const petHunger = pet.hunger || 0;
  const petStrength = pet.strength || 0;
  const petIntelligence = pet.intelligence || 0;
  const petAgility = pet.agility || 0;
  const petVitality = pet.vitality || 0;
  const petSpirit = pet.spirit || 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Тренировка питомца {petName}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p>Тренировка питомца...</p>
          ) : (
            <>
              <p>Выберите характеристику для тренировки:</p>
              <p className="training-info">Тренировка повысит выбранную характеристику на 1, но уменьшит сытость на 15%.</p>
              
              <div className="training-buttons">
                <button 
                  className="training-button" 
                  onClick={() => onTrain(pet.id, 'strength')}
                  disabled={petHunger < 30 || loading}
                >
                  Сила ({petStrength})
                </button>
                <button 
                  className="training-button" 
                  onClick={() => onTrain(pet.id, 'intelligence')}
                  disabled={petHunger < 30 || loading}
                >
                  Интеллект ({petIntelligence})
                </button>
                <button 
                  className="training-button" 
                  onClick={() => onTrain(pet.id, 'agility')}
                  disabled={petHunger < 30 || loading}
                >
                  Ловкость ({petAgility})
                </button>
                <button 
                  className="training-button" 
                  onClick={() => onTrain(pet.id, 'vitality')}
                  disabled={petHunger < 30 || loading}
                >
                  Живучесть ({petVitality})
                </button>
                <button 
                  className="training-button" 
                  onClick={() => onTrain(pet.id, 'spirit')}
                  disabled={petHunger < 30 || loading}
                >
                  Дух ({petSpirit})
                </button>
              </div>
              
              {petHunger < 30 && (
                <p className="training-warning">
                  Питомец слишком голоден для тренировки. Покормите его сначала!
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент модального окна для деталей питомца
const PetDetailsModal = ({ pet, onClose }) => {
  // Безопасный доступ к свойствам
  const petName = pet.customName || pet.petType?.name || pet.pet?.name || pet.name;
  const petType = pet.petType?.type || pet.pet?.type || pet.type;
  const petElement = pet.petType?.element || pet.pet?.element || pet.element;
  const petRarity = pet.petType?.rarity || pet.pet?.rarity || pet.rarity;
  const petEvolutionStage = pet.petType?.evolutionStage || pet.pet?.evolution_stage || pet.evolutionStage || 'baby';
  const petHunger = pet.hunger || 0;
  const petLoyalty = pet.loyalty || 0;
  
  // Функция для форматирования даты
  const formatDate = (date) => {
    if (!date) return 'Никогда';
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  // Получаем описания для типов
  const getTypeDescription = (type) => {
    const descriptions = {
      'beast': 'Духовный зверь с природными способностями и инстинктами. Отличается высокой живучестью и силой.',
      'mythical': 'Легендарное существо с уникальными мистическими способностями и высоким потенциалом роста.',
      'elemental': 'Духовная сущность, связанная с природными элементами. Обладает сильными элементальными атаками.',
      'spirit': 'Чистая духовная сущность, обладающая высоким интеллектом и способностями к манипуляции энергией.',
      'construct': 'Искусственно созданное духовное существо, обладающее уникальными способностями и высокой стабильностью.'
    };
    return descriptions[type] || 'Духовное существо с неизвестными свойствами и характеристиками.';
  };

  // Получаем названия для типов
  const getTypeName = (type) => {
    const typeNames = {
      'beast': 'Зверь',
      'mythical': 'Мифический',
      'elemental': 'Элементаль',
      'spirit': 'Дух',
      'construct': 'Конструкт'
    };
    return typeNames[type] || type;
  };
  
  const getElementName = (element) => {
    const elementNames = {
      'fire': 'Огонь',
      'water': 'Вода',
      'earth': 'Земля',
      'air': 'Воздух',
      'lightning': 'Молния',
      'ice': 'Лёд',
      'light': 'Свет',
      'dark': 'Тьма',
      'void': 'Пустота'
    };
    return elementNames[element] || element;
  };
  
  const getRarityName = (rarity) => {
    const rarityNames = {
      'common': 'Обычный',
      'uncommon': 'Необычный',
      'rare': 'Редкий',
      'epic': 'Эпический',
      'legendary': 'Легендарный'
    };
    return rarityNames[rarity] || rarity;
  };
  
  const getEvolutionStageName = (stage) => {
    const stageNames = {
      'baby': 'Детёныш',
      'juvenile': 'Юный',
      'adult': 'Взрослый',
      'elder': 'Старейшина',
      'ancient': 'Древний'
    };
    return stageNames[stage] || stage;
  };
  
  const getEvolutionStageDescription = (stage) => {
    const descriptions = {
      'baby': 'Молодой, неопытный питомец. Обладает базовыми способностями и высоким потенциалом роста.',
      'juvenile': 'Подросший питомец, начинающий развивать свои способности и характер.',
      'adult': 'Полностью сформировавшийся питомец с развитыми способностями и опытом.',
      'elder': 'Мудрый и опытный питомец, достигший вершины своего развития.',
      'ancient': 'Легендарный питомец, обладающий уникальными способностями и огромной мощью.'
    };
    return descriptions[stage] || 'Неизвестная стадия развития питомца.';
  };

  // Расчет примерных боевых бонусов от питомца
  const combatBonus = {
    attack: Math.floor(pet.strength * 0.5 * (petLoyalty / 100)),
    defense: Math.floor(pet.vitality * 0.5 * (petLoyalty / 100)),
    speed: Math.floor(pet.agility * 0.5 * (petLoyalty / 100)),
    critChance: (pet.agility * 0.005 * (petLoyalty / 100)),
    healthBonus: Math.floor(pet.vitality * 5 * (petLoyalty / 100)),
    energyBonus: Math.floor(pet.spirit * 3 * (petLoyalty / 100))
  };

  // Получаем способности питомца (если доступны)
  const petAbilities = pet.abilities || pet.pet?.abilities || [];
  const petCombatAbilities = pet.combatAbilities || pet.pet?.combat_abilities || [];
  const allAbilities = [...petAbilities, ...petCombatAbilities];

  return (
    <div className="modal-overlay">
      <div className="modal-content pet-details-modal">
        <div className="modal-header">
          <h3>{petName} - {getTypeName(petType)}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="pet-details-section">
            <h4>Основная информация</h4>
            <p className="pet-description">{getTypeDescription(petType)}</p>
            <div className="pet-details-row">
              <div className="pet-detail">
                <span className="detail-label">Уровень:</span>
                <span className="detail-value">{pet.level}</span>
              </div>
              <div className="pet-detail">
                <span className="detail-label">Опыт:</span>
                <span className="detail-value">{pet.experience} / {pet.level * 100}</span>
              </div>
              <div className="pet-detail">
                <span className="detail-label">Стадия эволюции:</span>
                <span className="detail-value">{getEvolutionStageName(petEvolutionStage)}</span>
              </div>
              <div className="pet-detail">
                <span className="detail-label">Элемент:</span>
                <span className="detail-value">{getElementName(petElement)}</span>
              </div>
              <div className="pet-detail">
                <span className="detail-label">Редкость:</span>
                <span className="detail-value">{getRarityName(petRarity)}</span>
              </div>
            </div>
            <div className="pet-evolution-description">
              {getEvolutionStageDescription(petEvolutionStage)}
            </div>
          </div>
          
          <div className="pet-details-section">
            <h4>Характеристики</h4>
            <div className="pet-details-stats">
              <div className="pet-detail-stat">
                <span className="detail-stat-name">Сила:</span>
                <span className="detail-stat-value">{pet.strength}</span>
              </div>
              <div className="pet-detail-stat">
                <span className="detail-stat-name">Интеллект:</span>
                <span className="detail-stat-value">{pet.intelligence}</span>
              </div>
              <div className="pet-detail-stat">
                <span className="detail-stat-name">Ловкость:</span>
                <span className="detail-stat-value">{pet.agility}</span>
              </div>
              <div className="pet-detail-stat">
                <span className="detail-stat-name">Живучесть:</span>
                <span className="detail-stat-value">{pet.vitality}</span>
              </div>
              <div className="pet-detail-stat">
                <span className="detail-stat-name">Дух:</span>
                <span className="detail-stat-value">{pet.spirit}</span>
              </div>
            </div>
          </div>
          
          <div className="pet-details-section">
            <h4>Боевые бонусы</h4>
            <div className="pet-details-combat">
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Атака:</span>
                <span className="combat-bonus-value">+{combatBonus.attack}</span>
              </div>
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Защита:</span>
                <span className="combat-bonus-value">+{combatBonus.defense}</span>
              </div>
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Скорость:</span>
                <span className="combat-bonus-value">+{combatBonus.speed}</span>
              </div>
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Шанс крит.удара:</span>
                <span className="combat-bonus-value">+{(combatBonus.critChance * 100).toFixed(1)}%</span>
              </div>
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Бонус здоровья:</span>
                <span className="combat-bonus-value">+{combatBonus.healthBonus}</span>
              </div>
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Бонус энергии:</span>
                <span className="combat-bonus-value">+{combatBonus.energyBonus}</span>
              </div>
            </div>
          </div>
          
          <div className="pet-details-section">
            <h4>Способности</h4>
            <div className="pet-abilities-list">
              {allAbilities.map(ability => (
                <div key={ability.id} className="pet-ability">
                  <div className="ability-header">
                    <span className="ability-name">{ability.name}</span>
                    <span className="ability-type">
                      {ability.type === 'attack' ? 'Атака' : 
                       ability.damage_type ? `Атака (${getElementName(ability.damage_type)})` :
                       ability.type === 'buff' ? 'Усиление' : 'Эффект'}
                    </span>
                  </div>
                  <div className="ability-description">{ability.description}</div>
                  {ability.cooldown && (
                    <div className="ability-energy-cost">Перезарядка: {ability.cooldown} ходов</div>
                  )}
                  {ability.energy_cost && (
                    <div className="ability-energy-cost">Энергия: {ability.energy_cost}</div>
                  )}
                  {ability.damage_multiplier && (
                    <div className="ability-damage">Множитель урона: x{ability.damage_multiplier.toFixed(1)}</div>
                  )}
                </div>
              ))}
            </div>
            {allAbilities.length === 0 && (
              <p className="no-abilities">У питомца пока нет способностей</p>
            )}
          </div>
          
          <div className="pet-details-section">
            <h4>Информация об уходе</h4>
            <div className="pet-details-care">
              <div className="pet-care-info">
                <span className="care-info-name">Сытость:</span>
                <div className="care-info-bar-container">
                  <div 
                    className="care-info-bar" 
                    style={{ 
                      width: `${petHunger}%`, 
                      backgroundColor: petHunger < 30 ? '#e74c3c' : '#2ecc71' 
                    }}
                  ></div>
                </div>
                <span className="care-info-value">{petHunger}%</span>
              </div>
              <div className="pet-care-info">
                <span className="care-info-name">Лояльность:</span>
                <div className="care-info-bar-container">
                  <div 
                    className="care-info-bar" 
                    style={{ 
                      width: `${petLoyalty}%`, 
                      backgroundColor: petLoyalty < 50 ? '#e74c3c' : '#2ecc71' 
                    }}
                  ></div>
                </div>
                <span className="care-info-value">{petLoyalty}%</span>
                {petLoyalty <= 25 && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    marginTop: '5px',
                    textAlign: 'center',
                    padding: '5px',
                    border: '1px solid #e74c3c',
                    borderRadius: '4px',
                    background: 'rgba(231, 76, 60, 0.1)'
                  }}>
                    ⚠️ Внимание! При низкой лояльности питомец может сбежать во время боя!
                  </div>
                )}
              </div>
              <div className="pet-loyalty-mechanics" style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'rgba(50, 50, 50, 0.5)',
                borderRadius: '5px',
                fontSize: '0.9em'
              }}>
                <h5 style={{ margin: '0 0 5px 0', fontSize: '1em' }}>Механика лояльности:</h5>
                <p>Питомцы с низкой лояльностью дают меньше бонусов и могут сбежать во время боя.</p>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  <li>Кормление повышает лояльность на 5% (если питомец был очень голоден)</li>
                  <li>Тренировка повышает лояльность на 3%</li>
                  <li>Победа в бою повышает лояльность на 5%</li>
                  <li>Лояльность снижается, если питомец голоден (ниже 20% сытости)</li>
                  <li>Питомец может сбежать из боя, если лояльность ниже 30%</li>
                </ul>
              </div>
              <div className="pet-dates">
                <div>Последнее кормление: {formatDate(pet.lastFed || pet.last_fed)}</div>
                <div>Последняя тренировка: {formatDate(pet.lastTrained || pet.last_trained)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Главный компонент вкладки питомцев
const SpiritPetsTab = () => {
  // Используем GameContext для получения userId
  const { state } = useContext(GameContext);
  const userId = state?.player?.id;
  const effectiveUserId = userId || parseInt(localStorage.getItem('userId') || '1'); // Используем 1 как значение по умолчанию
  
  // Состояния для хранения данных и UI
  const [pets, setPets] = useState([]);
  const [petFood, setPetFood] = useState([]);
  const [petConstants, setPetConstants] = useState(null);
  const [activePetId, setActivePetId] = useState(null);
  
  // Состояния для отслеживания загрузки и ошибок
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState({
    activate: false,
    feed: false,
    train: false,
    acquire: false
  });
  const [error, setError] = useState(null);
  
  // Состояния для модальных окон
  const [selectedPet, setSelectedPet] = useState(null);
  const [feedingModalOpen, setFeedingModalOpen] = useState(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  // Загружаем данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Загружаем всех питомцев пользователя
        const userPets = await fetchUserPets(effectiveUserId);
        
        if (userPets.error) {
          throw new Error(userPets.error);
        }
        
        setPets(userPets);
        
        // Находим активного питомца
        const activePet = userPets.find(pet => pet.isActive || pet.is_active);
        if (activePet) {
          setActivePetId(activePet.id);
        } else {
          // Если нет активного питомца, пробуем получить его отдельным запросом
          const activeResult = await fetchActivePet(effectiveUserId);
          if (activeResult && !activeResult.error) {
            setActivePetId(activeResult.id);
          }
        }
        
        // Загружаем доступные корма для питомцев с учетом инвентаря пользователя
        const foodData = await fetchPetFood(effectiveUserId);
        if (!foodData.error) {
          setPetFood(foodData);
        } else {
          console.warn('Не удалось загрузить корм для питомцев:', foodData?.error);
        }
        
        // Загружаем константы для питомцев
        const constants = await fetchPetConstants();
        if (!constants.error) {
          setPetConstants(constants);
        } else {
          console.warn('Не удалось загрузить константы для питомцев:', constants?.error);
        }
        
        // Проверяем и обновляем состояние питомцев
        await checkPetsStatus(effectiveUserId);
      } catch (err) {
        console.error('Ошибка при загрузке данных питомцев:', err);
        setError(err.message || 'Не удалось загрузить данные питомцев');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Устанавливаем интервал для проверки состояния питомцев
    const intervalId = setInterval(async () => {
      try {
        const updatedPets = await checkPetsStatus(effectiveUserId);
        
        if (updatedPets && updatedPets.length > 0 && !updatedPets.error) {
          setPets(prevPets => {
            return prevPets.map(pet => {
              const updatedPet = updatedPets.find(p => p.id === pet.id);
              return updatedPet ? { ...pet, ...updatedPet } : pet;
            });
          });
        }
      } catch (err) {
        console.error('Ошибка при проверке состояния питомцев:', err);
        // Не показываем пользователю ошибку при фоновой проверке состояния
      }
    }, 60000); // Проверяем каждую минуту
    
    return () => clearInterval(intervalId);
  }, [effectiveUserId]);
  
  // Обработчик активации питомца
  const handleActivatePet = async (petId) => {
    try {
      setOperationLoading(prev => ({ ...prev, activate: true }));
      setError(null);
      
      const result = await activatePet(petId, effectiveUserId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Обновляем активного питомца
      setActivePetId(petId);
      
      // Обновляем список питомцев
      setPets(prevPets => {
        return prevPets.map(pet => ({
          ...pet,
          isActive: pet.id === petId,
          is_active: pet.id === petId
        }));
      });
    } catch (err) {
      console.error('Ошибка при активации питомца:', err);
      setError(err.message || 'Не удалось активировать питомца');
    } finally {
      setOperationLoading(prev => ({ ...prev, activate: false }));
    }
  };
  
  // Обработчик открытия модального окна кормления
  const handleOpenFeedingModal = (petId) => {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setFeedingModalOpen(true);
    }
  };
  
  // Обработчик кормления питомца
  const handleFeedPet = async (petId, foodItemId) => {
    try {
      setOperationLoading(prev => ({ ...prev, feed: true }));
      setError(null);
      
      // Проверяем, что корм выбран
      if (!foodItemId) {
        throw new Error('Выберите корм для питомца');
      }
      
      const result = await feedPet(petId, foodItemId, effectiveUserId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Обновляем питомца в списке
      setPets(prevPets => {
        return prevPets.map(pet => {
          if (pet.id === petId) {
            return { ...pet, ...result };
          }
          return pet;
        });
      });
      
      // Обновляем доступный корм (уменьшаем количество)
      setPetFood(prevFood => {
        return prevFood.map(food => {
          if (food.id === foodItemId && food.quantity > 0) {
            return { ...food, quantity: food.quantity - 1 };
          }
          return food;
        }).filter(food => food.quantity > 0); // Удаляем корм с нулевым количеством
      });
      
      // Закрываем модальное окно
      setFeedingModalOpen(false);
      setSelectedPet(null);
    } catch (err) {
      console.error('Ошибка при кормлении питомца:', err);
      setError(err.message || 'Не удалось покормить питомца');
    } finally {
      setOperationLoading(prev => ({ ...prev, feed: false }));
    }
  };
  
  // Обработчик открытия модального окна тренировки
  const handleOpenTraining = (petId) => {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setTrainingModalOpen(true);
    }
  };
  
  // Обработчик тренировки питомца
  const handleTrainPet = async (petId, stat) => {
    try {
      setOperationLoading(prev => ({ ...prev, train: true }));
      setError(null);
      
      // Проверяем, что характеристика выбрана
      if (!stat) {
        throw new Error('Выберите характеристику для тренировки');
      }
      
      // Проверяем, что питомец не слишком голоден
      const pet = pets.find(p => p.id === petId);
      if (pet && (pet.hunger < 30)) {
        throw new Error('Питомец слишком голоден для тренировки. Покормите его сначала!');
      }
      
      const result = await trainPet(petId, stat, effectiveUserId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Обновляем питомца в списке
      setPets(prevPets => {
        return prevPets.map(pet => {
          if (pet.id === petId) {
            return { ...pet, ...result };
          }
          return pet;
        });
      });
      
      // Закрываем модальное окно
      setTrainingModalOpen(false);
      setSelectedPet(null);
    } catch (err) {
      console.error('Ошибка при тренировке питомца:', err);
      setError(err.message || 'Не удалось тренировать питомца');
      
      // Если ошибка связана с голодом, показываем соответствующее сообщение
      if (err.message && err.message.includes('голоден')) {
        setError('Питомец слишком голоден для тренировки. Покормите его сначала!');
      }
    } finally {
      setOperationLoading(prev => ({ ...prev, train: false }));
    }
  };
  
  // Обработчик просмотра деталей питомца
  const handleViewDetails = (pet) => {
    setSelectedPet(pet);
    setDetailsModalOpen(true);
  };
  
  // Обработчик получения нового питомца
  const handleAcquirePet = async () => {
    try {
      setOperationLoading(prev => ({ ...prev, acquire: true }));
      setError(null);
      
      const result = await acquirePet(null, effectiveUserId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Добавляем нового питомца в список
      setPets(prevPets => [...prevPets, result]);
      
      // Если это первый питомец, делаем его активным
      if (pets.length === 0) {
        handleActivatePet(result.id);
      }
    } catch (err) {
      console.error('Ошибка при получении нового питомца:', err);
      setError(err.message || 'Не удалось приручить нового питомца');
    } finally {
      setOperationLoading(prev => ({ ...prev, acquire: false }));
    }
  };
  
  // Рендеринг компонента
  return (
    <SpiritPetsContainer>
      <TabHeader>
        <TabTitle>Духовные питомцы</TabTitle>
        <TabDescription>
          Духовные питомцы - это сущности, которые могут помочь вам в развитии и битвах.
          Заботьтесь о них, и они ответят вам верностью и поддержкой.
        </TabDescription>
      </TabHeader>
      
      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}
      
      {loading ? (
        <LoadingMessage>
          <p>Загрузка питомцев...</p>
        </LoadingMessage>
      ) : pets.length > 0 ? (
        <PetsContainer>
          <SectionTitle>Ваши питомцы</SectionTitle>
          <PetsGrid>
            {pets.map(pet => {
              // Получаем данные из питомца с учетом возможных различий в форматах данных
              const level = pet.level || 1;
              const experience = pet.experience || 0;
              const expForCurrentLevel = level * 100;
              const expPercentage = (experience / expForCurrentLevel) * 100;
              
              const petName = pet.customName || pet.petType?.name || pet.pet?.name || pet.name || 'Безымянный питомец';
              const petType = pet.petType?.type || pet.pet?.type || pet.type || 'unknown';
              const petElement = pet.petType?.element || pet.pet?.element || pet.element || 'unknown';
              const petEvolutionStage = pet.petType?.evolutionStage || pet.pet?.evolution_stage || pet.evolutionStage || 'baby';
              const petHunger = pet.hunger || 0;
              const petLoyalty = pet.loyalty || 0;
              const isActivePet = pet.isActive || pet.is_active || (pet.id === activePetId);

              const getPetTypeColor = (type) => {
                const typeColors = {
                  'fire': '#e74c3c',
                  'water': '#3498db',
                  'earth': '#8e44ad',
                  'wind': '#2ecc71',
                  'lightning': '#f1c40f',
                  'ice': '#3498db',
                  'light': '#f5f5f5',
                  'dark': '#34495e',
                  'void': '#2c3e50'
                };
                return typeColors[type] || '#bdc3c7';
              };

              const getTypeName = (type) => {
                const typeNames = {
                  'beast': 'Зверь',
                  'mythical': 'Мифический',
                  'elemental': 'Элементаль',
                  'spirit': 'Дух',
                  'construct': 'Конструкт'
                };
                return typeNames[type] || type;
              };
              
              const getElementName = (element) => {
                const elementNames = {
                  'fire': 'Огонь',
                  'water': 'Вода',
                  'earth': 'Земля',
                  'air': 'Воздух',
                  'lightning': 'Молния',
                  'ice': 'Лёд',
                  'light': 'Свет',
                  'dark': 'Тьма',
                  'void': 'Пустота'
                };
                return elementNames[element] || element;
              };
              
              const getEvolutionStageName = (stage) => {
                const stageNames = {
                  'baby': 'Детёныш',
                  'juvenile': 'Юный',
                  'adult': 'Взрослый',
                  'elder': 'Старейшина',
                  'ancient': 'Древний'
                };
                return stageNames[stage] || stage;
              };

              return (
                <PetCardContainer key={pet.id} isActive={isActivePet} elementColor={getPetTypeColor(petElement)}>
                  <PetCardHeader elementColor={getPetTypeColor(petElement)}>
                    <PetName>{petName}</PetName>
                    <PetType>
                      {getTypeName(petType)}
                      <PetElement>• {getElementName(petElement)}</PetElement>
                    </PetType>
                    {isActivePet && <ActiveBadge>Активный</ActiveBadge>}
                  </PetCardHeader>
                  
                  <PetCardBody>
                    <PetInfoRow>
                      <PetLevel>Уровень {level}</PetLevel>
                      <PetEvolution>Стадия: {getEvolutionStageName(petEvolutionStage)}</PetEvolution>
                    </PetInfoRow>
                    
                    <ExpBarContainer>
                      <ExpBar width={expPercentage} />
                      <ExpText>{experience} / {expForCurrentLevel} опыта</ExpText>
                    </ExpBarContainer>
                    
                    <StatsContainer>
                      <StatItem>
                        <StatName>Сила:</StatName>
                        <StatValue>{pet.strength || 0}</StatValue>
                      </StatItem>
                      <StatItem>
                        <StatName>Интеллект:</StatName>
                        <StatValue>{pet.intelligence || 0}</StatValue>
                      </StatItem>
                      <StatItem>
                        <StatName>Ловкость:</StatName>
                        <StatValue>{pet.agility || 0}</StatValue>
                      </StatItem>
                      <StatItem>
                        <StatName>Живучесть:</StatName>
                        <StatValue>{pet.vitality || 0}</StatValue>
                      </StatItem>
                      <StatItem>
                        <StatName>Дух:</StatName>
                        <StatValue>{pet.spirit || 0}</StatValue>
                      </StatItem>
                    </StatsContainer>
                    
                    <IndicatorsContainer>
                      <IndicatorItem>
                        <IndicatorName>Сытость:</IndicatorName>
                        <IndicatorBarContainer>
                          <IndicatorBar
                            value={petHunger}
                            type="hunger"
                          />
                        </IndicatorBarContainer>
                        <IndicatorValue>{petHunger}%</IndicatorValue>
                      </IndicatorItem>
                      <IndicatorItem>
                        <IndicatorName>Лояльность:</IndicatorName>
                        <IndicatorBarContainer>
                          <IndicatorBar
                            value={petLoyalty}
                            type="loyalty"
                          />
                        </IndicatorBarContainer>
                        <IndicatorValue>{petLoyalty}%</IndicatorValue>
                        {petLoyalty <= 50 && (
                          <LoyaltyWarning isLow={petLoyalty <= 25}>
                            {petLoyalty <= 25 ? '⚠️ Питомец может сбежать в бою!' : '⚠️ Лояльность снижается быстрее при использовании в бою!'}
                          </LoyaltyWarning>
                        )}
                      </IndicatorItem>
                    </IndicatorsContainer>
                    
                    <ButtonsContainer>
                      {!isActivePet && (
                        <PetActionButton
                          variant="activate"
                          onClick={() => handleActivatePet(pet.id)}
                          disabled={
                            operationLoading.activate ||
                            operationLoading.feed ||
                            operationLoading.train ||
                            operationLoading.acquire
                          }
                        >
                          Сделать активным
                        </PetActionButton>
                      )}
                      <PetActionButton
                        variant="feed"
                        onClick={() => handleOpenFeedingModal(pet.id)}
                        disabled={
                          operationLoading.activate ||
                          operationLoading.feed ||
                          operationLoading.train ||
                          operationLoading.acquire ||
                          petHunger >= 100
                        }
                      >
                        Покормить
                      </PetActionButton>
                      <PetActionButton
                        variant="train"
                        onClick={() => handleOpenTraining(pet.id)}
                        disabled={
                          operationLoading.activate ||
                          operationLoading.feed ||
                          operationLoading.train ||
                          operationLoading.acquire ||
                          petHunger < 30
                        }
                      >
                        Тренировать
                      </PetActionButton>
                      <PetActionButton
                        variant="details"
                        onClick={() => handleViewDetails(pet)}
                        disabled={
                          operationLoading.activate ||
                          operationLoading.feed ||
                          operationLoading.train ||
                          operationLoading.acquire
                        }
                      >
                        Подробности
                      </PetActionButton>
                    </ButtonsContainer>
                  </PetCardBody>
                </PetCardContainer>
              );
            })}
          </PetsGrid>
          
          <AcquirePetSection>
            <SectionTitle>Получить нового питомца</SectionTitle>
            <PetActionButton
              variant="acquire"
              onClick={handleAcquirePet}
              disabled={operationLoading.acquire}
            >
              {operationLoading.acquire ? 'Поиск питомца...' : 'Найти питомца'}
            </PetActionButton>
            <AcquirePetNote>
              Вы можете найти новых питомцев во время исследования подземелий или приобрести их у торговцев духовными созданиями.
            </AcquirePetNote>
          </AcquirePetSection>
        </PetsContainer>
      ) : (
        <NoPetsMessage>
          <p>У вас пока нет духовных питомцев.</p>
          <PetActionButton
            variant="acquire"
            onClick={handleAcquirePet}
            disabled={operationLoading.acquire}
          >
            {operationLoading.acquire ? 'Поиск питомца...' : 'Найти первого питомца'}
          </PetActionButton>
        </NoPetsMessage>
      )}
      
      {/* Модальные окна */}
      {feedingModalOpen && selectedPet && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Кормление питомца {selectedPet.customName || selectedPet.petType?.name || selectedPet.name}</ModalTitle>
              <ModalCloseButton onClick={() => {
                setFeedingModalOpen(false);
                setSelectedPet(null);
              }}>×</ModalCloseButton>
            </ModalHeader>
            <PetFeedingModal
              pet={selectedPet}
              onClose={() => {
                setFeedingModalOpen(false);
                setSelectedPet(null);
              }}
              onSelect={handleFeedPet}
              petFood={petFood}
              loading={operationLoading.feed}
            />
          </ModalContent>
        </ModalOverlay>
      )}
      
      {trainingModalOpen && selectedPet && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Тренировка питомца {selectedPet.customName || selectedPet.petType?.name || selectedPet.name}</ModalTitle>
              <ModalCloseButton onClick={() => {
                setTrainingModalOpen(false);
                setSelectedPet(null);
              }}>×</ModalCloseButton>
            </ModalHeader>
            <PetTrainingModal
              pet={selectedPet}
              onClose={() => {
                setTrainingModalOpen(false);
                setSelectedPet(null);
              }}
              onTrain={handleTrainPet}
              loading={operationLoading.train}
            />
          </ModalContent>
        </ModalOverlay>
      )}
      
      {detailsModalOpen && selectedPet && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Подробности о питомце {selectedPet.customName || selectedPet.petType?.name || selectedPet.name}</ModalTitle>
              <ModalCloseButton onClick={() => {
                setDetailsModalOpen(false);
                setSelectedPet(null);
              }}>×</ModalCloseButton>
            </ModalHeader>
            <PetDetailsModal
              pet={selectedPet}
              onClose={() => {
                setDetailsModalOpen(false);
                setSelectedPet(null);
              }}
            />
          </ModalContent>
        </ModalOverlay>
      )}
    </SpiritPetsContainer>
  );
};

export default SpiritPetsTab;
