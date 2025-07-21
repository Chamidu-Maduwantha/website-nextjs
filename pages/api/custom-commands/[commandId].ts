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
    const { commandId } = req.query;

    if (!commandId || typeof commandId !== 'string') {
      return res.status(400).json({ error: 'Command ID is required' });
    }

    // Check if user is premium
    const isPremium = await BotFirebaseService.isPremiumUser(userId);
    if (!isPremium) {
      return res.status(403).json({ error: 'Premium subscription required' });
    }

    // Get the command to verify ownership
    const result = await BotFirebaseService.getCustomCommand(commandId);
    if (!result.success || result.data.userId !== userId) {
      return res.status(404).json({ error: 'Command not found or access denied' });
    }

    const command = result.data;

    if (req.method === 'PUT') {
      // Update custom command
      const { commandName, description, playlist } = req.body;

      if (!commandName || !playlist || !Array.isArray(playlist) || playlist.length === 0) {
        return res.status(400).json({ error: 'Command name and playlist are required' });
      }

      // Validate command name format
      if (!/^[a-zA-Z0-9_]+$/.test(commandName)) {
        return res.status(400).json({ error: 'Command name can only contain letters, numbers, and underscores' });
      }

      // Check if command name conflicts with other user commands (excluding current one)
      const userCommandsResult = await BotFirebaseService.getUserCustomCommands(userId);
      if (userCommandsResult.success) {
        const commandExists = userCommandsResult.data.some(cmd => 
          cmd.id !== commandId && cmd.displayName.toLowerCase() === commandName.toLowerCase()
        );

        if (commandExists) {
          return res.status(400).json({ error: 'You already have a command with this name' });
        }
      }

      const updateData = {
        displayName: commandName,
        description: description || '',
        playlist: playlist.filter((song: string) => song.trim() !== ''),
      };

      const updateResult = await BotFirebaseService.updateCustomCommand(commandId, updateData);
      if (updateResult.success) {
        return res.status(200).json({ 
          success: true, 
          message: `Custom command !${commandName} updated successfully!`
        });
      } else {
        return res.status(500).json({ error: updateResult.error });
      }
    }

    if (req.method === 'DELETE') {
      // Delete custom command
      const deleteResult = await BotFirebaseService.deleteCustomCommand(commandId, userId);
      if (deleteResult.success) {
        return res.status(200).json({ 
          success: true, 
          message: `Custom command !${command.displayName} deleted successfully!`
        });
      } else {
        return res.status(500).json({ error: deleteResult.error });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Custom command API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
