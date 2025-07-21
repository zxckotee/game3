import React, { useState, useEffect } from 'react';
import { getAndroidInfo, checkAndroidPerformance, shouldUseSimplifiedMode } from '../utils/androidCompatibility';

function AndroidCompatibilityWrapper({ children }) {
  const [androidInfo, setAndroidInfo] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    const info = getAndroidInfo();
    setAndroidInfo(info);

    if (info) {
      console.log('🤖 Android устройство обнаружено в React компоненте');
      
      // Проверяем производительность
      const perf = checkAndroidPerformance();
      setPerformance(perf);
      
      // Показываем предупреждение для проблемных устройств
      if (perf && (perf.isLowEnd || info.isWebView)) {
        setShowWarning(true);
      }
      
      // Даем время на инициализацию Android исправлений
      setTimeout(() => setIsReady(true), 1500);
    } else {
      setIsReady(true);
    }
  }, []);

  // Показываем экран загрузки для Android устройств
  if (androidInfo && !isReady) {
    return <AndroidLoadingScreen androidInfo={androidInfo} />;
  }

  // Показываем предупреждение для проблемных Android устройств
  if (showWarning && androidInfo) {
    return (
      <AndroidWarningScreen 
        androidInfo={androidInfo}
        performance={performance}
        onContinue={() => setShowWarning(false)}
        onUseSimplified={() => {
          setShowWarning(false);
          // Устанавливаем флаг для упрощенного режима
          window.FORCE_SIMPLIFIED_MODE = true;
        }}
      />
    );
  }

  // Упрощенная версия для слабых Android устройств
  if (androidInfo && (shouldUseSimplifiedMode() || window.FORCE_SIMPLIFIED_MODE)) {
    return <AndroidSimplifiedVersion androidInfo={androidInfo} />;
  }

  return children;
}

