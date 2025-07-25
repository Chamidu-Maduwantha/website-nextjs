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
    
    // Get dev mode status (this is still actively used)
    console.log('Fetching dev mode status...');
    
    // Check botSettings/devMode (where the web toggle writes to)
    let devModeDoc = await db.collection('botSettings').doc('devMode').get();
    let devModeData = { enabled: false };
    
    if (!devModeDoc.exists) {
      console.log('botSettings/devMode document not found, checking devMode collection...');
      // Fallback: Check devMode collection for backward compatibility
      const devModeCollection = await db.collection('devMode').limit(1).get();
      if (!devModeCollection.empty) {
        devModeDoc = devModeCollection.docs[0];
        console.log('Found devMode document with ID:', devModeDoc.id);
      }
    } else {
      console.log('Found botSettings/devMode document');
    }
    
    if (devModeDoc.exists) {
      const data = devModeDoc.data();
      devModeData = {
        enabled: data?.enabled || false,
        ...data
      };
    }
    
    console.log('Dev mode document exists:', devModeDoc.exists);
    console.log('Dev mode document ID:', devModeDoc.exists ? devModeDoc.id : 'none');
    console.log('Dev mode data from Firebase:', devModeData);

    // Try to get bot stats (may be outdated due to quota optimization)
    const botStatsDoc = await db.collection('botStats').doc('global').get();
    const botStats = botStatsDoc.exists ? botStatsDoc.data() : null;
    console.log('Bot stats document exists:', botStatsDoc.exists);
    console.log('Bot stats from Firebase:', botStats);
    
    // Determine bot status based on available data
    let status = 'online'; // Assume online since we're responding
    let maintenanceMode = devModeData.enabled || false;
    let devMode = devModeData.enabled || false;
    
    console.log('Computed maintenanceMode:', maintenanceMode);
    console.log('Computed devMode:', devMode);
    
    // If we have recent bot stats (within last hour), use them
    if (botStats?.lastUpdated) {
      try {
        const lastUpdate = botStats.lastUpdated.toDate();
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (lastUpdate > hourAgo) {
          status = botStats.status || 'online';
          // Override with Firebase stats only if they're recent
          maintenanceMode = botStats.maintenanceMode || devModeData.enabled || false;
        }
      } catch (error) {
        console.error('Error processing lastUpdated timestamp:', error);
      }
    }

    const response = {
      status: status,
      maintenanceMode: maintenanceMode,
      devMode: devMode,
      lastStatusUpdate: botStats?.lastStatusUpdate || botStats?.lastUpdated || new Date(),
      uptime: botStats?.uptime || 0,
      totalGuilds: botStats?.totalActiveGuilds || botStats?.totalGuilds || 80, // Fallback to known count
      totalUsers: botStats?.totalUsers || 4000, // Estimate
      lastHeartbeat: botStats?.lastUpdated || new Date(),
      note: botStats ? 'Data from Firebase' : 'Using fallback data (Firebase quota optimization)',
      debug: {
        devModeDocExists: devModeDoc.exists,
        devModeEnabled: devModeData.enabled,
        computedMaintenanceMode: maintenanceMode,
        computedDevMode: devMode
      }
    };
    
    console.log('Final bot status response:', response);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching bot status:', error);
    
    // Return fallback status instead of error
    res.status(200).json({
      status: 'online',
      maintenanceMode: false,
      devMode: false,
      lastStatusUpdate: new Date(),
      uptime: 0,
      totalGuilds: 80,
      totalUsers: 4000,
      lastHeartbeat: new Date(),
      note: 'Fallback data - Firebase unavailable'
    });
  }
}
