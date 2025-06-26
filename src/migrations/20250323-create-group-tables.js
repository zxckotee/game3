/**
 * Миграция для создания таблиц для системы групповых активностей
 */
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Создание таблицы групп
    await queryInterface.createTable('groups', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      leaderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      maxMembers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      minCultivationLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Создание таблицы участников группы
    await queryInterface.createTable('group_members', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id'
        }
      },
      role: {
        type: DataTypes.ENUM('leader', 'officer', 'member'),
        allowNull: false,
        defaultValue: 'member'
      },
      specialization: {
        type: DataTypes.ENUM('tank', 'damage', 'support', 'scout', 'alchemist', 'healer'),
        allowNull: true
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      lastActiveAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      contributionPoints: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Создание таблицы групповых активностей
    await queryInterface.createTable('group_activities', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('raid', 'hunt', 'expedition', 'tournament', 'caravan', 'tribulation', 'craft'),
        allowNull: false
      },
      difficulty: {
        type: DataTypes.ENUM('easy', 'medium', 'hard', 'extreme', 'legendary'),
        allowNull: false,
        defaultValue: 'medium'
      },
      minParticipants: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2
      },
      maxParticipants: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5
      },
      minCultivationLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      recommendedCultivationLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      cooldown: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1440
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true
      },
      requiredSpecializations: {
        type: DataTypes.JSON,
        allowNull: true
      },
      rewardStructure: {
        type: DataTypes.JSON,
        allowNull: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      specialConditions: {
        type: DataTypes.JSON,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Создание таблицы экземпляров групповых активностей
    await queryInterface.createTable('group_activity_instances', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id'
        }
      },
      activityId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'group_activities',
          key: 'id'
        }
      },
      status: {
        type: DataTypes.ENUM('preparing', 'in_progress', 'completed', 'failed', 'abandoned'),
        allowNull: false,
        defaultValue: 'preparing'
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      currentStage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      totalStages: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      progress: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      difficulty: {
        type: DataTypes.ENUM('easy', 'medium', 'hard', 'extreme', 'legendary'),
        allowNull: false
      },
      participants: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      battleLog: {
        type: DataTypes.JSON,
        allowNull: true
      },
      rewardsDistributed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      specialConditions: {
        type: DataTypes.JSON,
        allowNull: true
      },
      weatherConditions: {
        type: DataTypes.JSON,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Создание таблицы приглашений в группу
    await queryInterface.createTable('group_invitations', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id'
        }
      },
      inviterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      inviteeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
        allowNull: false,
        defaultValue: 'pending'
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      responseMessage: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Создание таблицы наград за групповые активности
    await queryInterface.createTable('group_rewards', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      activityInstanceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'group_activity_instances',
          key: 'id'
        }
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      rewardType: {
        type: DataTypes.ENUM('experience', 'cultivation', 'item', 'resource', 'currency', 'reputation', 'technique'),
        allowNull: false
      },
      rewardId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      quality: {
        type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'),
        allowNull: true
      },
      bonusPercentage: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      contribution: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      distributedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      claimedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      isClaimed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Создание индексов для повышения производительности
    await queryInterface.addIndex('group_members', ['userId', 'groupId'], {
      unique: true,
      name: 'group_members_user_group_unique'
    });
    await queryInterface.addIndex('group_invitations', ['inviteeId', 'status']);
    await queryInterface.addIndex('group_activity_instances', ['status', 'startedAt']);
    await queryInterface.addIndex('group_rewards', ['userId', 'isClaimed']);
  },

  down: async (queryInterface, Sequelize) => {
    // Удаление таблиц в обратном порядке
    await queryInterface.dropTable('group_rewards');
    await queryInterface.dropTable('group_invitations');
    await queryInterface.dropTable('group_activity_instances');
    await queryInterface.dropTable('group_activities');
    await queryInterface.dropTable('group_members');
    await queryInterface.dropTable('groups');
  }
};
