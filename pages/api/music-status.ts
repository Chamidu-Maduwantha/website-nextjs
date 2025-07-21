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
    console.log('Music status request for server:', req.query.serverId);
    
    const db = initializeFirebase();
    const { serverId } = req.query;

    if (!serverId) {
      console.log('No server ID provided');
      return res.status(400).json({ error: 'Server ID required' });
    }

    console.log('Fetching music status from Firebase for server:', serverId);
    
    // Get current music status from Firebase
    const musicStatusDoc = await db.collection('musicStatus').doc(serverId as string).get();
    
    console.log('Music status doc exists:', musicStatusDoc.exists);
    
    if (!musicStatusDoc.exists) {
      console.log('No music status found, returning default');
      return res.status(200).json({
        currentSong: null,
        queue: [],
        isPlaying: false,
        volume: 50,
        position: 0,
        lastUpdated: null
      });
    }

    const statusData = musicStatusDoc.data();
    console.log('Music status data:', statusData);
    
    // Check if data is recent (within last 30 seconds)
    const lastUpdated = statusData?.lastUpdated?.toDate();
    const now = new Date();
    const isRecent = lastUpdated && (now.getTime() - lastUpdated.getTime()) < 30000;

    console.log('Data age check:', { lastUpdated, isRecent });

    if (!isRecent) {
      // Data is stale, return empty status
      console.log('Data is stale, returning empty status');
      return res.status(200).json({
        currentSong: null,
        queue: [],
        isPlaying: false,
        volume: statusData?.volume || 50,
        position: 0,
        lastUpdated: lastUpdated?.toISOString() || null
      });
    }

    const response = {
      currentSong: statusData?.currentSong || null,
      queue: statusData?.queue || [],
      isPlaying: statusData?.isPlaying || false,
      volume: statusData?.volume || 50,
      position: statusData?.position || 0,
      lastUpdated: lastUpdated?.toISOString() || null
    };

    console.log('Returning music status:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching music status:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
