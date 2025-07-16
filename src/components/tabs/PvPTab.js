/**
 * PvPTab - компонент для отображения вкладки PvP
 * Обеспечивает интерфейс для всех функций PvP-системы
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import styled from 'styled-components';
import {
    getPvPModes, getRooms, createRoom, joinRoom,
    getRoomDetails, performAction, getRoomState,
    getLeaderboard, getUserRatings, getUserBattleHistory,
    leaveRoom, getUserPvPStatus, dismissRoom
} from '../../services/pvp-service-api';
import BattleInterface from '../battle/BattleInterface';
import PvPBattleResult from '../battle/PvPBattleResult';

// Keyframe анимации
const fadeIn = `
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

const shimmer = `
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
`;

const pulse = `
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const spin = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Стилизованные компоненты
const TabContainer = styled.div`
  ${fadeIn}
  ${shimmer}
  ${pulse}
  ${spin}
  
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background: linear-gradient(135deg,
    rgba(30, 30, 30, 0.95) 0%,
    rgba(45, 45, 45, 0.95) 50%,
    rgba(30, 30, 30, 0.95) 100%
  );
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: #f0f0f0;
  animation: fadeIn 0.6s ease-out;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(212, 175, 55, 0.1),
      transparent
    );
    background-size: 200px 100%;
    animation: shimmer 3s infinite;
    border-radius: 12px;
    pointer-events: none;
  }
`;

const TabHeader = styled.div`
  margin-bottom: 24px;
  text-align: center;
  
  h2 {
    background: linear-gradient(135deg, #d4af37, #f4d03f, #b7950b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 2.2rem;
    font-weight: bold;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    animation: shimmer 3s infinite;
    background-size: 200% 100%;
  }
`;

const TabContent = styled.div`
  flex: 1;
  animation: fadeIn 0.8s ease-out 0.2s both;
`;

const TabMenu = styled.div`
  display: flex;
  background: linear-gradient(135deg,
    rgba(40, 40, 40, 0.8) 0%,
    rgba(55, 55, 55, 0.8) 100%
  );
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 24px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
`;

const TabMenuItem = styled.div`
  padding: 12px 24px;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  color: ${props => props.active ? '#1a1a1a' : '#f0f0f0'};
  background: ${props => props.active ?
    'linear-gradient(135deg, #d4af37, #f4d03f)' :
    'transparent'
  };
  border-radius: 8px;
  margin: 0 4px;
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
    background: linear-gradient(
      90deg,
      transparent,
      rgba(212, 175, 55, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }
  
  &:hover {
    color: ${props => props.active ? '#1a1a1a' : '#d4af37'};
    background: ${props => props.active ?
      'linear-gradient(135deg, #f4d03f, #d4af37)' :
      'rgba(212, 175, 55, 0.1)'
    };
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const StyledButton = styled.button`
  padding: 12px 24px;
  background: ${props => {
    if (props.disabled) return 'rgba(60, 60, 60, 0.5)';
    
    switch (props.variant) {
      case 'primary':
        return 'linear-gradient(135deg, #d4af37, #f4d03f)';
      case 'danger':
        return 'linear-gradient(135deg, #dc3545, #ff6b7a)';
      case 'success':
        return 'linear-gradient(135deg, #28a745, #4caf50)';
      case 'warning':
        return 'linear-gradient(135deg, #ffc107, #ffeb3b)';
      case 'secondary':
        return 'linear-gradient(135deg, #6c757d, #8e9297)';
      case 'outline-primary':
        return 'transparent';
      case 'outline-warning':
        return 'transparent';
      default:
        return 'linear-gradient(135deg, #495057, #6c757d)';
    }
  }};
  color: ${props => {
    if (props.disabled) return '#999';
    if (props.variant === 'outline-primary' || props.variant === 'outline-warning') {
      return '#d4af37';
    }
    return props.variant === 'warning' ? '#1a1a1a' : '#fff';
  }};
  border: ${props => {
    if (props.variant === 'outline-primary' || props.variant === 'outline-warning') {
      return '2px solid #d4af37';
    }
    return 'none';
  }};
  border-radius: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  margin: 0 6px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    background: ${props => {
      switch (props.variant) {
        case 'primary':
          return 'linear-gradient(135deg, #f4d03f, #d4af37)';
        case 'danger':
          return 'linear-gradient(135deg, #ff6b7a, #dc3545)';
        case 'success':
          return 'linear-gradient(135deg, #4caf50, #28a745)';
        case 'warning':
          return 'linear-gradient(135deg, #ffeb3b, #ffc107)';
        case 'secondary':
          return 'linear-gradient(135deg, #8e9297, #6c757d)';
        case 'outline-primary':
          return 'linear-gradient(135deg, #d4af37, #f4d03f)';
        case 'outline-warning':
          return 'linear-gradient(135deg, #ffc107, #ffeb3b)';
        default:
          return 'linear-gradient(135deg, #6c757d, #495057)';
      }
    }};
    color: ${props => {
      if (props.variant === 'outline-primary' || props.variant === 'outline-warning') {
        return '#1a1a1a';
      }
      return props.variant === 'warning' ? '#1a1a1a' : '#fff';
    }};
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.3);
  }
`;

const StyledCard = styled.div`
  background: linear-gradient(135deg,
    rgba(40, 40, 40, 0.9) 0%,
    rgba(50, 50, 50, 0.9) 50%,
    rgba(40, 40, 40, 0.9) 100%
  );
  border: 2px solid ${props => {
    if (props.selected) return '#d4af37';
    if (props.borderColor) return props.borderColor;
    return 'rgba(212, 175, 55, 0.3)';
  }};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(212, 175, 55, 0.1),
      transparent
    );
    background-size: 200px 100%;
    animation: ${props => props.selected ? 'shimmer 2s infinite' : 'none'};
    border-radius: 12px;
    pointer-events: none;
  }
  
  ${props => props.selected && `
    border-color: #d4af37;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.4), 0 4px 15px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg,
      rgba(212, 175, 55, 0.1) 0%,
      rgba(50, 50, 50, 0.9) 50%,
      rgba(212, 175, 55, 0.1) 100%
    );
  `}
  
  ${props => props.clickable && `
    &:hover:not([disabled]) {
      transform: translateY(-4px);
      border-color: #f4d03f;
      box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3), 0 4px 15px rgba(0, 0, 0, 0.3);
      background: linear-gradient(135deg,
        rgba(212, 175, 55, 0.05) 0%,
        rgba(55, 55, 55, 0.9) 50%,
        rgba(212, 175, 55, 0.05) 100%
      );
      
      &::before {
        animation: shimmer 1.5s infinite;
      }
    }
    
    &:active:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2), 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  `}
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 30%;
    height: 2px;
    background: linear-gradient(90deg, #d4af37, #f4d03f);
    border-radius: 1px;
  }
`;

const CardTitle = styled.h4`
  margin: 0;
  background: linear-gradient(135deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  font-size: 1.1rem;
`;

const CardBody = styled.div`
  animation: fadeIn 0.6s ease-out 0.1s both;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 8px;
  margin-right: 8px;
  background: ${props => {
    switch (props.bg) {
      case 'primary':
        return 'linear-gradient(135deg, #007bff, #0056b3)';
      case 'secondary':
        return 'linear-gradient(135deg, #6c757d, #495057)';
      case 'success':
        return 'linear-gradient(135deg, #28a745, #1e7e34)';
      case 'danger':
        return 'linear-gradient(135deg, #dc3545, #bd2130)';
      case 'warning':
        return 'linear-gradient(135deg, #d4af37, #b7950b)';
      case 'info':
        return 'linear-gradient(135deg, #17a2b8, #117a8b)';
      case 'light':
        return 'linear-gradient(135deg, #f8f9fa, #e9ecef)';
      case 'dark':
        return 'linear-gradient(135deg, #343a40, #212529)';
      default:
        return 'linear-gradient(135deg, #d4af37, #f4d03f)';
    }
  }};
  color: ${props => {
    if (props.text === 'dark') return '#212529';
    if (props.bg === 'light') return '#212529';
    if (props.bg === 'warning') return '#1a1a1a';
    return '#fff';
  }};
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    
    &::before {
      left: 100%;
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(20, 20, 20, 0.9) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg,
    rgba(30, 30, 30, 0.95) 0%,
    rgba(45, 45, 45, 0.95) 50%,
    rgba(30, 30, 30, 0.95) 100%
  );
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 16px;
  padding: 24px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  position: relative;
  animation: fadeIn 0.4s ease-out 0.1s both;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(212, 175, 55, 0.1),
      transparent
    );
    background-size: 200px 100%;
    animation: shimmer 3s infinite;
    border-radius: 16px;
    pointer-events: none;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 40%;
    height: 2px;
    background: linear-gradient(90deg, #d4af37, #f4d03f);
    border-radius: 1px;
  }
`;

const ModalTitle = styled.h4`
  margin: 0;
  background: linear-gradient(135deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
  font-weight: bold;
`;

const CloseButton = styled.button`
  background: linear-gradient(135deg, rgba(60, 60, 60, 0.8), rgba(80, 80, 80, 0.8));
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  color: #aaa;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #fff;
    background: linear-gradient(135deg, #d4af37, #f4d03f);
    border-color: #f4d03f;
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  gap: 12px;
`;

const ModalBody = styled.div`
  animation: fadeIn 0.6s ease-out 0.2s both;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  animation: fadeIn 0.6s ease-out;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
  font-size: 0.9rem;
`;

const FormControl = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg,
    rgba(40, 40, 40, 0.9) 0%,
    rgba(50, 50, 50, 0.9) 100%
  );
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: #f0f0f0;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  position: relative;
  
  &::placeholder {
    color: rgba(240, 240, 240, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
    background: linear-gradient(135deg,
      rgba(50, 50, 50, 0.9) 0%,
      rgba(60, 60, 60, 0.9) 100%
    );
  }
  
  &:hover:not(:focus) {
    border-color: rgba(212, 175, 55, 0.5);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg,
    rgba(40, 40, 40, 0.9) 0%,
    rgba(50, 50, 50, 0.9) 100%
  );
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: #f0f0f0;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  cursor: pointer;
  
  option {
    background-color: #2d2d2d;
    color: #f0f0f0;
    padding: 8px;
  }
  
  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
    background: linear-gradient(135deg,
      rgba(50, 50, 50, 0.9) 0%,
      rgba(60, 60, 60, 0.9) 100%
    );
  }
  
  &:hover:not(:focus) {
    border-color: rgba(212, 175, 55, 0.5);
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 20px;
  background: linear-gradient(135deg,
    rgba(40, 40, 40, 0.9) 0%,
    rgba(50, 50, 50, 0.9) 100%
  );
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.6s ease-out;
  
  th, td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    transition: all 0.3s ease;
  }
  
  th {
    background: linear-gradient(135deg,
      rgba(212, 175, 55, 0.2) 0%,
      rgba(244, 208, 63, 0.2) 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    color: #d4af37;
    font-weight: bold;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #d4af37, #f4d03f);
    }
  }
  
  td {
    color: #f0f0f0;
    font-size: 0.9rem;
  }
  
  tbody tr {
    transition: all 0.3s ease;
    position: relative;
    
    &:hover {
      background: linear-gradient(135deg,
        rgba(212, 175, 55, 0.1) 0%,
        rgba(244, 208, 63, 0.05) 100%
      );
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
      
      td {
        color: #fff;
      }
    }
    
    &:last-child td {
      border-bottom: none;
    }
  }
  
  thead tr:first-child th:first-child {
    border-top-left-radius: 10px;
  }
  
  thead tr:first-child th:last-child {
    border-top-right-radius: 10px;
  }
  
  tbody tr:last-child td:first-child {
    border-bottom-left-radius: 10px;
  }
  
  tbody tr:last-child td:last-child {
    border-bottom-right-radius: 10px;
  }
`;

const AlertBox = styled.div`
  padding: 16px 20px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: ${props => {
    switch (props.variant) {
      case 'success':
        return 'linear-gradient(135deg, rgba(40, 167, 69, 0.2), rgba(76, 175, 80, 0.1))';
      case 'info':
        return 'linear-gradient(135deg, rgba(23, 162, 184, 0.2), rgba(33, 150, 243, 0.1))';
      case 'warning':
        return 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.1))';
      case 'danger':
        return 'linear-gradient(135deg, rgba(220, 53, 69, 0.2), rgba(244, 67, 54, 0.1))';
      default:
        return 'linear-gradient(135deg, rgba(23, 162, 184, 0.2), rgba(33, 150, 243, 0.1))';
    }
  }};
  border: 2px solid ${props => {
    switch (props.variant) {
      case 'success':
        return 'rgba(40, 167, 69, 0.4)';
      case 'info':
        return 'rgba(23, 162, 184, 0.4)';
      case 'warning':
        return 'rgba(212, 175, 55, 0.4)';
      case 'danger':
        return 'rgba(220, 53, 69, 0.4)';
      default:
        return 'rgba(23, 162, 184, 0.4)';
    }
  }};
  color: #f0f0f0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.6s ease-out;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background: ${props => {
      switch (props.variant) {
        case 'success':
          return 'linear-gradient(180deg, #28a745, #4caf50)';
        case 'info':
          return 'linear-gradient(180deg, #17a2b8, #2196f3)';
        case 'warning':
          return 'linear-gradient(180deg, #d4af37, #f4d03f)';
        case 'danger':
          return 'linear-gradient(180deg, #dc3545, #f44336)';
        default:
          return 'linear-gradient(180deg, #17a2b8, #2196f3)';
      }
    }};
    border-radius: 0 3px 3px 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      ${props => {
        switch (props.variant) {
          case 'success':
            return 'rgba(40, 167, 69, 0.1)';
          case 'info':
            return 'rgba(23, 162, 184, 0.1)';
          case 'warning':
            return 'rgba(212, 175, 55, 0.1)';
          case 'danger':
            return 'rgba(220, 53, 69, 0.1)';
          default:
            return 'rgba(23, 162, 184, 0.1)';
        }
      }},
      transparent
    );
    background-size: 200px 100%;
    animation: shimmer 3s infinite;
    border-radius: 12px;
    pointer-events: none;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    border-color: ${props => {
      switch (props.variant) {
        case 'success':
          return 'rgba(40, 167, 69, 0.6)';
        case 'info':
          return 'rgba(23, 162, 184, 0.6)';
        case 'warning':
          return 'rgba(212, 175, 55, 0.6)';
        case 'danger':
          return 'rgba(220, 53, 69, 0.6)';
        default:
          return 'rgba(23, 162, 184, 0.6)';
      }
    }};
  }
`;

const ProgressBarContainer = styled.div`
  height: 24px;
  width: 100%;
  background: linear-gradient(135deg,
    rgba(40, 40, 40, 0.9) 0%,
    rgba(60, 60, 60, 0.9) 100%
  );
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    background-size: 100px 100%;
    animation: shimmer 2s infinite;
    pointer-events: none;
  }
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: ${props => {
    switch (props.variant) {
      case 'success':
        return 'linear-gradient(135deg, #28a745, #4caf50, #66bb6a)';
      case 'info':
        return 'linear-gradient(135deg, #17a2b8, #2196f3, #42a5f5)';
      case 'warning':
        return 'linear-gradient(135deg, #d4af37, #f4d03f, #ffeb3b)';
      case 'danger':
        return 'linear-gradient(135deg, #dc3545, #f44336, #ef5350)';
      default:
        return 'linear-gradient(135deg, #17a2b8, #2196f3, #42a5f5)';
    }
  }};
  width: ${props => props.percent}%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.6s ease;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    background-size: 50px 100%;
    animation: shimmer 1.5s infinite;
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    pointer-events: none;
  }
`;

const Container = styled.div``;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10px;
`;

const Col = styled.div`
  flex: ${props => props.md ? `0 0 ${(props.md / 12) * 100}%` : '1'};
  max-width: ${props => props.md ? `${(props.md / 12) * 100}%` : '100%'};
  padding: 0 10px;
`;

const LoadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    animation: ${fadeIn} 0.3s ease-out;
`;

const LoadingSpinner = styled.div`
    width: 48px;
    height: 48px;
    border: 4px solid rgba(212, 175, 55, 0.1);
    border-radius: 50%;
    border-top: 4px solid #d4af37;
    animation: ${spin} 1s linear infinite;
    margin-bottom: 16px;
    position: relative;
    
    &::after {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid transparent;
        border-top: 2px solid rgba(212, 175, 55, 0.3);
        border-radius: 50%;
        animation: ${spin} 2s linear infinite reverse;
    }
`;

const LoadingText = styled.div`
    color: #d4af37;
    font-size: 16px;
    font-weight: 500;
    background: linear-gradient(135deg, #d4af37, #f4d03f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ${pulse} 2s ease-in-out infinite;
`;

const PvPTab = () => {
    const { state, actions } = useGame();
    const player = state.player;
    
    // Улучшенная функция отображения уведомлений с лучшей обработкой ошибок
    const showToast = (message, type, details = null) => {
        // Проверяем, не является ли сообщение дублированным
        let formattedMessage = message;
        
        // Удаляем префиксы ошибок, если они уже есть в сообщении
        if (type === 'error') {
            const errorPrefixes = [
                'Ошибка при создании комнаты:',
                'Ошибка при присоединении к комнате:',
                'Ошибка при загрузке деталей комнаты:'
            ];
            
            for (const prefix of errorPrefixes) {
                if (formattedMessage.startsWith(prefix)) {
                    formattedMessage = formattedMessage.substring(prefix.length).trim();
                    break;
                }
            }
        }
        
        // Если это ошибка и есть детали, отображаем их в форматированном виде
        if (type === 'error' && details) {
            // Форматируем сообщение для лучшего отображения
            formattedMessage = `${formattedMessage}: ${details}`;
            
            // Логируем ошибку для отладки
            console.error('[PvP] Ошибка:', message, details);
        }
        
        actions.addNotification({
            message: formattedMessage,
            type,
            // Увеличиваем время отображения для ошибок, чтобы пользователь успел прочитать
            duration: type === 'error' ? 5000 : 3000
        });
    };
    
    // Основные состояния компонента
    const [activeTab, setActiveTab] = useState('rooms');
    const [modes, setModes] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedMode, setSelectedMode] = useState(null);
    
    // Состояния для создания комнаты
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [minLevel, setMinLevel] = useState(1);
    const [maxLevel, setMaxLevel] = useState(player?.cultivation_level || 10);
    
    // Состояния для просмотра комнаты и боя
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomDetails, setRoomDetails] = useState(null);
    const [joinTeam, setJoinTeam] = useState(1);
    
    // Эффект для отладки roomDetails - выполняется при каждом изменении roomDetails
    useEffect(() => {
        if (roomDetails) {
            console.log('[PvP] roomDetails обновлен:', roomDetails);
            
            // Проверка структуры данных
            if (!roomDetails.teams) {
                console.warn('[PvP] Отсутствует поле teams в roomDetails, данные могут отображаться некорректно');
            } else {
                console.log('[PvP] Структура teams:', roomDetails.teams);
                console.log('[PvP] Teams[1]:', roomDetails.teams['1']);
                console.log('[PvP] Teams[2]:', roomDetails.teams['2']);
                
                // Проверка наличия участников в команде 1
                const team1Count = roomDetails.participants?.filter(p => p.team === 1 || p.team === '1').length || 0;
                const team1TeamsCount = roomDetails.teams['1']?.length || 0;
                
                if (team1Count !== team1TeamsCount) {
                    console.warn(`[PvP] Несоответствие количества участников в команде 1: participants (${team1Count}) vs teams (${team1TeamsCount})`);
                }
                
                // Проверка наличия участников в команде 2
                const team2Count = roomDetails.participants?.filter(p => p.team === 2 || p.team === '2').length || 0;
                const team2TeamsCount = roomDetails.teams['2']?.length || 0;
                
                if (team2Count !== team2TeamsCount) {
                    console.warn(`[PvP] Несоответствие количества участников в команде 2: participants (${team2Count}) vs teams (${team2TeamsCount})`);
                }
            }
        }
    }, [roomDetails]);
    const [joinPosition, setJoinPosition] = useState(1);
    const [inBattle, setInBattle] = useState(false);
    const [battleState, setBattleState] = useState(null);
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [selectedAction, setSelectedAction] = useState(null);
    const [actionCooldown, setActionCooldown] = useState(0);
    
    // Состояния для рейтингов и истории
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRatings, setUserRatings] = useState([]);
    const [battleHistory, setBattleHistory] = useState([]);
    
    // Вспомогательные состояния
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [lastActionId, setLastActionId] = useState(0);
    const [loading, setLoading] = useState(false);
    const [silentLoading, setSilentLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    
    // Состояние для показа наград
    const [showRewards, setShowRewards] = useState(false);
    const [battleRewards, setBattleRewards] = useState(null);

    // Проверка текущего статуса пользователя в PvP при загрузке
    useEffect(() => {
        const checkUserPvPStatus = async () => {
            try {
                console.log('[PvPTab] Проверяем текущий статус пользователя в PvP');
                setLoading(true);
                
                const response = await getUserPvPStatus();
                
                if (response.success && response.inRoom) {
                    console.log('[PvPTab] Пользователь находится в комнате:', response);
                    
                    // Устанавливаем выбранную комнату
                    setSelectedRoom(response.roomId);
                    
                    // Загружаем детали комнаты
                    const roomDetails = await getRoomDetails(response.roomId);
                    
                    if (roomDetails.success) {
                        // Устанавливаем детали комнаты
                        setRoomDetails(roomDetails);
                        
                        // Если комната в статусе "in_progress", переходим в режим боя
                        if (roomDetails.room.status === 'in_progress') {
                            setInBattle(true);
                            setBattleState(roomDetails);
                            
                            // Установка максимального ID действия для последующих обновлений
                            if (roomDetails.actions?.length > 0) {
                                setLastActionId(Math.max(...roomDetails.actions.map(a => a.id)));
                            }
                            
                            // Показываем уведомление пользователю
                            showToast('Вы находитесь в активном бою. Перенаправляем...', 'info');
                        } else {
                            // Показываем уведомление пользователю
                            showToast('Вы находитесь в комнате ожидания. Перенаправляем...', 'info');
                        }
                    } else {
                        // Если не удалось загрузить детали комнаты, показываем ошибку
                        console.error('[PvPTab] Ошибка при загрузке деталей комнаты:', roomDetails);
                        showToast('Не удалось загрузить детали комнаты', 'error', roomDetails.details || roomDetails.message);
                    }
                }
            } catch (error) {
                console.error('[PvPTab] Ошибка при проверке статуса пользователя:', error);
                showToast('Ошибка при проверке статуса в PvP', 'error', error.message);
            } finally {
                setLoading(false);
            }
        };
        
        // Проверяем статус пользователя при загрузке компонента
        checkUserPvPStatus();
    }, [player.id]); // Зависимость от ID игрока

    // Загрузка режимов PvP
    useEffect(() => {
        const loadModes = async () => {
            try {
                setLoading(true);
                console.log('[PvPTab] Запрашиваем режимы PvP');
                
                const response = await getPvPModes();
                console.log('[PvPTab] Получен ответ:', response);
                
                // Более гибкая обработка различных форматов ответа
                if (response) {
                    let modesData = [];
                    
                    if (response.success && Array.isArray(response.modes)) {
                        // Стандартный формат { success: true, modes: [...] }
                        console.log('[PvPTab] Получены режимы в стандартном формате');
                        modesData = response.modes;
                    } else if (Array.isArray(response)) {
                        // Массив режимов без обертки
                        console.log('[PvPTab] Получен массив режимов без обертки');
                        modesData = response;
                    } else if (response.modes && Array.isArray(response.modes)) {
                        // Объект с полем modes без поля success
                        console.log('[PvPTab] Получен объект с полем modes без обертки success');
                        modesData = response.modes;
                    }
                    
                    // Логируем полученные режимы
                    console.log('[PvPTab] Режимы для отображения:', modesData);
                    
                    if (modesData.length > 0) {
                        setModes(modesData);
                        setSelectedMode(modesData[0].id);
                    } else {
                        console.warn('[PvPTab] Получен пустой список режимов');
                        showToast('Не найдены доступные режимы PvP', 'warning');
                    }
                } else {
                    console.error('[PvPTab] Получен пустой ответ от API');
                    showToast('Ошибка при загрузке режимов PvP', 'error', 'Получен пустой ответ от сервера');
                }
            } catch (error) {
                console.error('[PvPTab] Исключение при загрузке режимов PvP:', error);
                showToast('Ошибка при загрузке режимов PvP', 'error', error.message);
            } finally {
                setLoading(false);
            }
        };

        loadModes();
    }, []);

    // Загрузка комнат
    useEffect(() => {
        // Функция для начальной загрузки (с анимацией)
        const initialLoadRooms = async () => {
            try {
                console.log('[PvPTab] Начальная загрузка комнат (с анимацией)');
                setLoading(true);
                const response = await getRooms('waiting', selectedMode);
                if (response.success) {
                    setRooms(response.rooms);
                    // После успешной начальной загрузки переключаемся на тихие обновления
                    setInitialLoad(false);
                }
            } catch (error) {
                console.error('[PvPTab] Ошибка начальной загрузки комнат:', error);
                showToast('Ошибка при загрузке комнат', 'error', error.message);
                setInitialLoad(false);
            } finally {
                setLoading(false);
            }
        };
        
        // Функция для тихого обновления (без анимации)
        const silentLoadRooms = async () => {
            try {
                // Показываем в консоли для отладки, но не устанавливаем видимую анимацию
                console.log('[PvPTab] Тихое обновление комнат (без анимации)');
                setSilentLoading(true);
                
                const response = await getRooms('waiting', selectedMode);
                if (response.success) {
                    setRooms(response.rooms);
                }
            } catch (error) {
                console.error('[PvPTab] Ошибка тихого обновления комнат:', error);
                // Не показываем уведомление при фоновом обновлении, чтобы не раздражать пользователя
            } finally {
                setSilentLoading(false);
            }
        };

        if (selectedMode && activeTab === 'rooms') {
            // Используем соответствующую функцию в зависимости от того, первая ли это загрузка
            if (initialLoad) {
                initialLoadRooms();
            } else {
                silentLoadRooms();
            }
            
            // Для периодического обновления всегда используем тихую загрузку
            const interval = setInterval(silentLoadRooms, 5000); // Обновляем каждые 5 секунд без анимации
            return () => clearInterval(interval);
        }
    }, [selectedMode, activeTab, refreshTrigger, initialLoad]);

    // Загрузка рейтингов
    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                if (selectedMode) {
                    setLoading(true);
                    const response = await getLeaderboard(selectedMode, 'current');
                    if (response.success) {
                        setLeaderboard(response.leaderboard);
                    }
                    setLoading(false);
                }
            } catch (error) {
                showToast('Ошибка при загрузке таблицы лидеров', 'error', error.message);
            }
        };

        const loadUserRatings = async () => {
            try {
                setLoading(true);
                const response = await getUserRatings(player.id);
                if (response.success) {
                    setUserRatings(response.ratings);
                }
                setLoading(false);
            } catch (error) {
                showToast('Ошибка при загрузке рейтингов', 'error', error.message);
            }
        };

        if (activeTab === 'ratings' && player?.id) {
            loadLeaderboard();
            loadUserRatings();
        }
    }, [selectedMode, activeTab, player.id]);

    // Загрузка истории боев
    useEffect(() => {
        const loadBattleHistory = async () => {
            try {
                if (player?.id && activeTab === 'history') {
                    setLoading(true);
                    const response = await getUserBattleHistory(player.id);
                    if (response.success) {
                        setBattleHistory(response.history);
                    }
                    setLoading(false);
                }
            } catch (error) {
                showToast('Ошибка при загрузке истории боев', 'error', error.message);
            }
        };

        loadBattleHistory();
    }, [activeTab, player.id]);

    // Создание комнаты
    const handleCreateRoom = async () => {
        try {
            if (!roomName || !selectedMode) {
                showToast('Укажите название комнаты и режим', 'error', 'Необходимо указать название комнаты и выбрать режим PvP');
                return;
            }

            setLoading(true);
            const response = await createRoom(roomName, selectedMode, minLevel, maxLevel);
            setLoading(false);

            if (response.success) {
                showToast('Комната успешно создана', 'success');
                setShowCreateRoomModal(false);
                setRefreshTrigger(prev => prev + 1);
                
                // Сразу открываем детали комнаты
                setSelectedRoom(response.room.id);
                handleViewRoom(response.room.id);
            } else {
                // Если есть конкретная ошибка, показываем ее вместе с деталями
                const errorMessage = response.message || response.error || 'Не удалось создать комнату';
                const errorDetails = response.details || null;
                showToast(errorMessage, 'error', errorDetails);
                
                // Логируем полный ответ для отладки
                console.error('[PvP] Ошибка при создании комнаты:', response);
                
                // Важно: не продолжаем выполнение, если операция не удалась
                return;
            }
        } catch (error) {
            setLoading(false);
            
            // Извлекаем сообщение об ошибке и детали
            let errorMessage = 'Ошибка при создании комнаты';
            let errorDetails = error.message || 'Неизвестная ошибка';
            
            // Удаляем префикс "Ошибка при создании комнаты: ", если он уже есть в деталях
            if (errorDetails.startsWith('Ошибка при создании комнаты:')) {
                errorDetails = errorDetails.substring('Ошибка при создании комнаты:'.length).trim();
            }
            
            showToast(errorMessage, 'error', errorDetails);
            console.error('[PvP] Исключение при создании комнаты:', error);
        }
    };

    // Просмотр деталей комнаты
    const handleViewRoom = async (roomId) => {
        try {
            setLoading(true);
            const response = await getRoomDetails(roomId);
            setLoading(false);

            if (response.success) {
                // ВАЖНОЕ ИСПРАВЛЕНИЕ: Сохраняем полный ответ API, а не только response.room
                // Делаем глубокую копию ответа для изоляции состояний
                const fullRoomDetails = JSON.parse(JSON.stringify(response));
                
                // Подробное логирование структуры данных
                console.log('[PvP] Получен ответ от API:', fullRoomDetails);
                console.log('[PvP] Структура teams:', fullRoomDetails.teams);
                console.log('[PvP] Teams[1]:', fullRoomDetails.teams?.['1']);
                console.log('[PvP] Teams[2]:', fullRoomDetails.teams?.['2']);
                
                // Проверяем, что структура данных соответствует ожидаемой
                if (!fullRoomDetails.teams) {
                    console.warn('[PvP] Отсутствует поле teams в ответе API, создаем пустой объект');
                    fullRoomDetails.teams = { '1': [], '2': [] };
                }
                
                // Устанавливаем состояние с полным ответом API
                setRoomDetails(fullRoomDetails);
                
                // Проверяем, в бою ли пользователь
                const userParticipant = response.participants?.find(p => p.user_id === player.id);
                if (userParticipant && response.room.status === 'in_progress') {
                    setInBattle(true);
                    setBattleState(response);
                    
                    // Установка максимального ID действия для последующих обновлений
                    if (response.actions?.length > 0) {
                        setLastActionId(Math.max(...response.actions.map(a => a.id)));
                    }
                }
            } else if (response) {
                // Обработка ошибки от API
                showToast(response.message || 'Ошибка при загрузке деталей комнаты', 'error', response.details);
                console.error('[PvP] Ошибка API при загрузке деталей комнаты:', response);
            }
        } catch (error) {
            setLoading(false);
            
            // Извлекаем детали ошибки
            let details = null;
            if (error.response) {
                // Ошибка от API с деталями
                details = error.response.data?.details || error.response.data?.error || error.message;
            } else if (error.message) {
                // Стандартная ошибка JavaScript
                details = error.message;
            }
            
            showToast('Ошибка при загрузке деталей комнаты', 'error', details);
            console.error('[PvP] Исключение при загрузке деталей комнаты:', error);
        }
    };

    // Присоединение к комнате
    const handleJoinRoom = async (roomId, selectedTeam, selectedPosition) => {
        try {
            if (!roomId) return;
            
            console.log(`[PvP] Попытка присоединиться к комнате: ${roomId}, команда: ${selectedTeam}, позиция: ${selectedPosition}`);
            
            // Запоминаем текущих участников для отладки
            const currentParticipants = roomDetails?.participants || [];
            console.log('[PvP] Текущие участники перед присоединением:',
                currentParticipants.map(p => ({id: p.id, user_id: p.user_id, team: p.team, position: p.position})));
            
            setLoading(true);
            const response = await joinRoom(roomId, selectedTeam, selectedPosition);
            
            // Обрабатываем ответ API
            if (response.success) {
                // Определяем тип операции: новое присоединение или смена позиции
                if (response.positionChanged) {
                    // Это смена позиции
                    console.log('[PvP] Успешная смена позиции:', {
                        previousTeam: response.previousTeam,
                        previousPosition: response.previousPosition,
                        newTeam: selectedTeam,
                        newPosition: selectedPosition
                    });
                    
                    // Показываем специальное сообщение о смене позиции
                    showToast(`Вы сменили позицию с команды ${response.previousTeam} (позиция ${response.previousPosition}) на команду ${selectedTeam} (позиция ${selectedPosition})`, 'success');
                } else {
                    // Это первое присоединение к комнате
                    showToast('Вы успешно присоединились к комнате', 'success');
                }
                
                console.log('[PvP] Успешная операция, запрашиваем обновленные данные');
                
                // Функция для получения обновленных данных с несколькими попытками
                const fetchUpdatedDetails = async (attempts = 3, delay = 500) => {
                    console.log(`[PvP] Попытка получения обновленных данных (осталось попыток: ${attempts})`);
                    
                    try {
                        // Делаем паузу перед запросом
                        await new Promise(resolve => setTimeout(resolve, delay));
                        
                        // Запрашиваем данные о комнате
                        const updatedRoomDetails = await getRoomDetails(roomId);
                        
                        if (updatedRoomDetails.success) {
                            console.log('[PvP] Получены обновленные данные комнаты:', updatedRoomDetails);
                            
                            // Проверяем, содержит ли ответ ожидаемые данные
                            const userParticipant = updatedRoomDetails.participants?.find(p =>
                                p.user_id === player.id &&
                                (p.team === selectedTeam || p.team === selectedTeam.toString()) &&
                                (p.position === selectedPosition || p.position === selectedPosition.toString()));
                            
                            if (userParticipant) {
                                console.log('[PvP] Найден пользователь в обновленных данных:', userParticipant);
                                
                                // Детальный лог структуры данных перед обновлением
                                console.log('[PvP] Структура полученных обновленных данных:', updatedRoomDetails);
                                console.log('[PvP] Команды в ответе API:', updatedRoomDetails.teams);
                                
                                // Проверяем и исправляем структуру данных, если необходимо
                                const fixedDetails = JSON.parse(JSON.stringify(updatedRoomDetails));
                                
                                // Проверяем, что поле teams существует и содержит ожидаемую структуру
                                if (!fixedDetails.teams) {
                                    console.warn('[PvP] Создаем отсутствующее поле teams');
                                    fixedDetails.teams = { '1': [], '2': [] };
                                }
                                
                                // Обновляем состояние с новыми данными
                                setRoomDetails(fixedDetails);
                                
                                // Дополнительная отладка - показываем обновленное состояние
                                setTimeout(() => {
                                    console.log('[PvP] Состояние roomDetails после обновления:', roomDetails);
                                    console.log('[PvP] Teams после обновления:', roomDetails.teams);
                                }, 100);
                                
                                // Принудительно обновляем интерфейс
                                setRefreshTrigger(prev => prev + 1);
                                return true;
                            } else if (attempts > 1) {
                                console.warn('[PvP] Пользователь не найден в данных, повторная попытка...');
                                return fetchUpdatedDetails(attempts - 1, delay * 1.5);
                            } else {
                                console.error('[PvP] Пользователь не найден в данных после всех попыток:',
                                    'искали user_id:', player.id, 'team:', selectedTeam, 'position:', selectedPosition,
                                    'имеющиеся участники:', updatedRoomDetails.participants);
                                
                                // Даже если пользователь не найден, все равно обновляем данные
                                setRoomDetails(JSON.parse(JSON.stringify(updatedRoomDetails)));
                                setRefreshTrigger(prev => prev + 1);
                                return false;
                            }
                        } else if (attempts > 1) {
                            console.warn('[PvP] Ошибка получения данных, повторная попытка...');
                            return fetchUpdatedDetails(attempts - 1, delay * 1.5);
                        } else {
                            console.error('[PvP] Ошибка получения данных после всех попыток:', updatedRoomDetails);
                            return false;
                        }
                    } catch (error) {
                        console.error('[PvP] Исключение при получении данных:', error);
                        
                        if (attempts > 1) {
                            console.warn('[PvP] Повторная попытка после ошибки...');
                            return fetchUpdatedDetails(attempts - 1, delay * 1.5);
                        }
                        return false;
                    }
                };
                
                // Запускаем процесс обновления данных
                await fetchUpdatedDetails();
                
                // Если бой начался, переходим в режим боя
                if (response.roomStarted) {
                    setInBattle(true);
                    showToast('Бой начался! Приготовьтесь!', 'warning');
                }
            } else {
                // Обработка ошибок из API с улучшенным форматированием
                console.error('[PvP] Ошибка API при присоединении:', response);
                
                // Извлекаем основное сообщение и детали
                const mainMessage = response.message || 'Ошибка при присоединении к комнате';
                const details = response.details || null;
                
                // Используем улучшенную функцию showToast с передачей деталей
                showToast(mainMessage, 'error', details);
                
                // Добавляем временные элементы отладки в консоль
                console.debug('[PvP DEBUG] Полный ответ API:', JSON.stringify(response, null, 2));
            }
        } catch (error) {
            // Улучшенная обработка исключений
            console.error('[PvP] Исключение при присоединении к комнате:', error);
            
            // Форматирование сообщения об ошибке для пользователя
            const mainMessage = 'Ошибка при присоединении к комнате';
            
            // Извлекаем детали ошибки
            let details = null;
            if (error.response) {
                // Ошибка от API с деталями
                details = error.response.data?.details || error.response.data?.error || error.message;
            } else if (error.message) {
                // Стандартная ошибка JavaScript
                details = error.message;
            }
            
            // Используем улучшенную функцию showToast с передачей деталей
            showToast(mainMessage, 'error', details);
            
            // Выводим дополнительную отладочную информацию
            if (error.stack) {
                console.debug('[PvP DEBUG] Stack trace:', error.stack);
            }
        } finally {
            setLoading(false);
        }
    };

    // Обновление состояния комнаты во время боя
    useEffect(() => {
        const updateBattleState = async () => {
            console.log('[PvP UPDATE DEBUG] updateBattleState вызвана');
            console.log('[PvP UPDATE DEBUG] selectedRoom:', selectedRoom, 'inBattle:', inBattle);
            
            try {
                if (!selectedRoom || !inBattle) {
                    console.log('[PvP UPDATE DEBUG] Выход из updateBattleState - нет комнаты или не в бою');
                    return;
                }
                
                console.log('[PvP UPDATE DEBUG] Запрашиваем состояние комнаты...');
                const response = await getRoomState(selectedRoom, lastActionId);
                console.log('[PvP UPDATE DEBUG] Получен ответ от getRoomState:', response);
                
                if (response.success) {
                    console.log('[PvP UPDATE DEBUG] Ответ успешный, статус комнаты:', response.room?.status);
                    // Обрабатываем эффекты для всех участников
                    if (response.participants && Array.isArray(response.participants)) {
                        const updatedParticipants = response.participants.map(participant => {
                            // Обновляем длительность эффектов
                            const withUpdatedEffects = updateEffectsDuration(participant);
                            // Применяем эффекты
                            return applyEffects(withUpdatedEffects);
                        });
                        
                        // Обновляем response с обработанными эффектами
                        response.participants = updatedParticipants;
                    }
                    
                    // Устанавливаем обновленное состояние
                    setBattleState(response);
                    
                    // Обновляем lastActionId, если есть новые действия
                    if (response.actions.length > 0) {
                        const maxActionId = Math.max(...response.actions.map(a => a.id));
                        if (maxActionId > lastActionId) {
                            setLastActionId(maxActionId);
                        }
                    }
                    
                    // Если бой завершен, показываем результаты
                    console.log('[PvP UPDATE DEBUG] Проверяем статус комнаты для завершения боя...');
                    if (response.room.status === 'completed' || response.room.status === 'dismissed') {
                        console.log('[PvP REWARDS DEBUG] ✅ Бой завершен! Статус:', response.room.status, 'Анализируем награды...');
                        console.log('[PvP REWARDS DEBUG] Полный response:', JSON.stringify(response, null, 2));
                        
                        const winnerTeam = response.room.winner_team;
                        const participant = response.participants.find(p => p.user_id === player.id);
                        const isWinner = participant && participant.team === winnerTeam;
                        
                        console.log('[PvP REWARDS DEBUG] Winner team:', winnerTeam);
                        console.log('[PvP REWARDS DEBUG] Player participant:', participant);
                        console.log('[PvP REWARDS DEBUG] Is winner:', isWinner);
                        console.log('[PvP REWARDS DEBUG] Response.rewards:', response.rewards);
                        
                        // Получаем награды для текущего игрока
                        // Проверяем разные возможные структуры данных
                        let playerRewards = null;
                        
                        if (response.rewards) {
                            // Вариант 1: награды в response.rewards[player.id]
                            playerRewards = response.rewards[player.id];
                            console.log('[PvP REWARDS DEBUG] Вариант 1 - rewards[player.id]:', playerRewards);
                            
                            // Вариант 2: награды напрямую в response.rewards (как в PvE)
                            if (!playerRewards && typeof response.rewards === 'object' && !Array.isArray(response.rewards)) {
                                playerRewards = response.rewards;
                                console.log('[PvP REWARDS DEBUG] Вариант 2 - прямые rewards:', playerRewards);
                            }
                        }
                        
                        // Вариант 3: награды в response.room.rewards
                        if (!playerRewards && response.room && response.room.rewards) {
                            playerRewards = response.room.rewards[player.id] || response.room.rewards;
                            console.log('[PvP REWARDS DEBUG] Вариант 3 - room.rewards:', playerRewards);
                        }
                        
                        console.log('[PvP REWARDS DEBUG] Финальные playerRewards:', playerRewards);
                        
                        if (playerRewards) {
                            console.log('[PvP REWARDS DEBUG] Показываем компонент с наградами');
                            console.log('[PvP REWARDS DEBUG] playerRewards:', playerRewards);
                            
                            const battleRewardsData = {
                                result: playerRewards.result || (isWinner ? 'victory' : 'defeat'), // Используем результат от backend
                                rewards: playerRewards.rewards || playerRewards, // Поддерживаем разные форматы
                                ratingChange: playerRewards.ratingChange || 0
                            };
                            
                            console.log('[PvP REWARDS DEBUG] Устанавливаем battleRewards:', battleRewardsData);
                            setBattleRewards(battleRewardsData);
                            
                            console.log('[PvP REWARDS DEBUG] Устанавливаем showRewards: true');
                            setShowRewards(true);
                            
                            // Проверяем состояние после установки
                            setTimeout(() => {
                                console.log('[PvP REWARDS DEBUG] Состояние после установки - showRewards:', showRewards, 'battleRewards:', battleRewards);
                            }, 100);
                        } else {
                            console.log('[PvP REWARDS DEBUG] Награды не найдены, показываем уведомление');
                            // Если нет наград, показываем обычное уведомление
                            showToast(
                                `Бой завершен! ${isWinner ? 'Ваша команда победила!' : 'Ваша команда проиграла.'}`,
                                isWinner ? 'success' : 'warning'
                            );
                        }
                        
                        // ИСПРАВЛЕНИЕ: Полный сброс состояний боя
                        setInBattle(false);
                        setBattleState(null);
                        setSelectedTarget(null);
                        setSelectedAction(null);
                        setActionCooldown(0);
                        
                        // Автоматически распускаем комнату после завершения боя
                        try {
                            await dismissRoom(selectedRoom);
                            console.log(`[PvP] Комната ${selectedRoom} успешно распущена после завершения боя`);
                            
                            // Сбрасываем selectedRoom только после успешного роспуска комнаты
                            setSelectedRoom(null);
                        } catch (dismissError) {
                            console.error(`[PvP] Ошибка при роспуске комнаты ${selectedRoom}:`, dismissError);
                            // Показываем дружественное сообщение пользователю
                            showToast('Произошла ошибка при закрытии комнаты, но результаты боя сохранены', 'info');
                            // В случае ошибки все равно сбрасываем выбранную комнату
                            setSelectedRoom(null);
                        }
                        
                        // Автоматическая загрузка истории боев после завершения
                        try {
                            const historyResponse = await getUserBattleHistory(player.id);
                            if (historyResponse.success) {
                                setBattleHistory(historyResponse.history);
                            }
                        } catch (historyError) {
                            console.error(`[PvP] Ошибка при загрузке истории боев:`, historyError);
                        }
                        
                        // Перезагружаем историю и рейтинги
                        setActiveTab('history');
                        
                        // Обновляем триггер для обновления списка комнат
                        setRefreshTrigger(prev => prev + 1);
                    } else {
                        console.log('[PvP UPDATE DEBUG] ❌ Бой НЕ завершен, статус:', response.room.status, '(ожидаем completed или dismissed)');
                    }
                }
            } catch (error) {
                console.error('Ошибка при обновлении состояния боя:', error);
            }
        };
        
        if (inBattle) {
            updateBattleState();
            const interval = setInterval(updateBattleState, 1000); // Обновление каждую секунду
            return () => clearInterval(interval);
        }
    }, [inBattle, selectedRoom, lastActionId, player.id]);

    // Обработка кулдауна действий
    useEffect(() => {
        let interval;
        if (actionCooldown > 0) {
            interval = setInterval(() => {
                setActionCooldown(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [actionCooldown]);

    // Функция для обновления длительности эффектов участника
    const updateEffectsDuration = (participant) => {
        if (!participant || !participant.effects || !Array.isArray(participant.effects)) return participant;
        
        console.log(`[DEBUG] PvPTab: Обновление длительности эффектов для участника ${participant.id}`);
        
        // Уменьшаем длительность всех эффектов на 1 ход
        const updatedEffects = participant.effects.map(effect => ({
            ...effect,
            elapsedTurns: (effect.elapsedTurns || 0) + 1,
            // Вычисляем оставшиеся ходы
            remainingTurns: effect.duration - ((effect.elapsedTurns || 0) + 1)
        }))
        // Фильтруем эффекты, удаляя те, у которых закончилась длительность
        .filter(effect => {
            const isExpired = effect.remainingTurns <= 0;
            if (isExpired) {
                console.log(`[DEBUG] PvPTab: Эффект ${effect.name} (${effect.type}) истек`);
            }
            return !isExpired;
        });
        
        return {
            ...participant,
            effects: updatedEffects
        };
    };
    
    // Функция для применения эффектов к участнику
    const applyEffects = (participant) => {
        if (!participant || !participant.effects || !Array.isArray(participant.effects)) return participant;
        
        console.log(`[DEBUG] PvPTab: Применение эффектов для участника ${participant.id}`);
        
        let statsModifiers = {
            damage: 0,
            defense: 0,
            speed: 0,
            energyRegen: 0
        };
        
        // Расчет модификаторов от активных эффектов
        participant.effects.forEach(effect => {
            switch(effect.type) {
                case 'regenerate':
                    // Накопление энергии
                    statsModifiers.energyRegen += 15; // Восстановление 15 единиц энергии
                    console.log(`[DEBUG] PvPTab: Применен эффект regenerate, +15 энергии`);
                    break;
                case 'weaken':
                    // Ослабление снижает наносимый урон
                    statsModifiers.damage -= 25; // Снижение урона на 25%
                    console.log(`[DEBUG] PvPTab: Применен эффект weaken, -25% к урону`);
                    break;
                case 'protect':
                    // Защита снижает получаемый урон
                    statsModifiers.defense += 40; // Снижение получаемого урона на 40%
                    console.log(`[DEBUG] PvPTab: Применен эффект protect, +40% к защите`);
                    break;
                case 'speed':
                    // Увеличение скорости
                    statsModifiers.speed += 20; // Увеличение скорости на 20%
                    console.log(`[DEBUG] PvPTab: Применен эффект speed, +20% к скорости`);
                    break;
            }
        });
        
        // Обработка эффектов периодического урона (ДОТ)
        let dotDamage = 0;
        participant.effects.forEach(effect => {
            if (effect.type === 'burn' || effect.type === 'bleed') {
                // Базовое значение ДОТ из эффекта или значение по умолчанию
                const baseDamage = effect.damage || 8; // 8 единиц урона по умолчанию
                dotDamage += baseDamage;
                console.log(`[DEBUG] PvPTab: Применен эффект ${effect.type}, ${baseDamage} урона от ДОТ`);
            }
        });
        
        // Применяем урон от ДОТ эффектов
        const newHP = Math.max(0, participant.current_hp - dotDamage);
        
        // Применение регенерации энергии
        const newEnergy = Math.min(
            participant.max_energy,
            participant.current_energy + statsModifiers.energyRegen
        );
        
        // Проверка на наличие эффекта оглушения
        const isStunned = participant.effects.some(effect => effect.type === 'stun');
        if (isStunned) {
            console.log(`[DEBUG] PvPTab: Участник ${participant.id} оглушен и не может действовать`);
        }
        
        return {
            ...participant,
            current_hp: newHP,
            current_energy: newEnergy,
            statsModifiers,
            canAct: !isStunned
        };
    };

    // Выполнение действия в бою
    const handlePerformAction = async (actionType, targetId, techniqueId) => {
        try {
            console.log(`[DEBUG] PvPTab: Выполнение действия ${actionType} с целью ${targetId} и техникой ${techniqueId}`);
            
            if (!selectedRoom || actionCooldown > 0) return;
            
            // Если techniqueId не передан, но это действие техники, используем selectedAction
            if (actionType === 'technique' && !techniqueId) {
                techniqueId = selectedAction;
            }
            
            // Перед выполнением действия обновляем длительность эффектов для текущего игрока
            if (battleState && battleState.participants) {
                const currentPlayerParticipant = battleState.participants.find(p => p.user_id === player.id);
                if (currentPlayerParticipant) {
                    // Обновляем длительность эффектов
                    const updatedParticipant = updateEffectsDuration(currentPlayerParticipant);
                    // Применяем эффекты
                    const participantWithEffects = applyEffects(updatedParticipant);
                    
                    // Проверяем, не оглушен ли игрок
                    if (participantWithEffects.effects?.some(effect => effect.type === 'stun')) {
                        showToast('Вы оглушены и не можете действовать в этом ходу', 'warning');
                        return;
                    }
                    
                    // Обновляем состояние в battleState
                    const updatedParticipants = battleState.participants.map(p =>
                        p.user_id === player.id ? participantWithEffects : p
                    );
                    
                    setBattleState({
                        ...battleState,
                        participants: updatedParticipants
                    });
                }
            }
            
            // Проверяем, требуется ли цель для выбранного действия
            let requiresTarget = false;
            
            if (actionType === 'attack') {
                // Атака всегда требует цель
                requiresTarget = true;
            } else if (actionType === 'technique' && techniqueId) {
                // Для техник проверяем флаг requiresTarget
                const availableActions = prepareBattleActions(battleState);
                const technique = availableActions.find(action =>
                    action.type === 'technique' && action.id === techniqueId);
                
                if (technique) {
                    requiresTarget = technique.requiresTarget;
                    console.log(`[DEBUG] PvPTab: Техника ${techniqueId} (${technique.name}) ${requiresTarget ? 'требует' : 'не требует'} выбора цели`);
                }
            }
            
            // Если действие требует цель, но цель не указана, показываем предупреждение
            if (requiresTarget && !targetId) {
                showToast('Выберите цель для атаки', 'warning');
                return;
            }
            
            setLoading(true);
            const response = await performAction(selectedRoom, actionType, targetId, techniqueId);
            setLoading(false);

            if (response.success) {
                setActionCooldown(5); // Устанавливаем кулдаун на 5 секунд
                
                let actionMessage = '';
                if (actionType === 'attack') {
                    actionMessage = `Атака нанесла ${response.damage} урона`;
                } else if (actionType === 'defense') {
                    actionMessage = 'Защитная стойка активирована';
                } else if (actionType === 'technique') {
                    // Находим технику по ID для отображения ее названия
                    const technique = prepareBattleActions(battleState)
                        .find(action => action.type === 'technique' && action.id === techniqueId);
                    
                    const techniqueName = technique ? technique.name : `Техника ${techniqueId}`;
                    actionMessage = `${techniqueName} применена`;
                    if (response.damage > 0) actionMessage += `, нанесено ${response.damage} урона`;
                    if (response.healing > 0) actionMessage += `, восстановлено ${response.healing} здоровья`;
                }
                
                showToast(actionMessage, 'success');
                
                // Обновляем состояние боя
                try {
                    const updatedState = await getRoomState(selectedRoom);
                    if (updatedState.success) {
                        setBattleState(updatedState);
                    }
                } catch (updateError) {
                    console.error('Ошибка при обновлении состояния боя:', updateError);
                }
                
                // Сбрасываем выбор
                setSelectedTarget(null);
                setSelectedAction(null);
            }
        } catch (error) {
            setLoading(false);
            showToast('Ошибка при выполнении действия', 'error', error.message);
        }
    };

    // Найти участника текущего пользователя
    const getCurrentUserParticipant = useCallback(() => {
        if (!battleState || !battleState.participants) return null;
        return battleState.participants.find(p => p.user_id === player.id);
    }, [battleState, player.id]);
    
    // Вспомогательные функции для нового интерфейса боя
    
    /**
     * Подготовка данных игрока для интерфейса боя
     * @param {Object} battleState - Состояние боя
     * @returns {Object} Данные игрока для интерфейса
     */
    const prepareBattlePlayer = (battleState) => {
        // Находим участника, соответствующего текущему игроку
        const playerParticipant = battleState.participants?.find(p => p.user_id === player.id);
        
        if (!playerParticipant) {
            console.error('[PvP] Не найден участник для текущего игрока');
            return {
                name: player.name,
                level: player.cultivation?.level || 1,
                icon: player.avatar || '👤',
                stats: {
                    health: 100,
                    maxHealth: 100,
                    energy: 100,
                    maxEnergy: 100
                },
                effects: [],
                cooldowns: {}
            };
        }
        
        return {
            name: playerParticipant.username || player.name,
            level: playerParticipant.level || player.cultivation?.level || 1,
            icon: player.avatar || '👤',
            stats: {
                health: playerParticipant.current_hp,
                maxHealth: playerParticipant.max_hp,
                energy: playerParticipant.current_energy,
                maxEnergy: playerParticipant.max_energy
            },
            effects: playerParticipant.effects || [],
            cooldowns: playerParticipant.cooldowns || {}
        };
    };
    
    /**
     * Подготовка данных противников для интерфейса боя
     * @param {Object} battleState - Состояние боя
     * @returns {Array} Массив данных противников
     */
    const prepareBattleOpponents = (battleState) => {
        // Находим участника, соответствующего текущему игроку
        const playerParticipant = battleState.participants?.find(p => p.user_id === player.id);
        
        if (!playerParticipant) {
            console.error('[PvP] Не найден участник для текущего игрока');
            return [];
        }
        
        // Определяем команду противников
        const opponentTeam = playerParticipant.team === 1 ? 2 : 1;
        
        // Фильтруем участников, принадлежащих команде противников
        const opponents = battleState.participants?.filter(p =>
            p.team === opponentTeam || p.team === opponentTeam.toString()
        ) || [];
        
        return opponents.map(opponent => ({
            id: opponent.id,
            name: opponent.username || 'Противник',
            level: opponent.level || 1,
            icon: '👹',
            stats: {
                health: opponent.current_hp,
                maxHealth: opponent.max_hp,
                energy: opponent.current_energy,
                maxEnergy: opponent.max_energy
            },
            effects: opponent.effects || []
        }));
    };
    
    /**
     * Подготовка данных о доступных действиях
     * @param {Object} battleState - Состояние боя
     * @returns {Array} Массив доступных действий
     */
    const prepareBattleActions = (battleState) => {
        // Базовые действия, доступные всегда
        const baseActions = [
            {
                id: 'basicAttack',
                name: 'Обычная атака',
                description: 'Простая физическая атака',
                type: 'attack',
                damage: 10,
                energyCost: 0,
                cooldown: 0,
                icon: '⚔️',
                requiresTarget: true // Атака всегда требует цель
            },
            {
                id: 'defense',
                name: 'Защита',
                description: 'Восстанавливает энергию и снижает получаемый урон',
                type: 'defense',
                energyCost: 0,
                cooldown: 0,
                icon: '🛡️',
                requiresTarget: false // Защита не требует цель
            }
        ];
        
        // Получаем техники игрока
        const playerTechniques = player.techniques?.map(technique => {
            // Определяем, требует ли техника выбора цели
            let requiresTarget = technique.type === 'attack';
            
            // Техники с уроном обычно требуют цель
            if (technique.damage !== undefined && technique.damage > 0) {
                requiresTarget = true;
            }
            
            // Техники с targetType = self не требуют выбора цели
            if (technique.targetType === 'self') {
                requiresTarget = false;
            }
            
            // Специальная обработка для техники "Дыхание Небес"
            if (technique.id === 'heavenly_breath') {
                console.log('[DEBUG] PvPTab: Техника "Дыхание Небес" не требует выбора цели');
                requiresTarget = false;
            }
            
            // Техники с типом "cultivation" не требуют выбора цели
            if (technique.type === 'cultivation') {
                requiresTarget = false;
            }
            
            console.log(`[DEBUG] PvPTab: Техника ${technique.id} (${technique.name}): requiresTarget=${requiresTarget}, type=${technique.type}, damage=${technique.damage}`);
            
            return {
                id: technique.id,
                name: technique.name,
                description: technique.description || 'Техника культивации',
                type: 'technique',
                techniqueType: technique.type, // Сохраняем оригинальный тип техники
                damage: technique.damage || 0, // Используем 0 по умолчанию, чтобы избежать проблем с undefined
                damageType: technique.damageType || 'physical',
                energyCost: technique.energyCost || 25,
                cooldown: technique.cooldown || 3,
                icon: technique.icon || '✨',
                effects: technique.effects || [],
                requiresTarget: requiresTarget // Добавляем флаг, требует ли техника выбора цели
            };
        }) || [];
        
        return [...baseActions, ...playerTechniques];
    };
    
    /**
     * Определение, чей сейчас ход
     * @param {Object} battleState - Состояние боя
     * @returns {boolean} true, если ход игрока
     */
    const isPlayerTurn = (battleState) => {
        // В текущей реализации всегда ход игрока
        // В будущем можно добавить логику определения хода
        return true;
    };
    
    /**
     * Подготовка лога боя
     * @param {Object} battleState - Состояние боя
     * @returns {Array} Массив записей лога
     */
    const prepareBattleLog = (battleState) => {
        return battleState.actions?.map(action => ({
            message: formatActionMessage(action, battleState),
            type: action.action_type
        })) || [];
    };
    
    /**
     * Форматирование сообщения о действии
     * @param {Object} action - Действие
     * @param {Object} battleState - Состояние боя
     * @returns {string} Отформатированное сообщение
     */
    const formatActionMessage = (action, battleState) => {
        const actor = battleState?.participants?.find(p => p.id === action.participant_id);
        const target = battleState?.participants?.find(p => p.id === action.target_id);
        
        const actorName = actor?.username || 'Неизвестный';
        const targetName = target?.username || 'Неизвестный';
        
        switch (action.action_type) {
            case 'attack':
                return `${actorName} атакует ${targetName} и наносит ${action.damage} урона`;
            case 'defense':
                return `${actorName} принимает защитную стойку`;
            case 'technique':
                return `${actorName} использует технику на ${targetName} и наносит ${action.damage} урона`;
            default:
                return `${actorName} выполняет действие ${action.action_type}`;
        }
    };
    
    /**
     * Обработка действий в бою
     * @param {Object} action - Выбранное действие
     * @param {number} targetId - ID цели
     * @returns {Promise} Промис с результатом действия
     */
    const handleBattleAction = async (action, targetId) => {
        try {
            if (actionCooldown > 0) {
                showToast('Подождите перед следующим действием', 'warning');
                return;
            }
            
            // Устанавливаем кулдаун на действия
            setActionCooldown(5); // 5 секунд кулдауна
            
            // Выполняем действие
            const response = await performAction(
                selectedRoom,
                action.type,
                targetId,
                action.type === 'technique' ? action.id : null
            );
            
            if (response.success) {
                // Обновляем состояние боя
                const updatedState = await getRoomState(selectedRoom);
                if (updatedState.success) {
                    setBattleState(updatedState);
                }
                
                let actionMessage = '';
                if (action.type === 'attack') {
                    actionMessage = `Атака нанесла ${response.damage} урона`;
                } else if (action.type === 'defense') {
                    actionMessage = 'Защитная стойка активирована';
                } else if (action.type === 'technique') {
                    actionMessage = `Техника ${action.name} применена`;
                    if (response.damage > 0) actionMessage += `, нанесено ${response.damage} урона`;
                    if (response.healing > 0) actionMessage += `, восстановлено ${response.healing} здоровья`;
                }
                
                showToast(actionMessage, 'success');
                
                return response;
            } else {
                showToast('Ошибка при выполнении действия', 'error', response.details || response.message);
                throw new Error('Ошибка при выполнении действия');
            }
        } catch (error) {
            console.error('Ошибка при выполнении действия:', error);
            showToast('Ошибка при выполнении действия', 'error', error.message);
            throw error;
        }
    };
    
    /**
     * Отображение участников команды с обработкой различных форматов данных
     * @param {string} teamId - ID команды ('1' или '2')
     * @param {Object|Array} teams - Команды (объект или массив)
     * @param {Array} participants - Массив участников
     * @returns {JSX.Element} - Отрендеренные участники команды
     */
    const renderTeamParticipants = (teamId, teams, participants) => {
        console.log(`[PvPTab] Рендер команды ${teamId}:`, { teams, participants });
        
        // Обработка ситуации, когда teams или participants отсутствуют
        if (!teams || !participants) {
            return <div>Нет участников</div>;
        }
        
        // Обработка разных форматов данных teams
        let teamParticipantIds = [];
        
        // Если teams - это объект с ключами по номерам команд
        if (typeof teams === 'object' && !Array.isArray(teams)) {
            teamParticipantIds = teams[teamId] || [];
        }
        // Если teams - это массив массивов (по индексу)
        else if (Array.isArray(teams)) {
            const index = parseInt(teamId);
            if (teams[index]) {
                teamParticipantIds = teams[index];
            }
        }
        
        if (!teamParticipantIds || teamParticipantIds.length === 0) {
            return <div>Команда пуста</div>;
        }
        
        // Рендер участников команды
        return (
            <>
                {teamParticipantIds.map(participantId => {
                    // Поиск участника по ID
                    const participant = participants.find(p =>
                        p.id === participantId ||
                        p.participant_id === participantId ||
                        p.user_id === participantId);
                    
                    return participant ? renderParticipant(participant) : null;
                })}
            </>
        );
    };

    /**
     * Получение участника команды по позиции с учетом различных возможных форматов данных
     * @param {Array|Object} teamData - Данные команды
     * @param {number} position - Позиция в команде
     * @param {Array} participants - Все участники комнаты
     * @returns {Object|null} - Участник или null, если не найден
     */
    // Улучшенная функция для поиска участника в команде по позиции
    const getTeamParticipant = (teamNumber, position, participants) => {
        // Показываем, что функция вызвана и с какими данными
        console.log('[PvP] Проверка позиции в команде:', {
            teamNumber,
            position,
            participantsCount: participants ? participants.length : 0
        });
        
        // ВАЖНО: получаем доступ к текущим roomDetails напрямую для отладки
        // Это необходимо, потому что participants может не содержать всех данных
        if (roomDetails) {
            console.log('[PvP] Текущее состояние roomDetails:', {
                teamsData: roomDetails.teams,
                hasTeam1: roomDetails.teams && roomDetails.teams['1'] ? true : false,
                hasTeam2: roomDetails.teams && roomDetails.teams['2'] ? true : false,
            });
            
            // Проверяем данные из teams напрямую
            if (roomDetails.teams && roomDetails.teams[teamNumber.toString()]) {
                const teamParticipants = roomDetails.teams[teamNumber.toString()];
                
                // Сначала проверяем по позиции в массиве teams
                // В teams данные часто организованы как массив, где индекс = позиция-1
                if (Array.isArray(teamParticipants) && teamParticipants.length > 0) {
                    console.log(`[PvP] Найдены участники команды ${teamNumber} в teams:`, teamParticipants);
                    
                    // Ищем участника с нужной позицией в массиве команды
                    for (const participant of teamParticipants) {
                        if (participant &&
                            ((participant.position === position) ||
                             (participant.position === position.toString()))) {
                            console.log('[PvP] Найден участник по position в teams:', participant);
                            return participant;
                        }
                    }
                }
            }
        }
        
        // Если не нашли в teams, ищем в participants
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            console.log('[PvP] В participants нет данных об участниках');
            return null;
        }
        
        // Фильтруем участников по команде для отладки
        const teamParticipants = participants.filter(p => {
            const pTeam = typeof p.team === 'string' ? parseInt(p.team) : p.team;
            return pTeam === teamNumber || pTeam === teamNumber.toString();
        });
        
        console.log(`[PvP] Участники команды ${teamNumber} в participants:`, teamParticipants);
        
        // Ищем участника с нужной позицией
        const foundParticipant = participants.find(p => {
            const pTeam = typeof p.team === 'string' ? parseInt(p.team) : p.team;
            const pPosition = typeof p.position === 'string' ? parseInt(p.position) : p.position;
            
            const teamMatches = pTeam === teamNumber || pTeam === teamNumber.toString();
            const positionMatches = pPosition === position || pPosition === position.toString();
            
            return teamMatches && positionMatches;
        });
        
        if (foundParticipant) {
            console.log('[PvP] Найден участник в participants:', foundParticipant);
            return foundParticipant;
        }
        
        console.log(`[PvP] Участник команды ${teamNumber} позиции ${position} не найден нигде`);
        return null;
    };
    
    // Проверка, является ли пользователь участником комнаты
    const isUserParticipant = (userId, roomData) => {
        if (!roomData || !roomData.participants || !userId) return false;
        
        return roomData.participants.some(p => p.user_id === userId);
    };
    
    // Функция для получения текущей позиции пользователя в комнате
    const getUserPosition = (userId, roomData) => {
        if (!roomData || !roomData.participants || !userId) return null;
        
        const participant = roomData.participants.find(p => p.user_id === userId);
        if (!participant) return null;
        
        return {
            team: participant.team,
            position: participant.position
        };
    };
    
    // Проверка, находится ли пользователь на указанной позиции
    const isUserAtPosition = (userId, roomData, team, position) => {
        if (!roomData || !roomData.participants || !userId) return false;
        
        return roomData.participants.some(p =>
            p.user_id === userId &&
            (p.team === team || p.team === team.toString()) &&
            (p.position === position || p.position === position.toString())
        );
    };
    
    // Обработка выхода из комнаты
    const handleReturnToList = async () => {
        // Если нет деталей комнаты, просто возвращаемся к списку
        if (!roomDetails) {
            setRoomDetails(null);
            setSelectedRoom(null);
            return;
        }
        
        // Если пользователь участвует в комнате, предлагаем подтверждение
        if (isUserParticipant(player.id, roomDetails)) {
            // Проверяем, находится ли комната в бою - это более серьезное предупреждение
            const isInProgress = roomDetails.room?.status === 'in_progress' || roomDetails.status === 'in_progress';
            const confirmMessage = isInProgress ?
                'Вы находитесь в активном бою! Выход приведет к снижению рейтинга. Вы действительно хотите покинуть комнату?' :
                'Вы действительно хотите покинуть комнату? Это действие нельзя отменить.';
            
            const confirmLeave = window.confirm(confirmMessage);
            
            if (!confirmLeave) return;
            
            // Если пользователь подтвердил, пытаемся покинуть комнату
            try {
                setLoading(true);
                
                // Вызываем API для выхода из комнаты
                // Убедимся, что мы передаем правильный ID комнаты
                const roomId = roomDetails.room?.id || roomDetails.id;
                if (!roomId) {
                    throw new Error('ID комнаты не найден');
                }
                
                const response = await leaveRoom(roomId);
                
                if (response.success) {
                    showToast(response.message || 'Вы успешно покинули комнату', 'success');
                } else {
                    // Используем улучшенную функцию showToast с передачей деталей
                    showToast(response.message || 'Ошибка при выходе из комнаты', 'error', response.details);
                    console.error('[PvP] Ошибка при выходе из комнаты:', response);
                }
            } catch (error) {
                console.error('[PvP] Непредвиденная ошибка при выходе из комнаты:', error);
                
                // Извлекаем детали ошибки
                let details = null;
                if (error.response) {
                    // Ошибка от API с деталями
                    details = error.response.data?.details || error.response.data?.error || error.message;
                } else if (error.message) {
                    // Стандартная ошибка JavaScript
                    details = error.message;
                }
                
                showToast('Непредвиденная ошибка при выходе из комнаты', 'error', details);
            } finally {
                setLoading(false);
            }
        }
        
        // В любом случае сбрасываем состояние и возвращаемся к списку
        setRoomDetails(null);
        setSelectedRoom(null);
        setSelectedTarget(null);
        setInBattle(false);
        setBattleState(null);
        
        // Обновляем список комнат
        setRefreshTrigger(prev => prev + 1);
    };
    
    // Рендер действий в логе боя
    const renderActionLog = () => {
        if (!battleState || !battleState.actions || battleState.actions.length === 0) {
            return <div className="text-center text-muted">Нет действий</div>;
        }
        
        return (
            <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '10px', border: '1px solid #333', borderRadius: '4px' }}>
                {battleState.actions.map((action, index) => (
                    <div key={index} style={{ marginBottom: '8px' }}>
                        <small>{new Date(action.timestamp).toLocaleTimeString()}</small>: 
                        <strong> {action.actor_name} </strong>
                        {action.action_type === 'attack' && (
                            <>атаковал <strong>{action.target_name}</strong> и нанес <Badge bg="danger">{action.damage}</Badge> урона</>
                        )}
                        {action.action_type === 'defense' && (
                            <>использовал защитную стойку и восстановил <Badge bg="info">20</Badge> энергии</>
                        )}
                        {action.action_type === 'technique' && (
                            <>использовал технику на <strong>{action.target_name}</strong> 
                            {action.damage > 0 && <> и нанес <Badge bg="danger">{action.damage}</Badge> урона</>}
                            {action.healing > 0 && <>, восстановив <Badge bg="success">{action.healing}</Badge> здоровья</>}
                            </>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Рендер участника боя
    const renderParticipant = (participant) => {
        const isCurrentUser = participant.user_id === player.id;
        const isTarget = participant.id === selectedTarget;
        const isActiveUser = getCurrentUserParticipant()?.status === 'active';
        const canBeTargeted = participant.status === 'active' && 
                          participant.team !== getCurrentUserParticipant()?.team &&
                          isActiveUser;
                          
        return (
            <StyledCard 
                key={participant.id} 
                borderColor={isCurrentUser ? '#0275d8' : isTarget ? '#dc3545' : undefined}
                selected={isTarget}
                clickable={canBeTargeted}
                disabled={participant.status !== 'active'}
                onClick={() => {
                    if (canBeTargeted) {
                        setSelectedTarget(participant.id);
                    }
                }}
            >
                <CardHeader>
                    <CardTitle>{participant.username}</CardTitle>
                    {isCurrentUser && <Badge bg="primary">Вы</Badge>}
                </CardHeader>
                <CardBody>
                    <div style={{ marginBottom: '8px' }}>
                        HP: 
                        <ProgressBarContainer>
                            <ProgressBarFill 
                                variant="danger"
                                percent={(participant.current_hp / participant.max_hp) * 100}
                            >
                                {`${participant.current_hp}/${participant.max_hp}`}
                            </ProgressBarFill>
                        </ProgressBarContainer>
                    </div>
                    <div>
                        Энергия: 
                        <ProgressBarContainer>
                            <ProgressBarFill 
                                variant="info"
                                percent={(participant.current_energy / participant.max_energy) * 100}
                            >
                                {`${participant.current_energy}/${participant.max_energy}`}
                            </ProgressBarFill>
                        </ProgressBarContainer>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                        {participant.status !== 'active' && (
                            <Badge bg="danger">Побежден</Badge>
                        )}
                        {isTarget && (
                            <Badge bg="warning" style={{ marginLeft: '5px' }}>Цель</Badge>
                        )}
                    </div>
                </CardBody>
            </StyledCard>
        );
    };

    // Функция для форматирования лиги
    const formatLeague = (league) => {
        switch (league?.toLowerCase()) {
            case 'bronze': return <Badge bg="secondary">Бронза</Badge>;
            case 'silver': return <Badge bg="light" text="dark">Серебро</Badge>;
            case 'gold': return <Badge bg="warning">Золото</Badge>;
            case 'platinum': return <Badge bg="info">Платина</Badge>;
            case 'diamond': return <Badge bg="primary">Бриллиант</Badge>;
            default: return <Badge bg="secondary">Новичок</Badge>;
        }
    };

    // Функция для закрытия окна наград
    const handleCloseRewards = () => {
        setShowRewards(false);
        setBattleRewards(null);
        // После закрытия окна наград можно обновить данные игрока
        // Это будет происходить автоматически при следующем обновлении состояния
    };

    return (
        <TabContainer>
            <TabHeader>
                <h2>PvP Арена</h2>
            </TabHeader>
            
            {loading && (
                <LoadingContainer>
                    <LoadingSpinner />
                    <LoadingText>Загрузка...</LoadingText>
                </LoadingContainer>
            )}
            
            {/* ИСПРАВЛЕНИЕ: Улучшенная логика условного рендеринга для разных состояний */}
            {/* Показываем интерфейс боя только если в активном бою */}
            {inBattle && battleState ? (
                // Режим боя с использованием нового интерфейса
                <TabContent>
                    {/* ИСПРАВЛЕНИЕ: Дополнительные проверки для отображения BattleInterface */}
                    {inBattle && battleState && battleState.room && battleState.room.status !== 'completed' && (
                        <BattleInterface
                            room={battleState.room}
                            participants={battleState.participants}
                            teams={battleState.teams || { 1: [], 2: [] }}
                            actions={battleState.actions || []}
                            currentUserId={player.id}
                            onPerformAction={(actionType, targetId, techniqueId) => {
                                handlePerformAction(actionType, targetId, techniqueId);
                            }}
                            availableTechniques={prepareBattleActions(battleState).filter(action => action.type === 'technique')}
                            isActionBlocked={actionCooldown > 0}     // Блокировка действий во время таймаута
                            actionCooldown={actionCooldown}          // Текущее значение таймаута
                            actionCooldownTotal={5}                  // Общее время таймаута для отображения прогресса
                        />
                    )}
                    
                    {/* Отображение сообщения о результате боя, если бой завершен */}
                    {battleState && battleState.room && battleState.room.status === 'completed' && (
                        <div className="battle-result">
                            {(() => {
                                const winnerTeam = battleState.room.winner_team;
                                const participant = battleState.participants.find(p => p.user_id === player.id);
                                const isWinner = participant && participant.team === winnerTeam;
                                return (
                                    <div className={`battle-result ${isWinner ? 'victory' : 'defeat'}`}>
                                        {isWinner ? 'Победа!' : 'Поражение!'}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </TabContent>
            ) : (
                // Режим просмотра и выбора комнат (когда нет активного боя)
                <TabContent>
                    <TabMenu>
                        <TabMenuItem 
                            active={activeTab === 'rooms'} 
                            onClick={() => setActiveTab('rooms')}
                        >
                            Комнаты
                        </TabMenuItem>
                        <TabMenuItem 
                            active={activeTab === 'ratings'} 
                            onClick={() => setActiveTab('ratings')}
                        >
                            Рейтинги
                        </TabMenuItem>
                        <TabMenuItem 
                            active={activeTab === 'history'} 
                            onClick={() => setActiveTab('history')}
                        >
                            История
                        </TabMenuItem>
                    </TabMenu>
                    
                    {activeTab === 'rooms' && (
                        <div>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <FormSelect 
                                    value={selectedMode || ''}
                                    onChange={e => setSelectedMode(e.target.value)}
                                    style={{ maxWidth: '300px' }}
                                >
                                    {modes.map(mode => (
                                        <option key={mode.id} value={mode.id}>
                                            {mode.name} ({mode.player_count} игроков)
                                        </option>
                                    ))}
                                </FormSelect>
                                
                                <StyledButton variant="primary" onClick={() => setShowCreateRoomModal(true)}>
                                    Создать комнату
                                </StyledButton>
                            </div>
                            
                            {roomDetails ? (
                                <StyledCard>
                                    <CardHeader>
                                        <div>
                                            <CardTitle>{roomDetails.name}</CardTitle>
                                            <div style={{ marginTop: '5px' }}>
                                                <Badge bg={roomDetails.status === 'waiting' ? 'success' : 'primary'}>
                                                    {roomDetails.status === 'waiting' ? 'Ожидание' : 'В процессе'}
                                                </Badge>
                                                <span style={{ marginLeft: '10px' }}>Режим: {roomDetails.room?.mode_name || 'Не указан'}</span>
                                                <span style={{ marginLeft: '10px' }}>Уровни: {roomDetails.room?.min_level || '?'}-{roomDetails.room?.max_level || '?'}</span>
                                            </div>
                                        </div>
                                        <StyledButton
                                            variant="secondary"
                                            onClick={handleReturnToList}
                                        >
                                            Вернуться к списку
                                        </StyledButton>
                                    </CardHeader>
                                    <CardBody>
                                        <h5 style={{ marginTop: '16px', color: '#d4af37' }}>
                                            Команда 1
                                            {/* Расширенная отладочная информация */}
                                            <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                                                (Отладка: {roomDetails.participants?.filter(p =>
                                                    (p.team === 1 || p.team === '1')).length || 0} участников)
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#ff7700', marginLeft: '8px' }}>
                                                {roomDetails.teams?.['1'] ? `(teams[1]: ${roomDetails.teams['1'].length})` : '(teams[1]: пусто)'}
                                            </span>
                                        </h5>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '16px' }}>
                                            {Array.from({ length: Math.ceil(roomDetails.room?.player_count / 2 || 1) }).map((_, idx) => {
                                                // Логируем содержимое participants
                                                console.log(`[PvP] Проверка позиции ${idx+1} в команде 1:`,
                                                    roomDetails.participants?.filter(p => p.team === 1 || p.team === '1'));
                                                
                                                // Используем вспомогательную функцию для команды 1 - передаем номер команды напрямую
                                                const participant = getTeamParticipant(1, idx + 1, roomDetails.participants);
                                                return (
                                                    <div key={`team1-pos${idx+1}`} style={{ margin: '8px', width: '180px' }}>
                                                        {/* Добавляем дополнительную проверку с использованием teams */}
                                                        {participant ||
                                                          (roomDetails.teams &&
                                                           roomDetails.teams['1'] &&
                                                           roomDetails.teams['1'].some(p => (p.position === idx + 1 || p.position === (idx + 1).toString()))) ? (
                                                            <StyledCard style={{ border: '2px solid #dc3545' }}>
                                                                <CardTitle>{participant ? participant.username : 'Участник'}</CardTitle>
                                                                <div>Уровень: {participant ? participant.level : '?'}</div>
                                                                <Badge bg="danger" style={{ marginTop: '5px' }}>Занято</Badge>
                                                                {/* Показываем ID для отладки */}
                                                                <div style={{ fontSize: '10px', color: '#999' }}>
                                                                    ID: {participant?.id || 'неизвестно'},
                                                                    User: {participant?.user_id || 'неизвестно'}
                                                                </div>
                                                            </StyledCard>
                                                        ) : (
                                                            <StyledCard style={{ border: '2px solid #28a745' }}>
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <Badge bg="success" style={{ marginBottom: '8px' }}>Свободно</Badge>
                                                                    {/* Информация для отладки */}
                                                                    <div style={{ fontSize: '10px', color: '#999', marginBottom: '8px' }}>
                                                                        Позиция: {idx + 1}
                                                                    </div>
                                                                    
                                                                    {/* Проверяем, находится ли игрок уже в комнате */}
                                                                    {isUserParticipant(player.id, roomDetails) ? (
                                                                        // Если игрок уже в комнате, показываем кнопку смены позиции
                                                                        <div>
                                                                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                                                                                {(() => {
                                                                                    const position = getUserPosition(player.id, roomDetails);
                                                                                    return position ?
                                                                                        `Ваша текущая позиция: команда ${position.team}, место ${position.position}` :
                                                                                        'Вы уже в игре';
                                                                                })()}
                                                                            </div>
                                                                            <StyledButton
                                                                                variant="outline-warning"
                                                                                onClick={() => {
                                                                                    handleJoinRoom(roomDetails.room.id, 1, idx + 1);
                                                                                }}
                                                                                disabled={roomDetails.room?.status !== 'waiting'}
                                                                            >
                                                                                Сменить позицию
                                                                            </StyledButton>
                                                                        </div>
                                                                    ) : (
                                                                        // Если игрок не в комнате, показываем обычную кнопку присоединения
                                                                        <StyledButton
                                                                            variant="outline-primary"
                                                                            onClick={() => {
                                                                                handleJoinRoom(roomDetails.room.id, 1, idx + 1);
                                                                            }}
                                                                            disabled={roomDetails.room?.status !== 'waiting'}
                                                                        >
                                                                            Занять место
                                                                        </StyledButton>
                                                                    )}
                                                                </div>
                                                            </StyledCard>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        <h5 style={{ marginTop: '16px', color: '#d4af37' }}>
                                            Команда 2
                                            {/* Расширенная отладочная информация */}
                                            <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                                                (Отладка: {roomDetails.participants?.filter(p =>
                                                    (p.team === 2 || p.team === '2')).length || 0} участников)
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#ff7700', marginLeft: '8px' }}>
                                                {roomDetails.teams?.['2'] ? `(teams[2]: ${roomDetails.teams['2'].length})` : '(teams[2]: пусто)'}
                                            </span>
                                        </h5>
                                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                            {Array.from({ length: Math.ceil(roomDetails.room?.player_count / 2 || 1) }).map((_, idx) => {
                                                // Логируем содержимое participants
                                                console.log(`[PvP] Проверка позиции ${idx+1} в команде 2:`,
                                                    roomDetails.participants?.filter(p => p.team === 2 || p.team === '2'));
                                                
                                                // Используем вспомогательную функцию для команды 2 - передаем номер команды напрямую
                                                const participant = getTeamParticipant(2, idx + 1, roomDetails.participants);
                                                return (
                                                    <div key={`team2-pos${idx+1}`} style={{ margin: '8px', width: '180px' }}>
                                                        {/* Добавляем дополнительную проверку с использованием teams */}
                                                        {participant ||
                                                          (roomDetails.teams &&
                                                           roomDetails.teams['2'] &&
                                                           roomDetails.teams['2'].some(p => (p.position === idx + 1 || p.position === (idx + 1).toString()))) ? (
                                                            <StyledCard style={{ border: '2px solid #dc3545' }}>
                                                                <CardTitle>{participant ? participant.username : 'Участник'}</CardTitle>
                                                                <div>Уровень: {participant ? participant.level : '?'}</div>
                                                                <Badge bg="danger" style={{ marginTop: '5px' }}>Занято</Badge>
                                                                {/* Показываем ID для отладки */}
                                                                <div style={{ fontSize: '10px', color: '#999' }}>
                                                                    ID: {participant?.id || 'неизвестно'},
                                                                    User: {participant?.user_id || 'неизвестно'}
                                                                </div>
                                                            </StyledCard>
                                                        ) : (
                                                            <StyledCard style={{ border: '2px solid #28a745' }}>
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <Badge bg="success" style={{ marginBottom: '8px' }}>Свободно</Badge>
                                                                    {/* Информация для отладки */}
                                                                    <div style={{ fontSize: '10px', color: '#999', marginBottom: '8px' }}>
                                                                        Позиция: {idx + 1}
                                                                    </div>
                                                                    {/* Проверяем, находится ли игрок уже в комнате */}
                                                                    {isUserParticipant(player.id, roomDetails) ? (
                                                                        // Если игрок уже в комнате, показываем кнопку смены позиции
                                                                        <div>
                                                                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                                                                                {(() => {
                                                                                    const position = getUserPosition(player.id, roomDetails);
                                                                                    return position ?
                                                                                        `Ваша текущая позиция: команда ${position.team}, место ${position.position}` :
                                                                                        'Вы уже в игре';
                                                                                })()}
                                                                            </div>
                                                                            <StyledButton
                                                                                variant="outline-warning"
                                                                                onClick={() => {
                                                                                    handleJoinRoom(roomDetails.room.id, 2, idx + 1);
                                                                                }}
                                                                                disabled={roomDetails.room?.status !== 'waiting'}
                                                                            >
                                                                                Сменить позицию
                                                                            </StyledButton>
                                                                        </div>
                                                                    ) : (
                                                                        // Если игрок не в комнате, показываем обычную кнопку присоединения
                                                                        <StyledButton
                                                                            variant="outline-primary"
                                                                            onClick={() => {
                                                                                handleJoinRoom(roomDetails.room.id, 2, idx + 1);
                                                                            }}
                                                                            disabled={roomDetails.room?.status !== 'waiting'}
                                                                        >
                                                                            Занять место
                                                                        </StyledButton>
                                                                    )}
                                                                </div>
                                                            </StyledCard>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardBody>
                                </StyledCard>
                            ) : (
                                <div>
                                    {rooms.length > 0 ? (
                                        <StyledTable>
                                            <thead>
                                                <tr>
                                                    <th>Название</th>
                                                    <th>Лидер</th>
                                                    <th>Режим</th>
                                                    <th>Уровень</th>
                                                    <th>Участники</th>
                                                    <th>Действия</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rooms.map(room => (
                                                    <tr key={room.id}>
                                                        <td>{room.name}</td>
                                                        <td>{room.leader_name}</td>
                                                        <td>{room.mode_name}</td>
                                                        <td>{room.min_level}-{room.max_level}</td>
                                                        <td>{room.participant_count}/{room.player_count}</td>
                                                        <td>
                                                            <StyledButton 
                                                                variant="primary" 
                                                                style={{ fontSize: '0.9rem', padding: '4px 8px' }}
                                                                onClick={() => {
                                                                    setSelectedRoom(room.id);
                                                                    handleViewRoom(room.id);
                                                                }}
                                                            >
                                                                Просмотр
                                                            </StyledButton>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </StyledTable>
                                    ) : (
                                        <AlertBox variant="info">
                                            Нет доступных комнат. Создайте новую!
                                        </AlertBox>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'ratings' && (
                        <div>
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ color: '#d4af37', marginBottom: '16px' }}>Ваши рейтинги</h4>
                                {userRatings.length > 0 ? (
                                    <StyledTable>
                                        <thead>
                                            <tr>
                                                <th>Режим</th>
                                                <th>Рейтинг</th>
                                                <th>Победы</th>
                                                <th>Поражения</th>
                                                <th>Лига</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userRatings.map(rating => (
                                                <tr key={rating.id}>
                                                    <td>{rating.mode_name}</td>
                                                    <td><Badge bg="warning" text="dark">{rating.rating}</Badge></td>
                                                    <td>{rating.wins}</td>
                                                    <td>{rating.losses}</td>
                                                    <td>{formatLeague(rating.league)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </StyledTable>
                                ) : (
                                    <AlertBox variant="info">
                                        У вас пока нет рейтинга. Примите участие в PvP боях!
                                    </AlertBox>
                                )}
                            </div>
                            
                            <h4 style={{ color: '#d4af37', marginBottom: '16px' }}>Таблица лидеров</h4>
                            <FormSelect 
                                value={selectedMode || ''}
                                onChange={e => setSelectedMode(e.target.value)}
                                style={{ maxWidth: '300px', marginBottom: '16px' }}
                            >
                                {modes.map(mode => (
                                    <option key={mode.id} value={mode.id}>
                                        {mode.name}
                                    </option>
                                ))}
                            </FormSelect>
                            
                            {leaderboard.length > 0 ? (
                                <StyledTable>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Игрок</th>
                                            <th>Рейтинг</th>
                                            <th>Победы</th>
                                            <th>Поражения</th>
                                            <th>Уровень</th>
                                            <th>Лига</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((player, idx) => (
                                            <tr key={player.id} style={{ 
                                                background: player.user_id === player.id ? 'rgba(0, 123, 255, 0.1)' : 'transparent' 
                                            }}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    {player.username}
                                                    {player.user_id === player.id && <Badge bg="primary" style={{ marginLeft: '8px' }}>Вы</Badge>}
                                                </td>
                                                <td><Badge bg="warning" text="dark">{player.rating}</Badge></td>
                                                <td>{player.wins}</td>
                                                <td>{player.losses}</td>
                                                <td>{player.cultivation_level}</td>
                                                <td>{formatLeague(player.league)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </StyledTable>
                            ) : (
                                <AlertBox variant="info">
                                    Нет данных о рейтингах для выбранного режима
                                </AlertBox>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'history' && (
                        <div>
                            <h4 style={{ color: '#d4af37', marginBottom: '16px' }}>История ваших боев</h4>
                            
                            {battleHistory.length > 0 ? (
                                <StyledTable>
                                    <thead>
                                        <tr>
                                            <th>Дата</th>
                                            <th>Режим</th>
                                            <th>Результат</th>
                                            <th>Изменение рейтинга</th>
                                            <th>Награды</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {battleHistory.map(battle => {
                                            const rewards = battle.rewards ? JSON.parse(battle.rewards) : { gold: 0, items: [] };
                                            return (
                                                <tr key={battle.id}>
                                                    <td>{new Date(battle.created_at).toLocaleString()}</td>
                                                    <td>{battle.mode_name}</td>
                                                    <td>
                                                        <Badge bg={battle.result === 'win' ? 'success' : 'danger'}>
                                                            {battle.result === 'win' ? 'Победа' : 'Поражение'}
                                                        </Badge>
                                                    </td>
                                                    <td style={{ color: battle.rating_change > 0 ? '#28a745' : '#dc3545' }}>
                                                        {battle.rating_change > 0 ? '+' : ''}{battle.rating_change}
                                                    </td>
                                                    <td>
                                                        <div>Золото: {rewards.gold}</div>
                                                        {rewards.items && rewards.items.length > 0 && (
                                                            <div>
                                                                Предметы: {rewards.items.map(item => item.name).join(', ')}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </StyledTable>
                            ) : (
                                <AlertBox variant="info">
                                    У вас пока нет истории боев. Примите участие в PvP сражениях!
                                </AlertBox>
                            )}
                        </div>
                    )}
                </TabContent>
            )}
            
            {/* Модальное окно создания комнаты */}
            {showCreateRoomModal && (
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>
                            <ModalTitle>Создание комнаты PvP</ModalTitle>
                            <CloseButton onClick={() => setShowCreateRoomModal(false)}>&times;</CloseButton>
                        </ModalHeader>
                        <ModalBody>
                            <FormGroup>
                                <FormLabel>Название комнаты</FormLabel>
                                <FormControl 
                                    type="text" 
                                    value={roomName}
                                    onChange={e => setRoomName(e.target.value)}
                                    placeholder="Введите название комнаты"
                                />
                            </FormGroup>
                            
                            <FormGroup>
                                <FormLabel>Режим PvP</FormLabel>
                                <FormSelect 
                                    value={selectedMode || ''}
                                    onChange={e => setSelectedMode(e.target.value)}
                                >
                                    {modes.map(mode => (
                                        <option key={mode.id} value={mode.id}>
                                            {mode.name}
                                        </option>
                                    ))}
                                </FormSelect>
                            </FormGroup>
                            
                            <FormGroup>
                                <FormLabel>Минимальный уровень культивации</FormLabel>
                                <FormControl 
                                    type="number" 
                                    value={minLevel}
                                    onChange={e => setMinLevel(parseInt(e.target.value))}
                                    min={1}
                                    max={player.cultivation_level}
                                />
                            </FormGroup>
                            
                            <FormGroup>
                                <FormLabel>Максимальный уровень культивации</FormLabel>
                                <FormControl 
                                    type="number" 
                                    value={maxLevel}
                                    onChange={e => setMaxLevel(parseInt(e.target.value))}
                                    min={minLevel}
                                />
                            </FormGroup>
                        </ModalBody>
                        <ModalFooter>
                            <StyledButton variant="secondary" onClick={() => setShowCreateRoomModal(false)}>
                                Отмена
                            </StyledButton>
                            <StyledButton variant="primary" onClick={handleCreateRoom}>
                                Создать комнату
                            </StyledButton>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            )}
            
            {/* Компонент для показа наград PvP */}
            {(() => {
                console.log('[PvP RENDER DEBUG] showRewards:', showRewards, 'battleRewards:', battleRewards);
                return showRewards && battleRewards && (
                    <PvPBattleResult
                        result={battleRewards.result}
                        rewards={battleRewards.rewards}
                        ratingChange={battleRewards.ratingChange}
                        onClose={handleCloseRewards}
                    />
                );
            })()}
        </TabContainer>
    );
};

export default PvPTab;