// Экран загрузки для Android
function AndroidLoadingScreen({ androidInfo }) {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingContent}>
        <h3 style={styles.title}>🤖 Настройка для Android...</h3>
        <div style={styles.spinner}></div>
        <p style={styles.text}>Применяем оптимизации для вашего устройства</p>
        
        {androidInfo.isWebView && (
          <div style={styles.warning}>
            <p>⚠️ Обнаружен WebView режим</p>
            <p>Для лучшей работы откройте в браузере Chrome</p>
          </div>
        )}
        
        {androidInfo.isLowMemory && (
          <div style={styles.warning}>
            <p>📱 Устройство с ограниченной памятью</p>
            <p>Рекомендуем закрыть другие приложения</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Экран предупреждения для Android
function AndroidWarningScreen({ androidInfo, performance, onContinue, onUseSimplified }) {
  return (
    <div style={styles.warningContainer}>
      <div style={styles.warningContent}>
        <h2 style={styles.title}>⚠️ Внимание</h2>
        <p style={styles.text}>
          Обнаружено Android устройство с возможными ограничениями производительности.
        </p>
        
        <div style={styles.infoBox}>
          <h4>📱 Информация об устройстве:</h4>
          <ul style={styles.list}>
            <li>Android версия: {androidInfo.version}</li>
            <li>Chrome версия: {androidInfo.chromeVersion}</li>
            {androidInfo.isWebView && <li style={styles.warning}>⚠️ WebView режим</li>}
            {androidInfo.isLowMemory && <li style={styles.warning}>⚠️ Ограниченная память</li>}
            {androidInfo.isOldAndroid && <li style={styles.warning}>⚠️ Старая версия Android</li>}
          </ul>
        </div>

        {performance && performance.recommendations.length > 0 && (
          <div style={styles.recommendationsBox}>
            <h4>💡 Рекомендации:</h4>
            <ul style={styles.list}>
              {performance.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={styles.buttonContainer}>
          <button 
            onClick={onUseSimplified}
            style={styles.primaryButton}
          >
            📱 Использовать упрощенную версию
          </button>
          
          <button 
            onClick={onContinue}
            style={styles.secondaryButton}
          >
            🚀 Продолжить на свой страх и риск
          </button>
        </div>

        <div style={styles.helpBox}>
          <h4>🔧 Если возникают проблемы:</h4>
          <ul style={styles.list}>
            <li>Перезагрузите страницу</li>
            <li>Закройте другие вкладки и приложения</li>
            <li>Попробуйте режим инкогнито</li>
            <li>Обновите браузер Chrome</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Упрощенная версия для слабых Android устройств
function AndroidSimplifiedVersion({ androidInfo }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div style={styles.simplifiedContainer}>
      <div style={styles.simplifiedContent}>
        <h2 style={styles.title}>🎮 Путь к Бессмертию</h2>
        <h3 style={styles.subtitle}>Упрощенная версия для Android</h3>
        
        <div style={styles.infoBox}>
          <h4>ℹ️ Информация</h4>
          <p>
            Ваше устройство использует упрощенную версию игры для лучшей совместимости 
            и производительности. Основные функции доступны, но некоторые эффекты отключены.
          </p>
        </div>
        
        <div style={styles.buttonContainer}>
          <button 
            onClick={() => window.location.reload()}
            style={styles.primaryButton}
          >
            🔄 Перезагрузить страницу
          </button>
          
          <button 
            onClick={() => {
              delete window.FORCE_SIMPLIFIED_MODE;
              window.location.reload();
            }}
            style={styles.secondaryButton}
          >
            🚀 Попробовать полную версию
          </button>
        </div>

        <button 
          onClick={() => setShowDetails(!showDetails)}
          style={styles.linkButton}
        >
          {showDetails ? '▼' : '▶'} Техническая информация
        </button>

        {showDetails && (
          <div style={styles.detailsBox}>
            <h4>🔧 Техническая информация:</h4>
            <ul style={styles.list}>
              <li>User Agent: {navigator.userAgent}</li>
              <li>Android версия: {androidInfo.version}</li>
              <li>Chrome версия: {androidInfo.chromeVersion}</li>
              <li>WebView: {androidInfo.isWebView ? 'Да' : 'Нет'}</li>
              <li>Память устройства: {navigator.deviceMemory || 'Неизвестно'} GB</li>
              <li>Размер экрана: {screen.width}x{screen.height}</li>
            </ul>
          </div>
        )}

        <div style={styles.helpBox}>
          <h4>🆘 Нужна помощь?</h4>
          <p>Если игра не работает должным образом:</p>
          <ul style={styles.list}>
            <li>Убедитесь, что у вас последняя версия Chrome</li>
            <li>Закройте другие приложения для освобождения памяти</li>
            <li>Перезагрузите устройство если проблемы продолжаются</li>
            <li>Попробуйте открыть игру в режиме инкогнито</li>
          </ul>
          
          <button 
            onClick={() => window.open('https://play.google.com/store/apps/details?id=com.android.chrome', '_blank')}
            style={styles.linkButton}
          >
            📱 Обновить Chrome
          </button>
        </div>
      </div>
    </div>
  );
}

// Стили для компонентов
const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#1a1a1a',
    fontFamily: 'Arial, sans-serif'
  },
  loadingContent: {
    textAlign: 'center',
    color: '#f0f0f0',
    maxWidth: '400px',
    padding: '20px'
  },
  warningContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    fontFamily: 'Arial, sans-serif',
    padding: '20px'
  },
  warningContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '600px',
    color: '#f0f0f0'
  },
  simplifiedContainer: {
    backgroundColor: '#1a1a1a',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    padding: '20px'
  },
  simplifiedContent: {
    maxWidth: '800px',
    margin: '0 auto',
    color: '#f0f0f0'
  },
  title: {
    color: '#d4af37',
    marginBottom: '20px',
    textAlign: 'center'
  },
  subtitle: {
    color: '#f0f0f0',
    marginBottom: '30px',
    textAlign: 'center'
  },
  text: {
    marginBottom: '20px',
    lineHeight: '1.5'
  },
  infoBox: {
    backgroundColor: '#333',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  recommendationsBox: {
    backgroundColor: '#2a4a2a',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  helpBox: {
    backgroundColor: '#2a2a4a',
    padding: '20px',
    borderRadius: '8px',
    marginTop: '20px'
  },
  detailsBox: {
    backgroundColor: '#333',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '10px',
    fontSize: '12px'
  },
  warning: {
    color: '#ff9800',
    backgroundColor: '#332a00',
    padding: '10px',
    borderRadius: '4px',
    marginTop: '10px'
  },
  list: {
    paddingLeft: '20px',
    lineHeight: '1.6'
  },
  buttonContainer: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px',
    flexWrap: 'wrap'
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    flex: 1,
    minWidth: '200px'
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    flex: 1,
    minWidth: '200px'
  },
  linkButton: {
    backgroundColor: 'transparent',
    color: '#4CAF50',
    border: '1px solid #4CAF50',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  spinner: {
    border: '4px solid #333',
    borderTop: '4px solid #d4af37',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '20px auto'
  }
};

// Добавляем CSS анимацию для спиннера
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default AndroidCompatibilityWrapper;