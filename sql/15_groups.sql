-- SQL-скрипт для создания таблиц системы групповых активностей
-- Создание: 28.04.2025
\encoding UTF8

-- Таблица групп
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_members INTEGER NOT NULL DEFAULT 5,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  min_cultivation_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица членов группы
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL CHECK (role IN ('leader', 'officer', 'member')) DEFAULT 'member',
  specialization VARCHAR(30) CHECK (specialization IN ('tank', 'damage', 'support', 'scout', 'alchemist', 'healer')),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contribution_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица групповых активностей (типы)
CREATE TABLE IF NOT EXISTS group_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('raid', 'hunt', 'expedition', 'tournament', 'caravan', 'tribulation', 'craft')),
  difficulty VARCHAR(30) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme', 'legendary')) DEFAULT 'medium',
  min_participants INTEGER NOT NULL DEFAULT 2,
  max_participants INTEGER NOT NULL DEFAULT 5,
  min_cultivation_level INTEGER NOT NULL DEFAULT 1,
  recommended_cultivation_level INTEGER NOT NULL DEFAULT 5,
  duration INTEGER NOT NULL,
  cooldown INTEGER NOT NULL DEFAULT 1440,
  location VARCHAR(255),
  required_specializations JSONB,
  reward_structure JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  special_conditions JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица экземпляров групповых активностей
CREATE TABLE IF NOT EXISTS group_activity_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES group_activities(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL CHECK (status IN ('preparing', 'in_progress', 'completed', 'failed', 'abandoned')) DEFAULT 'preparing',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  current_stage INTEGER NOT NULL DEFAULT 0,
  total_stages INTEGER NOT NULL DEFAULT 1,
  progress FLOAT NOT NULL DEFAULT 0,
  difficulty VARCHAR(30) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme', 'legendary')),
  participants JSONB NOT NULL DEFAULT '[]'::JSONB,
  battle_log JSONB,
  rewards_distributed BOOLEAN NOT NULL DEFAULT FALSE,
  special_conditions JSONB,
  weather_conditions JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица приглашений в группу
CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  message TEXT,
  expires_at TIMESTAMP NOT NULL,
  response_message TEXT,
  responded_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица наград за групповые активности
CREATE TABLE IF NOT EXISTS group_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_instance_id UUID NOT NULL REFERENCES group_activity_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(30) NOT NULL CHECK (reward_type IN ('experience', 'cultivation', 'item', 'resource', 'currency', 'reputation', 'technique')),
  reward_id VARCHAR(255),
  quantity INTEGER NOT NULL DEFAULT 1,
  quality VARCHAR(30) CHECK (quality IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  bonus_percentage FLOAT NOT NULL DEFAULT 0,
  contribution FLOAT NOT NULL DEFAULT 0,
  distributed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP,
  is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для повышения производительности
CREATE UNIQUE INDEX IF NOT EXISTS group_members_user_group_unique ON group_members(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee_status ON group_invitations(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_group_activity_instances_status_start ON group_activity_instances(status, started_at);
CREATE INDEX IF NOT EXISTS idx_group_rewards_user_claimed ON group_rewards(user_id, is_claimed);

-- Комментарии к таблицам
COMMENT ON TABLE groups IS 'Группы игроков для совместных активностей';
COMMENT ON TABLE group_members IS 'Члены групп с ролями и специализациями';
COMMENT ON TABLE group_activities IS 'Типы групповых активностей в игре';
COMMENT ON TABLE group_activity_instances IS 'Экземпляры запущенных групповых активностей';
COMMENT ON TABLE group_invitations IS 'Приглашения в группы';
COMMENT ON TABLE group_rewards IS 'Награды за участие в групповых активностях';