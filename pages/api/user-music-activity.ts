import type { NextApiRequest, NextApiResponse } from 'next';
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
    const db = initializeFirebase();
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Mock user activity data - in a real implementation, you'd track this
    const mockActivity = [
      {
        id: 'activity_1',
        type: 'played',
        songTitle: 'Watermelon Sugar',
        artist: 'Harry Styles',
        serverName: 'My Cool Server',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        thumbnail: 'https://i.ytimg.com/vi/E07s5ZYygMg/maxresdefault.jpg'
      },
      {
        id: 'activity_2',
        type: 'requested',
        songTitle: 'Blinding Lights',
        artist: 'The Weeknd',
        serverName: 'Gaming Hub',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/maxresdefault.jpg'
      },
      {
        id: 'activity_3',
        type: 'skipped',
        songTitle: 'Shape of You',
        artist: 'Ed Sheeran',
        serverName: 'Music Lovers',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
        thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/maxresdefault.jpg'
      },
      {
        id: 'activity_4',
        type: 'played',
        songTitle: 'Good 4 U',
        artist: 'Olivia Rodrigo',
        serverName: 'Friends Server',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        thumbnail: 'https://i.ytimg.com/vi/gNi_6U5Pm_o/maxresdefault.jpg'
      }
    ];

    res.status(200).json({ activity: mockActivity });
  } catch (error) {
    console.error('Error fetching user music activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
