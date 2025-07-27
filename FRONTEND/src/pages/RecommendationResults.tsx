import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Play, Filter, ArrowLeft, Music2 } from 'lucide-react';
import { getRecommendations, sendFeedback } from '../api';

interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  year: number;
  bpm: number;
  energy: number;
  danceability: number;
  duration: string;
  score?: number;
  liked?: boolean;
  disliked?: boolean;
}

export const RecommendationResults: React.FC = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [sortBy, setSortBy] = useState<'popularity' | 'bpm' | 'year' | 'energy'>('popularity');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const preferences = localStorage.getItem('musicPreferences');
    if (!preferences) {
      navigate('/form');
      return;
    }
    setLoading(true);
    getRecommendations(JSON.parse(preferences)).then((data) => {
      setSongs(data);
      setLoading(false);
    });
  }, [navigate]);

  const handleFeedback = async (songId: string, type: 'like' | 'dislike') => {
    const preferences = localStorage.getItem('musicPreferences');
    await sendFeedback(songId, type, preferences ? JSON.parse(preferences) : {});
    setSongs(prev => prev.map(song => {
      if (song.id === songId) {
        return {
          ...song,
          liked: type === 'like' ? !song.liked : false,
          disliked: type === 'dislike' ? !song.disliked : false
        };
      }
      return song;
    }));
  };

  const sortedSongs = [...songs].sort((a, b) => {
    switch (sortBy) {
      case 'bpm':
        return b.bpm - a.bpm;
      case 'year':
        return b.year - a.year;
      case 'energy':
        return b.energy - a.energy;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-white mb-2">Finding Your Perfect Songs...</h2>
          <p className="text-white/70">Our AI is analyzing millions of tracks to match your preferences</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/form')}
              className="flex items-center text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Form
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Music2 className="h-8 w-8 mr-3 text-purple-400" />
                Your Recommendations
              </h1>
              <p className="text-white/70 mt-1">Based on your preferences, here are {songs.length} songs we think you'll love</p>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-white/70" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="popularity" className="text-gray-900">Popularity</option>
              <option value="bpm" className="text-gray-900">BPM</option>
              <option value="year" className="text-gray-900">Year</option>
              <option value="energy" className="text-gray-900">Energy</option>
            </select>
          </div>
        </div>

        {/* Songs Grid */}
        <div className="grid gap-6">
          {sortedSongs.map((song) => (
            <div
              key={song.id}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-lg">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{song.title}</h3>
                      <p className="text-white/70">{song.artist}</p>
                      {song.score !== undefined && (
                        <span className="text-xs text-purple-300">Confidence: {(song.score * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <span className="text-white/50 block">Genre</span>
                      <span className="text-white font-medium">{song.genre}</span>
                    </div>
                    <div>
                      <span className="text-white/50 block">Year</span>
                      <span className="text-white font-medium">{song.year}</span>
                    </div>
                    <div>
                      <span className="text-white/50 block">BPM</span>
                      <span className="text-white font-medium">{song.bpm}</span>
                    </div>
                    <div>
                      <span className="text-white/50 block">Energy</span>
                      <span className="text-white font-medium">{song.energy}%</span>
                    </div>
                    <div>
                      <span className="text-white/50 block">Dance</span>
                      <span className="text-white font-medium">{song.danceability}%</span>
                    </div>
                    <div>
                      <span className="text-white/50 block">Duration</span>
                      <span className="text-white font-medium">{song.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Feedback Buttons */}
                <div className="flex space-x-2 ml-6">
                  <button
                    onClick={() => handleFeedback(song.id, 'like')}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      song.liked
                        ? 'bg-green-500 text-white'
                        : 'bg-white/20 text-white/70 hover:bg-green-500/20 hover:text-green-400'
                    }`}
                  >
                    <ThumbsUp className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(song.id, 'dislike')}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      song.disliked
                        ? 'bg-red-500 text-white'
                        : 'bg-white/20 text-white/70 hover:bg-red-500/20 hover:text-red-400'
                    }`}
                  >
                    <ThumbsDown className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Get More Recommendations */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/form')}
            className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Get More Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};