import React from 'react';
import styled from 'styled-components';

// Стили
const Container = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
`;

const SectName = styled.h2`
  color: #d4af37;
  margin: 0 0 5px;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
`;

const SectRank = styled.div`
  color: #aaa;
  font-size: 1rem;
  margin-bottom: 10px;
`;

const SectDescription = styled.p`
  color: #f0f0f0;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 15px 0 0;
  text-align: center;
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