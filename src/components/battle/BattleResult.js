import React from 'react';
import './BattleResult.css';

const BattleResult = ({ result, rewards, onClose }) => {
  const isVictory = result === 'victory';

  const getCurrencyIcon = (type) => {
    switch (type) {
      case 'gold': return '💰';
      case 'silver': return '🪙';
      case 'copper': return '🥉';
      default: return '💵';
    }
  };

  const getCurrencyName = (type) => {
    switch (type) {
      case 'gold': return 'Золото';
      case 'silver': return 'Серебро';
      case 'copper': return 'Медь';
      default: return 'Валюта';
    }
  };

  return (
    <div className="battle-result-overlay">
      <div className={`battle-result-container ${isVictory ? 'victory' : 'defeat'}`}>
        <h1 className="result-title">{isVictory ? 'Победа!' : 'Поражение'}</h1>
        
        {isVictory && rewards && (
          <div className="rewards-section">
            <h2 className="rewards-title">Награды</h2>
            <div className="rewards-grid">
              {rewards.experience > 0 && (
                <div className="reward-item experience">
                  <span className="reward-icon">⭐</span>
                  <span className="reward-name">Опыт</span>
                  <span className="reward-amount">+{rewards.experience}</span>
                </div>
              )}
              {rewards.currency && rewards.currency.amount > 0 && (
                <div className="reward-item currency">
                  <span className="reward-icon">{getCurrencyIcon(rewards.currency.type)}</span>
                  <span className="reward-name">{getCurrencyName(rewards.currency.type)}</span>
                  <span className="reward-amount">+{rewards.currency.amount}</span>
                </div>
              )}
              {rewards.items && rewards.items.map((item, index) => (
                <div key={index} className={`reward-item item rarity-${item.rarity || 'common'}`}>
                  <span className="reward-icon">{item.icon || '❓'}</span>
                  <span className="reward-name">{item.name}</span>
                  <span className="reward-amount">+{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isVictory && (
            <p className="defeat-message">Вы были повержены, но получили ценный опыт. В следующий раз вам обязательно повезет!</p>
        )}
        
        <button className="close-button" onClick={onClose}>
          Продолжить
        </button>
      </div>
    </div>
  );
};

export default BattleResult;