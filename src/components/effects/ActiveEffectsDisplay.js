import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../context/GameContextProvider';
import EffectsServiceAPI from '../../services/effects-service-api';
import './ActiveEffectsDisplay.css';

const getEffectIcon = (effectType) => {
  switch (effectType) {
    case 'stats':
      return '💪'; // Сила, бафф
    case 'dot':
      return '☠️'; // Яд, урон со временем
    case 'hot':
      return '❤️‍🩹'; // Лечение со временем
    case 'stun':
      return '😵'; // Оглушение
    default:
      return '✨'; // Общий эффект
  }
};

const ActiveEffectsDisplay = ({ userId }) => {
  const { state } = useGameContext();
  const [effects, setEffects] = useState([]);

  // Эффект для получения данных с сервера
  useEffect(() => {
    if (!userId) return;

    const fetchEffects = async () => {
      try {
        const activeEffects = await EffectsServiceAPI.getActivePlayerEffects(userId);
        setEffects(activeEffects);
      } catch (error) {
        console.error("Failed to fetch active effects:", error);
        setEffects([]); // Очищаем в случае ошибки
      }
    };

    fetchEffects(); // Первый вызов при монтировании
    const intervalId = setInterval(fetchEffects, 15000); // Повторяем каждые 15 секунд

    return () => clearInterval(intervalId); // Очистка при размонтировании
  }, [userId, state.player.inventory.items]); // Перезапускаем при изменении инвентаря

  // Эффект для локального тикающего таймера
  useEffect(() => {
    if (effects.length === 0) return;

    const timerId = setInterval(() => {
      setEffects(prevEffects =>
        prevEffects
          .map(effect => ({
            ...effect,
            remaining_seconds: effect.remaining_seconds - 1,
          }))
          .filter(effect => effect.remaining_seconds > 0)
      );
    }, 1000);

    return () => clearInterval(timerId);
  }, [effects]);


  if (effects.length === 0) {
    return null; // Не отображаем блок, если нет активных эффектов
  }

  return (
    <div className="active-effects-container">
      <h4>Активные эффекты</h4>
      <ul>
        {effects.map(effect => (
          <li key={effect.id} className="effect-item">
            <span className="effect-icon">{getEffectIcon(effect.effect_type)}</span>
            <span className="effect-name">{effect.name}</span>
            <span className="effect-value">
              ({effect.value > 0 ? '+' : ''}{effect.value})
            </span>
            <span className="effect-timer">{effect.remaining_seconds}с</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveEffectsDisplay;