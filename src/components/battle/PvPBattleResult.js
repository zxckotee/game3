import React from 'react';
import './BattleResult.css';

const PvPBattleResult = ({ result, rewards, ratingChange, onClose }) => {
  console.log('[PvPBattleResult DEBUG] Получены пропсы:', { result, rewards, ratingChange });
  
  const isVictory = result === 'victory' || result === 'win';
  
  console.log('[PvPBattleResult DEBUG] result:', result, 'isVictory:', isVictory);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#9e9e9e';
      case 'uncommon': return '#4caf50';
      case 'rare': return '#2196f3';
      case 'epic': return '#9c27b0';
      case 'legendary': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'common': return 'Обычный';
      case 'uncommon': return 'Необычный';
      case 'rare': return 'Редкий';
      case 'epic': return 'Эпический';
      case 'legendary': return 'Легендарный';
      default: return 'Обычный';
    }
  };

  return (
    <div className="battle-result-overlay">
      <div className={`battle-result-container ${isVictory ? 'victory' : 'defeat'}`}>
        <h1 className="result-title">{isVictory ? 'Победа!' : 'Поражение'}</h1>
        
        {/* Изменение рейтинга */}
        <div className="rating-section">
          <h2 className="rating-title">Изменение рейтинга</h2>
          <div className={`rating-change ${ratingChange >= 0 ? 'positive' : 'negative'}`}>
            {ratingChange >= 0 ? '+' : ''}{ratingChange}
          </div>
        </div>
        
        {/* Награды */}
        {rewards && Object.keys(rewards).length > 0 && (
          <div className="rewards-section">
            <h2 className="rewards-title">Награды</h2>
            <div className="rewards-grid">
              {/* Отображение предметов из массива items */}
              {rewards.items && Array.isArray(rewards.items) && rewards.items.length > 0 &&
                rewards.items.map((item, index) => (
                  <div key={index} className={`reward-item item rarity-${item.rarity || 'common'}`}>
                    <span className="reward-icon">🎁</span>
                    <div className="reward-details">
                      <span className="reward-name">{item.name}</span>
                      <span
                        className="reward-rarity"
                        style={{ color: getRarityColor(item.rarity) }}
                      >
                        {getRarityName(item.rarity)}
                      </span>
                      <span className="reward-type">({item.type})</span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="reward-quantity">x{item.quantity}</span>
                      )}
                    </div>
                  </div>
                ))
              }
              
              {/* Отображение одиночного предмета (старый формат) */}
              {rewards.item_id && rewards.name && (
                <div className={`reward-item item rarity-${rewards.rarity || 'common'}`}>
                  <span className="reward-icon">🎁</span>
                  <div className="reward-details">
                    <span className="reward-name">{rewards.name}</span>
                    <span
                      className="reward-rarity"
                      style={{ color: getRarityColor(rewards.rarity) }}
                    >
                      {getRarityName(rewards.rarity)}
                    </span>
                    <span className="reward-type">({rewards.type})</span>
                  </div>
                </div>
              )}
              
              {/* Отображение валюты из объекта currency */}
              {rewards.currency && Object.keys(rewards.currency).length > 0 &&
                Object.entries(rewards.currency).map(([currencyType, amount]) => (
                  <div key={currencyType} className="reward-item gold">
                    <span className="reward-icon">💰</span>
                    <div className="reward-details">
                      <span className="reward-name">{currencyType}</span>
                      <span className="reward-amount">+{amount}</span>
                    </div>
                  </div>
                ))
              }
              
              {/* Отображение золота (старый формат) */}
              {rewards.gold && rewards.gold > 0 && (
                <div className="reward-item gold">
                  <span className="reward-icon">💰</span>
                  <div className="reward-details">
                    <span className="reward-name">Золото</span>
                    <span className="reward-amount">+{rewards.gold}</span>
                  </div>
                </div>
              )}
              
              {/* Отображение опыта */}
              {rewards.experience && rewards.experience > 0 && (
                <div className="reward-item experience">
                  <span className="reward-icon">⭐</span>
                  <div className="reward-details">
                    <span className="reward-name">Опыт</span>
                    <span className="reward-amount">+{rewards.experience}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Сообщение если нет наград */}
        {(!rewards || Object.keys(rewards).length === 0) && (
          <div className="no-rewards">
            <p>В этом бою не было получено наград</p>
          </div>
        )}
        
        {/* Сообщение для проигравших */}
        {!isVictory && (
          <div className="defeat-message">
            <p>В следующий раз повезет больше!</p>
            <p>Изучайте новые техники и совершенствуйте свои навыки.</p>
          </div>
        )}
        
        <button className="close-button" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default PvPBattleResult;