import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import { debugEquipment } from '../../utils/equipmentDebug';
import { ensureItemHasCalculatedBonuses } from '../../utils/equipmentBonusHelper';
import EquipmentService from '../../services/equipment-service-adapter';

const Container = styled.div`
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 24px;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg,
    rgba(15, 15, 35, 0.95) 0%,
    rgba(25, 25, 45, 0.9) 50%,
    rgba(35, 35, 55, 0.85) 100%
  );
  animation: fadeIn 0.6s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const EquipmentDisplay = styled.div`
  background: linear-gradient(145deg,
    rgba(20, 25, 45, 0.95) 0%,
    rgba(30, 35, 55, 0.9) 50%,
    rgba(25, 30, 50, 0.95) 100%
  );
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-auto-rows: minmax(110px, auto);
  grid-gap: 16px;
  max-width: 100%;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(212, 175, 55, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
      transparent 30%,
      rgba(212, 175, 55, 0.05) 50%,
      transparent 70%
    );
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg,
      #d4af37,
      #f4d03f,
      #d4af37,
      #b7950b
    );
    border-radius: 16px;
    z-index: -1;
    animation: borderGlow 3s ease-in-out infinite alternate;
  }
  
  @keyframes borderGlow {
    0% {
      opacity: 0.6;
      filter: blur(0px);
    }
    100% {
      opacity: 0.8;
      filter: blur(1px);
    }
  }
`;

const EquipmentSlot = styled.div`
  background: linear-gradient(135deg,
    rgba(40, 45, 65, 0.8) 0%,
    rgba(30, 35, 55, 0.9) 50%,
    rgba(35, 40, 60, 0.8) 100%
  );
  border: 2px solid rgba(100, 100, 120, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 12px;
  cursor: pointer;
  height: 110px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    border-color: rgba(212, 175, 55, 0.6);
    box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(212, 175, 55, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    
    &::before {
      opacity: 1;
    }
  }
  
  &.head {
    grid-column: 1 / span 3;
    height: 90px;
  }
  
  &.body {
    grid-column: 2;
    grid-row: 2;
  }
  
  &.left {
    grid-column: 1;
    grid-row: 2;
  }
  
  &.right {
    grid-column: 3;
    grid-row: 2;
  }
  
  &.hands {
    grid-column: 1 / span 3;
    grid-row: 3;
    height: 90px;
  }
  
  &.legs {
    grid-column: 1 / span 3;
    grid-row: 4;
    height: 90px;
  }
  
  &.acc1 {
    grid-column: 1;
    grid-row: 5;
  }
  
  &.acc2 {
    grid-column: 3;
    grid-row: 5;
  }
  
  &.art1 {
    grid-column: 1;
    grid-row: 6;
  }
  
  &.art2 {
    grid-column: 3;
    grid-row: 6;
  }
  
  &.equipped {
    border-color: ${props => props.rarity === 'common' ? 'rgba(150, 150, 150, 0.8)' :
      props.rarity === 'uncommon' ? 'rgba(33, 150, 243, 0.8)' :
      props.rarity === 'rare' ? 'rgba(156, 39, 176, 0.8)' :
      props.rarity === 'epic' ? 'rgba(255, 152, 0, 0.8)' : 'rgba(212, 175, 55, 0.8)'};
    box-shadow:
      0 0 20px ${props => props.rarity === 'common' ? 'rgba(150, 150, 150, 0.3)' :
        props.rarity === 'uncommon' ? 'rgba(33, 150, 243, 0.3)' :
        props.rarity === 'rare' ? 'rgba(156, 39, 176, 0.3)' :
        props.rarity === 'epic' ? 'rgba(255, 152, 0, 0.3)' : 'rgba(212, 175, 55, 0.3)'},
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    background: linear-gradient(135deg,
      ${props => props.rarity === 'common' ? 'rgba(60, 65, 75, 0.9)' :
        props.rarity === 'uncommon' ? 'rgba(40, 60, 85, 0.9)' :
        props.rarity === 'rare' ? 'rgba(60, 40, 75, 0.9)' :
        props.rarity === 'epic' ? 'rgba(75, 55, 40, 0.9)' : 'rgba(75, 70, 45, 0.9)'} 0%,
      ${props => props.rarity === 'common' ? 'rgba(50, 55, 65, 0.9)' :
        props.rarity === 'uncommon' ? 'rgba(30, 50, 75, 0.9)' :
        props.rarity === 'rare' ? 'rgba(50, 30, 65, 0.9)' :
        props.rarity === 'epic' ? 'rgba(65, 45, 30, 0.9)' : 'rgba(65, 60, 35, 0.9)'} 100%
    );
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${props => props.rarity === 'common' ? 'linear-gradient(45deg, transparent 30%, rgba(150, 150, 150, 0.1) 50%, transparent 70%)' :
        props.rarity === 'uncommon' ? 'linear-gradient(45deg, transparent 30%, rgba(33, 150, 243, 0.1) 50%, transparent 70%)' :
        props.rarity === 'rare' ? 'linear-gradient(45deg, transparent 30%, rgba(156, 39, 176, 0.1) 50%, transparent 70%)' :
        props.rarity === 'epic' ? 'linear-gradient(45deg, transparent 30%, rgba(255, 152, 0, 0.1) 50%, transparent 70%)' : 'linear-gradient(45deg, transparent 30%, rgba(212, 175, 55, 0.1) 50%, transparent 70%)'};
      animation: shimmer 2s ease-in-out infinite;
    }
  }
  
  @keyframes shimmer {
    0%, 100% {
      opacity: 0.5;
      transform: translateX(-100%);
    }
    50% {
      opacity: 1;
      transform: translateX(100%);
    }
  }
