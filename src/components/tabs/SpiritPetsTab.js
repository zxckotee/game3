import React, { useState, useEffect, useContext } from 'react';
import './SpiritPetsTab.css';

// Импортируем функции из обновленного API-клиента
import {
  fetchUserPets,
  fetchActivePet,
  fetchPetDetails,
  activatePet,
  feedPet,
  trainPet,
  checkPetsStatus,
  acquirePet,
  fetchPetCombatBonuses,
  fetchPetFood,
  fetchPetConstants,
  renamePet
} from '../../services/spirit-pet-service-api';

// Импортируем GameContext для получения userId
import { GameContext } from '../../context/GameContext';

// Компонент карточки питомца
const PetCard = ({ pet, isActive, onActivate, onFeed, onTrain, onViewDetails, disabled }) => {
  // Защита от undefined
  if (!pet) {
    console.error('PetCard: получен undefined вместо объекта питомца');
    return (
      <div className="pet-card pet-card-error" style={{
        border: '2px solid #e74c3c',
        padding: '10px',
        borderRadius: '5px',
        backgroundColor: 'rgba(231, 76, 60, 0.1)'
      }}>
        <div className="pet-card-error-message" style={{
          color: '#e74c3c',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Ошибка загрузки питомца
        </div>
      </div>
    );
  }

  const getPetTypeColor = (type) => {
    const typeColors = {
      'fire': '#e74c3c',
      'water': '#3498db',
      'earth': '#8e44ad',
      'wind': '#2ecc71',
      'lightning': '#f1c40f',
      'ice': '#3498db',
      'light': '#f5f5f5',
      'dark': '#34495e',
      'void': '#2c3e50'
    };
    return typeColors[type] || '#bdc3c7';
  };

  // Получаем данные из питомца с учетом возможных различий в форматах данных
  const level = pet.level || 1;
  const experience = pet.experience || 0;
  
  // Расчет процента опыта до следующего уровня
  const expForCurrentLevel = level * 100; // Простая формула: level * 100
  const expPercentage = (experience / expForCurrentLevel) * 100;
  
  // Преобразование данных из API в формат, понятный компоненту
  // Учитываем разные форматы данных (API может вернуть структуру с petType или вложенным pet)
  const petName = pet.customName || pet.petType?.name || pet.pet?.name || pet.name || 'Безымянный питомец';
  const petType = pet.petType?.type || pet.pet?.type || pet.type || 'unknown';
  const petElement = pet.petType?.element || pet.pet?.element || pet.element || 'unknown';
  const petRarity = pet.petType?.rarity || pet.pet?.rarity || pet.rarity || 'common';
  const petEvolutionStage = pet.petType?.evolutionStage || pet.pet?.evolution_stage || pet.evolutionStage || 'baby';
  const petHunger = pet.hunger || 0;
  const petLoyalty = pet.loyalty || 0;
  const isActivePet = pet.isActive || pet.is_active || isActive;
  
  // Получаем названия для типов (эти данные должны быть доступны из API или констант)
  const getTypeName = (type) => {
    const typeNames = {
      'beast': 'Зверь',
      'mythical': 'Мифический',
      'elemental': 'Элементаль',
      'spirit': 'Дух',
      'construct': 'Конструкт'
    };
    return typeNames[type] || type;
  };
  
  const getElementName = (element) => {
    const elementNames = {
      'fire': 'Огонь',
      'water': 'Вода',
      'earth': 'Земля',
      'air': 'Воздух',
      'lightning': 'Молния',
      'ice': 'Лёд',
      'light': 'Свет',
      'dark': 'Тьма',
      'void': 'Пустота'
    };
    return elementNames[element] || element;
  };
  
  const getRarityName = (rarity) => {
    const rarityNames = {
      'common': 'Обычный',
      'uncommon': 'Необычный',
      'rare': 'Редкий',
      'epic': 'Эпический',
      'legendary': 'Легендарный'
    };
    return rarityNames[rarity] || rarity;
  };
  
  const getEvolutionStageName = (stage) => {
    const stageNames = {
      'baby': 'Детёныш',
      'juvenile': 'Юный',
      'adult': 'Взрослый',
      'elder': 'Старейшина',
      'ancient': 'Древний'
    };
    return stageNames[stage] || stage;
  };

  return (
    <div className={`pet-card ${isActivePet ? 'pet-card-active' : ''}`} style={{ borderColor: getPetTypeColor(petElement) }}>
      <div className="pet-card-header" style={{ backgroundColor: getPetTypeColor(petElement) }}>
        <h3 className="pet-name">{petName}</h3>
        <div className="pet-type">
          {getTypeName(petType)} 
          <span className="pet-element">• {getElementName(petElement)}</span>
        </div>
        {isActivePet && <div className="pet-active-badge">Активный</div>}
      </div>
      
      <div className="pet-card-body">
        <div className="pet-info-row">
          <div className="pet-level">Уровень {level}</div>
          <div className="pet-evolution">Стадия: {getEvolutionStageName(petEvolutionStage)}</div>
        </div>
        
        <div className="pet-exp-bar-container">
          <div className="pet-exp-bar" style={{ width: `${expPercentage}%` }}></div>
          <div className="pet-exp-text">{experience} / {expForCurrentLevel} опыта</div>
        </div>
        
        <div className="pet-stats-container">
          <div className="pet-stat">
            <span className="stat-name">Сила:</span>
            <span className="stat-value">{pet.strength || 0}</span>
          </div>
          <div className="pet-stat">
            <span className="stat-name">Интеллект:</span>
            <span className="stat-value">{pet.intelligence || 0}</span>
          </div>
          <div className="pet-stat">
            <span className="stat-name">Ловкость:</span>
            <span className="stat-value">{pet.agility || 0}</span>
          </div>
          <div className="pet-stat">
            <span className="stat-name">Живучесть:</span>
            <span className="stat-value">{pet.vitality || 0}</span>
          </div>
          <div className="pet-stat">
            <span className="stat-name">Дух:</span>
            <span className="stat-value">{pet.spirit || 0}</span>
          </div>
        </div>
        
        <div className="pet-indicators">
          <div className="pet-indicator">
            <span className="indicator-name">Сытость:</span>
            <div className="indicator-bar-container">
              <div className="indicator-bar" style={{
                width: `${petHunger}%`,
                backgroundColor: petHunger < 30 ? '#e74c3c' : '#2ecc71'
              }}></div>
            </div>
            <span className="indicator-value">{petHunger}%</span>
          </div>
          <div className="pet-indicator">
            <span className="indicator-name">Лояльность:</span>
            <div className="indicator-bar-container">
              <div className="indicator-bar" style={{
                width: `${petLoyalty}%`,
                backgroundColor: petLoyalty < 50 ? '#e74c3c' : '#2ecc71'
              }}></div>
            </div>
            <span className="indicator-value">{petLoyalty}%</span>
            {petLoyalty <= 50 && (
              <div className="loyalty-warning" style={{
                color: petLoyalty <= 25 ? '#e74c3c' : '#e67e22',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                marginTop: '5px',
                textAlign: 'center',
                padding: '3px',
                border: `1px solid ${petLoyalty <= 25 ? '#e74c3c' : '#e67e22'}`,
                borderRadius: '4px',
                background: petLoyalty <= 25 ? 'rgba(231, 76, 60, 0.1)' : 'rgba(230, 126, 34, 0.1)'
              }}>
                {petLoyalty <= 25 ? '⚠️ Питомец может сбежать в бою!' : '⚠️ Лояльность снижается быстрее при использовании в бою!'}
              </div>
            )}
          </div>
        </div>
        
        <div className="pet-card-buttons">
          {!isActivePet && (
            <button
              className="pet-action-button activate-button"
              onClick={() => onActivate && onActivate(pet.id)}
              disabled={disabled}
            >
              Сделать активным
            </button>
          )}
          <button
            className="pet-action-button feed-button"
            onClick={() => onFeed && onFeed(pet.id)}
            disabled={disabled || petHunger >= 100}
          >
            Покормить
          </button>
          <button
            className="pet-action-button train-button"
            onClick={() => onTrain && onTrain(pet.id)}
            disabled={disabled || petHunger < 30}
          >
            Тренировать
          </button>
          <button
            className="pet-action-button details-button"
            onClick={() => onViewDetails && onViewDetails(pet)}
            disabled={disabled}
          >
            Подробности
          </button>
        </div>
      </div>
    </div>
  );
};

// Компонент модального окна для кормления питомца
const PetFeedingModal = ({ pet, onClose, onSelect, petFood = [], loading = false }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Кормление питомца {pet.customName || pet.petType?.name || pet.pet?.name || pet.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>Выберите еду для питомца:</p>
          
          {loading ? (
            <p>Загрузка доступной еды...</p>
          ) : petFood.filter(food => food.quantity > 0).length > 0 ? (
            <div className="food-items-list">
              {petFood.filter(food => food.quantity > 0).map(food => (
                <div 
                  key={food.id} 
                  className="food-item"
                  onClick={() => !loading && onSelect(pet.id, food.id)}
                  style={{
                    padding: '10px',
                    margin: '5px 0',
                    border: '1px solid #444',
                    borderRadius: '5px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    background: 'rgba(30, 30, 30, 0.7)',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!loading) e.currentTarget.style.background = 'rgba(80, 80, 80, 0.7)';
                  }}
                  onMouseOut={(e) => {
                    if (!loading) e.currentTarget.style.background = 'rgba(30, 30, 30, 0.7)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold', color: (() => {
                      switch(food.rarity) {
                        case 'common': return '#aaa';
                        case 'uncommon': return '#1eff00';
                        case 'rare': return '#0070dd';
                        case 'epic': return '#a335ee';
                        case 'legendary': return '#ff8000';
                        default: return '#aaa';
                      }
                    })() }}>{food.name}</span>
                    <span>x{food.quantity || 1}</span>
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#aaa', marginTop: '3px' }}>{food.description}</div>
                  <div style={{ display: 'flex', marginTop: '5px' }}>
                    <div style={{ 
                      flex: 1, 
                      color: '#2ecc71', 
                      fontSize: '0.9em' 
                    }}>
                      Сытость: +{food.nutritionValue || 25}%
                    </div>
                    <div style={{ 
                      flex: 1, 
                      color: '#e67e22', 
                      fontSize: '0.9em' 
                    }}>
                      Лояльность: +{food.loyaltyBonus || 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-food-message" style={{ color: '#e74c3c' }}>
              У вас нет еды для питомцев. Вы можете купить её у Старого Чена на рынке.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент модального окна для тренировки питомца
const PetTrainingModal = ({ pet, onClose, onTrain, loading = false }) => {
  // Используем безопасный доступ к свойствам
  const petName = pet.customName || pet.petType?.name || pet.pet?.name || pet.name;
  const petHunger = pet.hunger || 0;
  const petStrength = pet.strength || 0;
  const petIntelligence = pet.intelligence || 0;
  const petAgility = pet.agility || 0;
  const petVitality = pet.vitality || 0;
  const petSpirit = pet.spirit || 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Тренировка питомца {petName}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p>Тренировка питомца...</p>
          ) : (
            <>
              <p>Выберите характеристику для тренировки:</p>
              <p className="training-info">Тренировка повысит выбранную характеристику на 1, но уменьшит сытость на 15%.</p>
              
              <div className="training-buttons">
                <button 
                  className="training-button" 
                  onClick={() => onTrain(pet.id, 'strength')}
                  disabled={petHunger < 30 || loading}
                >
                  Сила ({petStrength})
                </button>
                <button 
                  className="training-button" 
                  onClick={() => onTrain(pet.id, 'intelligence')}
                  disabled={petHunger < 30 || loading}
                >
                  Интеллект ({petIntelligence})
                </button>
                <button 
                  className="training-button" 
                  onClick={() => onTrain(pet.id, 'agility')}
                  disabled={petHunger < 30 || loading}
                >
                  Ловкость ({petAgility})
                </button>
                <button 
                  className="training-button" 
                  onClick={() => onTrain(pet.id, 'vitality')}
                  disabled={petHunger < 30 || loading}
                >
                  Живучесть ({petVitality})
                </button>
                <button 
                  className="training-button" 
                  onClick={() => onTrain(pet.id, 'spirit')}
                  disabled={petHunger < 30 || loading}
                >
                  Дух ({petSpirit})
                </button>
              </div>
              
              {petHunger < 30 && (
                <p className="training-warning">
                  Питомец слишком голоден для тренировки. Покормите его сначала!
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент модального окна для деталей питомца
const PetDetailsModal = ({ pet, onClose }) => {
  // Безопасный доступ к свойствам
  const petName = pet.customName || pet.petType?.name || pet.pet?.name || pet.name;
  const petType = pet.petType?.type || pet.pet?.type || pet.type;
  const petElement = pet.petType?.element || pet.pet?.element || pet.element;
  const petRarity = pet.petType?.rarity || pet.pet?.rarity || pet.rarity;
  const petEvolutionStage = pet.petType?.evolutionStage || pet.pet?.evolution_stage || pet.evolutionStage || 'baby';
  const petHunger = pet.hunger || 0;
  const petLoyalty = pet.loyalty || 0;
  
  // Функция для форматирования даты
  const formatDate = (date) => {
    if (!date) return 'Никогда';
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  // Получаем описания для типов
  const getTypeDescription = (type) => {
    const descriptions = {
      'beast': 'Духовный зверь с природными способностями и инстинктами. Отличается высокой живучестью и силой.',
      'mythical': 'Легендарное существо с уникальными мистическими способностями и высоким потенциалом роста.',
      'elemental': 'Духовная сущность, связанная с природными элементами. Обладает сильными элементальными атаками.',
      'spirit': 'Чистая духовная сущность, обладающая высоким интеллектом и способностями к манипуляции энергией.',
      'construct': 'Искусственно созданное духовное существо, обладающее уникальными способностями и высокой стабильностью.'
    };
    return descriptions[type] || 'Духовное существо с неизвестными свойствами и характеристиками.';
  };

  // Получаем названия для типов
  const getTypeName = (type) => {
    const typeNames = {
      'beast': 'Зверь',
      'mythical': 'Мифический',
      'elemental': 'Элементаль',
      'spirit': 'Дух',
      'construct': 'Конструкт'
    };
    return typeNames[type] || type;
  };
  
  const getElementName = (element) => {
    const elementNames = {
      'fire': 'Огонь',
      'water': 'Вода',
      'earth': 'Земля',
      'air': 'Воздух',
      'lightning': 'Молния',
      'ice': 'Лёд',
      'light': 'Свет',
      'dark': 'Тьма',
      'void': 'Пустота'
    };
    return elementNames[element] || element;
  };
  
  const getRarityName = (rarity) => {
    const rarityNames = {
      'common': 'Обычный',
      'uncommon': 'Необычный',
      'rare': 'Редкий',
      'epic': 'Эпический',
      'legendary': 'Легендарный'
    };
    return rarityNames[rarity] || rarity;
  };
  
  const getEvolutionStageName = (stage) => {
    const stageNames = {
      'baby': 'Детёныш',
      'juvenile': 'Юный',
      'adult': 'Взрослый',
      'elder': 'Старейшина',
      'ancient': 'Древний'
    };
    return stageNames[stage] || stage;
  };
  
  const getEvolutionStageDescription = (stage) => {
    const descriptions = {
      'baby': 'Молодой, неопытный питомец. Обладает базовыми способностями и высоким потенциалом роста.',
      'juvenile': 'Подросший питомец, начинающий развивать свои способности и характер.',
      'adult': 'Полностью сформировавшийся питомец с развитыми способностями и опытом.',
      'elder': 'Мудрый и опытный питомец, достигший вершины своего развития.',
      'ancient': 'Легендарный питомец, обладающий уникальными способностями и огромной мощью.'
    };
    return descriptions[stage] || 'Неизвестная стадия развития питомца.';
  };

  // Расчет примерных боевых бонусов от питомца
  const combatBonus = {
    attack: Math.floor(pet.strength * 0.5 * (petLoyalty / 100)),
    defense: Math.floor(pet.vitality * 0.5 * (petLoyalty / 100)),
    speed: Math.floor(pet.agility * 0.5 * (petLoyalty / 100)),
    critChance: (pet.agility * 0.005 * (petLoyalty / 100)),
    healthBonus: Math.floor(pet.vitality * 5 * (petLoyalty / 100)),
    energyBonus: Math.floor(pet.spirit * 3 * (petLoyalty / 100))
  };

  // Получаем способности питомца (если доступны)
  const petAbilities = pet.abilities || pet.pet?.abilities || [];
  const petCombatAbilities = pet.combatAbilities || pet.pet?.combat_abilities || [];
  const allAbilities = [...petAbilities, ...petCombatAbilities];

  return (
    <div className="modal-overlay">
      <div className="modal-content pet-details-modal">
        <div className="modal-header">
          <h3>{petName} - {getTypeName(petType)}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="pet-details-section">
            <h4>Основная информация</h4>
            <p className="pet-description">{getTypeDescription(petType)}</p>
            <div className="pet-details-row">
              <div className="pet-detail">
                <span className="detail-label">Уровень:</span>
                <span className="detail-value">{pet.level}</span>
              </div>
              <div className="pet-detail">
                <span className="detail-label">Опыт:</span>
                <span className="detail-value">{pet.experience} / {pet.level * 100}</span>
              </div>
              <div className="pet-detail">
                <span className="detail-label">Стадия эволюции:</span>
                <span className="detail-value">{getEvolutionStageName(petEvolutionStage)}</span>
              </div>
              <div className="pet-detail">
                <span className="detail-label">Элемент:</span>
                <span className="detail-value">{getElementName(petElement)}</span>
              </div>
              <div className="pet-detail">
                <span className="detail-label">Редкость:</span>
                <span className="detail-value">{getRarityName(petRarity)}</span>
              </div>
            </div>
            <div className="pet-evolution-description">
              {getEvolutionStageDescription(petEvolutionStage)}
            </div>
          </div>
          
          <div className="pet-details-section">
            <h4>Характеристики</h4>
            <div className="pet-details-stats">
              <div className="pet-detail-stat">
                <span className="detail-stat-name">Сила:</span>
                <span className="detail-stat-value">{pet.strength}</span>
              </div>
              <div className="pet-detail-stat">
                <span className="detail-stat-name">Интеллект:</span>
                <span className="detail-stat-value">{pet.intelligence}</span>
              </div>
              <div className="pet-detail-stat">
                <span className="detail-stat-name">Ловкость:</span>
                <span className="detail-stat-value">{pet.agility}</span>
              </div>
              <div className="pet-detail-stat">
                <span className="detail-stat-name">Живучесть:</span>
                <span className="detail-stat-value">{pet.vitality}</span>
              </div>
              <div className="pet-detail-stat">
                <span className="detail-stat-name">Дух:</span>
                <span className="detail-stat-value">{pet.spirit}</span>
              </div>
            </div>
          </div>
          
          <div className="pet-details-section">
            <h4>Боевые бонусы</h4>
            <div className="pet-details-combat">
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Атака:</span>
                <span className="combat-bonus-value">+{combatBonus.attack}</span>
              </div>
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Защита:</span>
                <span className="combat-bonus-value">+{combatBonus.defense}</span>
              </div>
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Скорость:</span>
                <span className="combat-bonus-value">+{combatBonus.speed}</span>
              </div>
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Шанс крит.удара:</span>
                <span className="combat-bonus-value">+{(combatBonus.critChance * 100).toFixed(1)}%</span>
              </div>
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Бонус здоровья:</span>
                <span className="combat-bonus-value">+{combatBonus.healthBonus}</span>
              </div>
              <div className="pet-combat-bonus">
                <span className="combat-bonus-name">Бонус энергии:</span>
                <span className="combat-bonus-value">+{combatBonus.energyBonus}</span>
              </div>
            </div>
          </div>
          
          <div className="pet-details-section">
            <h4>Способности</h4>
            <div className="pet-abilities-list">
              {allAbilities.map(ability => (
                <div key={ability.id} className="pet-ability">
                  <div className="ability-header">
                    <span className="ability-name">{ability.name}</span>
                    <span className="ability-type">
                      {ability.type === 'attack' ? 'Атака' : 
                       ability.damage_type ? `Атака (${getElementName(ability.damage_type)})` :
                       ability.type === 'buff' ? 'Усиление' : 'Эффект'}
                    </span>
                  </div>
                  <div className="ability-description">{ability.description}</div>
                  {ability.cooldown && (
                    <div className="ability-energy-cost">Перезарядка: {ability.cooldown} ходов</div>
                  )}
                  {ability.energy_cost && (
                    <div className="ability-energy-cost">Энергия: {ability.energy_cost}</div>
                  )}
                  {ability.damage_multiplier && (
                    <div className="ability-damage">Множитель урона: x{ability.damage_multiplier.toFixed(1)}</div>
                  )}
                </div>
              ))}
            </div>
            {allAbilities.length === 0 && (
              <p className="no-abilities">У питомца пока нет способностей</p>
            )}
          </div>
          
          <div className="pet-details-section">
            <h4>Информация об уходе</h4>
            <div className="pet-details-care">
              <div className="pet-care-info">
                <span className="care-info-name">Сытость:</span>
                <div className="care-info-bar-container">
                  <div 
                    className="care-info-bar" 
                    style={{ 
                      width: `${petHunger}%`, 
                      backgroundColor: petHunger < 30 ? '#e74c3c' : '#2ecc71' 
                    }}
                  ></div>
                </div>
                <span className="care-info-value">{petHunger}%</span>
              </div>
              <div className="pet-care-info">
                <span className="care-info-name">Лояльность:</span>
                <div className="care-info-bar-container">
                  <div 
                    className="care-info-bar" 
                    style={{ 
                      width: `${petLoyalty}%`, 
                      backgroundColor: petLoyalty < 50 ? '#e74c3c' : '#2ecc71' 
                    }}
                  ></div>
                </div>
                <span className="care-info-value">{petLoyalty}%</span>
                {petLoyalty <= 25 && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    marginTop: '5px',
                    textAlign: 'center',
                    padding: '5px',
                    border: '1px solid #e74c3c',
                    borderRadius: '4px',
                    background: 'rgba(231, 76, 60, 0.1)'
                  }}>
                    ⚠️ Внимание! При низкой лояльности питомец может сбежать во время боя!
                  </div>
                )}
              </div>
              <div className="pet-loyalty-mechanics" style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'rgba(50, 50, 50, 0.5)',
                borderRadius: '5px',
                fontSize: '0.9em'
              }}>
                <h5 style={{ margin: '0 0 5px 0', fontSize: '1em' }}>Механика лояльности:</h5>
                <p>Питомцы с низкой лояльностью дают меньше бонусов и могут сбежать во время боя.</p>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  <li>Кормление повышает лояльность на 5% (если питомец был очень голоден)</li>
                  <li>Тренировка повышает лояльность на 3%</li>
                  <li>Победа в бою повышает лояльность на 5%</li>
                  <li>Лояльность снижается, если питомец голоден (ниже 20% сытости)</li>
                  <li>Питомец может сбежать из боя, если лояльность ниже 30%</li>
                </ul>
              </div>
              <div className="pet-dates">
                <div>Последнее кормление: {formatDate(pet.lastFed || pet.last_fed)}</div>
                <div>Последняя тренировка: {formatDate(pet.lastTrained || pet.last_trained)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Главный компонент вкладки питомцев
const SpiritPetsTab = () => {
  // Используем GameContext для получения userId
  const { state } = useContext(GameContext);
  const userId = state?.player?.id;
  const effectiveUserId = userId || parseInt(localStorage.getItem('userId') || '1'); // Используем 1 как значение по умолчанию
  
  // Состояния для хранения данных и UI
  const [pets, setPets] = useState([]);
  const [petFood, setPetFood] = useState([]);
  const [petConstants, setPetConstants] = useState(null);
  const [activePetId, setActivePetId] = useState(null);
  
  // Состояния для отслеживания загрузки и ошибок
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState({
    activate: false,
    feed: false,
    train: false,
    acquire: false
  });
  const [error, setError] = useState(null);
  
  // Состояния для модальных окон
  const [selectedPet, setSelectedPet] = useState(null);
  const [feedingModalOpen, setFeedingModalOpen] = useState(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  // Загружаем данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Загружаем всех питомцев пользователя
        const userPets = await fetchUserPets(effectiveUserId);
        
        if (userPets.error) {
          throw new Error(userPets.error);
        }
        
        setPets(userPets);
        
        // Находим активного питомца
        const activePet = userPets.find(pet => pet.isActive || pet.is_active);
        if (activePet) {
          setActivePetId(activePet.id);
        } else {
          // Если нет активного питомца, пробуем получить его отдельным запросом
          const activeResult = await fetchActivePet(effectiveUserId);
          if (activeResult && !activeResult.error) {
            setActivePetId(activeResult.id);
          }
        }
        
        // Загружаем доступные корма для питомцев с учетом инвентаря пользователя
        const foodData = await fetchPetFood(effectiveUserId);
        if (!foodData.error) {
          setPetFood(foodData);
        } else {
          console.warn('Не удалось загрузить корм для питомцев:', foodData?.error);
        }
        
        // Загружаем константы для питомцев
        const constants = await fetchPetConstants();
        if (!constants.error) {
          setPetConstants(constants);
        } else {
          console.warn('Не удалось загрузить константы для питомцев:', constants?.error);
        }
        
        // Проверяем и обновляем состояние питомцев
        await checkPetsStatus(effectiveUserId);
      } catch (err) {
        console.error('Ошибка при загрузке данных питомцев:', err);
        setError(err.message || 'Не удалось загрузить данные питомцев');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Устанавливаем интервал для проверки состояния питомцев
    const intervalId = setInterval(async () => {
      try {
        const updatedPets = await checkPetsStatus(effectiveUserId);
        
        if (updatedPets && updatedPets.length > 0 && !updatedPets.error) {
          setPets(prevPets => {
            return prevPets.map(pet => {
              const updatedPet = updatedPets.find(p => p.id === pet.id);
              return updatedPet ? { ...pet, ...updatedPet } : pet;
            });
          });
        }
      } catch (err) {
        console.error('Ошибка при проверке состояния питомцев:', err);
        // Не показываем пользователю ошибку при фоновой проверке состояния
      }
    }, 60000); // Проверяем каждую минуту
    
    return () => clearInterval(intervalId);
  }, [effectiveUserId]);
  
  // Обработчик активации питомца
  const handleActivatePet = async (petId) => {
    try {
      setOperationLoading(prev => ({ ...prev, activate: true }));
      setError(null);
      
      const result = await activatePet(petId, effectiveUserId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Обновляем активного питомца
      setActivePetId(petId);
      
      // Обновляем список питомцев
      setPets(prevPets => {
        return prevPets.map(pet => ({
          ...pet,
          isActive: pet.id === petId,
          is_active: pet.id === petId
        }));
      });
    } catch (err) {
      console.error('Ошибка при активации питомца:', err);
      setError(err.message || 'Не удалось активировать питомца');
    } finally {
      setOperationLoading(prev => ({ ...prev, activate: false }));
    }
  };
  
  // Обработчик открытия модального окна кормления
  const handleOpenFeedingModal = (petId) => {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setFeedingModalOpen(true);
    }
  };
  
  // Обработчик кормления питомца
  const handleFeedPet = async (petId, foodItemId) => {
    try {
      setOperationLoading(prev => ({ ...prev, feed: true }));
      setError(null);
      
      // Проверяем, что корм выбран
      if (!foodItemId) {
        throw new Error('Выберите корм для питомца');
      }
      
      const result = await feedPet(petId, foodItemId, effectiveUserId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Обновляем питомца в списке
      setPets(prevPets => {
        return prevPets.map(pet => {
          if (pet.id === petId) {
            return { ...pet, ...result };
          }
          return pet;
        });
      });
      
      // Обновляем доступный корм (уменьшаем количество)
      setPetFood(prevFood => {
        return prevFood.map(food => {
          if (food.id === foodItemId && food.quantity > 0) {
            return { ...food, quantity: food.quantity - 1 };
          }
          return food;
        }).filter(food => food.quantity > 0); // Удаляем корм с нулевым количеством
      });
      
      // Закрываем модальное окно
      setFeedingModalOpen(false);
      setSelectedPet(null);
    } catch (err) {
      console.error('Ошибка при кормлении питомца:', err);
      setError(err.message || 'Не удалось покормить питомца');
    } finally {
      setOperationLoading(prev => ({ ...prev, feed: false }));
    }
  };
  
  // Обработчик открытия модального окна тренировки
  const handleOpenTraining = (petId) => {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setTrainingModalOpen(true);
    }
  };
  
  // Обработчик тренировки питомца
  const handleTrainPet = async (petId, stat) => {
    try {
      setOperationLoading(prev => ({ ...prev, train: true }));
      setError(null);
      
      // Проверяем, что характеристика выбрана
      if (!stat) {
        throw new Error('Выберите характеристику для тренировки');
      }
      
      // Проверяем, что питомец не слишком голоден
      const pet = pets.find(p => p.id === petId);
      if (pet && (pet.hunger < 30)) {
        throw new Error('Питомец слишком голоден для тренировки. Покормите его сначала!');
      }
      
      const result = await trainPet(petId, stat, effectiveUserId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Обновляем питомца в списке
      setPets(prevPets => {
        return prevPets.map(pet => {
          if (pet.id === petId) {
            return { ...pet, ...result };
          }
          return pet;
        });
      });
      
      // Закрываем модальное окно
      setTrainingModalOpen(false);
      setSelectedPet(null);
    } catch (err) {
      console.error('Ошибка при тренировке питомца:', err);
      setError(err.message || 'Не удалось тренировать питомца');
      
      // Если ошибка связана с голодом, показываем соответствующее сообщение
      if (err.message && err.message.includes('голоден')) {
        setError('Питомец слишком голоден для тренировки. Покормите его сначала!');
      }
    } finally {
      setOperationLoading(prev => ({ ...prev, train: false }));
    }
  };
  
  // Обработчик просмотра деталей питомца
  const handleViewDetails = (pet) => {
    setSelectedPet(pet);
    setDetailsModalOpen(true);
  };
  
  // Обработчик получения нового питомца
  const handleAcquirePet = async () => {
    try {
      setOperationLoading(prev => ({ ...prev, acquire: true }));
      setError(null);
      
      const result = await acquirePet(null, effectiveUserId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Добавляем нового питомца в список
      setPets(prevPets => [...prevPets, result]);
      
      // Если это первый питомец, делаем его активным
      if (pets.length === 0) {
        handleActivatePet(result.id);
      }
    } catch (err) {
      console.error('Ошибка при получении нового питомца:', err);
      setError(err.message || 'Не удалось приручить нового питомца');
    } finally {
      setOperationLoading(prev => ({ ...prev, acquire: false }));
    }
  };
  
  // Рендеринг компонента
  return (
    <div className="spirit-pets-tab">
      <div className="pets-tab-header">
        <h2>Духовные питомцы</h2>
        <p className="pets-tab-description">
          Духовные питомцы - это сущности, которые могут помочь вам в развитии и битвах.
          Заботьтесь о них, и они ответят вам верностью и поддержкой.
        </p>
      </div>
      
      {error && (
        <div className="pets-error-message">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="pets-loading">
          <p>Загрузка питомцев...</p>
        </div>
      ) : pets.length > 0 ? (
        <div className="pets-container">
          <h3>Ваши питомцы</h3>
          <div className="pets-grid">
            {pets.map(pet => (
              <PetCard
                key={pet.id}
                pet={pet}
                isActive={pet.id === activePetId}
                onActivate={handleActivatePet}
                onFeed={handleOpenFeedingModal}
                onTrain={handleOpenTraining}
                onViewDetails={handleViewDetails}
                disabled={
                  operationLoading.activate ||
                  operationLoading.feed ||
                  operationLoading.train ||
                  operationLoading.acquire
                }
              />
            ))}
          </div>
          
          <div className="acquire-pet-section">
            <h3>Получить нового питомца</h3>
            <button
              className="acquire-pet-button"
              onClick={handleAcquirePet}
              disabled={operationLoading.acquire}
            >
              {operationLoading.acquire ? 'Поиск питомца...' : 'Найти питомца'}
            </button>
            <p className="acquire-pet-note">
              Вы можете найти новых питомцев во время исследования подземелий или приобрести их у торговцев духовными созданиями.
            </p>
          </div>
        </div>
      ) : (
        <div className="no-pets-message">
          <p>У вас пока нет духовных питомцев.</p>
          <button
            className="acquire-pet-button"
            onClick={handleAcquirePet}
            disabled={operationLoading.acquire}
          >
            {operationLoading.acquire ? 'Поиск питомца...' : 'Найти первого питомца'}
          </button>
        </div>
      )}
      
      {/* Модальные окна */}
      {feedingModalOpen && selectedPet && (
        <PetFeedingModal
          pet={selectedPet}
          onClose={() => {
            setFeedingModalOpen(false);
            setSelectedPet(null);
          }}
          onSelect={handleFeedPet}
          petFood={petFood}
          loading={operationLoading.feed}
        />
      )}
      
      {trainingModalOpen && selectedPet && (
        <PetTrainingModal
          pet={selectedPet}
          onClose={() => {
            setTrainingModalOpen(false);
            setSelectedPet(null);
          }}
          onTrain={handleTrainPet}
          loading={operationLoading.train}
        />
      )}
      
      {detailsModalOpen && selectedPet && (
        <PetDetailsModal
          pet={selectedPet}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedPet(null);
          }}
        />
      )}
    </div>
  );
};

export default SpiritPetsTab;
