// Firebase service for Discord Bot - Complete Data Collection
import admin from 'firebase-admin';

let db = null;

// Initialize Firebase Admin SDK (lazy initialization)
function initializeFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  
  if (!db) {
    db = admin.firestore();
  }
  
  return db;
}

class BotFirebaseService {
  // Bot Statistics
  static async updateBotStats(stats) {
    try {
      const db = initializeFirebase();
      
      // Get active guild count
      const activeGuildsSnapshot = await db.collection('guilds').where('botPresent', '==', true).get();
      const totalActiveGuilds = activeGuildsSnapshot.size;
      
      await db.collection('botStats').doc('global').set({
        totalGuilds: stats.totalGuilds,
        totalActiveGuilds: totalActiveGuilds, // Only count active guilds
        totalUsers: stats.totalUsers,
        totalSongs: stats.totalSongs,
        uptime: stats.uptime,
        commandsUsed: stats.commandsUsed,
        status: stats.status,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log(`✅ Bot stats updated in Firebase (${totalActiveGuilds} active guilds out of ${stats.totalGuilds} total)`);
    } catch (error) {
      console.error('❌ Error updating bot stats:', error);
    }
  }

  static async getBotStats() {
    try {
      const db = initializeFirebase();
      const doc = await db.collection('botStats').doc('global').get();
      
      if (doc.exists) {
        const data = doc.data();
        return {
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || null
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting bot stats:', error);
      return null;
    }
  }

  // Guild Management
  static async addGuild(guild) {
    try {
      const db = initializeFirebase();
      console.log(`🔄 Adding guild ${guild.name} (${guild.id}) to Firebase...`);
      
      // Check if guild already exists
      const existingGuild = await db.collection('guilds').doc(guild.id).get();
      const isReturningGuild = existingGuild.exists;
      
      // Try to get owner information
      let ownerName = 'Unknown';
      let ownerAvatar = null;
      let ownerDiscriminator = null;
      let ownerGlobalName = null;
      let ownerCreatedAt = null;
      let ownerJoinedAt = null;
      let ownerRoles = [];
      let ownerBadges = [];
      try {
        const owner = await guild.fetchOwner();
        ownerName = owner.user?.username || 'Unknown';
        ownerGlobalName = owner.user?.globalName || null;
        ownerAvatar = owner.user?.displayAvatarURL({ size: 128 }) || null;
        ownerDiscriminator = owner.user?.discriminator || null;
        ownerCreatedAt = owner.user?.createdAt || null;
        ownerJoinedAt = owner.joinedAt || null;
        ownerRoles = owner.roles?.cache?.map(role => ({
          id: role.id,
          name: role.name,
          color: role.color,
          permissions: role.permissions.toArray()
        })) || [];
        ownerBadges = owner.user?.flags?.toArray() || [];
      } catch (error) {
        console.log(`Could not fetch owner for guild ${guild.name}:`, error.message);
      }
      
      const guildData = {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
        ownerName: ownerName,
        ownerGlobalName: ownerGlobalName,
        ownerAvatar: ownerAvatar,
        ownerDiscriminator: ownerDiscriminator,
        ownerCreatedAt: ownerCreatedAt,
        ownerJoinedAt: ownerJoinedAt,
        ownerRoles: ownerRoles,
        ownerBadges: ownerBadges,
        botJoinedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date(guild.createdAt),
        region: guild.region || 'Unknown',
        verificationLevel: guild.verificationLevel,
        features: guild.features || [],
        botPresent: true,
        commandsUsed: 0,
        songsPlayed: 0,
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        // Additional server info
        maxMembers: guild.maximumMembers || null,
        premiumTier: guild.premiumTier || 0,
        premiumSubscriptionCount: guild.premiumSubscriptionCount || 0,
        description: guild.description || null,
        banner: guild.banner || null,
        vanityURLCode: guild.vanityURLCode || null,
        verified: guild.verified || false,
        partnered: guild.partnered || false,
      };

      // Only set welcome message flags for truly new guilds
      if (!isReturningGuild) {
        guildData.joinedAt = admin.firestore.FieldValue.serverTimestamp();
        guildData.welcomeMessageSent = false;
        guildData.needsWelcomeMessage = true;
        console.log(`✨ New guild detected: ${guild.name} - will send welcome message`);
      } else {
        // Preserve existing welcome message status for returning guilds
        const existing = existingGuild.data();
        guildData.joinedAt = existing.joinedAt || admin.firestore.FieldValue.serverTimestamp();
        guildData.welcomeMessageSent = existing.welcomeMessageSent || false;
        guildData.needsWelcomeMessage = existing.needsWelcomeMessage || false;
        console.log(`🔄 Returning guild detected: ${guild.name} - preserving welcome status`);
      }
      
      await db.collection('guilds').doc(guild.id).set(guildData, { merge: true });
      
      console.log(`✅ Guild ${guild.name} added to Firebase`);
    } catch (error) {
      console.error(`❌ Error adding guild ${guild.name} (${guild.id}):`, error);
      throw error; // Re-throw to ensure calling code knows about the error
    }
  }

  // Remove guild when bot leaves
  static async removeGuild(guildId) {
    try {
      const db = initializeFirebase();
      await db.collection('guilds').doc(guildId).update({
        botPresent: false,
        leftAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Guild ${guildId} marked as left in Firebase`);
    } catch (error) {
      console.error('❌ Error removing guild:', error);
    }
  }

  // Update guild info
  static async updateGuild(guild) {
    try {
      const db = initializeFirebase();
      
      // Try to get owner information
      let ownerName = 'Unknown';
      let ownerAvatar = null;
      let ownerDiscriminator = null;
      let ownerGlobalName = null;
      let ownerCreatedAt = null;
      let ownerJoinedAt = null;
      let ownerRoles = [];
      let ownerBadges = [];
      try {
        const owner = await guild.fetchOwner();
        ownerName = owner.user?.username || 'Unknown';
        ownerGlobalName = owner.user?.globalName || null;
        ownerAvatar = owner.user?.displayAvatarURL({ size: 128 }) || null;
        ownerDiscriminator = owner.user?.discriminator || null;
        ownerCreatedAt = owner.user?.createdAt || null;
        ownerJoinedAt = owner.joinedAt || null;
        ownerRoles = owner.roles?.cache?.map(role => ({
          id: role.id,
          name: role.name,
          color: role.color,
          permissions: role.permissions.toArray()
        })) || [];
        ownerBadges = owner.user?.flags?.toArray() || [];
      } catch (error) {
        console.log(`Could not fetch owner for guild ${guild.name}:`, error.message);
      }
      
      await db.collection('guilds').doc(guild.id).update({
        name: guild.name,
        icon: guild.icon,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
        ownerName: ownerName,
        ownerGlobalName: ownerGlobalName,
        ownerAvatar: ownerAvatar,
        ownerDiscriminator: ownerDiscriminator,
        ownerCreatedAt: ownerCreatedAt,
        ownerJoinedAt: ownerJoinedAt,
        ownerRoles: ownerRoles,
        ownerBadges: ownerBadges,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        // Additional server info
        maxMembers: guild.maximumMembers || null,
        premiumTier: guild.premiumTier || 0,
        premiumSubscriptionCount: guild.premiumSubscriptionCount || 0,
        description: guild.description || null,
        banner: guild.banner || null,
        vanityURLCode: guild.vanityURLCode || null,
        verified: guild.verified || false,
        partnered: guild.partnered || false,
      });
      console.log(`✅ Guild ${guild.name} updated in Firebase`);
    } catch (error) {
      console.error('❌ Error updating guild:', error);
    }
  }

  // User Management
  static async addUser(user, guildId) {
    try {
      const db = initializeFirebase();
      const userDoc = {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        bot: user.bot || false,
        firstSeen: admin.firestore.FieldValue.serverTimestamp(),
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        guilds: admin.firestore.FieldValue.arrayUnion(guildId),
      };

      await db.collection('users').doc(user.id).set(userDoc, { merge: true });
      console.log(`✅ User ${user.username} added to Firebase`);
    } catch (error) {
      console.error(`❌ Error adding user ${user.username} (${user.id}):`, error);
      // Don't throw error for user addition to avoid breaking guild addition
    }
  }

  // Command Usage Tracking
  static async logCommand(commandData) {
    try {
      const db = initializeFirebase();
      await db.collection('commandUsage').add({
        command: commandData.command,
        userId: commandData.userId,
        username: commandData.username,
        guildId: commandData.guildId,
        guildName: commandData.guildName,
        channelId: commandData.channelId,
        channelName: commandData.channelName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        args: commandData.args || [],
        success: commandData.success !== false,
        error: commandData.error || null,
      });

      // Update guild command count
      await db.collection('guilds').doc(commandData.guildId).update({
        commandsUsed: admin.firestore.FieldValue.increment(1),
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Command ${commandData.command} logged to Firebase`);
    } catch (error) {
      console.error('❌ Error logging command:', error);
    }
  }

  // Music Usage Tracking
  static async logMusic(musicData) {
    try {
      const db = initializeFirebase();
      await db.collection('musicUsage').add({
        action: musicData.action, // 'play', 'skip', 'pause', 'resume', 'stop'
        songTitle: musicData.songTitle,
        songUrl: musicData.songUrl,
        duration: musicData.duration,
        userId: musicData.userId,
        username: musicData.username,
        guildId: musicData.guildId,
        guildName: musicData.guildName,
        channelId: musicData.channelId,
        channelName: musicData.channelName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        source: musicData.source || 'youtube',
      });

      // Update guild music count
      if (musicData.action === 'play') {
        await db.collection('guilds').doc(musicData.guildId).update({
          songsPlayed: admin.firestore.FieldValue.increment(1),
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      
      console.log(`✅ Music ${musicData.action} logged to Firebase`);
    } catch (error) {
      console.error('❌ Error logging music:', error);
    }
  }

  // Error Logging
  static async logError(errorData) {
    try {
      const db = initializeFirebase();
      await db.collection('errors').add({
        error: errorData.error,
        command: errorData.command,
        userId: errorData.userId,
        guildId: errorData.guildId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        stack: errorData.stack,
        severity: errorData.severity || 'error',
      });
      
      console.log(`✅ Error logged to Firebase`);
    } catch (error) {
      console.error('❌ Error logging error:', error);
    }
  }

  // Voice Channel Activity
  static async logVoiceActivity(voiceData) {
    try {
      const db = initializeFirebase();
      await db.collection('voiceActivity').add({
        userId: voiceData.userId,
        username: voiceData.username,
        guildId: voiceData.guildId,
        channelId: voiceData.channelId,
        channelName: voiceData.channelName,
        action: voiceData.action, // 'join', 'leave', 'move'
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Voice activity logged to Firebase`);
    } catch (error) {
      console.error('❌ Error logging voice activity:', error);
    }
  }

  // Queue Management
  static async updateQueue(guildId, queueData) {
    try {
      const db = initializeFirebase();
      await db.collection('musicQueues').doc(guildId).set({
        guildId: guildId,
        queue: queueData.queue || [],
        currentSong: queueData.currentSong || null,
        volume: queueData.volume || 100,
        repeat: queueData.repeat || 'none',
        shuffle: queueData.shuffle || false,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      console.log(`✅ Queue updated for guild ${guildId}`);
    } catch (error) {
      console.error('❌ Error updating queue:', error);
    }
  }

  // Performance Metrics
  static async logPerformance(metrics) {
    try {
      const db = initializeFirebase();
      await db.collection('performance').add({
        responseTime: metrics.responseTime,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage,
        guildsCount: metrics.guildsCount,
        usersCount: metrics.usersCount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Performance metrics logged`);
    } catch (error) {
      console.error('❌ Error logging performance:', error);
    }
  }

  // Test Firebase connection
  static async testConnection() {
    try {
      const db = initializeFirebase();
      await db.collection('test').doc('connection').set({
        status: 'connected',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ Firebase connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
      return false;
    }
  }

  // Dev Mode Management
  static async setDevMode(enabled) {
    try {
      const db = initializeFirebase();
      await db.collection('botSettings').doc('devMode').set({
        enabled: enabled,
        lastToggled: admin.firestore.FieldValue.serverTimestamp(),
        toggledBy: 'system'
      }, { merge: true });
      console.log(`✅ Dev mode ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    } catch (error) {
      console.error('❌ Error setting dev mode:', error);
      return false;
    }
  }

  static async setDevModeFromCommand(enabled, userId, username) {
    try {
      const db = initializeFirebase();
      await db.collection('botSettings').doc('devMode').set({
        enabled: enabled,
        lastToggled: admin.firestore.FieldValue.serverTimestamp(),
        toggledBy: username,
        toggledByUserId: userId,
        toggledFrom: 'command',
        needsNotification: false, // No need for notification since it's from Discord
        notificationSent: true
      }, { merge: true });
      console.log(`✅ Dev mode ${enabled ? 'enabled' : 'disabled'} from command by ${username}`);
      return true;
    } catch (error) {
      console.error('❌ Error setting dev mode from command:', error);
      return false;
    }
  }

  static async getDevMode() {
    try {
      const db = initializeFirebase();
      const doc = await db.collection('botSettings').doc('devMode').get();
      return doc.exists ? doc.data().enabled || false : false;
    } catch (error) {
      console.error('❌ Error getting dev mode:', error);
      return false;
    }
  }

  static async setDevModeFromWeb(enabled, userId, username) {
    try {
      const db = initializeFirebase();
      await db.collection('botSettings').doc('devMode').set({
        enabled: enabled,
        lastToggled: admin.firestore.FieldValue.serverTimestamp(),
        toggledBy: username,
        toggledByUserId: userId,
        toggledFrom: 'website',
        needsNotification: true, // Flag to tell bot to send notification
        notificationSent: false
      }, { merge: true });
      console.log(`✅ Dev mode ${enabled ? 'enabled' : 'disabled'} from website by ${username}`);
      return true;
    } catch (error) {
      console.error('❌ Error setting dev mode from web:', error);
      return false;
    }
  }

  // Mark notification as sent
  static async markDevModeNotificationSent() {
    try {
      const db = initializeFirebase();
      await db.collection('botSettings').doc('devMode').update({
        notificationSent: true,
        needsNotification: false
      });
      return true;
    } catch (error) {
      console.error('❌ Error marking notification as sent:', error);
      return false;
    }
  }

  // Get dev mode with notification status
  static async getDevModeWithNotification() {
    try {
      const db = initializeFirebase();
      const doc = await db.collection('botSettings').doc('devMode').get();
      if (doc.exists) {
        return doc.data();
      }
      return { enabled: false, needsNotification: false, notificationSent: true };
    } catch (error) {
      console.error('❌ Error getting dev mode with notification:', error);
      return { enabled: false, needsNotification: false, notificationSent: true };
    }
  }

  // Premium User Management
  static async addPremiumUser(userId, username, addedBy, addedByUsername, subscriptionType = 'permanent') {
    try {
      const db = initializeFirebase();
      
      // Calculate expiration date for monthly subscriptions
      let expiresAt = null;
      if (subscriptionType === 'monthly') {
        const now = new Date();
        expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
      }
      
      const premiumData = {
        userId: userId,
        username: username,
        addedBy: addedBy,
        addedByUsername: addedByUsername,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        subscriptionType: subscriptionType, // 'monthly' or 'permanent'
        expiresAt: expiresAt ? admin.firestore.Timestamp.fromDate(expiresAt) : null,
        tier: 'premium',
        benefits: [
          'Priority support',
          'Premium badge',
          'Early access to features',
          'Higher command rate limits',
          'Custom playlist commands'
        ],
        // Warning system for monthly users
        warningsSent: [],
        renewalReminders: {
          sevenDays: false,
          threeDays: false,
          oneDay: false
        }
      };

      await db.collection('premiumUsers').doc(userId).set(premiumData);
      
      // Set notification flag for bot to send welcome message
      await db.collection('premiumUsers').doc(userId).update({
        needsWelcomeMessage: true,
        welcomeMessageSent: false
      });

      // Re-enable custom commands that were deactivated due to premium removal
      const customCommandsSnapshot = await db.collection('customCommands')
        .where('userId', '==', userId)
        .where('deactivationReason', '==', 'Premium status removed')
        .get();
      
      if (!customCommandsSnapshot.empty) {
        const batch = db.batch();
        customCommandsSnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { 
            isActive: true,
            reactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
            deactivationReason: admin.firestore.FieldValue.delete()
          });
        });
        
        await batch.commit();
        console.log(`🔓 Re-enabled ${customCommandsSnapshot.size} custom commands for user ${userId}`);
      }

      console.log(`✅ Premium user ${username} (${userId}) added successfully with ${subscriptionType} subscription`);
      return { success: true, data: premiumData };
    } catch (error) {
      console.error('❌ Error adding premium user:', error);
      return { success: false, error: error.message };
    }
  }

  static async removePremiumUser(userId) {
    try {
      const db = initializeFirebase();
      
      // Deactivate premium status
      await db.collection('premiumUsers').doc(userId).update({
        isActive: false,
        removedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Disable all custom commands for this user
      const customCommandsSnapshot = await db.collection('customCommands')
        .where('userId', '==', userId)
        .get();
      
      const batch = db.batch();
      customCommandsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { 
          isActive: false,
          deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
          deactivationReason: 'Premium status removed'
        });
      });
      
      if (!customCommandsSnapshot.empty) {
        await batch.commit();
        console.log(`🔒 Disabled ${customCommandsSnapshot.size} custom commands for user ${userId}`);
      }
      
      console.log(`✅ Premium user ${userId} removed successfully`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error removing premium user:', error);
      return { success: false, error: error.message };
    }
  }

  // Subscription Management Methods
  static async checkExpiringSubscriptions() {
    try {
      const db = initializeFirebase();
      const now = new Date();
      
      // Check for subscriptions expiring in 7 days, 3 days, and 1 day
      const warningPeriods = [
        { days: 7, key: 'sevenDays' },
        { days: 3, key: 'threeDays' },
        { days: 1, key: 'oneDay' }
      ];
      
      const expiringUsers = [];
      
      for (const period of warningPeriods) {
        const targetDate = new Date(now.getTime() + (period.days * 24 * 60 * 60 * 1000));
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);
        
        const snapshot = await db.collection('premiumUsers')
          .where('subscriptionType', '==', 'monthly')
          .where('isActive', '==', true)
          .where('expiresAt', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
          .where('expiresAt', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
          .where(`renewalReminders.${period.key}`, '==', false)
          .get();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          expiringUsers.push({
            userId: doc.id,
            username: data.username,
            expiresAt: data.expiresAt.toDate(),
            daysRemaining: period.days,
            warningType: period.key
          });
        });
      }
      
      return expiringUsers;
    } catch (error) {
      console.error('❌ Error checking expiring subscriptions:', error);
      return [];
    }
  }

  static async markWarningAsSent(userId, warningType) {
    try {
      const db = initializeFirebase();
      await db.collection('premiumUsers').doc(userId).update({
        [`renewalReminders.${warningType}`]: true,
        warningsSent: admin.firestore.FieldValue.arrayUnion({
          type: warningType,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        })
      });
      
      console.log(`✅ Marked ${warningType} warning as sent for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking warning as sent:', error);
      return { success: false, error: error.message };
    }
  }

  static async checkExpiredSubscriptions() {
    try {
      const db = initializeFirebase();
      const now = admin.firestore.Timestamp.now();
      
      const snapshot = await db.collection('premiumUsers')
        .where('subscriptionType', '==', 'monthly')
        .where('isActive', '==', true)
        .where('expiresAt', '<=', now)
        .get();
      
      const expiredUsers = [];
      
      if (!snapshot.empty) {
        const batch = db.batch();
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          expiredUsers.push({
            userId: doc.id,
            username: data.username,
            expiresAt: data.expiresAt.toDate()
          });
          
          // Deactivate the premium status
          batch.update(doc.ref, {
            isActive: false,
            expiredAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'expired'
          });
          
          // Deactivate all custom commands for this user
          const customCommandsSnapshot = await db.collection('customCommands')
            .where('userId', '==', doc.id)
            .where('isActive', '==', true)
            .get();
          
          customCommandsSnapshot.docs.forEach((cmdDoc) => {
            batch.update(cmdDoc.ref, { 
              isActive: false,
              deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
              deactivationReason: 'Premium subscription expired'
            });
          });
        }
        
        await batch.commit();
        console.log(`✅ Deactivated ${expiredUsers.length} expired premium subscriptions`);
      }
      
      return expiredUsers;
    } catch (error) {
      console.error('❌ Error checking expired subscriptions:', error);
      return [];
    }
  }

  static async renewPremiumSubscription(userId, renewedBy, renewedByUsername) {
    try {
      const db = initializeFirebase();
      const userDoc = await db.collection('premiumUsers').doc(userId).get();
      
      if (!userDoc.exists) {
        return { success: false, error: 'User not found in premium users' };
      }
      
      const userData = userDoc.data();
      const now = new Date();
      
      // Calculate new expiration date (30 days from now)
      const newExpirationDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      // Update premium user data
      await db.collection('premiumUsers').doc(userId).update({
        isActive: true,
        expiresAt: admin.firestore.Timestamp.fromDate(newExpirationDate),
        renewedAt: admin.firestore.FieldValue.serverTimestamp(),
        renewedBy: renewedBy,
        renewedByUsername: renewedByUsername,
        status: admin.firestore.FieldValue.delete(), // Remove expired status if it exists
        // Reset renewal reminders
        renewalReminders: {
          sevenDays: false,
          threeDays: false,
          oneDay: false
        }
      });
      
      // Re-enable custom commands that were deactivated due to expiration
      const customCommandsSnapshot = await db.collection('customCommands')
        .where('userId', '==', userId)
        .where('deactivationReason', '==', 'Premium subscription expired')
        .get();
      
      if (!customCommandsSnapshot.empty) {
        const batch = db.batch();
        customCommandsSnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { 
            isActive: true,
            reactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
            deactivationReason: admin.firestore.FieldValue.delete()
          });
        });
        
        await batch.commit();
        console.log(`🔓 Re-enabled ${customCommandsSnapshot.size} custom commands for renewed user ${userId}`);
      }
      
      console.log(`✅ Premium subscription renewed for user ${userId} until ${newExpirationDate.toISOString()}`);
      return { 
        success: true, 
        newExpirationDate: newExpirationDate,
        commandsReactivated: customCommandsSnapshot.size
      };
    } catch (error) {
      console.error('❌ Error renewing premium subscription:', error);
      return { success: false, error: error.message };
    }
  }

  static async getAllPremiumUsers() {
    try {
      const db = initializeFirebase();
      // Remove orderBy to avoid index requirement - we'll sort in JavaScript instead
      const snapshot = await db.collection('premiumUsers')
        .where('isActive', '==', true)
        .get();
      
      const premiumUsers = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        premiumUsers.push({
          id: doc.id,
          ...data,
          addedAt: data.addedAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || null
        });
      });
      
      // Sort by addedAt in JavaScript (most recent first)
      premiumUsers.sort((a, b) => b.addedAt - a.addedAt);
      
      return { success: true, data: premiumUsers };
    } catch (error) {
      console.error('❌ Error getting premium users:', error);
      return { success: false, error: error.message };
    }
  }

  static async isPremiumUser(userId) {
    try {
      const db = initializeFirebase();
      const doc = await db.collection('premiumUsers').doc(userId).get();
      
      if (doc.exists) {
        const data = doc.data();
        return data.isActive === true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error checking premium status:', error);
      return false;
    }
  }

  static async getPremiumUsersNeedingWelcome() {
    try {
      const db = initializeFirebase();
      const snapshot = await db.collection('premiumUsers')
        .where('needsWelcomeMessage', '==', true)
        .where('welcomeMessageSent', '==', false)
        .get();
      
      const users = [];
      snapshot.forEach(doc => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('❌ Error getting users needing welcome:', error);
      return [];
    }
  }

  static async markWelcomeMessageSent(userId) {
    try {
      const db = initializeFirebase();
      await db.collection('premiumUsers').doc(userId).update({
        needsWelcomeMessage: false,
        welcomeMessageSent: true,
        welcomeMessageSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking welcome message sent:', error);
      return { success: false, error: error.message };
    }
  }

  static async updatePremiumUserInfo(userId, userInfo) {
    try {
      const db = initializeFirebase();
      await db.collection('premiumUsers').doc(userId).update({
        username: userInfo.username,
        globalName: userInfo.globalName || null,
        avatar: userInfo.avatar || null,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating premium user info:', error);
      return { success: false, error: error.message };
    }
  }

  // Custom Playlist Commands for Premium Users
  static async createCustomCommand(userId, commandName, playlist, description = '') {
    try {
      const db = initializeFirebase();
      
      // Check user tier and limits
      const isPremium = await this.isPremiumUser(userId);
      
      // For standard users, check command and playlist limits
      if (!isPremium) {
        // Check command count limit (1 for standard users)
        const existingCommands = await this.getUserCustomCommands(userId);
        if (existingCommands.success && existingCommands.data.length >= 1) {
          return { success: false, error: 'Standard users can only create 1 custom command. Upgrade to premium for unlimited commands.' };
        }
        
        // Check playlist size limit (maximum 8 songs for standard users)
        if (playlist.length > 8) {
          return { success: false, error: 'Standard users can have a maximum of 8 songs in their custom command playlist. Upgrade to premium for unlimited songs.' };
        }
      }

      // Check if command name already exists for this user
      const existingCommand = await db.collection('customCommands')
        .where('userId', '==', userId)
        .where('commandName', '==', commandName.toLowerCase())
        .get();

      if (!existingCommand.empty) {
        return { success: false, error: 'Command name already exists. Please choose a different name.' };
      }

      // Check if command name conflicts with existing bot commands
      const reservedCommands = ['play', 'pause', 'resume', 'stop', 'skip', 'queue', 'volume', 'nowplaying', 'shuffle', 'devmode', 'help', 'stats', 'serverinfo', 'clear'];
      if (reservedCommands.includes(commandName.toLowerCase())) {
        return { success: false, error: 'Command name conflicts with existing bot commands' };
      }

      const customCommandData = {
        userId: userId,
        commandName: commandName.toLowerCase(),
        displayName: commandName,
        playlist: playlist, // Array of song URLs/names
        description: description,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        usageCount: 0,
        lastUsed: null
      };

      const docRef = await db.collection('customCommands').add(customCommandData);
      
      console.log(`✅ Custom command '${commandName}' created for user ${userId}`);
      return { success: true, data: { id: docRef.id, ...customCommandData } };
    } catch (error) {
      console.error('❌ Error creating custom command:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserCustomCommands(userId) {
    try {
      const db = initializeFirebase();
      const snapshot = await db.collection('customCommands')
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .get();
      
      const commands = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        commands.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUsed: data.lastUsed?.toDate() || null
        });
      });
      
      return { success: true, data: commands };
    } catch (error) {
      console.error('❌ Error getting user custom commands:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateCustomCommand(commandId, updates) {
    try {
      const db = initializeFirebase();
      await db.collection('customCommands').doc(commandId).update({
        ...updates,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Custom command ${commandId} updated successfully`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating custom command:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteCustomCommand(commandId, userId) {
    try {
      const db = initializeFirebase();
      
      // Verify ownership
      const doc = await db.collection('customCommands').doc(commandId).get();
      if (!doc.exists || doc.data().userId !== userId) {
        return { success: false, error: 'Command not found or access denied' };
      }

      await db.collection('customCommands').doc(commandId).update({
        isActive: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Custom command ${commandId} deleted successfully`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting custom command:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCustomCommand(commandId) {
    try {
      const db = initializeFirebase();
      const doc = await db.collection('customCommands').doc(commandId).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Command not found' };
      }

      const data = doc.data();
      return {
        success: true,
        data: {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUsed: data.lastUsed?.toDate() || null
        }
      };
    } catch (error) {
      console.error('❌ Error getting custom command:', error);
      return { success: false, error: error.message };
    }
  }

  // Welcome message for new server owners
  static async markWelcomeMessageSent(guildId, ownerId) {
    try {
      const db = initializeFirebase();
      await db.collection('guilds').doc(guildId).update({
        welcomeMessageSent: true,
        welcomeMessageSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Welcome message marked as sent for guild ${guildId} owner ${ownerId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking welcome message sent:', error);
      return { success: false, error: error.message };
    }
  }

  // Get server activity data (admin only)
  static async getServerActivity(startDate) {
    try {
      const db = initializeFirebase();
      
      // Get recently joined servers (where botJoinedAt is after startDate)
      const joinedSnapshot = await db.collection('guilds')
        .where('botJoinedAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .where('botPresent', '==', true)
        .orderBy('botJoinedAt', 'desc')
        .limit(50)
        .get();
      
      // Get recently left servers (where leftAt is after startDate)
      const leftSnapshot = await db.collection('guilds')
        .where('leftAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .where('botPresent', '==', false)
        .orderBy('leftAt', 'desc')
        .limit(50)
        .get();
      
      const recentlyAdded = [];
      joinedSnapshot.forEach(doc => {
        const data = doc.data();
        recentlyAdded.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to regular dates for JSON serialization
          joinedAt: data.joinedAt?.toDate() || null,
          botJoinedAt: data.botJoinedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || null,
          lastActive: data.lastActive?.toDate() || null,
          lastUpdated: data.lastUpdated?.toDate() || null,
          ownerCreatedAt: data.ownerCreatedAt?.toDate() || null,
          ownerJoinedAt: data.ownerJoinedAt?.toDate() || null,
          leftAt: data.leftAt?.toDate() || null
        });
      });
      
      const recentlyLeft = [];
      leftSnapshot.forEach(doc => {
        const data = doc.data();
        recentlyLeft.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to regular dates for JSON serialization
          joinedAt: data.joinedAt?.toDate() || null,
          botJoinedAt: data.botJoinedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || null,
          lastActive: data.lastActive?.toDate() || null,
          lastUpdated: data.lastUpdated?.toDate() || null,
          ownerCreatedAt: data.ownerCreatedAt?.toDate() || null,
          ownerJoinedAt: data.ownerJoinedAt?.toDate() || null,
          leftAt: data.leftAt?.toDate() || null
        });
      });
      
      console.log(`✅ Retrieved server activity: ${recentlyAdded.length} joined, ${recentlyLeft.length} left`);
      return {
        recentlyAdded,
        recentlyLeft
      };
    } catch (error) {
      console.error('❌ Error getting server activity:', error);
      return {
        recentlyAdded: [],
        recentlyLeft: []
      };
    }
  }

  // Get guilds for a specific user (where they are the owner)
  static async getUserGuilds(userId) {
    try {
      const db = initializeFirebase();
      const snapshot = await db.collection('guilds')
        .where('ownerId', '==', userId)
        .orderBy('lastActive', 'desc')
        .get();
      
      const guilds = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        guilds.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to regular dates for JSON serialization
          joinedAt: data.joinedAt?.toDate() || null,
          botJoinedAt: data.botJoinedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || null,
          lastActive: data.lastActive?.toDate() || null,
          lastUpdated: data.lastUpdated?.toDate() || null,
          ownerCreatedAt: data.ownerCreatedAt?.toDate() || null,
          ownerJoinedAt: data.ownerJoinedAt?.toDate() || null,
          leftAt: data.leftAt?.toDate() || null
        });
      });
      
      console.log(`✅ Retrieved ${guilds.length} guilds for user ${userId}`);
      return guilds;
    } catch (error) {
      console.error('❌ Error getting user guilds:', error);
      return [];
    }
  }

  // Get all guilds (admin only)
  static async getAllGuilds() {
    try {
      const db = initializeFirebase();
      const snapshot = await db.collection('guilds').orderBy('lastActive', 'desc').get();
      
      const guilds = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        guilds.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to regular dates for JSON serialization
          joinedAt: data.joinedAt?.toDate() || null,
          botJoinedAt: data.botJoinedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || null,
          lastActive: data.lastActive?.toDate() || null,
          lastUpdated: data.lastUpdated?.toDate() || null,
          ownerCreatedAt: data.ownerCreatedAt?.toDate() || null,
          ownerJoinedAt: data.ownerJoinedAt?.toDate() || null,
          leftAt: data.leftAt?.toDate() || null
        });
      });
      
      console.log(`✅ Retrieved ${guilds.length} guilds for admin`);
      return guilds;
    } catch (error) {
      console.error('❌ Error getting all guilds:', error);
      return [];
    }
  }

  static async getGuildsNeedingWelcome() {
    try {
      const db = initializeFirebase();
      const snapshot = await db.collection('guilds')
        .where('botPresent', '==', true)
        .where('needsWelcomeMessage', '==', true)
        .get();
      
      const guilds = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Double-check that welcome message hasn't been sent
        if (!data.welcomeMessageSent) {
          guilds.push({
            id: doc.id,
            ...data,
            joinedAt: data.joinedAt?.toDate() || new Date()
          });
        }
      });
      
      return guilds;
    } catch (error) {
      console.error('❌ Error getting guilds needing welcome:', error);
      return [];
    }
  }
}

export { BotFirebaseService };