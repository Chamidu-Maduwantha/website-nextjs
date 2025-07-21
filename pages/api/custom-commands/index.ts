import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { BotFirebaseService } from "../../../utils/firebase";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userId = session.user.id;

    if (req.method === 'GET') {
      // Get user's custom commands
      const result = await BotFirebaseService.getUserCustomCommands(userId);
      if (result.success) {
        return res.status(200).json({ success: true, commands: result.data });
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

    if (req.method === 'POST') {
      // Create new custom command
      const { commandName, description, playlist } = req.body;

      if (!commandName || !playlist || !Array.isArray(playlist) || playlist.length === 0) {
        return res.status(400).json({ error: 'Command name and playlist are required' });
      }

      // Validate command name format
      if (!/^[a-zA-Z0-9_]+$/.test(commandName)) {
        return res.status(400).json({ error: 'Command name can only contain letters, numbers, and underscores' });
      }

      const filteredPlaylist = playlist.filter((song: string) => song.trim() !== '');
      const result = await BotFirebaseService.createCustomCommand(
        userId, 
        commandName, 
        filteredPlaylist, 
        description || ''
      );

      if (result.success) {
        return res.status(201).json({ 
          success: true, 
          message: `Custom command !${commandName} created successfully!`,
          commandId: result.data.id 
        });
      } else {
        return res.status(400).json({ error: result.error });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Custom commands API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
