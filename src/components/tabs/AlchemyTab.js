import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import styled, { keyframes, css } from 'styled-components';
import alchemyService from '../../services/alchemy-service-adapter';

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

// Стилизованные компоненты
const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  color: #f0f0f0;
  animation: ${fadeIn} 0.6s ease-out;
  min-height: 100vh;
`;

const TabHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  text-align: center;
`;

const TabTitle = styled.h2`
  font-size: 28px;
  margin: 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    border-radius: 2px;
  }
`;

const TabContent = styled.div`
  display: flex;
  flex: 1;
  gap: 20px;
`;

const LeftPanel = styled.div`
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
`;

const RightPanel = styled.div`
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
`;

const TabMenu = styled.div`
  display: flex;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
  gap: 4px;
`;

const TabButton = styled.button`
  background: ${props => props.active
    ? 'linear-gradient(145deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.2) 100%)'
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)'
  };
  color: ${props => props.active ? '#d4af37' : '#aaa'};
  border: 1px solid ${props => props.active ? 'rgba(212, 175, 55, 0.4)' : 'rgba(100, 100, 100, 0.3)'};
  border-radius: 12px 12px 0 0;
  padding: 12px 20px;
  font-size: 16px;
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
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.15) 0%, rgba(244, 208, 63, 0.15) 100%);
    color: #d4af37;
    border-color: rgba(212, 175, 55, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    
    &::before {
      left: 100%;
    }
  }
  
  ${props => props.active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(45deg, #d4af37, #f4d03f);
      border-radius: 2px 2px 0 0;
    }
  `}
`;

const RecipeList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RecipeCard = styled.div`
  display: flex;
  background: ${props => props.selected
    ? 'linear-gradient(145deg, rgba(212, 175, 55, 0.15) 0%, rgba(244, 208, 63, 0.15) 100%)'
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%)'
  };
  border: 2px solid ${props => props.selected ? 'rgba(212, 175, 55, 0.6)' : 'rgba(100, 100, 100, 0.3)'};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
  
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
    background: linear-gradient(145deg, rgba(212, 175, 55, 0.1) 0%, rgba(244, 208, 63, 0.1) 100%);
    border-color: rgba(212, 175, 55, 0.8);
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.2);
    animation: ${pulse} 2s infinite;
    
    &::before {
      left: 100%;
    }
  }
  
  ${props => props.selected && `
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
    
    &::after {
      content: '';
      position: absolute;
      top: 8px;
      right: 8px;
      width: 12px;
      height: 12px;
      background: linear-gradient(45deg, #d4af37, #f4d03f);
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
    }
  `}
`;

const RecipeIcon = styled.div`
  width: 64px;
  height: 64px;
  background: ${props => props.src ? `url(${props.src}) center/cover` : '#333'};
  border: 2px solid transparent;
  border-radius: 12px;
  margin-right: 16px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #d4af37;
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(45deg, #d4af37, #f4d03f, #b7950b, #d4af37);
    border-radius: 12px;
    z-index: -1;
    animation: ${shimmer} 3s infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    inset: 2px;
    background: linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(40, 40, 40, 0.5) 100%);
    border-radius: 8px;
    z-index: -1;
  }
  
  ${props => props.rarity && `
    &::before {
      background: linear-gradient(45deg,
        ${props.rarity === 'legendary' ? '#ff6b35, #f7931e, #ff6b35' :
          props.rarity === 'epic' ? '#9b59b6, #8e44ad, #9b59b6' :
          props.rarity === 'rare' ? '#3498db, #2980b9, #3498db' :
          '#d4af37, #f4d03f, #b7950b, #d4af37'}
      );
    }
  `}
`;

const RecipeInfo = styled.div`
  flex: 1;
`;

const RecipeName = styled.div`
  font-weight: bold;
  color: ${props => {
    switch(props.rarity) {
      case 'common': return '#aaa';
      case 'uncommon': return '#1eff00';
      case 'rare': return '#0070dd';
      case 'epic': return '#a335ee';
      case 'legendary': return '#ff8000';
      default: return '#aaa';
    }
  }};
`;

const RecipeDescription = styled.div`
  font-size: 14px;
  color: rgba(212, 175, 55, 0.8);
  margin-top: 8px;
  font-style: italic;
`;

const RecipeDetails = styled.div`
  padding: 20px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  margin-top: 20px;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #d4af37, #f4d03f, #b7950b);
    border-radius: 12px 12px 0 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.05), transparent);
    transform: rotate(45deg);
    animation: ${shimmer} 4s infinite;
    pointer-events: none;
  }
`;

const DetailTitle = styled.h3`
  margin: 0 0 16px 0;
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 18px;
  font-weight: 600;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 40px;
    height: 2px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    border-radius: 1px;
  }
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const DetailLabel = styled.div`
  color: rgba(212, 175, 55, 0.7);
  font-weight: 500;
`;

const DetailValue = styled.div`
  color: #fff;
  font-weight: 600;
`;

const IngredientsList = styled.div`
  margin-top: 15px;
`;

const IngredientItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: ${props => props.available
    ? 'linear-gradient(145deg, rgba(46, 125, 50, 0.15) 0%, rgba(76, 175, 80, 0.15) 100%)'
    : 'linear-gradient(145deg, rgba(183, 28, 28, 0.15) 0%, rgba(244, 67, 54, 0.15) 100%)'
  };
  border: 1px solid ${props => props.available
    ? 'rgba(76, 175, 80, 0.3)'
    : 'rgba(244, 67, 54, 0.3)'
  };
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${props => props.available
      ? 'linear-gradient(180deg, #4caf50, #66bb6a)'
      : 'linear-gradient(180deg, #f44336, #ef5350)'
    };
    border-radius: 0 4px 4px 0;
  }
  
  &:hover {
    transform: translateX(4px);
    box-shadow: ${props => props.available
      ? '0 4px 12px rgba(76, 175, 80, 0.2)'
      : '0 4px 12px rgba(244, 67, 54, 0.2)'
    };
  }
