import React, { useEffect, useState } from 'react';
import { getRecommendations, getTrendingSongs, getCsvMeta, uploadCsv, downloadDemoCsv, getSimilarSongs, useCsv, getCurrentCsv } from '../api';

export const HomeRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [csvMeta, setCsvMeta] = useState<{genres: string[], artists: string[], moods: string[]}>({genres: [], artists: [], moods: []});
  const [csvUploadStatus, setCsvUploadStatus] = useState<string>('');
  const [similarSongs, setSimilarSongs] = useState<{[songId: string]: any[]}>({});
  const [csvType, setCsvType] = useState<'default' | 'user'>('default');
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const preferences = localStorage.getItem('musicPreferences');
    if (preferences) {
      setRecommendations(await getRecommendations(JSON.parse(preferences)));
    } else {
      setRecommendations([]);
    }
    const trendingData = await getTrendingSongs();
    setTrending(trendingData.trending || []);
    setCsvMeta(await getCsvMeta());
    setLoading(false);
  };

  useEffect(() => {
    getCurrentCsv().then(res => setCsvType(res.type));
    loadAll();
  }, []);

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploadStatus('Uploading...');
    const res = await uploadCsv(file);
    if (res.status === 'success') {
      setCsvUploadStatus('CSV uploaded and processed!');
      await useCsv('user');
      setCsvType('user');
      await loadAll();
      setTimeout(() => setCsvUploadStatus(''), 3000);
    } else {
      setCsvUploadStatus('Upload failed: ' + (res.error || 'Unknown error'));
    }
  };

  const handleShowSimilar = async (songId: string) => {
    if (similarSongs[songId]) return;
    const res = await getSimilarSongs(songId);
    setSimilarSongs(prev => ({ ...prev, [songId]: res.similar || [] }));
  };

  const handleSwitchCsv = async (type: 'default' | 'user') => {
    await useCsv(type);
    setCsvType(type);
    await loadAll();
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to musicRecommenda</h1>
            <p className="text-white/70">Discover music tailored to your taste and see what’s trending!</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <button
              onClick={downloadDemoCsv}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700"
            >
              Download Demo CSV
            </button>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="block text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer cursor-pointer"
            />
            {csvUploadStatus && <span className="text-green-400 text-sm ml-2">{csvUploadStatus}</span>}
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleSwitchCsv('default')}
                className={`px-3 py-2 rounded-lg font-semibold ${csvType === 'default' ? 'bg-purple-700 text-white' : 'bg-white/20 text-white/70 hover:bg-purple-600 hover:text-white'}`}
              >
                Use Demo Data
              </button>
              <button
                onClick={() => handleSwitchCsv('user')}
                className={`px-3 py-2 rounded-lg font-semibold ${csvType === 'user' ? 'bg-purple-700 text-white' : 'bg-white/20 text-white/70 hover:bg-purple-600 hover:text-white'}`}
                disabled={!window.localStorage.getItem('user_uploaded_csv') && csvType !== 'user'}
              >
                Use Uploaded Data
              </button>
              <span className="text-xs text-white/60 ml-2">Current: {csvType === 'default' ? 'Demo' : 'Uploaded'} CSV</span>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-white/70 py-12">Loading...</div>
        ) : (
        <>
        {/* Personalized Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Your Personalized Recommendations</h2>
            <div className="grid gap-6">
              {recommendations.map(song => (
                <div key={song.id} className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{song.title}</h3>
                      <p className="text-white/70">{song.artist} &mdash; {song.genre} ({song.year})</p>
                      <p className="text-xs text-purple-300">Confidence: {(song.score * 100).toFixed(1)}%</p>
                    </div>
                    <button
                      onClick={() => handleShowSimilar(song.id)}
                      className="ml-4 px-3 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
                    >
                      Show Similar Songs
                    </button>
                  </div>
                  {similarSongs[song.id] && similarSongs[song.id].length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-white/80 font-semibold mb-2">Similar Songs:</h4>
                      <ul className="text-white/70 text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
                        {similarSongs[song.id].map(sim => (
                          <li key={sim.id} className="bg-white/10 rounded p-2">
                            {sim.title} <span className="text-xs">({sim.artist})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Songs */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Trending Songs</h2>
          <div className="grid gap-6">
            {trending.map(song => (
              <div key={song.id} className="bg-white/10 rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{song.title}</h3>
                    <p className="text-white/70">{song.artist} &mdash; {song.genre} ({song.year})</p>
                  </div>
                  <span className="text-green-400 font-semibold">{song.likes} Likes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CSV Meta Info (tabular view) */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-2">Available Genres, Artists, Moods</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white/10 rounded-xl text-white text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Genres</th>
                  <th className="px-4 py-2 text-left">Artists</th>
              
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 align-top">
                    <ul className="list-disc ml-4">
                      {csvMeta.genres.map(g => <li key={g}>{g}</li>)}
                    </ul>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <ul className="list-disc ml-4">
                      {csvMeta.artists.map(a => <li key={a}>{a}</li>)}
                    </ul>
                  </td>
                  
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </>) }
      </div>
    </div>
  );
}; 