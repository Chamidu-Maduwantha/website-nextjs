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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = initializeFirebase();
    const { serverId } = req.query;

    if (!serverId) {
      return res.status(400).json({ error: 'Server ID required' });
    }

    // Get server data from Firebase
    const guildDoc = await db.collection('guilds').doc(serverId as string).get();
    
    if (!guildDoc.exists) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const guildData = guildDoc.data();

    // Mock channels and roles data - in a real implementation, you'd get this from Discord API
    // or store it in Firebase when the bot joins/updates the server
    const mockChannels = [
      { id: '1', name: 'general' },
      { id: '2', name: 'music' },
      { id: '3', name: 'bot-commands' },
      { id: '4', name: 'voice-chat' }
    ];

    const mockRoles = [
      { id: '1', name: 'Admin' },
      { id: '2', name: 'Moderator' },
      { id: '3', name: 'DJ' },
      { id: '4', name: 'Member' }
    ];

    res.status(200).json({
      channels: mockChannels,
      roles: mockRoles,
      guildInfo: {
        id: guildData.id,
        name: guildData.name,
        memberCount: guildData.memberCount,
        ownerId: guildData.ownerId
      }
    });

  } catch (error) {
    console.error('Error fetching server data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
