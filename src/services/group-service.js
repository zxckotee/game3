/**
 * Сервис для работы с группами
 * Автоматически использует PostgreSQL, если доступен, или мок-базу данных, если нет
 */
const { v4: uuidv4 } = require('uuid');
const connectionManagerAdapter = require('./database-connection-manager-adapter');
const unifiedDatabase = connectionManagerAdapter.unifiedDatabase;

class GroupService {
  /**
   * Получение списка групп пользователя
   */
  static async getUserGroups(userId) {
    try {
      const groupsCollection = await unifiedDatabase.getCollection('groups');
      const groupsQuery = groupsCollection.where('memberIds', 'array-contains', userId);
      
      const groupsSnapshot = await groupsQuery.get();
      const groups = [];
      
      for (const groupDoc of groupsSnapshot.docs) {
        const group = {
          id: groupDoc.id,
          ...groupDoc.data()
        };
        
        group.members = await this.getGroupMembers(group.id);
        groups.push(group);
      }
      
      return groups;
    } catch (error) {
      console.error('Ошибка при получении групп пользователя:', error);
      throw error;
    }
  }
  
  /**
   * Получение данных группы по ID
   */
  static async getGroupById(groupId) {
    try {
      const groupsCollection = await unifiedDatabase.getCollection('groups');
      const groupDoc = await groupsCollection.doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Группа не найдена');
      }
      
      const group = {
        id: groupDoc.id,
        ...groupDoc.data()
      };
      
      group.members = await this.getGroupMembers(groupId);
      
      return group;
    } catch (error) {
      console.error('Ошибка при получении данных группы:', error);
      throw error;
    }
  }
  
  /**
   * Получение списка участников группы
   */
  static async getGroupMembers(groupId) {
    try {
      const membersCollection = await unifiedDatabase.getCollection('group_members');
      const membersSnapshot = await membersCollection
        .where('groupId', '==', groupId)
        .get();
      
      const members = [];
      
      for (const memberDoc of membersSnapshot.docs) {
        const member = {
          id: memberDoc.id,
          ...memberDoc.data()
        };
        
        const usersCollection = await unifiedDatabase.getCollection('users');
        const userDoc = await usersCollection.doc(member.userId).get();
        
        if (userDoc.exists) {
          member.user = {
            id: userDoc.id,
            name: userDoc.data().name,
            avatar: userDoc.data().avatar,
            cultivationLevel: userDoc.data().cultivation?.level || 1,
            cultivationStage: userDoc.data().cultivation?.stage || 'Начинающий'
          };
        }
        
        members.push(member);
      }
      
      return members;
    } catch (error) {
      console.error('Ошибка при получении участников группы:', error);
      throw error;
    }
  }
  
  /**
   * Создание новой группы
   */
  static async createGroup(groupData, userId) {
    try {
      // Проверка на валидность userId
      if (!userId) {
        throw new Error('ID пользователя не указан');
      }
      
      const groupsCollection = await unifiedDatabase.getCollection('groups');
      const userGroupsSnapshot = await groupsCollection
        .where('leaderId', '==', userId)
        .get();
      
      if (userGroupsSnapshot.size >= 3) {
        throw new Error('Превышен лимит групп для пользователя (максимум 3)');
      }
      
      const usersCollection = await unifiedDatabase.getCollection('users');
      const userDoc = await usersCollection.doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('Пользователь не найден');
      }
      
      // Безопасное получение данных пользователя
      const userData = userDoc.data() || {};
      const user = {
        id: userDoc.id,
        ...userData
      };
      
      // Безопасное получение уровня культивации
      const userLevel = user.cultivation?.level || 1;
      
      if (userLevel < (groupData.minCultivationLevel || 1)) {
        throw new Error('Ваш уровень культивации не соответствует минимальному требованию');
      }
      
      const now = new Date();
      const groupId = uuidv4();
      
      const group = {
        id: groupId,
        name: groupData.name,
        description: groupData.description || '',
        leaderId: userId,
        memberIds: [userId],
        maxMembers: groupData.maxMembers || 10,
        minCultivationLevel: groupData.minCultivationLevel || 1,
        isPrivate: groupData.isPrivate || false,
        requiresApproval: groupData.requiresApproval || false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      await groupsCollection.doc(groupId).set(group);
      
      const memberId = uuidv4();
      
      const member = {
        id: memberId,
        groupId,
        userId,
        role: 'leader',
        specialization: groupData.leaderSpecialization || groupData.specialization || null,
        joinedAt: now.toISOString()
      };
      
      const membersCollection = await unifiedDatabase.getCollection('group_members');
      await membersCollection.doc(memberId).set(member);
      
      // Безопасное создание объекта пользователя
      member.user = {
        id: userId,
        name: user.name || 'Неизвестный культиватор', // Добавляем значение по умолчанию
        avatar: user.avatar || null,
        cultivationLevel: userLevel,
        cultivationStage: user.cultivation?.stage || 'Начинающий'
      };
      
      group.members = [member];
      
      return group;
    } catch (error) {
      console.error('Ошибка при создании группы:', error);
      throw error;
    }
  }
  
  /**
   * Обновление данных группы
   */
  static async updateGroup(groupId, updateData, userId) {
    try {
      const groupsCollection = await unifiedDatabase.getCollection('groups');
      const groupDoc = await groupsCollection.doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Группа не найдена');
      }
      
      const group = {
        id: groupDoc.id,
        ...groupDoc.data()
      };
      
      if (group.leaderId !== userId) {
        throw new Error('Только лидер группы может обновлять её данные');
      }
      
      const now = new Date();
      
      const updatedGroup = {
        ...group,
        name: updateData.name || group.name,
        description: updateData.description !== undefined ? updateData.description : group.description,
        maxMembers: updateData.maxMembers || group.maxMembers,
        minCultivationLevel: updateData.minCultivationLevel || group.minCultivationLevel,
        isPrivate: updateData.isPrivate !== undefined ? updateData.isPrivate : group.isPrivate,
        requiresApproval: updateData.requiresApproval !== undefined ? updateData.requiresApproval : group.requiresApproval,
        updatedAt: now.toISOString()
      };
      
      await groupsCollection.doc(groupId).update({
        name: updatedGroup.name,
        description: updatedGroup.description,
        maxMembers: updatedGroup.maxMembers,
        minCultivationLevel: updatedGroup.minCultivationLevel,
        isPrivate: updatedGroup.isPrivate,
        requiresApproval: updatedGroup.requiresApproval,
        updatedAt: updatedGroup.updatedAt
      });
      
      updatedGroup.members = await this.getGroupMembers(groupId);
      
      return updatedGroup;
    } catch (error) {
      console.error('Ошибка при обновлении группы:', error);
      throw error;
    }
  }
  
  /**
   * Удаление группы
   */
  static async deleteGroup(groupId, userId) {
    try {
      const groupsCollection = await unifiedDatabase.getCollection('groups');
      const groupDoc = await groupsCollection.doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Группа не найдена');
      }
      
      const group = groupDoc.data();
      
      if (group.leaderId !== userId) {
        throw new Error('Только лидер группы может удалить её');
      }
      
      const membersCollection = await unifiedDatabase.getCollection('group_members');
      const membersSnapshot = await membersCollection
        .where('groupId', '==', groupId)
        .get();
      
      // Используем транзакцию из унифицированного интерфейса
      await unifiedDatabase.transaction(async (batch) => {
        membersSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        batch.delete(groupsCollection.doc(groupId));
      });
      
      return true;
    } catch (error) {
      console.error('Ошибка при удалении группы:', error);
      throw error;
    }
  }
  
  /**
   * Добавление участника в группу
   */
  static async addMember(groupId, userId, role = 'member', specialization = null) {
    try {
      const groupsCollection = await unifiedDatabase.getCollection('groups');
      const groupDoc = await groupsCollection.doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Группа не найдена');
      }
      
      const group = {
        id: groupDoc.id,
        ...groupDoc.data()
      };
      
      if (group.memberIds.length >= group.maxMembers) {
        throw new Error('Достигнуто максимальное количество участников в группе');
      }
      
      if (group.memberIds.includes(userId)) {
        throw new Error('Пользователь уже является участником этой группы');
      }
      
      const usersCollection = await unifiedDatabase.getCollection('users');
      const userDoc = await usersCollection.doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('Пользователь не найден');
      }
      
      const user = {
        id: userDoc.id,
        ...userDoc.data()
      };
      
      const userLevel = user.cultivation?.level || 1;
      
      if (userLevel < group.minCultivationLevel) {
        throw new Error('Уровень культивации пользователя не соответствует минимальному требованию');
      }
      
      const now = new Date();
      const memberId = uuidv4();
      
      const member = {
        id: memberId,
        groupId,
        userId,
        role,
        specialization,
        joinedAt: now.toISOString()
      };
      
      await groupsCollection.doc(groupId).update({
        memberIds: [...group.memberIds, userId],
        updatedAt: now.toISOString()
      });
      
      const membersCollection = await unifiedDatabase.getCollection('group_members');
      await membersCollection.doc(memberId).set(member);
      
      member.user = {
        id: userId,
        name: user.name,
        avatar: user.avatar,
        cultivationLevel: userLevel,
        cultivationStage: user.cultivation?.stage || 'Начинающий'
      };
      
      return member;
    } catch (error) {
      console.error('Ошибка при добавлении участника в группу:', error);
      throw error;
    }
  }
  
  /**
   * Удаление участника из группы
   */
  static async removeMember(groupId, userId, removedById) {
    try {
      const groupsCollection = await unifiedDatabase.getCollection('groups');
      const groupDoc = await groupsCollection.doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Группа не найдена');
      }
      
      const group = {
        id: groupDoc.id,
        ...groupDoc.data()
      };
      
      const membersCollection = await unifiedDatabase.getCollection('group_members');
      const membersSnapshot = await membersCollection
        .where('groupId', '==', groupId)
        .where('userId', '==', userId)
        .get();
      
      if (membersSnapshot.empty) {
        throw new Error('Пользователь не является участником этой группы');
      }
      
      const memberDoc = membersSnapshot.docs[0];
      const member = {
        id: memberDoc.id,
        ...memberDoc.data()
      };
      
      const removerSnapshot = await membersCollection
        .where('groupId', '==', groupId)
        .where('userId', '==', removedById)
        .get();
      
      let removerRole = null;
      
      if (!removerSnapshot.empty) {
        const removerDoc = removerSnapshot.docs[0];
        removerRole = removerDoc.data().role;
      }
      
      if (
        userId !== removedById && // Нельзя удалять других пользователей, если...
        removerRole !== 'leader' && // ...не лидер
        (removerRole !== 'officer' || member.role === 'leader' || member.role === 'officer') // ...и не офицер, удаляющий обычного участника
      ) {
        throw new Error('У вас нет прав для удаления этого пользователя из группы');
      }
      
      if (member.role === 'leader' && group.memberIds.length > 1) {
        const officersSnapshot = await membersCollection
          .where('groupId', '==', groupId)
          .where('role', '==', 'officer')
          .get();
        
        let newLeaderId = null;
        
        if (!officersSnapshot.empty) {
          newLeaderId = officersSnapshot.docs[0].data().userId;
        } else {
          const otherMembersSnapshot = await membersCollection
            .where('groupId', '==', groupId)
            .where('userId', '!=', userId)
            .get();
          
          if (!otherMembersSnapshot.empty) {
            newLeaderId = otherMembersSnapshot.docs[0].data().userId;
          }
        }
        
        if (newLeaderId) {
          await membersCollection
            .where('groupId', '==', groupId)
            .where('userId', '==', newLeaderId)
            .get()
            .then(snapshot => {
              if (!snapshot.empty) {
                snapshot.docs[0].ref.update({ role: 'leader' });
              }
            });
          
          await groupsCollection.doc(groupId).update({
            leaderId: newLeaderId
          });
        }
      }
      
      await memberDoc.ref.delete();
      
      await groupsCollection.doc(groupId).update({
        memberIds: group.memberIds.filter(id => id !== userId),
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Ошибка при удалении участника из группы:', error);
      throw error;
    }
  }
  
  /**
   * Обновление роли участника группы
   */
  static async updateMemberRole(groupId, userId, newRole, updatedById) {
    try {
      const groupsCollection = await unifiedDatabase.getCollection('groups');
      const groupDoc = await groupsCollection.doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Группа не найдена');
      }
      
      const group = groupDoc.data();
      
      if (
        group.leaderId !== updatedById && 
        newRole === 'leader'
      ) {
        throw new Error('Только лидер группы может назначать нового лидера');
      }
      
      const membersCollection = await unifiedDatabase.getCollection('group_members');
      const updaterSnapshot = await membersCollection
        .where('groupId', '==', groupId)
        .where('userId', '==', updatedById)
        .get();
      
      if (updaterSnapshot.empty) {
        throw new Error('Вы не являетесь участником этой группы');
      }
      
      const updaterRole = updaterSnapshot.docs[0].data().role;
      
      if (updaterRole !== 'leader' && updaterRole !== 'officer') {
        throw new Error('Только лидер или офицер группы может обновлять роли');
      }
      
      const memberSnapshot = await membersCollection
        .where('groupId', '==', groupId)
        .where('userId', '==', userId)
        .get();
      
      if (memberSnapshot.empty) {
        throw new Error('Пользователь не является участником этой группы');
      }
      
      const memberDoc = memberSnapshot.docs[0];
      const member = {
        id: memberDoc.id,
        ...memberDoc.data()
      };
      
      if (
        updaterRole === 'officer' && 
        (member.role === 'leader' || member.role === 'officer')
      ) {
        throw new Error('Офицер не может обновлять роли лидера или других офицеров');
      }
      
      if (newRole === 'leader') {
        await membersCollection
          .where('groupId', '==', groupId)
          .where('role', '==', 'leader')
          .get()
          .then(snapshot => {
            if (!snapshot.empty) {
              snapshot.docs[0].ref.update({ role: 'officer' });
            }
          });
        
        await groupsCollection.doc(groupId).update({
          leaderId: userId
        });
      }
      
      await memberDoc.ref.update({
        role: newRole
      });
      
      await groupsCollection.doc(groupId).update({
        updatedAt: new Date().toISOString()
      });
      
      const updatedMember = {
        ...member,
        role: newRole
      };
      
      return updatedMember;
    } catch (error) {
      console.error('Ошибка при обновлении роли участника:', error);
      throw error;
    }
  }
  
  /**
   * Отправка приглашения в группу
   */
  static async sendInvitation(groupId, inviteeId, inviterId, message = '') {
    try {
      const groupDoc = await database.collection('groups').doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Группа не найдена');
      }
      
      const group = groupDoc.data();
      
      const inviterSnapshot = await database.collection('group_members')
        .where('groupId', '==', groupId)
        .where('userId', '==', inviterId)
        .get();
      
      if (inviterSnapshot.empty) {
        throw new Error('Вы не являетесь участником этой группы');
      }
      
      const inviterRole = inviterSnapshot.docs[0].data().role;
      
      if (inviterRole !== 'leader' && inviterRole !== 'officer') {
        throw new Error('Только лидер или офицер группы может отправлять приглашения');
      }
      
      if (group.memberIds.includes(inviteeId)) {
        throw new Error('Пользователь уже является участником этой группы');
      }
      
      const existingInvitationSnapshot = await database.collection('group_invitations')
        .where('groupId', '==', groupId)
        .where('inviteeId', '==', inviteeId)
        .where('status', '==', 'pending')
        .get();
      
      if (!existingInvitationSnapshot.empty) {
        throw new Error('Для этого пользователя уже существует ожидающее приглашение');
      }
      
      const inviteeDoc = await database.collection('users').doc(inviteeId).get();
      
      if (!inviteeDoc.exists) {
        throw new Error('Приглашаемый пользователь не найден');
      }
      
      const invitee = inviteeDoc.data();
      
      const inviteeLevel = invitee.cultivation?.level || 1;
      
      if (inviteeLevel < group.minCultivationLevel) {
        throw new Error(`Уровень культивации пользователя (${inviteeLevel}) не соответствует минимальному требованию группы (${group.minCultivationLevel})`);
      }
      
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      
      const invitationId = uuidv4();
      
      const invitation = {
        id: invitationId,
        groupId,
        inviterId,
        inviteeId,
        status: 'pending',
        message,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      await database.collection('group_invitations').doc(invitationId).set(invitation);
      
      invitation.group = {
        id: group.id,
        name: group.name,
        description: group.description
      };
      
      const inviterDoc = await database.collection('users').doc(inviterId).get();
      if (inviterDoc.exists) {
        invitation.inviter = {
          id: inviterId,
          name: inviterDoc.data().name,
          avatar: inviterDoc.data().avatar
        };
      }
      
      invitation.invitee = {
        id: inviteeId,
        name: invitee.name,
        avatar: invitee.avatar
      };
      
      return invitation;
    } catch (error) {
      console.error('Ошибка при отправке приглашения в группу:', error);
      throw error;
    }
  }
  
  /**
   * Получение списка приглашений пользователя
   */
  static async getUserInvitations(userId, status = 'pending') {
    try {
      let invitationsQuery = database.collection('group_invitations')
        .where('inviteeId', '==', userId);
      
      if (status) {
        if (Array.isArray(status)) {
          invitationsQuery = invitationsQuery.where('status', 'in', status);
        } else {
          invitationsQuery = invitationsQuery.where('status', '==', status);
        }
      }
      
      invitationsQuery = invitationsQuery.orderBy('createdAt', 'desc');
      
      const invitationsSnapshot = await invitationsQuery.get();
      const invitations = [];
      
      for (const invitationDoc of invitationsSnapshot.docs) {
        const invitation = {
          id: invitationDoc.id,
          ...invitationDoc.data()
        };
        
        const groupDoc = await database.collection('groups').doc(invitation.groupId).get();
        if (groupDoc.exists) {
          invitation.group = {
            id: groupDoc.id,
            name: groupDoc.data().name,
            description: groupDoc.data().description,
            memberCount: groupDoc.data().memberIds ? groupDoc.data().memberIds.length : 0,
            maxMembers: groupDoc.data().maxMembers
          };
        }
        
        const inviterDoc = await database.collection('users').doc(invitation.inviterId).get();
        if (inviterDoc.exists) {
          invitation.inviter = {
            id: inviterDoc.id,
            name: inviterDoc.data().name,
            avatar: inviterDoc.data().avatar
          };
        }
        
        invitations.push(invitation);
      }
      
      return invitations;
    } catch (error) {
      console.error('Ошибка при получении приглашений пользователя:', error);
      throw error;
    }
  }

  /**
   * Ответ на приглашение в группу
   */
  static async respondToInvitation(invitationId, response, userId) {
    try {
      const invitationDoc = await database.collection('group_invitations').doc(invitationId).get();
      
      if (!invitationDoc.exists) {
        throw new Error('Приглашение не найдено');
      }
      
      const invitation = invitationDoc.data();
      
      if (invitation.inviteeId !== userId) {
        throw new Error('У вас нет прав для ответа на это приглашение');
      }
      
      if (invitation.status !== 'pending') {
        throw new Error('Нельзя ответить на приглашение, которое не находится в статусе ожидания');
      }
      
      const now = new Date();
      const expiresAt = new Date(invitation.expiresAt);
      
      if (expiresAt < now) {
        throw new Error('Срок действия приглашения истек');
      }
      
      const statusUpdate = {
        status: response === 'accept' ? 'accepted' : 'declined',
        updatedAt: now.toISOString()
      };
      
      await database.collection('group_invitations').doc(invitationId).update(statusUpdate);
      
      if (response === 'accept') {
        await this.addMember(invitation.groupId, userId);
      }
      
      return { success: true, status: statusUpdate.status };
    } catch (error) {
      console.error('Ошибка при ответе на приглашение:', error);
      throw error;
    }
  }
  
  /**
   * Получение активностей группы с возможностью фильтрации
   */
  static async getGroupActivities(groupId, options = {}) {
    try {
      let query = database.collection('group_activities')
        .where('groupId', '==', groupId);

      // Фильтрация по статусу
      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.where('status', 'in', options.status);
        } else {
          query = query.where('status', '==', options.status);
        }
      }

      // Сортировка
      const sortField = options.sortField || 'createdAt';
      const sortDirection = options.sortDirection || 'desc';
      query = query.orderBy(sortField, sortDirection);

      // Ограничение количества
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const activitiesSnapshot = await query.get();
      const activities = [];
      
      for (const activityDoc of activitiesSnapshot.docs) {
        const activity = {
          id: activityDoc.id,
          ...activityDoc.data()
        };
        
        // Загружаем участников если требуется
        if (options.includeParticipants) {
          const participants = await database.collection('group_activity_participants')
            .where('activityId', '==', activity.id)
            .get();
          activity.participants = participants.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
        
        activities.push(activity);
      }
      
      return activities;
    } catch (error) {
      console.error('Ошибка при получении активностей группы:', error);
      throw error;
    }
  }
  
  /**
   * Создание групповой активности
   */
  static async createGroupActivity(groupId, activityData, creatorId) {
    try {
      const groupDoc = await database.collection('groups').doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Группа не найдена');
      }
      
      const group = groupDoc.data();
      
      const memberSnapshot = await database.collection('group_members')
        .where('groupId', '==', groupId)
        .where('userId', '==', creatorId)
        .get();
      
      if (memberSnapshot.empty) {
        throw new Error('Вы не являетесь участником этой группы');
      }
      
      const memberRole = memberSnapshot.docs[0].data().role;
      
      if (memberRole !== 'leader' && memberRole !== 'officer') {
        throw new Error('Только лидер или офицер группы может создавать активности');
      }
      
      const now = new Date();
      const activityId = uuidv4();
      
      const activity = {
        id: activityId,
        groupId,
        creatorId,
        name: activityData.name,
        description: activityData.description || '',
        type: activityData.type || 'exploration',
        location: activityData.location || '',
        minParticipants: activityData.minParticipants || 2,
        maxParticipants: activityData.maxParticipants || group.maxMembers,
        startTime: activityData.startTime || null,
        endTime: activityData.endTime || null,
        status: 'planned',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      await database.collection('group_activities').doc(activityId).set(activity);
      
      return activity;
    } catch (error) {
      console.error('Ошибка при создании групповой активности:', error);
      throw error;
    }
  }
  
  /**
   * Присоединение к групповой активности
   */
  static async joinGroupActivity(activityId, userId) {
    try {
      const activityDoc = await database.collection('group_activities').doc(activityId).get();
      
      if (!activityDoc.exists) {
        throw new Error('Активность не найдена');
      }
      
      const activity = activityDoc.data();
      
      const memberSnapshot = await database.collection('group_members')
        .where('groupId', '==', activity.groupId)
        .where('userId', '==', userId)
        .get();
      
      if (memberSnapshot.empty) {
        throw new Error('Вы не являетесь участником этой группы');
      }
      
      const participantsSnapshot = await database.collection('group_activity_participants')
        .where('activityId', '==', activityId)
        .get();
      
      const participantCount = participantsSnapshot.size;
      
      if (participantCount >= activity.maxParticipants) {
        throw new Error('Достигнуто максимальное количество участников для этой активности');
      }
      
      const existingParticipantSnapshot = await database.collection('group_activity_participants')
        .where('activityId', '==', activityId)
        .where('userId', '==', userId)
        .get();
      
      if (!existingParticipantSnapshot.empty) {
        throw new Error('Вы уже являетесь участником этой активности');
      }
      
      const now = new Date();
      const participantId = uuidv4();
      
      const participant = {
        id: participantId,
        activityId,
        userId,
        role: 'participant',
        joinedAt: now.toISOString()
      };
      
      await database.collection('group_activity_participants').doc(participantId).set(participant);
      
      return participant;
    } catch (error) {
      console.error('Ошибка при присоединении к групповой активности:', error);
      throw error;
    }
  }
}

module.exports = GroupService;


// Экспортируем отдельные методы для совместимости
module.exports.getUserGroups = GroupService.getUserGroups;
module.exports.getGroupById = GroupService.getGroupById;
module.exports.getGroupMembers = GroupService.getGroupMembers;
module.exports.createGroup = GroupService.createGroup;
module.exports.updateGroup = GroupService.updateGroup;
module.exports.deleteGroup = GroupService.deleteGroup;
module.exports.addMember = GroupService.addMember;
module.exports.removeMember = GroupService.removeMember;
module.exports.updateMemberRole = GroupService.updateMemberRole;
module.exports.sendInvitation = GroupService.sendInvitation;
module.exports.getUserInvitations = GroupService.getUserInvitations;
module.exports.respondToInvitation = GroupService.respondToInvitation;
module.exports.getGroupActivities = GroupService.getGroupActivities;
module.exports.createGroupActivity = GroupService.createGroupActivity;
module.exports.joinGroupActivity = GroupService.joinGroupActivity;