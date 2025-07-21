import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
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
    const { commandId } = req.query;

    if (!commandId) {
      return res.status(400).json({ error: 'Command ID required' });
    }

    const commandDoc = await db.collection('commandQueue').doc(commandId as string).get();
    
    if (!commandDoc.exists) {
      return res.status(404).json({ error: 'Command not found' });
    }

    const commandData = commandDoc.data();

    // Check if user owns this command
    if (commandData?.userId !== session.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json({
      status: commandData?.status || 'unknown',
      response: commandData?.response || null,
      error: commandData?.error || null,
      completedAt: commandData?.completedAt?.toDate().toISOString() || null
    });

  } catch (error) {
    console.error('Error checking command status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