`;

const SlotName = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ItemImage = styled.img`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

const ItemIconFallback = styled.div`
  width: 48px;
  height: 48px;
  background: ${props => props.type === 'weapon' ? 'linear-gradient(135deg, #f44336, #d32f2f)' :
    props.type === 'armor' ? 'linear-gradient(135deg, #2196f3, #1976d2)' :
    props.type === 'accessory' ? 'linear-gradient(135deg, #9c27b0, #7b1fa2)' :
    props.type === 'artifact' ? 'linear-gradient(135deg, #ff9800, #f57c00)' :
    props.type === 'material' ? 'linear-gradient(135deg, #4caf50, #388e3c)' :
    props.type === 'book' ? 'linear-gradient(135deg, #795548, #5d4037)' : 'linear-gradient(135deg, #666, #424242)'};
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  
  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 50%,
      rgba(0, 0, 0, 0.2) 100%
    );
    border-radius: 6px;
    pointer-events: none;
  }
  
  &:hover {
    transform: scale(1.05);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

// Компонент для отображения иконки предмета с fallback
const ItemIcon = ({ item, type }) => {
  const getTypeIcon = (itemType) => {
    switch(itemType) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'accessory': return '💍';
      case 'artifact': return '🔮';
      case 'material': return '🧱';
      case 'book': return '📚';
      default: return '❓';
    }
  };

  if (item && item.image_url) {
    return (
      <ItemImage
        src={item.image_url}
        alt={item.name || 'Предмет'}
        onError={(e) => {
          // Если изображение не загрузилось, показываем fallback
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }
  
  return (
    <ItemIconFallback type={type}>
      {getTypeIcon(type)}
    </ItemIconFallback>
  );
};

const ItemName = styled.div`
  color: ${props => props.rarity === 'common' ? '#ffffff' :
    props.rarity === 'uncommon' ? '#64b5f6' :
    props.rarity === 'rare' ? '#ba68c8' :
    props.rarity === 'epic' ? '#ffb74d' : '#ffd54f'};
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 8px;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.3px;
  
  ${props => props.rarity !== 'common' && `
    background: linear-gradient(45deg,
      ${props.rarity === 'uncommon' ? '#2196f3, #64b5f6' :
        props.rarity === 'rare' ? '#9c27b0, #ba68c8' :
        props.rarity === 'epic' ? '#ff9800, #ffb74d' : '#d4af37, #ffd54f'}
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  `}
`;

const StatsPanel = styled.div`
  background: linear-gradient(145deg,
    rgba(20, 25, 45, 0.95) 0%,
    rgba(30, 35, 55, 0.9) 50%,
    rgba(25, 30, 50, 0.95) 100%
  );
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(212, 175, 55, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
      transparent 30%,
      rgba(212, 175, 55, 0.05) 50%,
      transparent 70%
    );
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg,
      #d4af37,
      #f4d03f,
      #d4af37,
      #b7950b
    );
    border-radius: 16px;
    z-index: -1;
    animation: borderGlow 3s ease-in-out infinite alternate;
  }
