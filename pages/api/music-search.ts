import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    // If YouTube API key is not configured, fall back to mock data
    if (!process.env.YOUTUBE_API_KEY) {
      console.log('YouTube API key not configured, returning mock data');
      const mockResults = [
        {
          title: `${query} - Song 1`,
          artist: "Artist Name",
          duration: "3:45",
          thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          platform: "YouTube"
        },
        {
          title: `${query} - Song 2`,
          artist: "Another Artist",
          duration: "4:12",
          thumbnail: "https://i.ytimg.com/vi/L_jWHffIx5E/maxresdefault.jpg",
          url: "https://www.youtube.com/watch?v=L_jWHffIx5E",
          platform: "YouTube"
        },
        {
          title: `${query} - Song 3`,
          artist: "Third Artist",
          duration: "2:58",
          thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg",
          url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
          platform: "YouTube"
        }
      ];

      return res.status(200).json({ results: mockResults });
    }

    // Search YouTube
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults: 10,
      videoCategoryId: '10' // Music category
    });

    if (!searchResponse.data.items) {
      return res.status(200).json({ results: [] });
    }

    // Get video details for duration
    const videoIds = searchResponse.data.items.map(item => item.id?.videoId).filter(Boolean);
    const videoDetailsResponse = await youtube.videos.list({
      part: ['contentDetails', 'statistics'],
      id: videoIds
    });

    const results = searchResponse.data.items.map((item, index) => {
      const videoDetails = videoDetailsResponse.data.items?.[index];
      const duration = videoDetails?.contentDetails?.duration || 'PT0S';
      
      // Convert ISO 8601 duration to MM:SS format
      const formatDuration = (isoDuration: string) => {
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return '0:00';
        
        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        const seconds = parseInt(match[3] || '0');
        
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };

      return {
        title: item.snippet?.title || 'Unknown Title',
        artist: item.snippet?.channelTitle || 'Unknown Artist',
        duration: formatDuration(duration),
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
        url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
        platform: 'YouTube'
      };
    }).filter(result => result.title !== 'Unknown Title');

    res.status(200).json({ results });
  } catch (error) {
    console.error('Error searching music:', error);
    
    // Fall back to mock data on error
    const mockResults = [
      {
        title: `Search results for "${req.body.query || 'music'}"`,
        artist: "YouTube Search",
        duration: "3:45",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(req.body.query || 'music')}`,
        platform: "YouTube"
      }
    ];
    
    res.status(200).json({ results: mockResults });
  }
}
