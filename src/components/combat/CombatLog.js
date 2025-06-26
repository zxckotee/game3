import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: rgba(10, 12, 16, 0.7);
  border-radius: 10px;
  padding: 15px;
  height: 200px;
  overflow-y: auto;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'Arial', sans-serif;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, rgba(212, 175, 55, 0.7), rgba(192, 155, 35, 0.7));
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, rgba(232, 195, 75, 0.8), rgba(212, 175, 55, 0.8));
  }
`;

const LogEntry = styled.div`
  position: relative;
  color: ${props => {
    switch (props.type) {
      case 'damage':
        return '#ff7f7f';
      case 'heal':
        return '#7fff7f';
      case 'buff':
        return '#7fbfff';
      case 'debuff':
        return '#ffbf7f';
      case 'critical':
        return '#ff7fbf';
      case 'dodge':
        return '#bf7fff';
      case 'system':
        return '#ffd700';
      default:
        return '#e0e0e0';
    }
  }};
  padding: 6px 10px;
  margin-bottom: 4px;
  font-size: 0.95rem;
  line-height: 1.5;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
  border-left: 3px solid ${props => {
    switch (props.type) {
      case 'damage':
        return 'rgba(255, 87, 34, 0.7)';
      case 'heal':
        return 'rgba(76, 175, 80, 0.7)';
      case 'buff':
        return 'rgba(33, 150, 243, 0.7)';
      case 'debuff':
        return 'rgba(255, 152, 0, 0.7)';
      case 'critical':
        return 'rgba(233, 30, 99, 0.7)';
      case 'dodge':
        return 'rgba(156, 39, 176, 0.7)';
      case 'system':
        return 'rgba(212, 175, 55, 0.7)';
      default:
        return 'rgba(158, 158, 158, 0.7)';
    }
  }};
  border-radius: 4px;
  background: ${props => {
    switch (props.type) {
      case 'damage':
        return 'rgba(244, 67, 54, 0.1)';
      case 'heal':
        return 'rgba(76, 175, 80, 0.1)';
      case 'buff':
        return 'rgba(33, 150, 243, 0.1)';
      case 'debuff':
        return 'rgba(255, 152, 0, 0.1)';
      case 'critical':
        return 'rgba(233, 30, 99, 0.1)';
      case 'dodge':
        return 'rgba(156, 39, 176, 0.1)';
      case 'system':
        return 'rgba(212, 175, 55, 0.1)';
      default:
        return 'rgba(0, 0, 0, 0.15)';
    }
  }};
  
  &:hover {
    background: ${props => {
      switch (props.type) {
        case 'damage':
          return 'rgba(244, 67, 54, 0.2)';
        case 'heal':
          return 'rgba(76, 175, 80, 0.2)';
        case 'buff':
          return 'rgba(33, 150, 243, 0.2)';
        case 'debuff':
          return 'rgba(255, 152, 0, 0.2)';
        case 'critical':
          return 'rgba(233, 30, 99, 0.2)';
        case 'dodge':
          return 'rgba(156, 39, 176, 0.2)';
        case 'system':
          return 'rgba(212, 175, 55, 0.2)';
        default:
          return 'rgba(66, 66, 66, 0.2)';
      }
    }};
    transform: translateX(2px);
    transition: all 0.3s ease;
  }
`;

const Timestamp = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  margin-right: 8px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
`;

function CombatLog({ entries = [] }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };
  
  return (
    <Container ref={containerRef}>
      {entries.map((entry, index) => (
        <LogEntry
          key={`${entry.timestamp}-${index}`}
          type={entry.type}
        >
          <Timestamp>{formatTime(entry.timestamp)}</Timestamp>
          {entry.message}
        </LogEntry>
      ))}
    </Container>
  );
}

export default CombatLog;
