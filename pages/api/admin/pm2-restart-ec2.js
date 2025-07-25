import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { action } = req.body;

    // Validate action
    const validActions = ['restart', 'stop', 'start', 'status', 'logs'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    console.log(`ℹ️ Admin ${session.user.name || session.user.id} queuing PM2 command: ${action}`);

    // Queue the command in Firebase
    const commandRef = await db.collection('pm2Commands').add({
      action: action,
      status: 'pending',
      requestedBy: session.user.id,
      requestedByName: session.user.name || `User-${session.user.id}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ PM2 command ${action} queued with ID: ${commandRef.id}`);

    // Wait for the command to be processed (with timeout)
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    let totalWaitTime = 0;

    while (totalWaitTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      totalWaitTime += checkInterval;

      const commandDoc = await commandRef.get();
      const commandData = commandDoc.data();

      if (commandData.status === 'completed') {
        console.log(`✅ PM2 command ${action} completed successfully`);
        return res.json({
          success: true,
          message: commandData.result.message,
          output: commandData.result.output,
          stderr: commandData.result.stderr
        });
      } else if (commandData.status === 'failed') {
        console.error(`❌ PM2 command ${action} failed: ${commandData.error}`);
        return res.status(500).json({
          success: false,
          error: commandData.error,
          stderr: commandData.stderr
        });
      }
    }

    // Timeout reached
    console.warn(`⏰ PM2 command ${action} timed out after ${maxWaitTime}ms`);
    return res.status(408).json({
      success: false,
      error: 'Command execution timed out. The bot server might be unresponsive.'
    });

  } catch (error) {
    console.error('PM2 Firebase handler error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
