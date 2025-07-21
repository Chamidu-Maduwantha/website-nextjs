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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = initializeFirebase();
    const { serverId, command, args } = req.body;

    console.log('Bot command request:', { serverId, command, args, userId: session.user.id });

    if (!serverId || !command) {
      console.log('Missing required fields:', { serverId: !!serverId, command: !!command });
      return res.status(400).json({ error: 'Server ID and command required' });
    }

    // Verify user has access to this server - check if they're admin or server member
    const isAdmin = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',').includes(session.user.id);
    console.log('User access check:', { isAdmin, userId: session.user.id });
    
    if (!isAdmin) {
      // For non-admin users, check if they have access to this server
      // We'll check the guilds collection to see if user is owner or has access
      const guildDoc = await db.collection('guilds').doc(serverId).get();
      const guildData = guildDoc.data();
      
      console.log('Guild data check:', { exists: guildDoc.exists, botPresent: guildData?.botPresent });
      
      if (!guildData || !guildData.botPresent) {
        return res.status(403).json({ error: 'Bot not present in this server' });
      }
      
      // For now, allow any authenticated user to send commands
      // In production, you'd want to verify server membership via Discord API
    }

    // Create command request in Firebase for the bot to process
    const commandRequest = {
      serverId,
      userId: session.user.id,
      username: session.user.name || 'Unknown',
      command,
      args: args || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      source: 'web'
    };

    // Add command to queue
    const commandRef = await db.collection('commandQueue').add(commandRequest);
    console.log('Command added to queue with ID:', commandRef.id);
    
    // Wait for response (with timeout)
    let attempts = 0;
    const maxAttempts = 10; // 5 seconds total wait time
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      
      const commandDoc = await commandRef.get();
      const commandData = commandDoc.data();
      
      console.log(`Attempt ${attempts + 1}: Command status:`, commandData?.status);
      
      if (commandData?.status === 'completed') {
        console.log('Command completed successfully:', commandData.response);
        return res.status(200).json({
          success: true,
          message: commandData.response || `${command} executed successfully`,
          executedAt: commandData.completedAt?.toDate().toISOString()
        });
      } else if (commandData?.status === 'failed') {
        console.log('Command failed:', commandData.error);
        return res.status(400).json({
          success: false,
          message: commandData.error || 'Command failed to execute'
        });
      }
      
      attempts++;
    }

    // Timeout - command might still be processing
    console.log('Command timed out after 5 seconds');
    return res.status(202).json({
      success: true,
      message: 'Command sent to bot (processing may take a moment)',
      commandId: commandRef.id
    });

  } catch (error) {
    console.error('Error executing bot command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
