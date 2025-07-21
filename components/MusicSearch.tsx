import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlayIcon, PlusIcon } from '@heroicons/react/24/outline';

interface MusicSearchProps {
  serverId: string;
}

interface SearchResult {
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  url: string;
  platform: string;
}

export default function MusicSearch({ serverId }: MusicSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentMusicSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const searchMusic = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/music-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        
        // Add to recent searches
        const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentMusicSearches', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error searching music:', error);
    } finally {
      setLoading(false);
    }
  };

  const playMusic = async (url: string) => {
    try {
      const response = await fetch('/api/bot-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serverId, 
          command: 'play',
          args: url
        })
      });

      if (response.ok) {
        // Show success message or feedback
        console.log('Song added to queue!');
      }
    } catch (error) {
      console.error('Error playing music:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMusic(query);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
      <h3 className="text-white font-medium mb-4 flex items-center">
        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
        Music Search
      </h3>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for songs, artists, or playlists..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳' : 'Search'}
          </button>
        </div>
      </form>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="mb-4">
          <p className="text-white/60 text-sm mb-2">Recent searches:</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(search);
                  searchMusic(search);
                }}
                className="px-3 py-1 bg-white/5 text-white/80 rounded-full text-sm hover:bg-white/10 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
              <div className="w-12 h-12 bg-white/20 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <img 
                src={result.thumbnail} 
                alt={result.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{result.title}</h4>
                <p className="text-white/60 text-sm truncate">{result.artist}</p>
                <p className="text-white/40 text-xs">{result.duration} • {result.platform}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => playMusic(result.url)}
                  className="p-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30"
                  title="Play now"
                >
                  <PlayIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => playMusic(result.url)}
                  className="p-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30"
                  title="Add to queue"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : query && !loading ? (
        <div className="text-center py-8">
          <p className="text-white/60">No results found for "{query}"</p>
          <p className="text-white/40 text-sm mt-2">Try different keywords or check spelling</p>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-white/60 text-sm mb-2">Popular genres:</p>
        <div className="flex flex-wrap gap-2">
          {['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical'].map((genre) => (
            <button
              key={genre}
              onClick={() => {
                setQuery(genre);
                searchMusic(genre);
              }}
              className="px-3 py-1 bg-white/5 text-white/80 rounded-full text-sm hover:bg-white/10 transition-colors"
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
