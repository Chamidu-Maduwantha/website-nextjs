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
  try {
    const db = initializeFirebase();
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    if (req.method === 'GET') {
      // Get user favorites
      const favoritesRef = db.collection('userFavorites').doc(userId as string);
      const favoritesDoc = await favoritesRef.get();
      
      let favorites = [];
      if (favoritesDoc.exists) {
        const data = favoritesDoc.data();
        favorites = data?.songs || [];
      }

      res.status(200).json({ favorites });

    } else if (req.method === 'POST') {
      // Add to favorites
      const { title, artist, thumbnail, url } = req.body;
      
      const newFavorite = {
        id: `fav_${Date.now()}`,
        title,
        artist,
        thumbnail,
        url,
        addedAt: new Date().toISOString()
      };

      const favoritesRef = db.collection('userFavorites').doc(userId as string);
      await favoritesRef.set({
        songs: admin.firestore.FieldValue.arrayUnion(newFavorite)
      }, { merge: true });

      res.status(200).json({ success: true, favorite: newFavorite });

    } else if (req.method === 'DELETE') {
      // Remove from favorites
      const { songId } = req.body;
      
      const favoritesRef = db.collection('userFavorites').doc(userId as string);
      const favoritesDoc = await favoritesRef.get();
      
      if (favoritesDoc.exists) {
        const data = favoritesDoc.data();
        const currentFavorites = data?.songs || [];
        const updatedFavorites = currentFavorites.filter((song: any) => song.id !== songId);
        
        await favoritesRef.update({
          songs: updatedFavorites
        });
      }

      res.status(200).json({ success: true });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling user favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
