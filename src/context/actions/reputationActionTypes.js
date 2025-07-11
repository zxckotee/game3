/**
 * Типы действий для системы репутации
 */

// Загрузка репутации
export const LOAD_REPUTATION_REQUEST = 'LOAD_REPUTATION_REQUEST';
export const LOAD_REPUTATION_SUCCESS = 'LOAD_REPUTATION_SUCCESS';
export const LOAD_REPUTATION_FAILURE = 'LOAD_REPUTATION_FAILURE';

// Изменение репутации
export const CHANGE_REPUTATION_REQUEST = 'CHANGE_REPUTATION_REQUEST';
export const CHANGE_REPUTATION_SUCCESS = 'CHANGE_REPUTATION_SUCCESS';
export const CHANGE_REPUTATION_FAILURE = 'CHANGE_REPUTATION_FAILURE';

// Проверка новых возможностей
export const CHECK_REPUTATION_FEATURES_REQUEST = 'CHECK_REPUTATION_FEATURES_REQUEST';
export const CHECK_REPUTATION_FEATURES_SUCCESS = 'CHECK_REPUTATION_FEATURES_SUCCESS';
export const CHECK_REPUTATION_FEATURES_FAILURE = 'CHECK_REPUTATION_FEATURES_FAILURE';

// Уведомления об изменении репутации
export const ADD_REPUTATION_NOTIFICATION = 'ADD_REPUTATION_NOTIFICATION';
export const REMOVE_REPUTATION_NOTIFICATION = 'REMOVE_REPUTATION_NOTIFICATION';
export const CLEAR_REPUTATION_NOTIFICATIONS = 'CLEAR_REPUTATION_NOTIFICATIONS';