`;

const IngredientName = styled.div`
  flex: 1;
  color: ${props => props.available ? '#4caf50' : '#f44336'};
  font-weight: 500;
  font-size: 14px;
`;

const IngredientQuantity = styled.div`
  color: ${props => props.available ? '#4caf50' : '#f44336'};
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuantityBadge = styled.span`
  background: ${props => props.enough
    ? 'linear-gradient(145deg, rgba(76, 175, 80, 0.2) 0%, rgba(129, 199, 132, 0.2) 100%)'
    : 'linear-gradient(145deg, rgba(244, 67, 54, 0.2) 0%, rgba(239, 83, 80, 0.2) 100%)'
  };
  color: ${props => props.enough ? '#4caf50' : '#f44336'};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid ${props => props.enough
    ? 'rgba(76, 175, 80, 0.3)'
    : 'rgba(244, 67, 54, 0.3)'
  };
  min-width: 24px;
  text-align: center;
`;

const ActionButton = styled.button`
  background: ${props => props.primary
    ? 'linear-gradient(145deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.2) 100%)'
    : 'linear-gradient(145deg, rgba(0, 0, 0, 0.3) 0%, rgba(60, 60, 60, 0.5) 100%)'
  };
  color: ${props => props.primary ? '#d4af37' : '#ccc'};
  border: 2px solid ${props => props.primary ? 'rgba(212, 175, 55, 0.4)' : 'rgba(100, 100, 100, 0.3)'};
  border-radius: 8px;
  padding: 12px 20px;
  margin-top: 20px;
  font-size: 16px;
  font-weight: 600;
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
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    background: ${props => props.primary
      ? 'linear-gradient(145deg, rgba(212, 175, 55, 0.3) 0%, rgba(244, 208, 63, 0.3) 100%)'
      : 'linear-gradient(145deg, rgba(60, 60, 60, 0.4) 0%, rgba(80, 80, 80, 0.6) 100%)'
    };
    border-color: ${props => props.primary ? 'rgba(212, 175, 55, 0.6)' : 'rgba(150, 150, 150, 0.5)'};
    transform: translateY(-2px);
    box-shadow: ${props => props.primary
      ? '0 6px 20px rgba(212, 175, 55, 0.3)'
      : '0 6px 20px rgba(0, 0, 0, 0.3)'
    };
    
    &::before {
      left: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: ${props => props.primary
      ? '0 2px 8px rgba(212, 175, 55, 0.2)'
      : '0 2px 8px rgba(0, 0, 0, 0.2)'
    };
  }
  
  &:disabled {
    background: linear-gradient(145deg, rgba(30, 30, 30, 0.3) 0%, rgba(50, 50, 50, 0.3) 100%);
    color: #666;
    border-color: rgba(60, 60, 60, 0.3);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    
    &::before {
      display: none;
    }
  }
  
  ${props => props.primary && `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.3), transparent);
      transform: translate(-50%, -50%);
      transition: width 0.3s ease, height 0.3s ease;
    }
    
    &:hover:not(:disabled)::after {
      width: 100%;
      height: 100%;
    }
  `}
`;

const SearchBar = styled.input`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  color: #fff;
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  width: 100%;
  
  &::placeholder {
    color: rgba(212, 175, 55, 0.6);
    font-style: italic;
  }
  
  &:focus {
    outline: none;
    border-color: rgba(212, 175, 55, 0.8);
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.2);
    background: linear-gradient(145deg, rgba(0, 0, 0, 0.5) 0%, rgba(40, 40, 40, 0.7) 100%);
  }
  
  &:hover {
    border-color: rgba(212, 175, 55, 0.5);
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.1);
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const FilterSelect = styled.select`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  color: #fff;
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(212, 175, 55, 0.8);
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.2);
    background: linear-gradient(145deg, rgba(0, 0, 0, 0.5) 0%, rgba(40, 40, 40, 0.7) 100%);
  }
  
  &:hover {
    border-color: rgba(212, 175, 55, 0.5);
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.1);
  }
  
  option {
    background: rgba(20, 20, 20, 0.9);
    color: #fff;
    padding: 8px;
  }
`;

const NoRecipesMessage = styled.div`
  text-align: center;
  padding: 24px;
  color: rgba(212, 175, 55, 0.6);
  font-style: italic;
  font-size: 16px;
  font-weight: 500;
`;

const ResultMessage = styled.div`
  margin-top: 24px;
  padding: 16px 20px;
  border-radius: 12px;
  background: ${props => props.success
    ? 'linear-gradient(145deg, rgba(46, 125, 50, 0.2) 0%, rgba(76, 175, 80, 0.2) 100%)'
    : 'linear-gradient(145deg, rgba(183, 28, 28, 0.2) 0%, rgba(244, 67, 54, 0.2) 100%)'
  };
  border: 2px solid ${props => props.success
    ? 'rgba(76, 175, 80, 0.4)'
    : 'rgba(244, 67, 54, 0.4)'
  };
  color: ${props => props.success ? '#4caf50' : '#f44336'};
  text-align: center;
  font-weight: 600;
  font-size: 16px;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.success
      ? 'linear-gradient(90deg, #4caf50, #66bb6a)'
      : 'linear-gradient(90deg, #f44336, #ef5350)'
    };
    border-radius: 12px 12px 0 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: ${props => props.success
      ? 'linear-gradient(45deg, transparent, rgba(76, 175, 80, 0.1), transparent)'
      : 'linear-gradient(45deg, transparent, rgba(244, 67, 54, 0.1), transparent)'
    };
    transform: rotate(45deg);
    animation: ${shimmer} 3s infinite;
    pointer-events: none;
  }
`;

const CraftingProgress = styled.div`
  margin-top: 24px;
  height: 24px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    animation: ${shimmer} 2s infinite;
    pointer-events: none;
  }