`;

const UnequipButton = styled.button`
  padding: 10px 15px;
  background: rgba(180, 30, 30, 0.3);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(180, 30, 30, 0.5);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const DropButton = styled.button`
  padding: 10px 15px;
  background: rgba(180, 30, 30, 0.3);
  border: 1px solid #d4af37;
  border-radius: 4px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  width: 100%;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(180, 30, 30, 0.5);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const SectionTitle = styled.h3`
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 16px;
  padding-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background: linear-gradient(45deg, #d4af37, #f4d03f, #d4af37);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      #d4af37 20%,
      #f4d03f 50%,
      #d4af37 80%,
      transparent 100%
    );
    border-radius: 1px;
    box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
  }
  
  &::before {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 1px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 1px;
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  animation: slideInUp 0.6s ease-out;
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg,
    rgba(40, 45, 65, 0.6) 0%,
    rgba(50, 55, 75, 0.4) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-2px);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.2),
      0 0 20px rgba(212, 175, 55, 0.1);
    
    &::before {
      opacity: 1;
    }
  }
  
  span:first-child {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    font-size: 0.9rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
  
  span:last-child {
    color: ${props => props.value > 0 ? '#81c784' : props.value < 0 ? '#e57373' : '#ffffff'};
    font-weight: 600;
    font-size: 0.95rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    background: ${props => props.value > 0 ? 'linear-gradient(45deg, #4caf50, #81c784)' :
      props.value < 0 ? 'linear-gradient(45deg, #f44336, #e57373)' : 'linear-gradient(45deg, #ffffff, #f5f5f5)'};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const FilterButton = styled.button`
  padding: 8px 15px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #666;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.5);
  }
  
  &.active {
    background: rgba(212, 175, 55, 0.2);
    border-color: #d4af37;
    color: #d4af37;
  }
`;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #666;
  border-radius: 8px;
`;

const ItemSlot = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${props => props.rarity === 'common' ? '#666' :
    props.rarity === 'uncommon' ? '#2196f3' :
    props.rarity === 'rare' ? '#9c27b0' :
    props.rarity === 'epic' ? '#ff9800' : '#d4af37'};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 10px ${props => props.rarity === 'common' ? '#666' :
      props.rarity === 'uncommon' ? '#2196f3' :
      props.rarity === 'rare' ? '#9c27b0' :
      props.rarity === 'epic' ? '#ff9800' : '#d4af37'};
  }
  
  &.equipped {
    border-width: 2px;
    box-shadow: 0 0 5px ${props => props.rarity === 'common' ? '#666' :
      props.rarity === 'uncommon' ? '#2196f3' :
      props.rarity === 'rare' ? '#9c27b0' :
      props.rarity === 'epic' ? '#ff9800' : '#d4af37'};
  }
`;

// Вспомогательная функция для определения типа брони на основе armorType и названия
const determineArmorType = (item) => {
  if (!item) return null;
  
  // Сначала проверяем явно указанный тип
  const armorType = item.properties?.armorType || item.armorType;
  if (armorType) return armorType;
  
  // Если тип не указан, определяем по названию
  const itemName = item.name.toLowerCase();
  
  if (itemName.includes('шлем') || itemName.includes('шапка') || itemName.includes('капюшон')) {
    return 'head';
  }
  
  if (itemName.includes('сапог') || itemName.includes('ботин') || itemName.includes('обувь')) {
    return 'legs';
  }
  
  if (itemName.includes('перчат') || itemName.includes('рукав')) {
    return 'hands';
  }
  
  // По умолчанию считаем броней для тела
  return 'body';
};

// Функция для получения русского названия характеристики
const getStatDisplayName = (statKey) => {
  const statNames = {
    // Базовые характеристики
    strength: 'Сила',
    intellect: 'Интеллект',
    spirit: 'Дух',
    agility: 'Ловкость',
    health: 'Здоровье',
    luck: 'Удача',
    
    // Вторичные характеристики
    physicalDefense: 'Физическая защита',
    spiritualDefense: 'Магическая защита',
    spiritualAttack: 'Духовная атака',
    attackSpeed: 'Скорость атаки',
    criticalChance: 'Шанс крит. удара',
    movementSpeed: 'Скорость передвижения'
  };
  
  return statNames[statKey] || statKey;
};

// Функция для определения, нужно ли отображать значение как процент
const isPercentageStat = (statKey) => {
  const percentageStats = ['attackSpeed', 'criticalChance', 'movementSpeed'];
  return percentageStats.includes(statKey);
};

// Функция для форматирования значения характеристики
const formatStatValue = (statKey, value) => {
  if (isPercentageStat(statKey)) {
    return `${value}%`;
  }
  return value.toString();
};

function EquipmentTab() {
  const { state, actions } = useGame();
  const [equipped, setEquipped] = useState({
    weapon: null,
    headArmor: null,
    bodyArmor: null,
    legArmor: null,
    handArmor: null,
    accessory1: null,
    accessory2: null,
    artifact1: null,
    artifact2: null
  });
  const [filter, setFilter] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEquippedItem, setSelectedEquippedItem] = useState(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Загружаем экипированные предметы один раз при монтировании компонента
  const isMounted = React.useRef(false);
  
  useEffect(() => {
      // Загружаем экипировку только при первом монтировании компонента
      if (isMounted.current) {
        return;
      }
      isMounted.current = true;
      console.log('[EquipmentTab] Инициализация вкладки Экипировка');

      const userId = state.player?.id;

      const initLogic = async () => {
        if (userId && actions.loadInventoryData) {
          console.log('[EquipmentTab] Загрузка данных инвентаря...');
          await actions.loadInventoryData(userId);
        }
        
        // Загружаем характеристики персонажа
        if (userId && actions.loadCharacterStats) {
          console.log('[EquipmentTab] Загрузка характеристик персонажа...');
          await actions.loadCharacterStats(userId);
        }
        
        // Загружаем экипированные предметы уже из обновленного state
        const items = updateEquippedItems();
        
        // Явно применяем бонусы экипировки при первой загрузке компонента
        console.log('[EquipmentTab] Явное применение бонусов экипировки при первом монтировании');
        if (actions.applyEquipmentBonuses) { // Добавим проверку на существование action
            actions.applyEquipmentBonuses(items);
        }
        
        // Используем нашу отладочную утилиту для вывода информации
        setTimeout(() => {
          debugEquipment(state);
        }, 500); // Небольшая задержка, чтобы убедиться, что все бонусы успели применяться
      };

      initLogic();
  }, [state.player?.id, actions]); // Добавляем зависимости state.player?.id и actions
  
  // Логика обогащения предметов при первой загрузке удалена,
  // так как предметы теперь приходят с сервера уже обогащенными.
  
  // Обновляем отображение экипированных предметов при изменении инвентаря
  useEffect(() => {
    if (!isMounted.current) {
      return; // Пропускаем первую загрузку, она обрабатывается выше
    }
    
    // Обновляем отображение экипировки напрямую из состояния без обращения к API
    console.log('Обновление отображения экипированных предметов из state.player.inventory');
    updateEquippedItems();
    
  }, [state.player.inventory.items]);
  
  // Функция для обновления отображения экипированных предметов (без пересчета бонусов)
  // Возвращает объект с экипированными предметами
  const updateEquippedItems = () => {
    const equippedItems = {};
    
    // Получаем список экипированных предметов
    const equippedItemsList = state.player.inventory.items.filter(item => item.equipped);
    
    console.log('==== ОБНОВЛЕНИЕ ЭКИПИРОВАННЫХ ПРЕДМЕТОВ ====');
    console.log(`Найдено ${equippedItemsList.length} экипированных предметов`);
    
    // Находим экипированные предметы из инвентаря
    state.player.inventory.items.forEach(item => {
      if (item.equipped) {
        // Используем нашу утилиту для гарантии наличия предрассчитанных бонусов
        let itemWithBonuses = ensureItemHasCalculatedBonuses(item);
        if (itemWithBonuses.calculatedBonuses) {
          console.log(`✅ Предмет ${item.name} имеет предрассчитанные бонусы`);
        }
        
        switch(item.type) {
          case 'weapon':
            equippedItems.weapon = itemWithBonuses;
            console.log(`⚔️ Экипировано оружие: ${itemWithBonuses.name}`);
            break;
          case 'armor':
            // Получаем armorType из properties, если доступно
            const armorType = item.properties?.armorType || item.armorType;
            const itemName = item.name.toLowerCase();
            
            // Улучшенная логика определения типа брони
            if (armorType === 'head' || (!armorType && (itemName.includes('шлем') || itemName.includes('шапка') || itemName.includes('капюшон')))) {
              equippedItems.headArmor = itemWithBonuses;
              console.log(`🧢 Экипирована броня для головы: ${itemWithBonuses.name}`);
            }
            else if (armorType === 'legs' || (!armorType && (itemName.includes('сапог') || itemName.includes('ботин') || itemName.includes('обувь')))) {
              equippedItems.legArmor = itemWithBonuses;
              console.log(`👢 Экипирована броня для ног: ${itemWithBonuses.name}`);
            }
            else if (armorType === 'hands' || (!armorType && (itemName.includes('перчат') || itemName.includes('рукав')))) {
              equippedItems.handArmor = itemWithBonuses;
              console.log(`🧤 Экипирована броня для рук: ${itemWithBonuses.name}`);
            }
            else {
              // Если ничего не совпало, считаем бронёй для тела
              equippedItems.bodyArmor = itemWithBonuses;
              console.log(`🥋 Экипирована броня для тела: ${itemWithBonuses.name}`);
            }
            break;
          case 'accessory':
            if (!equippedItems.accessory1) {
              equippedItems.accessory1 = itemWithBonuses;
              console.log(`💍 Экипирован аксессуар 1: ${itemWithBonuses.name}`);
            } else if (!equippedItems.accessory2) {
              equippedItems.accessory2 = itemWithBonuses;
              console.log(`📿 Экипирован аксессуар 2: ${itemWithBonuses.name}`);
            }
            break;
          case 'artifact':
            if (!equippedItems.artifact1) {
              equippedItems.artifact1 = itemWithBonuses;
              console.log(`🔮 Экипирован артефакт 1: ${itemWithBonuses.name}`);
            } else if (!equippedItems.artifact2) {
              equippedItems.artifact2 = itemWithBonuses;
              console.log(`🧿 Экипирован артефакт 2: ${itemWithBonuses.name}`);
            }
            break;
        }
      }
    });
    
    setEquipped(equippedItems);
    
    // После обновления экипировки сразу же применяем бонусы
    console.log('Применение бонусов экипировки после обновления экипированных предметов');
    actions.applyEquipmentBonuses(equippedItems);
    
    return equippedItems;
  };
  
  const handleSlotClick = (slotType) => {
    // Работаем напрямую с данными из state без дополнительных API-запросов
    setSelectedSlot(slotType);
    
    // Сохраняем выбранный экипированный предмет, если он есть в слоте
    const itemInSlot = equipped[slotType];
    setSelectedEquippedItem(itemInSlot);
    
    // Автоматически меняем фильтр в зависимости от типа слота
    switch(slotType) {
      case 'weapon':
        setFilter('weapon');
        break;
      case 'headArmor':
      case 'bodyArmor':
      case 'legArmor':
      case 'handArmor':
        setFilter('armor');
        break;
      case 'accessory1':
      case 'accessory2':
        setFilter('accessory');
        break;
      case 'artifact1':
      case 'artifact2':
        setFilter('artifact');
        break;
      default:
        setFilter('all');
    }
  };
  
  // Функция для снятия экипировки
  const handleUnequipItem = async () => {
    if (!selectedEquippedItem || !selectedEquippedItem.item) { // Проверяем наличие item в selectedEquippedItem
      actions.addNotification({ message: 'Предмет для снятия не выбран или не содержит информации.', type: 'warning' });
      return;
    }

    const userId = state.player?.id;
    // Убедимся, что selectedEquippedItem.item существует перед доступом к id
    const itemId = selectedEquippedItem.item.id;

    if (!userId || !itemId) {
      actions.addNotification({ message: 'Ошибка: ID пользователя или предмета не найден для снятия.', type: 'error' });
      return;
    }

    try {
      console.log(`[EquipmentTab] Попытка снять предмет API: ${itemId} для пользователя ${userId}`);
      // Убедитесь, что EquipmentService.unequipItem определен и делает корректный API вызов.
      // Этот метод должен возвращать объект с полем success: true/false.
      const unequipResult = await EquipmentService.unequipItem(userId, itemId);

      if (unequipResult && unequipResult.success) {
        actions.addNotification({ message: `${selectedEquippedItem.item.name} успешно снят.`, type: 'success' });
        if (actions.loadInventoryData) {
          await actions.loadInventoryData(userId); // Перезагружаем инвентарь
        }
        // Перезагружаем характеристики персонажа
        if (actions.loadCharacterStats) {
          await actions.loadCharacterStats(userId);
        }
        // Сбрасываем состояния после успешной операции и обновления данных
        setSelectedEquippedItem(null);
        setSelectedSlot(null);
      } else {
        actions.addNotification({ message: `Не удалось снять ${selectedEquippedItem.item.name}. ${unequipResult?.message || 'Сервер не вернул причину.'}`, type: 'error' });
      }
    } catch (error) {
      console.error('[EquipmentTab] Ошибка при снятии предмета через API:', error);
      actions.addNotification({ message: `Ошибка снятия предмета: ${error.message}`, type: 'error' });
    }
  };
  
  // Функция для выбрасывания предмета
  const handleDropItem = () => {
    if (selectedInventoryItem) {
      console.log(`Выбрасывание предмета ${selectedInventoryItem.name}`);
      
      // Если предмет экипирован, сначала снимаем его
      if (selectedInventoryItem.equipped) {
        // Находим слот, в котором экипирован предмет
        for (const [slot, item] of Object.entries(equipped)) {
          if (item && item.id === selectedInventoryItem.id) {
            console.log(`Сначала снимаем экипировку ${selectedInventoryItem.name} из слота ${slot}`);
            actions.unequipItem(slot);
            break;
          }
        }
      }
      
      // Выбрасываем предмет - обратите внимание, что reducer ожидает объект с id в качестве payload
      const itemId = selectedInventoryItem.id || selectedInventoryItem.itemId;
      actions.removeItem({ id: itemId }); // Исправление: передаем объект с id вместо самого id
      
      // Обновляем отображение экипировки
      setTimeout(() => {
        updateEquippedItems();
        
        // Сбрасываем выбранный предмет
        setSelectedInventoryItem(null);
      }, 100);
    }
  };
  
  const handleItemClick = (item) => {
    // Сохраняем выбранный предмет инвентаря
    setSelectedInventoryItem(item);
    
    if (selectedSlot) {
      // Убедимся, что предмет имеет предрассчитанные бонусы
      item = ensureItemHasCalculatedBonuses(item);
      
      console.log(`Экипировка предмета ${item.name} (ID: ${item.id}) в слот ${selectedSlot}`);
      
      // Показываем индикатор загрузки
      actions.addNotification({
        message: 'Экипировка предмета...',
        type: 'info',
        duration: 1000
      });
      
      // Используем новый API-маршрут для проверки требований и экипировки предмета на сервере
      fetch('/api/equipment/equip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId: state.player.id,
          itemId: item.id // ID предмета в инвентаре
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Предмет успешно экипирован
          actions.addNotification({
            message: data.message || 'Предмет успешно экипирован',
            type: 'success'
          });
          
          // Обновляем инвентарь через loadInventoryData
          const userId = state.player?.id;
          if (userId && actions.loadInventoryData) {
            actions.loadInventoryData(userId);
          }
          // Перезагружаем характеристики персонажа
          if (userId && actions.loadCharacterStats) {
            actions.loadCharacterStats(userId);
          }
          // updateEquippedItems() будет вызван автоматически через useEffect после обновления глобального состояния
        } else {
          // Ошибка при экипировке
          actions.addNotification({
            message: data.message || 'Не удалось экипировать предмет',
            type: 'error'
          });
          
          // Показываем список невыполненных требований, если они есть
          if (data.failedRequirements && data.failedRequirements.length > 0) {
            actions.addNotification({
              message: `Не выполнены требования: ${data.failedRequirements.join(', ')}`,
              type: 'error'
            });
          }
        }
      })
      .catch(error => {
        console.error('Ошибка при экипировке предмета:', error);
        actions.addNotification({
          message: 'Произошла ошибка при экипировке предмета',
          type: 'error'
        });
      });
    }
  };
  
  // Рендеринг компонента
  return (
    <Container>
      <div>
        <EquipmentDisplay>
          <EquipmentSlot 
            className="head" 
            onClick={() => handleSlotClick('headArmor')}
            rarity={equipped.headArmor ? equipped.headArmor.rarity : 'common'}
          >
            <SlotName>Голова</SlotName>
            {equipped.headArmor ? (
              <>
                <ItemIcon item={equipped.headArmor} type="armor" />
                <ItemName rarity={equipped.headArmor.rarity}>{equipped.headArmor.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="left" 
            onClick={() => handleSlotClick('weapon')}
            rarity={equipped.weapon ? equipped.weapon.rarity : 'common'}
          >
            <SlotName>Оружие</SlotName>
            {equipped.weapon ? (
              <>
                <ItemIcon item={equipped.weapon} type="weapon" />
                <ItemName rarity={equipped.weapon.rarity}>{equipped.weapon.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="body" 
            onClick={() => handleSlotClick('bodyArmor')}
            rarity={equipped.bodyArmor ? equipped.bodyArmor.rarity : 'common'}
          >
            <SlotName>Тело</SlotName>
            {equipped.bodyArmor ? (
              <>
                <ItemIcon item={equipped.bodyArmor} type="armor" />
                <ItemName rarity={equipped.bodyArmor.rarity}>{equipped.bodyArmor.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="right" 
            onClick={() => handleSlotClick('shield')}
            rarity={'common'}
          >
            <SlotName>Щит</SlotName>
            <span>Не экипировано</span>
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="hands" 
            onClick={() => handleSlotClick('handArmor')}
            rarity={equipped.handArmor ? equipped.handArmor.rarity : 'common'}
          >
            <SlotName>Руки</SlotName>
            {equipped.handArmor ? (
              <>
                <ItemIcon item={equipped.handArmor} type="armor" />
                <ItemName rarity={equipped.handArmor.rarity}>{equipped.handArmor.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="legs" 
            onClick={() => handleSlotClick('legArmor')}
            rarity={equipped.legArmor ? equipped.legArmor.rarity : 'common'}
          >
            <SlotName>Ноги</SlotName>
            {equipped.legArmor ? (
              <>
                <ItemIcon item={equipped.legArmor} type="armor" />
                <ItemName rarity={equipped.legArmor.rarity}>{equipped.legArmor.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="acc1" 
            onClick={() => handleSlotClick('accessory1')}
            rarity={equipped.accessory1 ? equipped.accessory1.rarity : 'common'}
          >
            <SlotName>Аксессуар 1</SlotName>
            {equipped.accessory1 ? (
              <>
                <ItemIcon item={equipped.accessory1} type="accessory" />
                <ItemName rarity={equipped.accessory1.rarity}>{equipped.accessory1.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="acc2" 
            onClick={() => handleSlotClick('accessory2')}
            rarity={equipped.accessory2 ? equipped.accessory2.rarity : 'common'}
          >
            <SlotName>Аксессуар 2</SlotName>
            {equipped.accessory2 ? (
              <>
                <ItemIcon item={equipped.accessory2} type="accessory" />
                <ItemName rarity={equipped.accessory2.rarity}>{equipped.accessory2.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="art1" 
            onClick={() => handleSlotClick('artifact1')}
            rarity={equipped.artifact1 ? equipped.artifact1.rarity : 'common'}
          >
            <SlotName>Артефакт 1</SlotName>
            {equipped.artifact1 ? (
              <>
                <ItemIcon item={equipped.artifact1} type="artifact" />
                <ItemName rarity={equipped.artifact1.rarity}>{equipped.artifact1.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
          
          <EquipmentSlot 
            className="art2" 
            onClick={() => handleSlotClick('artifact2')}
            rarity={equipped.artifact2 ? equipped.artifact2.rarity : 'common'}
          >
            <SlotName>Артефакт 2</SlotName>
            {equipped.artifact2 ? (
              <>
                <ItemIcon item={equipped.artifact2} type="artifact" />
                <ItemName rarity={equipped.artifact2.rarity}>{equipped.artifact2.name}</ItemName>
              </>
            ) : (
              <span>Не экипировано</span>
            )}
          </EquipmentSlot>
        </EquipmentDisplay>
        
        {/* Секция инвентаря */}
        <div style={{ marginTop: '20px' }}>
          <SectionTitle>Инвентарь</SectionTitle>
          
          <FilterButtons>
            <FilterButton 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              Все
            </FilterButton>
            <FilterButton 
              className={filter === 'weapon' ? 'active' : ''} 
              onClick={() => setFilter('weapon')}
            >
              Оружие
            </FilterButton>
            <FilterButton 
              className={filter === 'armor' ? 'active' : ''} 
              onClick={() => setFilter('armor')}
            >
              Броня
            </FilterButton>
            <FilterButton 
              className={filter === 'accessory' ? 'active' : ''} 
              onClick={() => setFilter('accessory')}
            >
              Аксессуары
            </FilterButton>
            <FilterButton 
              className={filter === 'artifact' ? 'active' : ''} 
              onClick={() => setFilter('artifact')}
            >
              Артефакты
            </FilterButton>
          </FilterButtons>
          
          <InventoryGrid>
            {state.player.inventory.items
              .filter(item => {
                if (filter === 'all') return true;
                return item.type === filter;
              })
              .map((item, index) => (
                <ItemSlot 
                  key={`${item.id}-${index}`}
                  rarity={item.rarity || 'common'}
                  className={item.equipped ? 'equipped' : ''}
                  onClick={() => handleItemClick(item)}
                >
                  <ItemIcon type={item.type || 'material'} />
                  <ItemName rarity={item.rarity || 'common'}>{item.name}</ItemName>
                </ItemSlot>
              ))}
          </InventoryGrid>
        </div>
      </div>
      
      <StatsPanel>
        <SectionTitle>Характеристики персонажа</SectionTitle>
        
        {/* Панель управления выбранным предметом */}
        {selectedEquippedItem && (
          <div>
            <h4>Выбранный предмет: {selectedEquippedItem.name}</h4>
            <UnequipButton onClick={handleUnequipItem}>
              Снять предмет
            </UnequipButton>
            <div style={{ marginTop: '10px' }}>
              <DropButton onClick={handleDropItem}>
                Выбросить
              </DropButton>
            </div>
          </div>
        )}
        
        {/* Отображаем информацию о выбранном предмете из инвентаря */}
        {selectedInventoryItem && !selectedInventoryItem.equipped && (
          <div>
            <h4>Выбранный предмет: {selectedInventoryItem.name}</h4>
            <div style={{ marginTop: '10px' }}>
              <DropButton onClick={handleDropItem}>
                Выбросить
              </DropButton>
            </div>
          </div>
        )}
        
        {state.player.characterStats && state.player.characterStats.modified && (
          <>
            {/* Базовые характеристики (отображаем модифицированные значения) */}
            <div>
              <h4>Базовые характеристики</h4>
              <StatGrid>
                {['strength', 'intellect', 'spirit', 'agility', 'health', 'luck'].map(stat => {
                  const value = state.player.characterStats.modified[stat];
                  if (value !== undefined) {
                    return (
                      <StatItem key={stat} value={0}>
                        <span>{getStatDisplayName(stat)}</span>
                        <span>{formatStatValue(stat, value)}</span>
                      </StatItem>
                    );
                  }
                  return null;
                })}
              </StatGrid>
            </div>
            
            {/* Вторичные характеристики */}
            <div>
              <h4>Вторичные характеристики</h4>
              <StatGrid>
                {['physicalDefense', 'spiritualDefense', 'spiritualAttack', 'attackSpeed', 'criticalChance', 'movementSpeed'].map(stat => {
                  const value = state.player.characterStats.secondary?.[stat];
                  if (value !== undefined) {
                    return (
                      <StatItem key={stat} value={0}>
                        <span>{getStatDisplayName(stat)}</span>
                        <span>{formatStatValue(stat, value)}</span>
                      </StatItem>
                    );
                  }
                  return null;
                })}
              </StatGrid>
            </div>
          </>
        )}
        
        {/* Показываем сообщение, если характеристики не загружены */}
        {!state.player.characterStats && (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
            Загрузка характеристик...
          </div>
        )}
      </StatsPanel>
    </Container>
  );
}

export default EquipmentTab;
