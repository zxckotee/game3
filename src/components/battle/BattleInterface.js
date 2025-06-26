import React, { useState, useEffect, useRef } from 'react';
import './BattleInterface.css';
import BattleEffects from './BattleEffects';
import ActionPanel from './ActionPanel';
import { techniques } from '../../data/combat';

/**
 * Основной компонент интерфейса боя
 * @param {Object} props - Свойства компонента
 * @param {Object} props.room - Данные комнаты
 * @param {Array} props.participants - Массив участников
 * @param {Object} props.teams - Объект с командами
 * @param {Array} props.actions - Массив действий
 * @param {number} props.currentUserId - ID текущего пользователя
 * @param {Function} props.onPerformAction - Функция выполнения действия
 * @param {Array} props.availableTechniques - Массив доступных техник
 */
const BattleInterface = ({
  room,
  participants = [],
  teams = { 1: [], 2: [] },
  actions = [],
  currentUserId,
  onPerformAction,
  availableTechniques = [],
  isActionBlocked = false,     // Флаг блокировки действий во время таймаута
  actionCooldown = 0,          // Текущее значение таймаута в секундах
  actionCooldownTotal = 5      // Общее время таймаута для отображения прогресса
}) => {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [currentTechniqueId, setCurrentTechniqueId] = useState(null);
  const [lastActionId, setLastActionId] = useState(null);
  const logRef = useRef(null);

  // Находим текущего участника
  const currentParticipant = participants.find(p => p.user_id === currentUserId);
  
  // Определяем, может ли игрок действовать (бой в процессе)
  const isMyTurn = room?.status === 'in_progress';
  
  // Создаем useRef для состояния canAct
  const canActRef = useRef(false);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const [, forceUpdate] = useState({});
  
  // Выводим доступные техники в консоль для отладки
  useEffect(() => {
    console.log('[DEBUG] Доступные техники:', availableTechniques);
    
    // Выводим подробную информацию о каждой технике
    availableTechniques.forEach(technique => {
      const tech = typeof technique === 'object' ? technique : techniques[technique];
      if (tech) {
        console.log(`[DEBUG] Техника: ${tech.id || technique}`, {
          name: tech.name,
          type: tech.type,
          damage: tech.damage,
          energyCost: tech.energyCost,
          targetType: tech.targetType
        });
      }
    });
  }, [availableTechniques]);
  
  // Обновляем canAct и remainingCooldown каждую секунду
  useEffect(() => {
    const checkCooldown = () => {
      if (!currentParticipant?.last_action_time) {
        canActRef.current = true;
        setRemainingCooldown(0);
        return;
      }
      
      const lastActionTime = new Date(currentParticipant.last_action_time);
      const now = new Date();
      const elapsed = now - lastActionTime;
      const cooldownPeriod = 5000; // 5 секунд между действиями
      
      if (elapsed >= cooldownPeriod) {
        canActRef.current = true;
        setRemainingCooldown(0);
      } else {
        canActRef.current = false;
        setRemainingCooldown(Math.ceil((cooldownPeriod - elapsed) / 1000));
      }
      
      // Форсируем обновление компонента
      forceUpdate({});
    };
    
    // Проверяем сразу
    checkCooldown();
    
    // Устанавливаем интервал для обновления
    const interval = setInterval(checkCooldown, 250); // Более частые обновления
    
    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(interval);
  }, [currentParticipant?.last_action_time]);

  // Автоматическая прокрутка лога боя при добавлении новых действий
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0; // Прокручиваем к верху списка, так как новые события теперь сверху
    }
  }, [actions]);

  // Функция для определения, является ли техника атакующей (требует выбор цели)
  const isTechniqueAttack = (techniqueId) => {
    console.log(`[DEBUG] Проверка техники ${techniqueId}`, {
      availableTechniquesCount: availableTechniques.length,
      availableTechniquesIds: availableTechniques.map(t => typeof t === 'object' ? t.id : t)
    });
    
    // Исключение для техники "Дыхание Небес"
    if (techniqueId === 'heavenly_breath') {
      console.log(`[DEBUG] Обнаружена техника "Дыхание Небес", не требует выбора цели`);
      return false;
    }
    
    // Проверка конкретной техники "Удар кулака"
    if (techniqueId === 'basic_punch' || techniqueId === 'удар_кулака') {
      console.log(`[DEBUG] Обнаружена техника "Удар кулака", считаем её атакующей`);
      return true;
    }
    
    // Получаем объект техники
    const techniqueObj = availableTechniques.find(t =>
      (typeof t === 'object' && t.id === techniqueId) || t === techniqueId
    );
    
    const technique = typeof techniqueObj === 'object' ? techniqueObj : techniques[techniqueId];
    
    console.log(`[DEBUG] Найденная техника:`, {
      techniqueObj,
      technique,
      techniqueType: technique?.type,
      techniqueName: technique?.name,
      targetType: technique?.targetType,
      techniqueDamage: technique?.damage,
      isFromAvailableTechniques: !!techniqueObj,
      isFromGlobalTechniques: !!techniques[techniqueId]
    });
    
    // Если техника не найдена, считаем ее не требующей цели
    if (!technique) {
      console.log(`[DEBUG] Техника ${techniqueId} не найдена, считаем её не требующей выбора цели`);
      return false;
    }
    
    // Проверка targetType техники
    if (technique.targetType === 'self') {
      console.log(`[DEBUG] Техника ${techniqueId} имеет targetType=self, не требует выбора цели`);
      return false;
    }
    
    // Если тип техники "cultivation", не требует выбора цели
    if (technique.type === 'cultivation') {
      console.log(`[DEBUG] Техника ${techniqueId} имеет тип=cultivation, не требует выбора цели`);
      return false;
    }
    
    // Некоторые типы техник не требуют выбора цели
    if (['meditation', 'cultivation', 'transformation'].includes(technique.type)) {
      console.log(`[DEBUG] Техника ${techniqueId} имеет тип=${technique.type}, не требует выбора цели`);
      return false;
    }
    
    // Проверка по названию для "Удар кулака"
    if (technique.name === 'Удар кулака' || technique.name?.toLowerCase().includes('удар кулака')) {
      console.log(`[DEBUG] Обнаружена техника "Удар кулака" по имени, считаем её атакующей`);
      return true;
    }
    
    // Если тип техники явно определен как "attack", то требуется выбор цели
    if (technique.type === 'attack') {
      console.log(`[DEBUG] Техника ${techniqueId} (${technique.name}): тип=${technique.type}, является атакующей`);
      return true;
    }
    
    // Проверка на наличие урона (исправленная версия)
    if (technique.damage !== undefined && technique.damage > 0) {
      console.log(`[DEBUG] Техника ${techniqueId} имеет урон ${technique.damage}, считаем её атакующей`);
      return true;
    }
    
    // Для техник типа "support" проверяем targetType
    if (technique.type === 'support') {
      // Если targetType не SELF, то требуется выбор цели
      const requiresTarget = technique.targetType !== 'self';
      console.log(`[DEBUG] Техника поддержки ${techniqueId} ${requiresTarget ? 'требует' : 'не требует'} выбора цели (targetType=${technique.targetType})`);
      return requiresTarget;
    }
    
    // Для всех остальных типов техник выбор цели не требуется
    console.log(`[DEBUG] Техника ${techniqueId} (${technique.name || 'неизвестная'}): тип=${technique.type || 'неизвестный'}, targetType=${technique.targetType}, урон=${technique.damage}, не является атакующей`);
    return false;
  };

  // Обработчик выбора действия
  const handleActionSelect = (actionType, techniqueId = null) => {
    console.log(`[DEBUG] handleActionSelect вызван с actionType=${actionType}, techniqueId=${techniqueId}`);
    
    setCurrentAction(actionType);
    setCurrentTechniqueId(techniqueId);
    
    // Получаем данные о технике для логирования
    let techniqueInfo = null;
    if (techniqueId) {
      const techniqueObj = availableTechniques.find(t =>
        (typeof t === 'object' && t.id === techniqueId) || t === techniqueId
      );
      const technique = typeof techniqueObj === 'object' ? techniqueObj : techniques[techniqueId];
      techniqueInfo = {
        id: techniqueId,
        name: technique?.name,
        type: technique?.type,
        damage: technique?.damage
      };
    }
    
    // Проверяем, требует ли действие выбора цели
    const requiresTarget = actionType === 'attack' ||
                          (actionType === 'technique' && techniqueId && isTechniqueAttack(techniqueId));
    
    console.log(`[DEBUG] Действие ${actionType} ${requiresTarget ? 'требует' : 'не требует'} выбора цели`, {
      actionType,
      techniqueId,
      techniqueInfo,
      requiresTarget
    });
    
    if (!requiresTarget) {
      // Выполняем действие без цели
      console.log(`[DEBUG] Автоматически выполняем ${actionType} без выбора цели`, {
        actionType,
        techniqueId: techniqueId,
        techniqueInfo
      });
      onPerformAction(actionType, null, techniqueId);
      
      // Сбрасываем выбор
      setCurrentAction(null);
      setCurrentTechniqueId(null);
    } else {
      // Показываем интерфейс выбора цели
      console.log(`[DEBUG] Ожидаем выбор цели для ${actionType}`);
      setSelectedTarget(null);
    }
  };

  // Обработчик выбора цели
  const handleTargetSelect = (targetId) => {
    if (!currentAction) return;
    
    // Получаем данные о технике для логирования
    let techniqueInfo = null;
    if (currentTechniqueId) {
      const techniqueObj = availableTechniques.find(t =>
        (typeof t === 'object' && t.id === currentTechniqueId) || t === currentTechniqueId
      );
      const technique = typeof techniqueObj === 'object' ? techniqueObj : techniques[currentTechniqueId];
      techniqueInfo = {
        id: currentTechniqueId,
        name: technique?.name,
        type: technique?.type,
        damage: technique?.damage
      };
    }
    
    console.log(`[DEBUG] BattleInterface: Выбрана цель с ID ${targetId}`, {
      targetId,
      actionType: currentAction,
      techniqueId: currentTechniqueId,
      techniqueInfo,
      isAttackTechnique: currentTechniqueId ? isTechniqueAttack(currentTechniqueId) : false
    });
    
    setSelectedTarget(targetId);
    
    // Выполняем действие
    onPerformAction(currentAction, targetId, currentTechniqueId);
    
    // Сбрасываем выбор
    setCurrentAction(null);
    setCurrentTechniqueId(null);
    setSelectedTarget(null);
  };

  // Определяем, нужно ли выбирать цель для текущего действия
  const needsTarget = React.useMemo(() => {
    // Получаем данные о технике для логирования
    let techniqueInfo = null;
    if (currentTechniqueId) {
      const techniqueObj = availableTechniques.find(t =>
        (typeof t === 'object' && t.id === currentTechniqueId) || t === currentTechniqueId
      );
      const technique = typeof techniqueObj === 'object' ? techniqueObj : techniques[currentTechniqueId];
      techniqueInfo = {
        id: currentTechniqueId,
        name: technique?.name,
        type: technique?.type,
        damage: technique?.damage
      };
    }
    
    const requiresTarget = currentAction === 'attack' ||
                         (currentAction === 'technique' && currentTechniqueId && isTechniqueAttack(currentTechniqueId));
    
    console.log(`[DEBUG] needsTarget = ${requiresTarget}`, {
      currentAction,
      currentTechniqueId,
      techniqueInfo,
      isAttackType: currentAction === 'technique' && currentTechniqueId ? isTechniqueAttack(currentTechniqueId) : 'n/a'
    });
    
    return requiresTarget;
  }, [currentAction, currentTechniqueId, availableTechniques]);

  // Получаем процент здоровья для определения класса
  const getHealthClass = (current, max) => {
    const percent = (current / max) * 100;
    if (percent > 60) return 'high';
    if (percent > 30) return 'medium';
    return 'low';
  };

  // Форматирование времени для лога
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Получение названия техники по ID
  const getTechniqueName = (techniqueId) => {
    // Сначала ищем в availableTechniques
    const availableTechnique = availableTechniques.find(t =>
      (typeof t === 'object' && t.id === techniqueId) || t === techniqueId
    );
    
    // Если нашли объект техники, возвращаем его имя
    if (typeof availableTechnique === 'object' && availableTechnique.name)
      return availableTechnique.name;
    
    // Если не нашли или нашли только ID, ищем в глобальном объекте techniques
    const technique = techniques[techniqueId];
    return technique ? technique.name : 'Техника';
  };

  // Проверка, является ли эффект истекающим (осталось менее 5 секунд)
  const isExpiringEffect = (effect) => {
    // Проверяем на основе разных полей, которые могут содержать длительность
    if (effect.remainingSeconds !== undefined) {
      return effect.remainingSeconds <= 5;
    } else if (effect.durationMs !== undefined && effect.startTime !== undefined) {
      const now = Date.now();
      const elapsedMs = now - effect.startTime;
      const remainingMs = Math.max(0, effect.durationMs - elapsedMs);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      return remainingSeconds <= 5;
    } else if (effect.displayValue && typeof effect.displayValue === 'string') {
      // Если есть displayValue в формате "X сек."
      const match = effect.displayValue.match(/(\d+)\s*сек/);
      if (match) {
        return parseInt(match[1], 10) <= 5;
      }
    } else if (effect.duration !== undefined) {
      // Используем значение duration напрямую, т.к. в БД хранятся секунды
      return (effect.duration - (effect.elapsedTurns || 0)) <= 5;
    }
    return false;
  };

  // Функция для вычисления модификаторов от эффектов
  const calculateStatsModifiers = (participant) => {
    if (!participant || !participant.effects || !Array.isArray(participant.effects)) {
      return { damage: 0, defense: 0, speed: 0, energyRegen: 0 };
    }
    
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
          break;
        case 'weaken':
          // Ослабление снижает наносимый урон
          statsModifiers.damage -= 25; // Снижение урона на 25%
          break;
        case 'protect':
          // Защита снижает получаемый урон
          statsModifiers.defense += 40; // Снижение получаемого урона на 40%
          break;
        case 'speed':
          // Увеличение скорости
          statsModifiers.speed += 20; // Увеличение скорости на 20%
          break;
      }
    });
    
    return statsModifiers;
  };

  // Определяем, в какой команде находится текущий игрок
  const playerTeam = currentParticipant?.team;
  const opponentTeam = playerTeam === 1 ? 2 : 1;
  
  // Функция для рендеринга команды
  const renderTeam = (teamNumber, isPlayerTeam) => {
    const teamClass = isPlayerTeam ? "team-one" : "team-two";
    const teamTitle = isPlayerTeam ? "Моя команда" : "Команда противника";
    
    console.log(`[DEBUG] Рендеринг команды ${teamNumber}, isPlayerTeam=${isPlayerTeam}, needsTarget=${needsTarget}`);
    
    return (
      <div className={`team-container ${teamClass}`}>
        <div className={`team-header ${teamClass}`}>{teamTitle}</div>
        {teams[teamNumber]?.map(participant => {
          const isDefeated = participant.current_hp <= 0;
          
          // Определяем, может ли этот участник быть целью в зависимости от типа действия
          // Для атак целями могут быть только противники
          const isEnemyTeam = participant.team !== currentParticipant?.team;
          const isAttackAction = currentAction === 'attack';
          const isTechniqueAction = currentAction === 'technique';
          
          // Для атак и атакующих техник целью могут быть только противники
          // Если это не атакующее действие, то isSelectable всегда false
          const isSelectable = needsTarget && !isDefeated && isEnemyTeam;
          const isCurrentUser = participant.user_id === currentUserId;
          
          console.log(`[DEBUG] Участник ${participant.id} (${participant.username}):
            isDefeated=${isDefeated},
            isEnemyTeam=${isEnemyTeam},
            needsTarget=${needsTarget},
            isSelectable=${isSelectable}`);
          
          return (
            <div
              key={participant.id}
              className={`participant-card ${isDefeated ? 'defeated' : ''} ${isSelectable ? 'selectable' : ''} ${isCurrentUser ? 'current-user' : ''}`}
              onClick={() => {
                console.log(`[DEBUG] Клик по участнику ${participant.id}, isSelectable=${isSelectable}`);
                if (isSelectable) {
                  handleTargetSelect(participant.id);
                }
              }}
            >
              <div className="participant-header">
                <div className="participant-name">{participant.username}</div>
                <div className="participant-level">Уровень {participant.level}</div>
              </div>
              
              <div className="health-bar">
                <div
                  className={`health-fill ${getHealthClass(participant.current_hp, participant.max_hp)}`}
                  style={{ width: `${Math.max(0, Math.min(100, (participant.current_hp / participant.max_hp) * 100))}%` }}
                ></div>
                <div className="health-text">
                  {participant.current_hp} / {participant.max_hp}
                </div>
              </div>
              
              <div className="energy-bar">
                <div
                  className="energy-fill"
                  style={{ width: `${Math.max(0, Math.min(100, (participant.current_energy / participant.max_energy) * 100))}%` }}
                ></div>
              </div>
              
              <BattleEffects
                effects={participant.effects?.map(effect => ({
                  ...effect,
                  expiring: isExpiringEffect(effect)
                }))}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="battle-container">
      <div className="battle-header">
        <div className="battle-title">{room?.name || 'PvP Арена'}</div>
        <div className={`battle-status ${room?.status || 'waiting'}`}>
          {room?.status === 'waiting' && 'Ожидание'}
          {room?.status === 'in_progress' && 'В процессе'}
          {room?.status === 'completed' && 'Завершен'}
        </div>
      </div>
      
      <div className="battle-arena">
        {/* Команда игрока (всегда слева) */}
        {playerTeam && renderTeam(playerTeam, true)}
        
        {/* Индикатор возможности действия - показываем только если игрок может действовать */}
        {room?.status === 'in_progress' && currentParticipant && canActRef.current && !isActionBlocked && (
          <div className="turn-indicator">
            Выберите действие
          </div>
        )}
        
        {/* Отдельный индикатор ожидания перезарядки - показываем только во время ожидания из-за canActRef */}
        {room?.status === 'in_progress' && currentParticipant && !canActRef.current && !isActionBlocked && (
          <div className="wait-indicator">
            Ожидание перезарядки: {remainingCooldown} сек
          </div>
        )}
        
        {/* Индикатор таймаута между ходами - показываем только при активном таймауте */}
        {room?.status === 'in_progress' && currentParticipant && isActionBlocked && (
          <div className="wait-indicator">
            Ожидание следующего хода: {actionCooldown} сек
          </div>
        )}
        
        {/* Команда противника (всегда справа) */}
        {opponentTeam && renderTeam(opponentTeam, false)}
      </div>
      
      {/* Подсказка о выборе цели - не показываем, если действия заблокированы */}
      {needsTarget && !isActionBlocked && (
        <div className="target-prompt">
          Выберите цель для {currentAction === 'attack' ? 'атаки' : `техники "${getTechniqueName(currentTechniqueId)}"`}
        </div>
      )}
      
      {/* Лог боя */}
      <div className="battle-log" ref={logRef}>
        {actions.length > 0 ? (
          [...actions].map((action, index) => {
            let type = '';
            let message = '';
            
            if (action.action_type === 'attack') {
              message = `${action.actor_name} атакует ${action.target_name} и наносит ${action.damage} урона`;
              type = 'damage';
            } else if (action.action_type === 'defense') {
              message = `${action.actor_name} принимает защитную стойку`;
              type = 'effect';
            } else if (action.action_type === 'technique') {
              const techniqueName = action.technique_name || getTechniqueName(action.technique_id) || 'технику';
              
              if (action.damage > 0) {
                message = `${action.actor_name} использует ${techniqueName} и наносит ${action.damage} урона ${action.target_name}`;
                type = 'damage';
              } else if (action.healing > 0) {
                // Для исцеления указываем цель, если она есть и не Unknown
                const healTarget = (!action.target_name || action.target_name === 'Unknown') ?
                  (action.target_id === action.actor_id ? 'себе' : 'себя') :
                  action.target_name;
                
                message = `${action.actor_name} использует ${techniqueName} и восстанавливает ${action.healing} здоровья ${healTarget !== 'себя' ? healTarget : ''}`;
                type = 'heal';
              } else {
                // Исправление проблемы с "Unknown" в логах
                const targetName = (!action.target_name || action.target_name === 'Unknown') ?
                  (action.target_id === action.actor_id ? 'себя' : 'себя') :
                  action.target_name;
                
                message = `${action.actor_name} использует ${techniqueName} на ${targetName}`;
                type = 'effect';
              }
              
              // Добавляем информацию о наложенных эффектах
              if (action.applied_effects && action.applied_effects.length > 0) {
                const effectNames = action.applied_effects.map(e => e.name).join(', ');
                message += ` (эффекты: ${effectNames})`;
              }
            }
            
            // Проверяем, является ли это действие новым
            const isNewAction = lastActionId !== action.id && index === 0; // Изменено с index === actions.length - 1 на index === 0, так как массив перевернут
            if (isNewAction && action.id) {
              setLastActionId(action.id);
            }
            
            return (
              <div key={index} className={`log-entry ${type} ${isNewAction ? 'new-action' : ''}`}>
                <span className="log-timestamp">{formatTime(action.timestamp || new Date())}</span>
                {message}
              </div>
            );
          })
        ) : (
          <div className="log-entry system">
            {isActionBlocked
              ? `Ожидание следующего хода: ${actionCooldown}с`
              : "Бой только начался. Выберите действие."}
          </div>
        )}
      </div>
      
      {/* Результат боя */}
      {room?.status === 'completed' && (
        <div className={`battle-result ${room.winner_team === currentParticipant?.team ? 'victory' : 'defeat'}`}>
          {room.winner_team === currentParticipant?.team ? 'Победа!' : 'Поражение!'}
        </div>
      )}
      
      {/* Панель действий */}
      <div className={`action-container ${!canActRef.current || isActionBlocked ? 'disabled-panel' : ''}`}>
        {currentParticipant && (
          <ActionPanel
            onAction={canActRef.current && !isActionBlocked ? handleActionSelect : () => {}}
            cooldowns={currentParticipant.cooldowns || {}}
            availableTechniques={availableTechniques}
            isMyTurn={isMyTurn && canActRef.current && !isActionBlocked}
            selectedAction={currentAction}
            selectedTechniqueId={currentTechniqueId}
            currentEnergy={currentParticipant.current_energy}
            maxEnergy={currentParticipant.max_energy}
            isActionBlocked={isActionBlocked}
            actionCooldown={actionCooldown}
            actionCooldownTotal={actionCooldownTotal}
            effects={currentParticipant.effects || []}
            statsModifiers={calculateStatsModifiers(currentParticipant)}
          />
        )}
      </div>
    </div>
  );
};

export default BattleInterface;