`;

const ProgressBar = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #d4af37 0%, #f4d03f 50%, #b7950b 100%);
  border-radius: 8px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: ${shimmer} 1.5s infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    background: linear-gradient(90deg,
      rgba(212, 175, 55, 0.8) 0%,
      rgba(244, 208, 63, 0.9) 50%,
      rgba(183, 149, 11, 0.8) 100%
    );
    border-radius: 6px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  
  ${props => props.progress > 0 && css`
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
  `}
  
  ${props => props.progress >= 100 && css`
    animation: ${pulse} 1s infinite;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
  `}
`;

/**
 * Компонент вкладки "Алхимия"
 */
// Переводы ингредиентов теперь получаются динамически с сервера
// Убрана зависимость от статических данных

// Таблица соответствия идентификаторов в инвентаре и рецептах
const idMappings = {
  'essence_heaven': 'essence_of_heaven', // Пример возможного несоответствия
  // Добавьте другие несоответствия при необходимости
};

// Функция нормализации идентификаторов
const normalizeItemId = (id) => {
  if (!id) return '';
  
  // Приводим к нижнему регистру
  let normalizedId = String(id).toLowerCase();
  
  // Проверяем наличие в таблице соответствия
  if (idMappings[normalizedId]) {
    console.log(`Нормализация ID: ${normalizedId} -> ${idMappings[normalizedId]}`);
    return idMappings[normalizedId];
  }
  
  return normalizedId;
};

// Функция для получения русского названия ингредиента
const getIngredientRussianName = (itemId, fallbackName) => {
  // Убрана зависимость от статических переводов - используем только данные с сервера
  
  // Используем переданное имя с сервера как приоритетное
  if (fallbackName) {
    return fallbackName;
  }
  
  // Если нет имени с сервера, генерируем читаемое имя из itemId
  if (itemId) {
    return itemId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return "Неизвестный ингредиент";
};

const AlchemyTab = () => {
  const { state, actions } = useGame();
  const { player, cultivation } = state;
  
  // Состояние компонента
  const [activeTab, setActiveTab] = useState('pills'); // pills, talismans, weapons, armor, accessories
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [craftingStatus, setCraftingStatus] = useState(null); // null, 'crafting', 'success', 'failed'
  const [craftingProgress, setCraftingProgress] = useState(0);
  const [craftingResult, setCraftingResult] = useState(null);
  
  // Получение типа рецептов для активной вкладки
  const getRecipeType = () => {
    switch (activeTab) {
      case 'pills': return 'pill';
      case 'talismans': return 'talisman';
      case 'weapons': return 'weapon';
      case 'armor': return 'armor';
      case 'accessories': return 'accessory';
      default: return 'pill';
    }
  };
  
  // Сбрасываем выбранный рецепт при переключении вкладок
  useEffect(() => {
    setSelectedRecipe(null);
    setCraftingStatus(null);
    setCraftingResult(null);
  }, [activeTab]);
  
  // Функция для безопасного выбора рецепта с глубоким копированием
  const selectRecipe = (recipe) => {
    console.log('Выбор рецепта:', recipe.name);
    
    // Полностью очищаем текущий выбранный рецепт
    setSelectedRecipe(null);
    
    // Сбрасываем статус и результат создания при выборе нового рецепта
    setCraftingStatus(null);
    setCraftingResult(null);
    
    // Делаем паузу перед установкой нового рецепта
    setTimeout(() => {
      // Создаем совершенно новый объект с только нужными свойствами
      const cleanRecipe = {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        type: recipe.type,
        rarity: recipe.rarity,
        requiredLevel: recipe.requiredLevel,
        requiredStage: recipe.requiredStage,
        successRate: recipe.successRate,
        // Создаем полностью новый массив ингредиентов с новыми объектами
        ingredients: []
      };
      
      // Если у рецепта есть ингредиенты и это массив, копируем каждый ингредиент
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        // Добавляем только уникальные ингредиенты, копируя каждый в новый объект
        const uniqueIngredients = new Map();
        
        recipe.ingredients.forEach(ing => {
          // Используем правильный идентификатор
          const itemId = ing.id;
          console.log("Обработка ингредиента из рецепта:", ing);
          
          if (!uniqueIngredients.has(itemId) && itemId) {
            // Получаем русское название из словаря переводов или генерируем читаемое имя
            let readableName = getIngredientRussianName(itemId, null);
            
            // УЛУЧШЕННАЯ ПРОВЕРКА: Проверяем наличие ингредиента в инвентаре
            // и явно выводим расширенную информацию для отладки
            console.log(`Поиск ингредиента ${itemId} в инвентаре...`);
            
            // Логируем предметы инвентаря с похожими ID для отладки
            const similarItems = player.inventory.items.filter(item => {
              const normalizedItemId = normalizeItemId(item.item_id || item.itemId || item.id);
              const normalizedSearchId = normalizeItemId(itemId);
              return normalizedItemId.includes(normalizedSearchId) ||
                     normalizedSearchId.includes(normalizedItemId);
            });
            
            if (similarItems.length > 0) {
              console.log("Похожие предметы в инвентаре:",
                similarItems.map(item => `${item.name} (ID: ${item.item_id || item.itemId || item.id}, тип: ${item.type}, кол-во: ${item.quantity})`)
              );
            }
            
            // Проверяем наличие ингредиента в инвентаре
            const availableQuantity = getIngredientQuantityInInventory(itemId);
            
            // Создаем объект для ингредиента с расширенной информацией
            uniqueIngredients.set(itemId, {
              id: itemId,
              name: ing.item?.name || ing.name || readableName,
              quantity: ing.quantity,
              available: availableQuantity,
              hasEnough: availableQuantity >= ing.quantity,
              // Сохраняем исходную информацию о типе для отладки
              originalType: ing.type
            });
            
            console.log(`Добавлен ингредиент: ${ing.item?.name || ing.name || readableName} (${itemId})`);
            console.log(`Статус доступности: ${availableQuantity}/${ing.quantity}, достаточно: ${availableQuantity >= ing.quantity ? 'ДА' : 'НЕТ'}`);
          }
        });
        
        // Преобразуем Map обратно в массив
        cleanRecipe.ingredients = Array.from(uniqueIngredients.values());
        console.log(`Всего уникальных ингредиентов: ${cleanRecipe.ingredients.length}`);
        
        // Проверяем общую доступность всех ингредиентов
        cleanRecipe.hasAllIngredients = cleanRecipe.ingredients.every(ing => ing.hasEnough);
      }
      
      console.log('Итоговый список ингредиентов:', cleanRecipe.ingredients);
      console.log(`Общая доступность рецепта: ${cleanRecipe.hasAllIngredients ? 'ДОСТУПЕН' : 'НЕДОСТУПЕН'}`);
      
      // Проверяем наличие предметов с типом "ingredient" в инвентаре
      const ingredientTypeItems = player.inventory.items.filter(item => item.type === 'ingredient');
      if (ingredientTypeItems.length > 0) {
        console.log("Предметы с типом 'ingredient' в инвентаре:",
          ingredientTypeItems.map(item => `${item.name} (ID: ${item.item_id || item.itemId || item.id}, кол-во: ${item.quantity})`)
        );
      }
      
      setSelectedRecipe(cleanRecipe);
    }, 100); // Увеличиваем задержку для обеспечения завершения всех асинхронных операций
  };

  // Функция загрузки рецептов (определена на уровне компонента для доступности во всех методах)
  const loadRecipes = async () => {
    try {
      // Очищаем рецепты перед загрузкой новых
      setRecipes([]);
      setSelectedRecipe(null);

      // Получаем текущий тип рецептов на основе активной вкладки
      const currentType = getRecipeType();
      
      console.log(`Загрузка рецептов типа: ${currentType}`);
      
      // Используем API сервиса алхимии для получения рецептов указанного типа
      // Получаем все данные о рецептах и ингредиентах за один запрос
      const recipesData = await alchemyService.getRecipesByType(currentType);
      
      console.log('Получены данные от API:', recipesData);
      
      // Обрабатываем полученные данные
      // Преобразуем серверные данные в формат, подходящий для интерфейса
      const formattedRecipes = recipesData.map(recipe => {
        // Извлекаем ингредиенты, обеспечивая корректное форматирование
        let ingredients = [];
        
        // Проверяем и обрабатываем ингредиенты корректно
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
          ingredients = recipe.ingredients.map(ing => {
            // Обрабатываем случай, когда item === null и нужно использовать item_id
            const itemId = ing.item_id || ing.itemId;
            
            // Получаем русское название из словаря переводов
            let readableName = getIngredientRussianName(itemId, ing.item?.name || ing.name);
            
            return {
              id: itemId,
              name: ing.item?.name || ing.name || readableName,
              quantity: ing.quantity,
              
            };
          });
          
        }
        
        console.log(`Рецепт ${recipe.name} имеет ${ingredients.length} ингредиентов:`, ingredients);
        
        return {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
        type: recipe.type,
        rarity: recipe.rarity,
        requiredLevel: recipe.required_level || recipe.requiredLevel,
        requiredStage: recipe.required_stage || recipe.requiredStage,
        successRate: recipe.success_rate || recipe.successRate,
        ingredients: ingredients
      };
    });
    
    console.log('Отформатированные рецепты:', formattedRecipes);
    
    // Устанавливаем новые рецепты
    setRecipes(formattedRecipes);
  } catch (error) {
    console.error('Ошибка при загрузке рецептов алхимии:', error);
  }
};

