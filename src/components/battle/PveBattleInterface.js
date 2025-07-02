import React, { useState, useEffect, useRef } from 'react';
import './BattleInterface.css';
import BattleEffects from './BattleEffects';
import ActionPanel from './ActionPanel';

/**
 * Основной компонент интерфейса боя для PvE
 * @param {Object} props - Свойства компонента
 * @param {Object} props.player - Данные игрока
 * @param {Object} props.enemy - Данные врага
 * @param {Array} props.log - Лог боя
 * @param {Function} props.onAction - Функция выполнения действия
 * @param {boolean} props.isPlayerTurn - Флаг, указывающий, чей сейчас ход
 */
const PveBattleInterface = ({
  player,
  enemy,
  log = [],
  onAction,
  isPlayerTurn
}) => {
  const logRef = useRef(null);

  // Автоматическая прокрутка лога боя
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [log]);

  const getHealthClass = (current, max) => {
    const percent = (current / max) * 100;
    if (percent > 60) return 'high';
    if (percent > 30) return 'medium';
    return 'low';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const renderParticipant = (participant, type) => {
    if (!participant) return null;
    const isDefeated = participant.currentHp <= 0;

    return (
      <div className={`participant-card ${isDefeated ? 'defeated' : ''} ${type}`}>
        <div className="participant-header">
          <div className="participant-name">{participant.name}</div>
          {participant.level && <div className="participant-level">Уровень {participant.level}</div>}
        </div>
        
        <div className="health-bar">
          <div
            className={`health-fill ${getHealthClass(participant.currentHp, participant.maxHp)}`}
            style={{ width: `${Math.max(0, Math.min(100, (participant.currentHp / participant.maxHp) * 100))}%` }}
          ></div>
          <div className="health-text">
            {participant.currentHp} / {participant.maxHp}
          </div>
        </div>
        
        {participant.maxEnergy > 0 && (
            <div className="energy-bar">
                <div
                className="energy-fill"
                style={{ width: `${Math.max(0, Math.min(100, (participant.currentEnergy / participant.maxEnergy) * 100))}%` }}
                ></div>
                <div className="energy-text">
                    {participant.currentEnergy} / {participant.maxEnergy}
                </div>
            </div>
        )}

        <BattleEffects effects={participant.effects || []} />
      </div>
    );
  };

  return (
    <div className="battle-container pve">
      <div className="battle-arena">
        <div className="team-container team-one">
            {renderParticipant(player, 'player')}
        </div>
        <div className="versus-divider">VS</div>
        <div className="team-container team-two">
            {renderParticipant(enemy, 'enemy')}
        </div>
      </div>

      <div className="battle-footer">
        <div className="battle-log-container">
            <div className="battle-log-header">Лог боя</div>
            <div className="battle-log" ref={logRef}>
            {log.map((entry, index) => (
                <div key={index} className="log-entry">
                <span className="log-timestamp">[{formatTime(entry.timestamp)}]</span>
                <span className="log-message">{entry.message}</span>
                </div>
            ))}
            </div>
        </div>

        <ActionPanel
            onAction={onAction}
            isPlayerTurn={isPlayerTurn}
            currentEnergy={player?.currentEnergy}
            maxEnergy={player?.maxEnergy}
            availableTechniques={player?.techniques || []}
            effects={player?.effects || []}
        />
      </div>
    </div>
  );
};

export default PveBattleInterface;