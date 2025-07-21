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
    
    // Get bot stats
    const botStatsDoc = await db.collection('botStats').doc('global').get();
    
    if (!botStatsDoc.exists) {
      return res.status(404).json({ error: 'Bot stats not found' });
    }

    const botStats = botStatsDoc.data();
    console.log('Raw bot stats from Firebase:', botStats); // Debug log
    
    // Get dev mode status
    const devModeDoc = await db.collection('devMode').doc('status').get();
    const devModeData = devModeDoc.exists ? devModeDoc.data() : { enabled: false };
    console.log('Dev mode data from Firebase:', devModeData); // Debug log

    const response = {
      status: botStats?.status || 'unknown',
      maintenanceMode: botStats?.maintenanceMode || devModeData.enabled || false,
      devMode: botStats?.devMode || devModeData.enabled || false,
      lastStatusUpdate: botStats?.lastStatusUpdate || botStats?.lastUpdated || null,
      uptime: botStats?.uptime || 0,
      totalGuilds: botStats?.totalGuilds || 0,
      totalUsers: botStats?.totalUsers || 0,
      lastHeartbeat: botStats?.lastUpdated || null
    };
    
    console.log('Bot status response:', response); // Debug log

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching bot status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