// Загрузка рецептов при изменении вкладки
useEffect(() => {
  loadRecipes();
}, [activeTab]);
  
  // Фильтрация рецептов
  const filteredRecipes = React.useMemo(() => {
    if (!recipes || recipes.length === 0) {
      return [];
    }
    
    return recipes.filter(recipe => {
      // Фильтр по поисковому запросу
      const matchesSearch = searchQuery === '' || 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Фильтр по редкости
      const matchesRarity = rarityFilter === 'all' || recipe.rarity === rarityFilter;
      
      // Фильтр по доступности (уровень культивации игрока)
      const playerStage = cultivation?.stage || 'Закалка тела';
      const playerLevel = cultivation?.level || 1;
      
      const stageOrder = ['Закалка тела', 'Очищение Ци', 'Золотое ядро', 'Формирование души'];
      const playerStageIndex = stageOrder.indexOf(playerStage);
      const recipeStageIndex = stageOrder.indexOf(recipe.requiredStage);
      
      let isAvailable = true;
      
      // Если ступень игрока ниже требуемой, рецепт недоступен
      if (playerStageIndex < recipeStageIndex) {
        isAvailable = false;
      }
      
      // Если ступень та же, проверяем уровень
      if (playerStageIndex === recipeStageIndex && playerLevel < recipe.requiredLevel) {
        isAvailable = false;
      }
      
      return matchesSearch && matchesRarity;
    });
  }, [recipes, searchQuery, rarityFilter, cultivation]);
  
  // Проверка наличия ингредиентов у игрока
  const checkIngredients = (recipe) => {
    if (!recipe || !recipe.ingredients || !player.inventory.items) {
      console.log('ОШИБКА: Нет рецепта, ингредиентов или инвентаря');
      return false;
    }
    
    console.log('======= ФИНАЛЬНАЯ ПРОВЕРКА ИНГРЕДИЕНТОВ ДЛЯ КРАФТА =======');
    console.log('Рецепт:', recipe.name);
    console.log('Всего ингредиентов в рецепте:', recipe.ingredients.length);
    
    // Логируем все предметы инвентаря для отладки
    console.log('ПОЛНЫЙ ИНВЕНТАРЬ:');
    player.inventory.items.forEach(item => {
      console.log(`- ${item.name}, ID: ${item.item_id || item.itemId || item.id}, тип: ${item.type}, количество: ${item.quantity}`);
    });
    
    // НОВЫЙ ПОДХОД: Используем доступность ингредиентов, определенную при выборе рецепта
    // Так как мы уже проверили доступность в selectRecipe, можем использовать эту информацию
    if (recipe.hasAllIngredients === true) {
      console.log('РЕЗУЛЬТАТ: Все ингредиенты доступны согласно предварительной проверке');
      return true;
    }
    
    // Резервный вариант: для каждого ингредиента проверяем наличие в инвентаре
    console.log('Запуск проверки наличия каждого ингредиента:');
    for (const ingredient of recipe.ingredients) {
      const normalizedIngredientId = normalizeItemId(ingredient.id);
      
      // Расширенный отладочный лог
      console.log(`\nПроверяем ингредиент: ${ingredient.name} (ID: ${ingredient.id}, нормализованный ID: ${normalizedIngredientId})`);
      console.log(`Требуемое количество: ${ingredient.quantity}`);
      
      // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: ПРЯМОЙ ПОИСК БЕЗ УЧЕТА ТИПА
      // Ищем любой предмет с подходящим ID независимо от типа
      let inventoryItem = null;
      
      // Сначала ищем по точному совпадению ID
      const exactMatches = player.inventory.items.filter(item => {
        const normalizedItemId = normalizeItemId(item.item_id || item.itemId || item.id);
        return normalizedItemId === normalizedIngredientId || (item.item_id || item.itemId || item.id) === ingredient.id;
      });
      
      if (exactMatches.length > 0) {
        console.log(`Найдены точные совпадения (${exactMatches.length}):`,
          exactMatches.map(item => `${item.name} (ID: ${item.item_id || item.itemId || item.id}, тип: ${item.type}, кол-во: ${item.quantity})`)
        );
        // Используем первый найденный предмет
        inventoryItem = exactMatches[0];
      }
      
      // 2. Простой поиск по ID (точное совпадение)
      if (!inventoryItem) {
        inventoryItem = player.inventory.items.find(item => {
          const normalizedItemId = normalizeItemId(item.item_id || item.itemId || item.id);
          // ИЗМЕНЕНО: убрана проверка типа, только сравнение ID
          return normalizedItemId === normalizedIngredientId;
        });
        
        if (inventoryItem) {
          console.log(`Найдено точное совпадение по ID: ${inventoryItem.name} (ID: ${inventoryItem.itemId})`);
        }
      }
      
      // 3. Частичное совпадение по ID
      if (!inventoryItem) {
        inventoryItem = player.inventory.items.find(item => {
          const normalizedItemId = normalizeItemId(item.item_id || item.itemId || item.id);
          return normalizedItemId && normalizedIngredientId &&
                 (normalizedItemId.includes(normalizedIngredientId) ||
                  normalizedIngredientId.includes(normalizedItemId));
        });
        
        if (inventoryItem) {
          console.log(`Найдено частичное совпадение по ID: ${inventoryItem.name} (ID: ${inventoryItem.itemId})`);
        }
      }
      
      // 4. Поиск по имени
      if (!inventoryItem) {
        const russianName = getIngredientRussianName(ingredient.id, null);
        inventoryItem = player.inventory.items.find(item =>
          item.name === russianName ||
          (item.name && russianName && (
            item.name.toLowerCase().includes(russianName.toLowerCase()) ||
            russianName.toLowerCase().includes(item.name.toLowerCase())
          ))
        );
        
        if (inventoryItem) {
          console.log(`Найдено совпадение по имени: ${inventoryItem.name} (ID: ${inventoryItem.itemId})`);
        }
      }
      
      // 5. Последняя попытка - полный игнор типа и поиск по любому совпадению
      if (!inventoryItem) {
        console.log(`Аварийный поиск для "${ingredient.name}" без учета типа предмета`);
        
        const possibleMatches = player.inventory.items.filter(item =>
          // Проверяем только ID и количество, полностью игнорируя тип
          item.quantity >= ingredient.quantity && (
            normalizeItemId(item.item_id || item.itemId || item.id) === normalizedIngredientId ||
            (item.item_id || item.itemId || item.id) === ingredient.id ||
            (normalizeItemId(item.item_id || item.itemId || item.id).includes(normalizedIngredientId.slice(0, 3)) ||
             normalizedIngredientId.includes(normalizeItemId(item.item_id || item.itemId || item.id).slice(0, 3)) ||
             item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
             ingredient.name.toLowerCase().includes(item.name.toLowerCase()))
          )
        );
        
        if (possibleMatches.length > 0) {
          console.log(`Найдены аварийные совпадения (${possibleMatches.length}):`,
            possibleMatches.map(item => `${item.name} (ID: ${item.item_id || item.itemId || item.id}, кол-во: ${item.quantity})`)
          );
          inventoryItem = possibleMatches[0];
          console.log(`Используем: ${inventoryItem.name} (кол-во: ${inventoryItem.quantity})`);
        }
      }
      
      // Финальная проверка результатов поиска
      if (!inventoryItem) {
        console.log(`❌ ОШИБКА: Ингредиент ${ingredient.name} (ID: ${ingredient.id}) не найден в инвентаре`);
        return false;
      } else if (inventoryItem.quantity < ingredient.quantity) {
        console.log(`❌ ОШИБКА: Ингредиент ${ingredient.name} найден (${inventoryItem.name}), но количества недостаточно: ${inventoryItem.quantity}/${ingredient.quantity}`);
        return false;
      } else {
        console.log(`✅ УСПЕХ: Ингредиент ${ingredient.name} найден как ${inventoryItem.name}: ${inventoryItem.quantity}/${ingredient.quantity} - ОК`);
      }
    }
    
    console.log('🏆 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ: Все ингредиенты найдены в достаточном количестве');
    return true;
  };
  
  // Получение количества ингредиента в инвентаре
  const getIngredientQuantityInInventory = (ingredientId) => {
    if (!player.inventory.items) {
      return 0;
    }
    
    const normalizedIngredientId = normalizeItemId(ingredientId);
    
    // Добавляем расширенный отладочный лог
    console.log(`Поиск в инвентаре ингредиента с ID: ${ingredientId}, нормализованный ID: ${normalizedIngredientId}`);
    
    // Логируем предметы в инвентаре с их типами для отладки
    console.log("Предметы в инвентаре (с типами):");
    const inventoryIds = player.inventory.items.map(item => {
      const normalizedItemId = normalizeItemId(item.item_id || item.itemId || item.id);
      console.log(`- ${item.name}: itemId="${item.item_id || item.itemId || item.id}", тип="${item.type}", нормализованный="${normalizedItemId}"`);
      return { original: item.item_id || item.itemId || item.id, normalized: normalizedItemId, type: item.type };
    });
    
    // Пробуем несколько вариантов поиска
    // Добавляем явную проверку типа, чтобы как "ingredient", так и "consumable" считались подходящими
    let inventoryItem = player.inventory.items.find(item => {
      const normalizedItemId = normalizeItemId(item.item_id || item.itemId || item.id);
      // Теперь явно сравниваем ID и проверяем совместимость типов
      return normalizedItemId === normalizedIngredientId;
    });
    
    console.log(`Результат начального поиска для ${ingredientId}: ${inventoryItem ? 'найден' : 'не найден'}`);
    console.log(`Предметы инвентаря с типом ingredient или consumable:`,
      player.inventory.items
        //.filter(item => item.type === 'ingredient' || item.type === 'consumable' || item.type === 'resource')
        .map(item => `${item.name} (ID: ${item.item_id || item.itemId || item.id}, тип: ${item.type}, кол-во: ${item.quantity})`)
    );
    
    // Если не нашли точное совпадение, пробуем частичное
    if (!inventoryItem) {
      inventoryItem = player.inventory.items.find(item => {
        const normalizedItemId = normalizeItemId(item.item_id || item.itemId || item.id);
        return (normalizedItemId && normalizedIngredientId &&
                (normalizedItemId.includes(normalizedIngredientId) ||
                 normalizedIngredientId.includes(normalizedItemId)));
      });
    }
    
    // Если все еще не нашли, пробуем поиск по имени
    if (!inventoryItem) {
      const russianName = getIngredientRussianName(ingredientId, null);
      inventoryItem = player.inventory.items.find(item => item.name === russianName);
    }
    
    // НОВЫЙ МЕТОД: Полностью игнорируем тип предмета и другие атрибуты,
    // ищем только по идентификатору в любом формате
    if (!inventoryItem) {
      console.log(`Последняя попытка поиска: полный перебор всех предметов, игнорируя тип`);
      // Ищем все предметы, которые могут соответствовать этому ингредиенту
      const possibleMatches = player.inventory.items.filter(item => {
        // Проверяем все возможные форматы ID
        const itemNormalizedId = normalizeItemId(item.item_id || item.itemId || item.id);
        const ingredientNormalizedId = normalizedIngredientId;
        
        // Проверяем строковое соответствие, частичное соответствие, и содержание
        return itemNormalizedId === ingredientNormalizedId ||
               (item.item_id || item.itemId || item.id) === ingredientId ||
               (itemNormalizedId && ingredientNormalizedId &&
                (itemNormalizedId.includes(ingredientNormalizedId) ||
                 ingredientNormalizedId.includes(itemNormalizedId)));
      });
      
      // Если нашли возможные совпадения, логируем их и берем первое
      if (possibleMatches.length > 0) {
        console.log(`Найдены возможные совпадения (${possibleMatches.length}):`,
                   possibleMatches.map(item => `${item.name} (${item.item_id || item.itemId || item.id}, тип: ${item.type})`));
        inventoryItem = possibleMatches[0];
      }
    }
    
    if (inventoryItem) {
      console.log(`Найден предмет в инвентаре: ${inventoryItem.name} (${inventoryItem.itemId}), тип: ${inventoryItem.type}, количество: ${inventoryItem.quantity}`);
    } else {
      console.log(`Предмет с ID ${ingredientId} не найден в инвентаре`);
      
      // НОВАЯ ЛОГИКА: Проверяем предметы с типом "ingredient" и похожим ID
      const ingredientTypeItems = player.inventory.items.filter(item =>
        item.type === 'ingredient' &&
        (normalizeItemId(item.item_id || item.itemId || item.id).includes(normalizedIngredientId) ||
         normalizedIngredientId.includes(normalizeItemId(item.item_id || item.itemId || item.id)))
      );
      
      if (ingredientTypeItems.length > 0) {
        console.log(`Найдены предметы с типом "ingredient" и похожим ID:`,
          ingredientTypeItems.map(item => `${item.name} (${item.item_id || item.itemId || item.id}), количество: ${item.quantity}`)
        );
        // Используем первый найденный предмет с типом "ingredient"
        inventoryItem = ingredientTypeItems[0];
        console.log(`Используем предмет с типом "ingredient" как доступный: ${inventoryItem.name}, количество: ${inventoryItem.quantity}`);
      }
    }
    
    // Важно: возвращаем количество найденного предмета,
    // даже если его тип "ingredient"
    return (inventoryItem ? inventoryItem.quantity : 0);
  };
  
  // Обработчик нажатия кнопки создания предмета
  const handleCraft = async () => {
    if (!selectedRecipe) return;
    
    // Проверяем наличие ингредиентов перед началом крафта
    if (!checkIngredients(selectedRecipe)) {
      // Показываем уведомление, если ингредиентов недостаточно
      if (actions && actions.addNotification) {
        actions.addNotification({
          message: 'Недостаточно ингредиентов для создания предмета',
          type: 'error'
        });
      }
      return;
    }
    
    // Начинаем процесс крафта
    setCraftingStatus('crafting');
    setCraftingProgress(0);
    
    try {
      // Симулируем процесс крафта с анимацией прогресса
      const craftingTime = 3000; // 3 секунды
      const interval = 50; // 50 миллисекунд для каждого обновления
      const steps = craftingTime / interval;
      let currentStep = 0;
      
      const craftingInterval = setInterval(() => {
        currentStep++;
        setCraftingProgress(Math.min(100, (currentStep / steps) * 100));
        
        if (currentStep >= steps) {
          clearInterval(craftingInterval);
          // Вызываем функцию завершения крафта, которая взаимодействует с API
          completeCrafting();
        }
      }, interval);
    } catch (error) {
      console.error('Ошибка при создании предмета:', error);
      setCraftingStatus('failed');
      setCraftingResult(null);
      
      // Показываем уведомление об ошибке
      if (actions && actions.addNotification) {
        actions.addNotification({
          message: `Ошибка при создании предмета: ${error.message}`,
          type: 'error'
        });
      }
    }
  };
  
  // Завершение процесса крафта
  const completeCrafting = async () => {
    try {
      // Получаем userId из контекста
      const userId = player.id;
      
      if (!userId || !selectedRecipe) {
        console.error('Отсутствует ID пользователя или выбранный рецепт');
        setCraftingStatus('failed');
        setCraftingResult(null);
        return;
      }
      
      console.log(`Вызов API создания предмета: userId=${userId}, recipeId=${selectedRecipe.id}`);
      console.log("КЛИЕНТ: Состояние инвентаря до крафта:",
        player.inventory.items.map(item => `${item.name} (ID: ${item.item_id || item.itemId || item.id}): ${item.quantity}`));
      console.log("КЛИЕНТ: Используемые ингредиенты:", selectedRecipe.ingredients);
      
      // Вызов API для создания предмета
      const result = await alchemyService.craftItem(userId, selectedRecipe.id);
      
      console.log('Результат создания предмета:', result);
      
      if (result.success) {
        setCraftingStatus('success');
        setCraftingResult({
          name: selectedRecipe.name,
          description: selectedRecipe.description,
          rarity: selectedRecipe.rarity,
          items: result.items // Получаем созданные предметы с сервера
        });
        
        // Показываем уведомление об успехе
        if (actions && actions.addNotification) {
          actions.addNotification({
            message: `Успешно создан предмет: ${selectedRecipe.name}`,
            type: 'success'
          });
        }
        
        // Упрощенная версия: обновляем инвентарь игрока через API
        if (actions && actions.refreshInventory) {
          console.log("КЛИЕНТ: Запрос на полное обновление инвентаря через API");
          actions.refreshInventory();
        } else {
          console.warn('Функция обновления инвентаря недоступна');
        }
        
        console.log("КЛИЕНТ: Состояние инвентаря после крафта:",
          player.inventory.items.map(item => `${item.name} (ID: ${item.item_id || item.itemId || item.id}): ${item.quantity}`));
        
        // Сразу сбрасываем выбранный рецепт
        setSelectedRecipe(null);
      } else {
        setCraftingStatus('failed');
        setCraftingResult(null);
        
        // Показываем уведомление о неудаче
        if (actions && actions.addNotification) {
          actions.addNotification({
            message: result.message || 'Не удалось создать предмет. Ингредиенты потрачены впустую.',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Ошибка при завершении создания предмета:', error);
      setCraftingStatus('failed');
      setCraftingResult(null);
      
      // Показываем уведомление об ошибке
      if (actions && actions.addNotification) {
        actions.addNotification({
          message: `Ошибка при создании предмета: ${error.message}`,
          type: 'error'
        });
      }
    }
  };
  
  // Рендеринг иконки рецепта
  const renderRecipeIcon = (type) => {
    switch (type) {
      case 'pill': return '💊';
      case 'talisman': return '📜';
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'accessory': return '💍';
      default: return '?';
    }
  };
  
  // Функция для сброса только результата крафта
  const resetCraftingResult = () => {
    setCraftingStatus(null);
    setCraftingResult(null);
  };
  
  // Рендеринг сообщения о результате крафта
  const renderCraftingResult = () => {
    // Дополнительная проверка на наличие выбранного рецепта
    if (!craftingStatus || craftingStatus === 'crafting' || !selectedRecipe) {
      return null;
    }
    
    if (craftingStatus === 'success' && craftingResult) {
      return (
        <ResultMessage success>
          <h3>Создание успешно!</h3>
          <p>Вы успешно создали {craftingResult.name}</p>
          {craftingResult.items && craftingResult.items.length > 0 && (
            <div>
              <p>Полученные предметы:</p>
              <ul style={{ listStyleType: 'none', padding: '0' }}>
                {craftingResult.items.map((item, index) => (
                  <li key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '5px 0',
                    padding: '5px',
                    background: 'rgba(0, 128, 0, 0.1)',
                    borderRadius: '3px'
                  }}>
                    <div style={{ marginRight: '10px' }}>
                      {renderRecipeIcon(item.type || 'unknown')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8em', color: '#aaa' }}>
                        {item.quantity > 1 ? `${item.quantity} шт.` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <ActionButton onClick={resetCraftingResult} style={{ marginTop: '15px' }}>
            Продолжить крафт
          </ActionButton>
        </ResultMessage>
      );
    } else if (selectedRecipe) {
      return (
        <ResultMessage success={false}>
          <h3>Создание не удалось!</h3>
          <p>Вы не смогли создать {selectedRecipe.name}. Ингредиенты потрачены впустую.</p>
        </ResultMessage>
      );
    }
    
    return null;
  };
  
  return (
    <TabContainer>
      <TabHeader>
        <TabTitle>Ремесло и создание предметов</TabTitle>
      </TabHeader>
      
      <TabMenu>
        <TabButton 
          active={activeTab === 'consumable'} // пилюли просто назовем расходниками, ведь у нас добавлены зелья и это все должно быть в одном разделе
          onClick={() => setActiveTab('consumable')}
        >
          Расходники
        </TabButton>
        <TabButton 
          active={activeTab === 'talismans'} 
          onClick={() => setActiveTab('talismans')}
        >
          Талисманы
        </TabButton>
        <TabButton 
          active={activeTab === 'weapons'} 
          onClick={() => setActiveTab('weapons')}
        >
          Оружие
        </TabButton>
        <TabButton 
          active={activeTab === 'armor'} 
          onClick={() => setActiveTab('armor')}
        >
          Броня
        </TabButton>
        <TabButton 
          active={activeTab === 'accessories'} 
          onClick={() => setActiveTab('accessories')}
        >
          Аксессуары
        </TabButton>
      </TabMenu>
      
      <TabContent>
        <LeftPanel>
          <SearchBar 
            placeholder="Поиск рецептов..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <FilterContainer>
            <FilterSelect 
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
            >
              <option value="all">Любая редкость</option>
              <option value="common">Обычные</option>
              <option value="uncommon">Необычные</option>
              <option value="rare">Редкие</option>
              <option value="epic">Эпические</option>
              <option value="legendary">Легендарные</option>
            </FilterSelect>
          </FilterContainer>
          
          <RecipeList>
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  selected={selectedRecipe && selectedRecipe.id === recipe.id}
                  onClick={() => selectRecipe(recipe)}
                >
                  <RecipeIcon>{renderRecipeIcon(recipe.type)}</RecipeIcon>
                  <RecipeInfo>
                    <RecipeName rarity={recipe.rarity}>{recipe.name}</RecipeName>
                    <RecipeDescription>{recipe.description}</RecipeDescription>
                  </RecipeInfo>
                </RecipeCard>
              ))
            ) : (
              <NoRecipesMessage>Нет доступных рецептов в этой категории</NoRecipesMessage>
            )}
          </RecipeList>
        </LeftPanel>
        
        <RightPanel>
          {selectedRecipe ? (
            <>
              <DetailTitle>{selectedRecipe.name}</DetailTitle>
              <RecipeDescription>{selectedRecipe.description}</RecipeDescription>
              
              <RecipeDetails>
                <DetailRow>
                  <DetailLabel>Тип:</DetailLabel>
                  <DetailValue>
                    {(() => {
                      switch(selectedRecipe.type) {
                        case 'pill': return 'Пилюля';
                        case 'talisman': return 'Талисман';
                        case 'weapon': return 'Оружие';
                        case 'armor': return 'Броня';
                        case 'accessory': return 'Аксессуар';
                        default: return selectedRecipe.type;
                      }
                    })()}
                  </DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Редкость:</DetailLabel>
                  <DetailValue style={{
                    color: (() => {
                      switch(selectedRecipe.rarity) {
                        case 'common': return '#aaa';
                        case 'uncommon': return '#1eff00';
                        case 'rare': return '#0070dd';
                        case 'epic': return '#a335ee';
                        case 'legendary': return '#ff8000';
                        default: return '#aaa';
                      }
                    })()
                  }}>
                    {(() => {
                      switch(selectedRecipe.rarity) {
                        case 'common': return 'Обычное';
                        case 'uncommon': return 'Необычное';
                        case 'rare': return 'Редкое';
                        case 'epic': return 'Эпическое';
                        case 'legendary': return 'Легендарное';
                        default: return selectedRecipe.rarity;
                      }
                    })()}
                  </DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Требуемая ступень:</DetailLabel>
                  <DetailValue>{selectedRecipe.requiredStage}</DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Требуемый уровень:</DetailLabel>
                  <DetailValue>{selectedRecipe.requiredLevel}</DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Шанс успеха:</DetailLabel>
                  <DetailValue>{selectedRecipe.successRate}%</DetailValue>
                </DetailRow>
              </RecipeDetails>
              
              <IngredientsList>
                <DetailTitle>Ингредиенты:</DetailTitle>
                {/* Дополнительная проверка для предотвращения дублирования */}
                {selectedRecipe && selectedRecipe.ingredients && Array.isArray(selectedRecipe.ingredients) ?
                  // Используем Set для обеспечения уникальности ингредиентов по id
                  [...new Set(selectedRecipe.ingredients.map(ing => ing.id))].map(id => {
                    // Находим первый ингредиент с таким id
                    const ingredient = selectedRecipe.ingredients.find(ing => ing.id === id);
                    if (!ingredient) return null; // Проверка на случай, если ингредиент не найден
                    
                    const inventoryQuantity = getIngredientQuantityInInventory(ingredient.id);
                    const hasEnough = inventoryQuantity >= ingredient.quantity;
                    
                    console.log(`Отображение ингредиента: ${ingredient.name} (${ingredient.id})`);
                    
                    return (
                    <IngredientItem
                      key={ingredient.id}
                      available={hasEnough}
                    >
                      <IngredientName available={hasEnough}>{ingredient.name}</IngredientName>
                      <IngredientQuantity available={hasEnough}>
                        <QuantityBadge enough={hasEnough}>
                          {inventoryQuantity}/{ingredient.quantity}
                        </QuantityBadge>
                         
                      </IngredientQuantity>
                    </IngredientItem>
                    );
                  }).filter(Boolean) // Фильтруем null значения
                : <div>Нет ингредиентов или неверный формат данных</div>}
              </IngredientsList>
              
              {craftingStatus === 'crafting' && (
                <CraftingProgress>
                  <ProgressBar progress={craftingProgress} />
                </CraftingProgress>
              )}
              
              {renderCraftingResult()}
              
              <ActionButton
                primary
                onClick={handleCraft}
                disabled={!selectedRecipe.hasAllIngredients || craftingStatus === 'crafting'}
              >
                {craftingStatus === 'crafting' ? 'Создание...' : 'Создать'}
              </ActionButton>
            </>
          ) : (
            <NoRecipesMessage>Выберите рецепт для просмотра деталей</NoRecipesMessage>
          )}
        </RightPanel>
      </TabContent>
    </TabContainer>
  );
};

export default AlchemyTab;
