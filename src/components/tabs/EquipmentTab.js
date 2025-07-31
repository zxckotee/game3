import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import { debugEquipment } from '../../utils/equipmentDebug';
import { ensureItemHasCalculatedBonuses } from '../../utils/equipmentBonusHelper';
import EquipmentService from '../../services/equipment-service-adapter';
import InventoryServiceAPI from '../../services/inventory-api';
import InventoryAuthManager from '../../utils/InventoryAuthManager';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 24px;
  padding: 20px;
  min-height: 100vh;
  animation: fadeIn 0.6s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
`;

const EquipmentDisplay = styled.div`
  background: linear-gradient(145deg,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(40, 30, 20, 0.4) 50%,
    rgba(20, 15, 10, 0.6) 100%
  );
  backdrop-filter: blur(15px);
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
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.03), transparent);
    transform: rotate(45deg);
    animation: shimmer 4s infinite;
    pointer-events: none;
  }
  
`;

const EquipmentSlot = styled.div`
  background: linear-gradient(135deg,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(40, 30, 20, 0.3) 50%,
    rgba(20, 15, 10, 0.5) 100%
  );
  backdrop-filter: blur(10px);
  border: 2px solid rgba(212, 175, 55, 0.2);
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
      rgba(212, 175, 55, 0.1) 50%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    border-color: rgba(212, 175, 55, 0.6);
    background: linear-gradient(135deg,
      rgba(0, 0, 0, 0.6) 0%,
      rgba(40, 30, 20, 0.4) 50%,
      rgba(20, 15, 10, 0.6) 100%
    );
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
  width: ${props => props.size === 'large' ? '64px' : props.size === 'widget' ? '80px' : '48px'};
  height: ${props => props.size === 'large' ? '64px' : props.size === 'widget' ? '80px' : '48px'};
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  display: block;
  
  &:hover {
    transform: scale(1.05);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

const ItemIconFallback = styled.div`
  width: ${props => props.size === 'large' ? '64px' : props.size === 'widget' ? '80px' : '48px'};
  height: ${props => props.size === 'large' ? '64px' : props.size === 'widget' ? '80px' : '48px'};
  background: ${props => props.type === 'weapon' ? 'linear-gradient(135deg, #d4af37, #b7950b)' :
    props.type === 'armor' ? 'linear-gradient(135deg, #d4af37, #f4d03f)' :
    props.type === 'accessory' ? 'linear-gradient(135deg, #f4d03f, #d4af37)' :
    props.type === 'artifact' ? 'linear-gradient(135deg, #b7950b, #d4af37)' :
    props.type === 'material' ? 'linear-gradient(135deg, #d4af37, #f4d03f)' :
    props.type === 'book' ? 'linear-gradient(135deg, #b7950b, #d4af37)' : 'linear-gradient(135deg, #d4af37, #b7950b)'};
  border-radius: 8px;
  border: 2px solid rgba(212, 175, 55, 0.3);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.size === 'large' ? '2rem' : props.size === 'widget' ? '2.5rem' : '1.5rem'};
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
const ItemIcon = ({ item, type, size = 'small' }) => {
  const [imageError, setImageError] = React.useState(false);
  
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

  const handleImageError = () => {
    setImageError(true);
  };

  // Если есть ошибка загрузки изображения или нет URL, показываем fallback
  if (!item?.image_url || imageError) {
    return (
      <ItemIconFallback type={type} size={size}>
        {getTypeIcon(type)}
      </ItemIconFallback>
    );
  }

  return (
    <ItemImage
      src={item.image_url}
      alt={item.name || 'Предмет'}
      size={size}
      onError={handleImageError}
    />
  );
};

const ItemName = styled.div`
  color: ${props => props.rarity === 'common' ? '#ffffff' :
    props.rarity === 'uncommon' ? '#f4d03f' :
    props.rarity === 'rare' ? '#d4af37' :
    props.rarity === 'epic' ? '#b7950b' : '#ffd54f'};
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
      ${props.rarity === 'uncommon' ? '#f4d03f, #d4af37' :
        props.rarity === 'rare' ? '#d4af37, #b7950b' :
        props.rarity === 'epic' ? '#b7950b, #d4af37' : '#d4af37, #ffd54f'}
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  `}
`;

const StatsPanel = styled.div`
  background: linear-gradient(145deg,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(40, 30, 20, 0.3) 50%,
    rgba(20, 15, 10, 0.5) 100%
  );
  backdrop-filter: blur(10px);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 20px rgba(212, 175, 55, 0.2);
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
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transform: rotate(45deg);
    animation: shimmer 3s infinite;
    pointer-events: none;
  }
`;

const UnequipButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, rgba(244, 67, 54, 0.2), rgba(229, 115, 115, 0.2));
  border: 1px solid rgba(244, 67, 54, 0.4);
  border-radius: 8px;
  color: #f44336;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 12px;
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
    background: linear-gradient(90deg, transparent, rgba(244, 67, 54, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, rgba(244, 67, 54, 0.3), rgba(229, 115, 115, 0.3));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.2);
    
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

const DropButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2));
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 8px;
  color: #d4af37;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
  
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
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, rgba(212, 175, 55, 0.3), rgba(244, 208, 63, 0.3));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    color: #f4d03f;
    
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
    rgba(0, 0, 0, 0.4) 0%,
    rgba(40, 30, 20, 0.2) 100%
  );
  backdrop-filter: blur(5px);
  border: 1px solid rgba(212, 175, 55, 0.2);
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
      rgba(212, 175, 55, 0.1) 50%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-2px);
    border-color: rgba(212, 175, 55, 0.4);
    background: linear-gradient(135deg,
      rgba(0, 0, 0, 0.5) 0%,
      rgba(40, 30, 20, 0.3) 100%
    );
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
  padding: 10px 20px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  color: #aaa;
  font-weight: 500;
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
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    border-color: rgba(212, 175, 55, 0.4);
    color: #d4af37;
    transform: translateY(-1px);
    
    &::before {
      left: 100%;
    }
  }
  
  &.active {
    background: linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2));
    border-color: rgba(212, 175, 55, 0.4);
    color: #d4af37;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
  }
`;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  padding: 24px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 16px;
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
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transform: rotate(45deg);
    animation: shimmer 3s infinite;
    pointer-events: none;
  }
`;

const ItemSlot = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
  border: 1px solid ${props => props.rarity === 'common' ? 'rgba(102, 102, 102, 0.4)' :
    props.rarity === 'uncommon' ? 'rgba(244, 208, 63, 0.4)' :
    props.rarity === 'rare' ? 'rgba(212, 175, 55, 0.4)' :
    props.rarity === 'epic' ? 'rgba(183, 149, 11, 0.4)' : 'rgba(212, 175, 55, 0.4)'};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  backdrop-filter: blur(5px);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, ${props => props.rarity === 'common' ? 'rgba(102, 102, 102, 0.1)' :
      props.rarity === 'uncommon' ? 'rgba(244, 208, 63, 0.1)' :
      props.rarity === 'rare' ? 'rgba(212, 175, 55, 0.1)' :
      props.rarity === 'epic' ? 'rgba(183, 149, 11, 0.1)' : 'rgba(212, 175, 55, 0.1)'}, transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.05);
    border-color: ${props => props.rarity === 'common' ? 'rgba(102, 102, 102, 0.6)' :
      props.rarity === 'uncommon' ? 'rgba(244, 208, 63, 0.6)' :
      props.rarity === 'rare' ? 'rgba(212, 175, 55, 0.6)' :
      props.rarity === 'epic' ? 'rgba(183, 149, 11, 0.6)' : 'rgba(212, 175, 55, 0.6)'};
    box-shadow: 0 8px 25px ${props => props.rarity === 'common' ? 'rgba(102, 102, 102, 0.15)' :
      props.rarity === 'uncommon' ? 'rgba(244, 208, 63, 0.15)' :
      props.rarity === 'rare' ? 'rgba(212, 175, 55, 0.15)' :
      props.rarity === 'epic' ? 'rgba(183, 149, 11, 0.15)' : 'rgba(212, 175, 55, 0.15)'};
    
    &::before {
      left: 100%;
    }
  }
  
  &.equipped {
    border-width: 2px;
    box-shadow: 0 0 15px ${props => props.rarity === 'common' ? 'rgba(102, 102, 102, 0.3)' :
      props.rarity === 'uncommon' ? 'rgba(244, 208, 63, 0.3)' :
      props.rarity === 'rare' ? 'rgba(212, 175, 55, 0.3)' :
      props.rarity === 'epic' ? 'rgba(183, 149, 11, 0.3)' : 'rgba(212, 175, 55, 0.3)'};
  }
