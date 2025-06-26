import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { 
  updateActivityProgress, 
  completeActivity,
  failActivity,
  abandonActivity,
  startActivity
} from '../../context/actions/groupActions';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import styles from './ActivityInstance.module.css';

/**
 * Компонент для отображения и взаимодействия с запущенной групповой активностью
 * @param {Object} instance - Экземпляр активности
 * @param {Function} onComplete - Функция, вызываемая при завершении активности
 */
const ActivityInstance = ({ instance, onComplete }) => {
  const { state, actions } = useGame();
  const { user } = state.player;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventResult, setEventResult] = useState(null);
  
  // Убедимся, что все массивы инициализированы
  const participants = Array.isArray(instance?.participants) ? instance.participants : [];
  
  // Определяем роль пользователя в группе
  const userRole = participants.find(p => p.userId === user?.id)?.role || 'member';
  const isLeaderOrOfficer = userRole === 'leader' || userRole === 'officer';
  
  // Получить иконку для типа активности
  const getActivityTypeIcon = (type) => {
    switch (type) {
      case 'raid':
        return '🏰'; // Рейд
      case 'hunt':
        return '🏹'; // Охота
      case 'expedition':
        return '🧭'; // Экспедиция
      case 'tournament':
        return '🏆'; // Турнир
      case 'caravan':
        return '🐪'; // Караван
      case 'tribulation':
        return '⚡'; // Испытание стихии
      case 'craft':
        return '⚒️'; // Создание артефакта
      default:
        return '📜'; // По умолчанию
    }
  };
  
  // Получить название для типа активности
  const getActivityTypeName = (type) => {
    switch (type) {
      case 'raid':
        return 'Рейд';
      case 'hunt':
        return 'Охота';
      case 'expedition':
        return 'Экспедиция';
      case 'tournament':
        return 'Турнир';
      case 'caravan':
        return 'Караван';
      case 'tribulation':
        return 'Испытание стихии';
      case 'craft':
        return 'Создание артефакта';
      default:
        return 'Активность';
    }
  };
  
  // Получить строку с описанием сложности
  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'Легкая';
      case 'medium':
        return 'Средняя';
      case 'hard':
        return 'Тяжелая';
      case 'extreme':
        return 'Экстремальная';
      case 'legendary':
        return 'Легендарная';
      default:
        return 'Неизвестная сложность';
    }
  };
  
  // Получить класс для элемента сложности
  const getDifficultyClass = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return styles.difficultyEasy;
      case 'medium':
        return styles.difficultyMedium;
      case 'hard':
        return styles.difficultyHard;
      case 'extreme':
        return styles.difficultyExtreme;
      case 'legendary':
        return styles.difficultyLegendary;
      default:
        return '';
    }
  };
  
  // Генерируем события для текущего этапа активности
  useEffect(() => {
    if (instance?.status === 'in_progress' && !currentEvent && !eventResult) {
      generateEventForCurrentStage();
    }
  }, [instance?.currentStage, instance?.status]);
  
  // Генерация события для текущего этапа
  const generateEventForCurrentStage = () => {
    // Логика генерации событий зависит от типа активности и текущего этапа
    const activityType = instance?.activityType?.type || 'generic';
    const currentStage = instance?.currentStage || 1;
    const events = getEventsForActivityType(activityType, currentStage);
    const randomIndex = Math.floor(Math.random() * events.length);
    setCurrentEvent(events[randomIndex]);
    setEventResult(null);
  };
  
  // Получение возможных событий для типа активности и этапа
  const getEventsForActivityType = (type, stage) => {
    // Здесь будет более сложная логика в зависимости от типа активности
    // Примеры событий:
    const events = {
      'raid': {
        1: [
          { 
            id: 'scout', 
            title: 'Разведка территории', 
            description: 'Перед вами раскинулся древний комплекс. Необходимо собрать информацию о возможных опасностях и сокровищах.', 
            options: ['Осторожное наблюдение', 'Отправить разведчика', 'Использовать духовное восприятие'] 
          },
          { 
            id: 'entrance', 
            title: 'Вход в комплекс', 
            description: 'Вы обнаружили несколько возможных путей внутрь древнего комплекса.', 
            options: ['Главный вход', 'Секретный проход', 'Пробить стену силой'] 
          },
        ],
        2: [
          { 
            id: 'encounter', 
            title: 'Первое столкновение', 
            description: 'На пути встречается группа стражей древнего комплекса!', 
            options: ['Атаковать напрямую', 'Попытаться обойти', 'Попробовать договориться'] 
          },
          { 
            id: 'trap', 
            title: 'Древняя ловушка', 
            description: 'Проходя по коридору, вы активировали древнюю ловушку.', 
            options: ['Блокировать техникой', 'Уклониться', 'Пожертвовать ресурсами для нейтрализации'] 
          },
        ],
        3: [
          { 
            id: 'treasure', 
            title: 'Сокровищница', 
            description: 'Вы нашли хранилище артефактов, но оно охраняется мощными печатями.', 
            options: ['Взломать печати', 'Искать обходной путь', 'Использовать специальный ключ'] 
          },
        ],
      },
      'hunt': {
        1: [
          { 
            id: 'track', 
            title: 'Поиск следов', 
            description: 'Вам нужно найти следы редкого духовного зверя.', 
            options: ['Исследовать окрестности', 'Использовать приманку', 'Спросить у местных жителей'] 
          },
        ],
      },
      'expedition': {
        1: [
          { 
            id: 'path', 
            title: 'Выбор пути', 
            description: 'Перед вами несколько возможных маршрутов экспедиции.', 
            options: ['Горный перевал', 'Лесная тропа', 'Подземные туннели'] 
          },
        ],
      },
    };
    
    // Если нет специфичных событий для типа/этапа, возвращаем общие события
    return events[type]?.[stage] || [
      { 
        id: 'generic', 
        title: `Этап ${stage}`, 
        description: `Ваша группа продвигается через этап ${stage} активности.`, 
        options: ['Действовать осторожно', 'Действовать решительно', 'Импровизировать'] 
      }
    ];
  };
  
  // Обработчик выбора варианта события
  const handleOptionSelect = (optionIndex) => {
    if (!currentEvent) return;
    
    const option = currentEvent.options[optionIndex];
    
    // Здесь была бы более сложная логика определения успеха
    // в зависимости от параметров группы и выбранного варианта
    const successChance = 0.7; // 70% базовый шанс успеха
    const success = Math.random() < successChance;
    
    // Формируем результат события
    const result = {
      success,
      description: success 
        ? `Вы успешно справились с задачей, выбрав вариант "${option}".` 
        : `К сожалению, выбор "${option}" привел к осложнениям.`,
      rewards: success ? generateRewards() : [],
      penalties: !success ? generatePenalties() : []
    };
    
    setEventResult(result);
  };
  
  // Генерация наград за успешное прохождение этапа
  const generateRewards = () => {
    return [
      { type: 'experience', value: Math.floor(Math.random() * 100) + 50 },
      { type: 'resource', name: 'Духовный кристалл', quantity: Math.floor(Math.random() * 3) + 1 }
    ];
  };
  
  // Генерация штрафов за неудачное прохождение
  const generatePenalties = () => {
    return [
      { type: 'health', value: Math.floor(Math.random() * 20) + 10 },
      { type: 'energy', value: Math.floor(Math.random() * 30) + 15 }
    ];
  };
  
  // Обработчик перехода к следующему этапу
  const handleNextStage = async () => {
    if (!isLeaderOrOfficer) {
      actions.addNotification({
        message: 'Только лидер или офицер группы может управлять активностью',
        type: 'error'
      });
      return;
    }
    
    if (!eventResult) {
      actions.addNotification({
        message: 'Сначала нужно выбрать вариант действия',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const nextStage = instance.currentStage + 1;
      const additionalData = {
        battleLog: {
          stage: instance.currentStage,
          event: currentEvent,
          result: eventResult,
          timestamp: new Date().toISOString()
        }
      };
      
      if (nextStage > instance.totalStages) {
        // Завершаем активность
        await actions.dispatch(completeActivity(instance.id, additionalData, user.id));
        
        // Вызываем функцию завершения
        if (onComplete) {
          onComplete();
        }
      } else {
        // Переходим к следующему этапу
        await actions.dispatch(updateActivityProgress(
          instance.id, nextStage, additionalData, user.id
        ));
        
        // Сбрасываем текущее событие и результат
        setCurrentEvent(null);
        setEventResult(null);
      }
    } catch (err) {
      console.error('Ошибка при переходе к следующему этапу:', err);
      setError(`Не удалось перейти к следующему этапу: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик провала активности
  const handleFailActivity = async () => {
    if (!isLeaderOrOfficer) {
      actions.addNotification({
        message: 'Только лидер или офицер группы может управлять активностью',
        type: 'error'
      });
      return;
    }
    
    if (!window.confirm('Вы уверены, что хотите отметить эту активность как проваленную? Это действие нельзя отменить.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const failureData = {
        reason: 'Отмечено лидером группы как проваленная активность',
        timestamp: new Date().toISOString()
      };
      
      await actions.dispatch(failActivity(instance.id, failureData, user.id));
      
      // Вызываем функцию завершения
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Ошибка при отметке активности как проваленной:', err);
      setError(`Не удалось отметить активность как проваленную: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик отмены активности
  const handleAbandonActivity = async () => {
    if (userRole !== 'leader') {
      actions.addNotification({
        message: 'Только лидер группы может отменить активность',
        type: 'error'
      });
      return;
    }
    
    if (!window.confirm('Вы уверены, что хотите отменить эту активность? Это действие нельзя отменить.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const reason = 'Отменено лидером группы';
      
      await actions.dispatch(abandonActivity(instance.id, reason, user.id));
      
      // Вызываем функцию завершения
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Ошибка при отмене активности:', err);
      setError(`Не удалось отменить активность: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Если активность еще не запущена
  if (instance?.status === 'preparing') {
    return (
      <div className={styles.activityInstance}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <span className={styles.typeIcon}>
              {getActivityTypeIcon(instance.activityType?.type)}
            </span>
            <h3 className={styles.title}>
              {instance.activityType?.name || 'Групповая активность'}
            </h3>
            <span className={`${styles.status} ${styles.statusPreparing}`}>
              Подготовка
            </span>
          </div>
        </div>
        
        <div className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Тип:</span>
              <span className={styles.value}>
                {getActivityTypeName(instance.activityType?.type)}
              </span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Сложность:</span>
              <span className={`${styles.value} ${getDifficultyClass(instance.difficulty)}`}>
                {getDifficultyText(instance.difficulty)}
              </span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Этапы:</span>
              <span className={styles.value}>
                {instance.totalStages || 3}
              </span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Участники:</span>
              <span className={styles.value}>
                {participants.length}
              </span>
            </div>
          </div>
        </div>
        
        <div className={styles.preparingMessage}>
          Активность создана и ожидает запуска. Лидер или офицер группы могут запустить активность.
        </div>
        
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        
        <div className={styles.actions}>
        {isLeaderOrOfficer && (
          <Button 
            onClick={() => actions.dispatch(startActivity(instance.id, user.id))}
            disabled={loading}
            className={styles.startButton}
          >
            {loading ? 'Загрузка...' : 'Начать активность'}
          </Button>
        )}
          
          {userRole === 'leader' && (
            <Button 
              onClick={handleAbandonActivity}
              disabled={loading}
              className={styles.abandonButton}
            >
              Отменить активность
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Если активность уже завершена или провалена
  if (instance?.status === 'completed' || instance?.status === 'failed' || instance?.status === 'abandoned') {
    return (
      <div className={styles.activityInstance}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <span className={styles.typeIcon}>
              {getActivityTypeIcon(instance.activityType?.type)}
            </span>
            <h3 className={styles.title}>
              {instance.activityType?.name || 'Групповая активность'}
            </h3>
            
            {instance.status === 'completed' && (
              <span className={`${styles.status} ${styles.statusCompleted}`}>
                Завершена
              </span>
            )}
            
            {instance.status === 'failed' && (
              <span className={`${styles.status} ${styles.statusFailed}`}>
                Провалена
              </span>
            )}
            
            {instance.status === 'abandoned' && (
              <span className={`${styles.status} ${styles.statusAbandoned}`}>
                Отменена
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Тип:</span>
              <span className={styles.value}>
                {getActivityTypeName(instance.activityType?.type)}
              </span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Сложность:</span>
              <span className={`${styles.value} ${getDifficultyClass(instance.difficulty)}`}>
                {getDifficultyText(instance.difficulty)}
              </span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Начало:</span>
              <span className={styles.value}>
                {instance.startedAt ? new Date(instance.startedAt).toLocaleString() : 'Нет данных'}
              </span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.label}>Завершение:</span>
              <span className={styles.value}>
                {instance.completedAt ? new Date(instance.completedAt).toLocaleString() : 'Нет данных'}
              </span>
            </div>
          </div>
        </div>
        
        {instance.status === 'completed' && (
          <div className={styles.resultSection}>
            <h4 className={styles.resultTitle}>Активность успешно завершена!</h4>
            
            {Array.isArray(instance.rewards) && instance.rewards.length > 0 ? (
              <div className={styles.rewardsList}>
                <h5 className={styles.rewardsTitle}>Полученные награды:</h5>
                
                {instance.rewards.map(reward => (
                  <div key={reward.id} className={styles.rewardItem}>
                    {reward.rewardType === 'experience' && (
                      <>
                        <span className={styles.rewardIcon}>🔮</span>
                        <span className={styles.rewardName}>Опыт культивации</span>
                        <span className={styles.rewardValue}>+{reward.quantity}</span>
                      </>
                    )}
                    
                    {reward.rewardType === 'resource' && (
                      <>
                        <span className={styles.rewardIcon}>🌿</span>
                        <span className={styles.rewardName}>{reward.rewardId}</span>
                        <span className={styles.rewardValue}>x{reward.quantity}</span>
                      </>
                    )}
                    
                    {reward.rewardType === 'item' && (
                      <>
                        <span className={styles.rewardIcon}>📦</span>
                        <span className={styles.rewardName}>{reward.rewardId}</span>
                        <span className={styles.rewardValue}>x{reward.quantity}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noRewards}>
                Информация о наградах недоступна
              </div>
            )}
          </div>
        )}
        
        {instance.status === 'failed' && (
          <div className={styles.resultSection}>
            <h4 className={styles.resultTitle}>Активность провалена</h4>
            
            {instance.specialConditions?.reason && (
              <div className={styles.failReason}>
                Причина: {instance.specialConditions.reason}
              </div>
            )}
          </div>
        )}
        
        {instance.status === 'abandoned' && (
          <div className={styles.resultSection}>
            <h4 className={styles.resultTitle}>Активность отменена</h4>
            
            {instance.specialConditions?.abandonReason && (
              <div className={styles.failReason}>
                Причина: {instance.specialConditions.abandonReason}
              </div>
            )}
          </div>
        )}
        
        <div className={styles.actions}>
          <Button 
            onClick={onComplete}
            className={styles.closeButton}
          >
            Закрыть
          </Button>
        </div>
      </div>
    );
  }
  
  // Если активность в процессе
  return (
    <div className={styles.activityInstance}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <span className={styles.typeIcon}>
            {getActivityTypeIcon(instance.activityType?.type)}
          </span>
          <h3 className={styles.title}>
            {instance.activityType?.name || 'Групповая активность'}
          </h3>
          <span className={`${styles.status} ${styles.statusInProgress}`}>
            В процессе
          </span>
        </div>
      </div>
      
      <div className={styles.infoSection}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Тип:</span>
            <span className={styles.value}>
              {getActivityTypeName(instance.activityType?.type)}
            </span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Сложность:</span>
            <span className={`${styles.value} ${getDifficultyClass(instance.difficulty)}`}>
              {getDifficultyText(instance.difficulty)}
            </span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Этап:</span>
              <span className={styles.value}>
                {instance.currentStage || 1}/{instance.totalStages || 3}
              </span>
          </div>
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Начало:</span>
            <span className={styles.value}>
              {instance.startedAt ? new Date(instance.startedAt).toLocaleString() : 'Нет данных'}
            </span>
          </div>
        </div>
        
      <div className={styles.progressContainer}>
        <ProgressBar 
          progress={instance.progress || 0} 
          className={styles.progressBar}
          showLabel={true}
          height="15px"
          color="#d4af37"
        />
        <span className={styles.progressText}>
          Прогресс: {Math.round(instance.progress || 0)}%
        </span>
      </div>
      </div>
      
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      <div className={styles.eventSection}>
        {currentEvent && !eventResult ? (
          <>
            <h4 className={styles.eventTitle}>{currentEvent.title}</h4>
            <p className={styles.eventDescription}>{currentEvent.description}</p>
            
            <div className={styles.eventOptions}>
              {currentEvent.options.map((option, index) => (
                <Button 
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={loading}
                  className={styles.optionButton}
                >
                  {option}
                </Button>
              ))}
            </div>
          </>
        ) : eventResult ? (
          <div className={styles.eventResult}>
            <h4 className={`${styles.resultTitle} ${eventResult.success ? styles.success : styles.failure}`}>
              {eventResult.success ? 'Успех!' : 'Неудача!'}
            </h4>
            <p className={styles.resultDescription}>{eventResult.description}</p>
            
            {eventResult.rewards.length > 0 && (
              <div className={styles.resultRewards}>
                <h5 className={styles.rewardsTitle}>Награды:</h5>
                <ul className={styles.rewardsList}>
                  {eventResult.rewards.map((reward, index) => (
                    <li key={index} className={styles.rewardItem}>
                      {reward.type === 'experience' && (
                        <>
                          <span className={styles.rewardIcon}>🔮</span>
                          <span className={styles.rewardName}>Опыт культивации</span>
                          <span className={styles.rewardValue}>+{reward.value}</span>
                        </>
                      )}
                      
                      {reward.type === 'resource' && (
                        <>
                          <span className={styles.rewardIcon}>🌿</span>
                          <span className={styles.rewardName}>{reward.name}</span>
                          <span className={styles.rewardValue}>x{reward.quantity}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {eventResult.penalties.length > 0 && (
              <div className={styles.resultPenalties}>
                <h5 className={styles.penaltiesTitle}>Потери:</h5>
                <ul className={styles.penaltiesList}>
                  {eventResult.penalties.map((penalty, index) => (
                    <li key={index} className={styles.penaltyItem}>
                      {penalty.type === 'health' && (
                        <>
                          <span className={styles.penaltyIcon}>❤️</span>
                          <span className={styles.penaltyName}>Здоровье</span>
                          <span className={styles.penaltyValue}>-{penalty.value}</span>
                        </>
                      )}
                      
                      {penalty.type === 'energy' && (
                        <>
                          <span className={styles.penaltyIcon}>⚡</span>
                          <span className={styles.penaltyName}>Энергия</span>
                          <span className={styles.penaltyValue}>-{penalty.value}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
        {isLeaderOrOfficer && (
          <Button 
            onClick={handleNextStage}
            disabled={loading}
            className={styles.nextButton}
          >
            {loading ? 'Загрузка...' : instance.currentStage === instance.totalStages ? 'Завершить активность' : 'Перейти к следующему этапу'}
          </Button>
        )}
          </div>
        ) : (
          <div className={styles.loading}>
            Загрузка события...
          </div>
        )}
      </div>
      
      <div className={styles.actionsSection}>
        {isLeaderOrOfficer && (
          <Button 
            onClick={handleFailActivity}
            disabled={loading}
            className={styles.failButton}
          >
            Отметить как проваленную
          </Button>
        )}
        
        {userRole === 'leader' && (
          <Button 
            onClick={handleAbandonActivity}
            disabled={loading}
            className={styles.abandonButton}
          >
            Отменить активность
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActivityInstance;
