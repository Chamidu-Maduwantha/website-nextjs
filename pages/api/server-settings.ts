import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
let db: admin.firestore.Firestore;

function initializeFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }
  
  if (!db) {
    db = admin.firestore();
  }
  
  return db;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = initializeFirebase();
    const { serverId } = req.query;

    console.log('Server settings request:', { method: req.method, serverId, userId: session.user.id });

    if (!serverId) {
      console.log('Missing server ID');
      return res.status(400).json({ error: 'Server ID required' });
    }

    if (req.method === 'GET') {
      // Get server settings
      const settingsDoc = await db.collection('serverSettings').doc(serverId as string).get();
      
      const defaultSettings = {
        defaultVolume: 50,
        maxQueueSize: 100,
        autoLeave: true,
        autoLeaveTimeout: 5,
        allowedChannels: [],
        blockedChannels: [],
        welcomeMessages: true,
        nowPlayingMessages: true,
        deleteCommands: false
      };

      const settings = settingsDoc.exists ? { ...defaultSettings, ...settingsDoc.data() } : defaultSettings;

      res.status(200).json({ settings });

    } else if (req.method === 'POST') {
      // Update server settings - check if user is server owner
      const { settings, serverId: bodyServerId } = req.body;
      
      // Use serverId from either query or body
      const serverIdToUse = serverId || bodyServerId;
      
      console.log('POST request body:', req.body);
      console.log('Server ID from query:', serverId);
      console.log('Server ID from body:', bodyServerId);
      console.log('Using server ID:', serverIdToUse);
      console.log('Settings to update:', settings);
      
      if (!serverIdToUse) {
        console.log('No server ID provided in query or body');
        return res.status(400).json({ error: 'Server ID required' });
      }
      
      if (!settings) {
        console.log('No settings provided in request body');
        return res.status(400).json({ error: 'Settings required' });
      }
      
      // Get guild info to check ownership
      const guildDoc = await db.collection('guilds').doc(serverIdToUse as string).get();
      const guildData = guildDoc.data();
      
      console.log('Guild ownership check:', { 
        guildExists: guildDoc.exists, 
        ownerId: guildData?.ownerId, 
        userId: session.user.id,
        isOwner: guildData?.ownerId === session.user.id 
      });
      
      // Allow admin users to modify any server settings
      const isAdmin = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',').includes(session.user.id);
      console.log('Admin check:', { isAdmin });
      
      if (!isAdmin && (!guildData || guildData.ownerId !== session.user.id)) {
        return res.status(403).json({ error: 'Only server owners can modify settings' });
      }

      await db.collection('serverSettings').doc(serverIdToUse as string).set(settings, { merge: true });

      res.status(200).json({ success: true, settings });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling server settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
