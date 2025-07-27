import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Music, TrendingUp, RefreshCw } from 'lucide-react';
import { retrainModel, getFeedbackStats, getSongPopularity } from '../api';

async function getUserSessions() {
  const res = await fetch('http://localhost:5000/api/admin/user-sessions');
  return res.json();
}

export const AdminDashboard: React.FC = () => {
  const [isRetraining, setIsRetraining] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState<{likes: number, dislikes: number, total: number}>({likes: 0, dislikes: 0, total: 0});
  const [songPopularity, setSongPopularity] = useState<{top_songs: [string, number][]}>({top_songs: []});
  const [userSessions, setUserSessions] = useState<any[]>([]);

  useEffect(() => {
    getFeedbackStats().then(setFeedbackStats);
    getSongPopularity().then(setSongPopularity);
    getUserSessions().then(data => setUserSessions(data.sessions || []));
  }, [isRetraining]);

  const handleRetrain = async () => {
    setIsRetraining(true);
    await retrainModel();
    setIsRetraining(false);
    alert('Model retrained successfully!');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white flex items-center mb-4">
            <BarChart3 className="h-10 w-10 mr-4 text-purple-400" />
            Admin Dashboard
          </h1>
          <p className="text-white/70 text-lg">
            Monitor system performance, analyze user interactions, and retrain the model
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total Feedback</p>
                <p className="text-2xl font-bold text-white">{feedbackStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-green-400 text-sm mt-2">Likes: {feedbackStats.likes} | Dislikes: {feedbackStats.dislikes}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Top Songs</p>
                <p className="text-2xl font-bold text-white">{songPopularity.top_songs.length}</p>
              </div>
              <Music className="h-8 w-8 text-purple-400" />
            </div>
            <ul className="text-white/70 text-sm mt-2">
              {songPopularity.top_songs.map(([id, count]) => (
                <li key={id}>Song ID: {id} — Likes: {count}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Positive Feedback</p>
                <p className="text-2xl font-bold text-white">
                  {feedbackStats.total > 0 ? ((feedbackStats.likes / feedbackStats.total) * 100).toFixed(1) : '0'}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-green-400 text-sm mt-2">Based on user likes</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* User Sessions */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-6">Recent User Sessions</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {userSessions.length === 0 && <p className="text-white/60">No recent sessions.</p>}
              {userSessions.map((session, idx) => (
                <div key={idx} className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-medium text-sm">
                        Session at {new Date(session.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-white/50 font-medium">Preferences:</span>
                      <span className="text-white break-words">
                        {JSON.stringify(session.preferences).length > 100 
                          ? JSON.stringify(session.preferences).substring(0, 100) + '...'
                          : JSON.stringify(session.preferences)
                        }
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white/50 font-medium">Recommended Songs:</span>
                      <span className="text-white break-words">
                        {session.recommended_songs?.length > 0 
                          ? session.recommended_songs.slice(0, 5).join(', ') + (session.recommended_songs.length > 5 ? '...' : '')
                          : 'None'
                        }
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white/50 font-medium">Feedback:</span>
                      <span className="text-white break-words">
                        {session.feedback?.length > 0 
                          ? session.feedback.slice(0, 3).map((f: any) => `${f.song_id}:${f.feedback}`).join(', ') + (session.feedback.length > 3 ? '...' : '')
                          : 'None'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Retraining */}
          
        </div>
      </div>
    </div>
  );
};