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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = initializeFirebase();
    const { maintenanceMode } = req.body;
    
    // Update bot stats with maintenance mode
    await db.collection('botStats').doc('global').update({
      maintenanceMode: maintenanceMode === true,
      devMode: maintenanceMode === true,
      lastStatusUpdate: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`🔧 Updated maintenance mode to: ${maintenanceMode}`);
    
    res.status(200).json({ 
      success: true, 
      maintenanceMode: maintenanceMode === true,
      message: `Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'}` 
    });
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