`;

// Styled components для виджета выбранного предмета
const SelectedItemWidget = styled.div`
  background: linear-gradient(135deg,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(40, 30, 20, 0.3) 50%,
    rgba(20, 15, 10, 0.5) 100%
  );
  backdrop-filter: blur(10px);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 20px rgba(212, 175, 55, 0.2);
  animation: fadeInUp 0.3s ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.6), transparent);
  }

  @keyframes fadeInUp {
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

const ItemPreview = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
`;

const ItemImageContainer = styled.div`
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(212, 175, 55, 0.4);
  background: linear-gradient(135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(40, 30, 20, 0.2) 100%
  );
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemWidgetName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #d4af37;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ItemType = styled.div`
  font-size: 14px;
  color: #a0a0c0;
  margin-bottom: 12px;
  font-style: italic;
`;

const ItemStats = styled.div`
  background: linear-gradient(135deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(40, 30, 20, 0.2) 100%
  );
  backdrop-filter: blur(5px);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
`;

const ItemStatsTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #d4af37;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ItemStatsList = styled.div`
  display: grid;
  gap: 4px;
`;

const ItemStat = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #b0b0d0;
  padding: 2px 0;

  .stat-name {
    color: #a0a0c0;
  }

  .stat-value {
    color: #70ff70;
    font-weight: 500;
  }
`;

const ItemActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  flex: 1;
  min-width: 120px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const UnequipActionButton = styled(ActionButton)`
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(183, 149, 11, 0.4) 100%);
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.5);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
  backdrop-filter: blur(5px);

  &:hover {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.4) 0%, rgba(183, 149, 11, 0.5) 100%);
    box-shadow: 0 6px 16px rgba(212, 175, 55, 0.3);
    color: #f4d03f;
    transform: translateY(-1px);
  }
`;

const DropActionButton = styled(ActionButton)`
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(229, 115, 115, 0.3) 100%);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.4);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.2);
  backdrop-filter: blur(5px);

  &:hover {
    background: linear-gradient(135deg, rgba(244, 67, 54, 0.3) 0%, rgba(229, 115, 115, 0.4) 100%);
    box-shadow: 0 6px 16px rgba(244, 67, 54, 0.3);
    transform: translateY(-1px);
  }
`;

// Стилизованные компоненты для диалога подтверждения
const ConfirmationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ConfirmationModal = styled.div`
  background: linear-gradient(135deg,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(40, 30, 20, 0.4) 100%
  );
  backdrop-filter: blur(15px);
  border: 2px solid rgba(212, 175, 55, 0.4);
  border-radius: 12px;
  padding: 24px;
  min-width: 320px;
  max-width: 400px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(212, 175, 55, 0.2);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ConfirmationTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ConfirmationMessage = styled.p`
  color: #ccc;
  margin: 0 0 24px 0;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
`;

const ConfirmationButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const ConfirmButton = styled.button`
  background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%);
  color: white;
  border: 1px solid #dc3545;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);

  &:hover {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CancelButton = styled.button`
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(183, 149, 11, 0.3) 100%);
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.2);

  &:hover {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(183, 149, 11, 0.4) 100%);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    color: #f4d03f;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
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
    physicalAttack: 'Физическая атака',
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

// Функция для получения характеристик предмета
const getItemStats = (item) => {
  if (!item || !item.properties) return [];
  
  const stats = [];
  const properties = item.properties;
  
  // Проверяем все возможные характеристики
  const statKeys = [
    'strength', 'intellect', 'spirit', 'agility', 'health', 'luck',
    'physicalAttack', 'physicalDefense', 'spiritualDefense', 'spiritualAttack',
    'attackSpeed', 'criticalChance', 'movementSpeed'
  ];
  
  statKeys.forEach(key => {
    if (properties[key] && properties[key] !== 0) {
      stats.push({
        name: getStatDisplayName(key),
        value: formatStatValue(key, properties[key])
      });
    }
  });
  
  return stats;
};

// Функция для определения типа предмета на русском
const getItemTypeDisplayName = (item) => {
  if (!item) return 'Неизвестный предмет';
  
  const type = item.type;
  const subtype = item.subtype;
  
  if (type === 'weapon') {
    return 'Оружие';
  } else if (type === 'armor') {
    const armorType = determineArmorType(item);
    switch (armorType) {
      case 'head': return 'Шлем';
      case 'body': return 'Броня';
      case 'hands': return 'Перчатки';
      case 'legs': return 'Обувь';
      default: return 'Броня';
    }
  } else if (type === 'accessory') {
    return 'Аксессуар';
  } else if (type === 'artifact') {
    return 'Артефакт';
  } else if (type === 'material') {
    return 'Материал';
  } else if (type === 'book') {
    return 'Книга';
  }
  
  return 'Предмет';
};

function EquipmentTab() {
  const { state, actions } = useGame();
  const navigate = useNavigate();
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
  const [showDropConfirmation, setShowDropConfirmation] = useState(false);
  
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
    if (!selectedEquippedItem) {
      actions.addNotification({ message: 'Предмет для снятия не выбран.', type: 'warning' });
      return;
    }

    const equipableTypes = ['weapon', 'armor', 'accessory', 'talisman'];
    if (!equipableTypes.includes(selectedEquippedItem.type)) {
      actions.addNotification({ message: `Предмет типа '${selectedEquippedItem.type}' нельзя снять.`, type: 'warning' });
      return;
    }

    try {
      const userId = await InventoryAuthManager.ensureUserAuthorized(state, actions, navigate, false);
      if (!userId) {
        return;
      }

      // Снимаем предмет (equipped = false)
      await InventoryServiceAPI.toggleEquipItem(userId, selectedEquippedItem.id, false);

      actions.addNotification({
        message: `${selectedEquippedItem.name} снят.`,
        type: 'success'
      });

      // Обновляем инвентарь и характеристики
      if (actions.loadInventoryData) {
        await actions.loadInventoryData(userId);
      }
      if (actions.loadCharacterStats) {
        await actions.loadCharacterStats(userId);
      }

      // Сбрасываем состояния
      setSelectedEquippedItem(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error('[EquipmentTab] Ошибка при снятии предмета:', error);
      actions.addNotification({ message: `Ошибка снятия предмета: ${error.message || 'Неизвестная ошибка'}`, type: 'error' });
    }
  };
  
  // Функция для выбрасывания предмета
  const handleDropItem = async () => {
    const itemToRemove = selectedInventoryItem || selectedEquippedItem;
    
    if (!itemToRemove) {
      actions.addNotification({ message: 'Предмет для удаления не выбран.', type: 'warning' });
      return;
    }

    try {
      const userId = await InventoryAuthManager.ensureUserAuthorized(state, actions, navigate, false);
      if (!userId) {
        return;
      }

      // Если предмет экипирован, сначала снимаем его
      if (itemToRemove.equipped) {
        await InventoryServiceAPI.toggleEquipItem(userId, itemToRemove.id, false);
      }

      // Удаляем предмет из инвентаря
      await InventoryServiceAPI.removeInventoryItem(userId, itemToRemove.id, 1);

      actions.addNotification({
        message: `${itemToRemove.name} выброшен.`,
        type: 'success'
      });

      // Обновляем инвентарь и характеристики
      if (actions.loadInventoryData) {
        await actions.loadInventoryData(userId);
      }
      if (actions.loadCharacterStats) {
        await actions.loadCharacterStats(userId);
      }

      // Сбрасываем состояния
      setSelectedInventoryItem(null);
      setSelectedEquippedItem(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error('[EquipmentTab] Ошибка при удалении предмета:', error);
      actions.addNotification({ message: `Ошибка удаления предмета: ${error.message || 'Неизвестная ошибка'}`, type: 'error' });
    }
  };

  // Функция для показа диалога подтверждения удаления
  const handleShowDropConfirmation = () => {
    const itemToRemove = selectedInventoryItem || selectedEquippedItem;
    
    if (!itemToRemove) {
      actions.addNotification({ message: 'Предмет для удаления не выбран.', type: 'warning' });
      return;
    }

    setShowDropConfirmation(true);
  };

  // Функция для подтверждения удаления
  const handleConfirmDrop = async () => {
    setShowDropConfirmation(false);
    await handleDropItem();
  };

  // Функция для отмены удаления
  const handleCancelDrop = () => {
    setShowDropConfirmation(false);
  };
  
  const handleItemClick = async (item) => {
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
      
      try {
        const userId = await InventoryAuthManager.ensureUserAuthorized(state, actions, navigate, false);
        if (!userId) {
          return;
        }

        // Используем тот же API, что и InventoryTab
        await InventoryServiceAPI.toggleEquipItem(userId, item.id, true);

        actions.addNotification({
          message: `${item.name} экипирован.`,
          type: 'success'
        });
        
        // Обновляем инвентарь через loadInventoryData
        if (userId && actions.loadInventoryData) {
          actions.loadInventoryData(userId);
        }
        // Перезагружаем характеристики персонажа
        if (userId && actions.loadCharacterStats) {
          actions.loadCharacterStats(userId);
        }
        
        // Сбрасываем состояния для закрытия виджета деталей предмета
        setSelectedInventoryItem(null);
        setSelectedSlot(null);
        
        // updateEquippedItems() будет вызван автоматически через useEffect после обновления глобального состояния
      } catch (error) {
        console.error('[EquipmentTab] Ошибка при экипировке предмета:', error);
        actions.addNotification({
          message: `Ошибка экипировки: ${error.message || 'Неизвестная ошибка'}`,
          type: 'error'
        });
      }
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
                <ItemIcon item={equipped.headArmor} type="armor" size="large" />
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
                <ItemIcon item={equipped.weapon} type="weapon" size="large" />
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
                <ItemIcon item={equipped.bodyArmor} type="armor" size="large" />
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
                <ItemIcon item={equipped.handArmor} type="armor" size="large" />
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
                <ItemIcon item={equipped.legArmor} type="armor" size="large" />
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
                <ItemIcon item={equipped.accessory1} type="accessory" size="small" />
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
                <ItemIcon item={equipped.accessory2} type="accessory" size="small" />
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
                <ItemIcon item={equipped.artifact1} type="artifact" size="small" />
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
                <ItemIcon item={equipped.artifact2} type="artifact" size="small" />
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
                  <ItemIcon item={item} type={item.type || 'material'} size="small" />
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
          <SelectedItemWidget>
            <ItemPreview>
              <ItemImageContainer>
                <ItemIcon item={selectedEquippedItem} type={selectedEquippedItem.type} size="widget" />
              </ItemImageContainer>
              <ItemInfo>
                <ItemWidgetName>{selectedEquippedItem.name}</ItemWidgetName>
                <ItemType>{getItemTypeDisplayName(selectedEquippedItem)}</ItemType>
              </ItemInfo>
            </ItemPreview>
            
            {getItemStats(selectedEquippedItem).length > 0 && (
              <ItemStats>
                <ItemStatsTitle>Характеристики</ItemStatsTitle>
                <ItemStatsList>
                  {getItemStats(selectedEquippedItem).map((stat, index) => (
                    <ItemStat key={index}>
                      <span className="stat-name">{stat.name}:</span>
                      <span className="stat-value">+{stat.value}</span>
                    </ItemStat>
                  ))}
                </ItemStatsList>
              </ItemStats>
            )}
            
            <ItemActions>
              <UnequipActionButton onClick={handleUnequipItem}>
                Снять предмет
              </UnequipActionButton>
              <DropActionButton onClick={handleShowDropConfirmation}>
                Выбросить
              </DropActionButton>
            </ItemActions>
          </SelectedItemWidget>
        )}
        
        {/* Отображаем информацию о выбранном предмете из инвентаря */}
        {selectedInventoryItem && !selectedInventoryItem.equipped && (
          <SelectedItemWidget>
            <ItemPreview>
              <ItemImageContainer>
                <ItemIcon item={selectedInventoryItem} type={selectedInventoryItem.type} size="widget" />
              </ItemImageContainer>
              <ItemInfo>
                <ItemWidgetName>{selectedInventoryItem.name}</ItemWidgetName>
                <ItemType>{getItemTypeDisplayName(selectedInventoryItem)}</ItemType>
              </ItemInfo>
            </ItemPreview>
            
            {getItemStats(selectedInventoryItem).length > 0 && (
              <ItemStats>
                <ItemStatsTitle>Характеристики</ItemStatsTitle>
                <ItemStatsList>
                  {getItemStats(selectedInventoryItem).map((stat, index) => (
                    <ItemStat key={index}>
                      <span className="stat-name">{stat.name}:</span>
                      <span className="stat-value">+{stat.value}</span>
                    </ItemStat>
                  ))}
                </ItemStatsList>
              </ItemStats>
            )}
            
            <ItemActions>
              <DropActionButton onClick={handleShowDropConfirmation}>
                Выбросить
              </DropActionButton>
            </ItemActions>
          </SelectedItemWidget>
        )}
        
        {state.player.characterStats && state.player.characterStats.modified && (
          <>
            {/* Базовые характеристики (отображаем модифицированные значения) */}
            <div>
              <h4>Базовые характеристики</h4>
              <StatGrid>
                {['strength', 'intellect', 'spirit', 'agility', 'health'].map(stat => {
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
                {['physicalAttack', 'physicalDefense', 'spiritualDefense', 'spiritualAttack', 'attackSpeed', 'criticalChance', 'movementSpeed'].map(stat => {
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

      {/* Диалог подтверждения удаления предмета */}
      {showDropConfirmation && (
        <ConfirmationOverlay>
          <ConfirmationModal>
            <ConfirmationTitle>Подтверждение удаления</ConfirmationTitle>
            <ConfirmationMessage>
              Вы уверены, что хотите выбросить этот предмет? Это действие нельзя отменить.
            </ConfirmationMessage>
            <ConfirmationButtons>
              <CancelButton onClick={handleCancelDrop}>
                Отмена
              </CancelButton>
              <ConfirmButton onClick={handleConfirmDrop}>
                Выбросить
              </ConfirmButton>
            </ConfirmationButtons>
          </ConfirmationModal>
        </ConfirmationOverlay>
      )}
    </Container>
  );
}

export default EquipmentTab;
