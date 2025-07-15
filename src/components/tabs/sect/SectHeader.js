import React from 'react';
import styled, { keyframes } from 'styled-components';

// Анимации
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.9;
  }
`;

// Стили
const Container = styled.div`
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.4) 0%, rgba(40, 40, 40, 0.6) 100%);
  border: 2px solid rgba(212, 175, 55, 0.4);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.6s ease-out;
  
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
    background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transform: rotate(45deg);
    animation: ${shimmer} 4s infinite;
    pointer-events: none;
  }
`;

const SectName = styled.h2`
  background: linear-gradient(45deg, #d4af37, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
  animation: ${pulse} 3s infinite;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    border-radius: 2px;
  }
`;

const SectRank = styled.div`
  color: rgba(212, 175, 55, 0.8);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const SectDescription = styled.p`
  color: #f0f0f0;
  font-size: 15px;
  line-height: 1.6;
  margin: 20px 0 0;
  text-align: center;
  opacity: 0.9;
  font-style: italic;
`;

/**
 * Компонент для отображения заголовка секты
 * @param {Object} sect - Данные о секте
 */
function SectHeader({ sect }) {
  return (
    <Container>
      <SectName>{sect.name}</SectName>
      <SectRank>Ранг: {sect.rank || 'Начальная'}</SectRank>
      
      {sect.description && (
        <SectDescription>
          {sect.description}
        </SectDescription>
      )}
    </Container>
  );
}

export default SectHeader;