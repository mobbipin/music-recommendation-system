import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, Search } from 'lucide-react';
import { getCsvMeta } from '../api';

interface FormData {
  [key: string]: string | number;
}

export const RecommendationForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({});
  const [csvMeta, setCsvMeta] = useState<{genres: string[], artists: string[], moods: string[]}>({genres: [], artists: [], moods: []});
  const [genreInput, setGenreInput] = useState('');
  const [artistInput, setArtistInput] = useState('');
  const [moodInput, setMoodInput] = useState('');

  useEffect(() => {
    getCsvMeta().then(setCsvMeta);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('musicPreferences', JSON.stringify(formData));
    navigate('/results');
  };

  // Filtered dropdowns
  const filteredGenres = csvMeta.genres.filter(g => g.toLowerCase().includes(genreInput.toLowerCase()));
  const filteredArtists = csvMeta.artists.filter(a => a.toLowerCase().includes(artistInput.toLowerCase()));
  const filteredMoods = csvMeta.moods.filter(m => m.toLowerCase().includes(moodInput.toLowerCase()));

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Sliders className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Tell Us Your Music Preferences
          </h1>
          <p className="text-white/70 text-lg">
            The more details you provide, the better we can tailor recommendations to your taste
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Genre Selection */}
            {csvMeta.genres.length > 0 && (
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  🎵 Preferred Genre
                </label>
                <input
                  type="text"
                  value={genreInput}
                  onChange={e => setGenreInput(e.target.value)}
                  placeholder="Type to search genres..."
                  className="w-full mb-2 bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
                <select
                  value={formData.genre || ''}
                  onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="">Select a genre</option>
                  {filteredGenres.map(genre => (
                    <option key={genre} value={genre} className="text-gray-900">
                      {genre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Artist Selection */}
            {csvMeta.artists.length > 0 && (
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  🎧 Favorite Artist
                </label>
                <input
                  type="text"
                  value={artistInput}
                  onChange={e => setArtistInput(e.target.value)}
                  placeholder="Type to search artists..."
                  className="w-full mb-2 bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
                <select
                  value={formData.artist || ''}
                  onChange={e => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="">Select an artist (optional)</option>
                  {filteredArtists.map(artist => (
                    <option key={artist} value={artist} className="text-gray-900">
                      {artist}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mood Selection */}
            {csvMeta.moods.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-white font-semibold mb-3 text-lg">
                  😄 Current Mood
                </label>
                <input
                  type="text"
                  value={moodInput}
                  onChange={e => setMoodInput(e.target.value)}
                  placeholder="Type to search moods..."
                  className="w-full mb-2 bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
                <select
                  value={formData.mood || ''}
                  onChange={e => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="">Select your mood</option>
                  {filteredMoods.map(mood => (
                    <option key={mood} value={mood} className="text-gray-900">
                      {mood}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <button
              type="submit"
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Search className="mr-2 h-5 w-5" />
              Get My Recommendations
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};