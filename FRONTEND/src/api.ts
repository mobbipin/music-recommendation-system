const API_BASE = 'http://localhost:5000/api';

export async function getRecommendations(preferences) {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  return res.json();
}

export async function sendFeedback(songId, feedback, userPreferences = {}) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ song_id: songId, feedback, user_preferences: userPreferences }),
  });
  return res.json();
}

export async function retrainModel() {
  const res = await fetch(`${API_BASE}/retrain`, { method: 'POST' });
  return res.json();
}

export async function getFeedbackStats() {
  const res = await fetch(`${API_BASE}/admin/feedback-stats`);
  return res.json();
}

export async function getSongPopularity() {
  const res = await fetch(`${API_BASE}/admin/song-popularity`);
  return res.json();
}

export async function getCsvMeta() {
  const res = await fetch(`${API_BASE}/csv-meta`);
  return res.json();
}

export async function uploadCsv(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload-csv`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

export function downloadDemoCsv() {
  window.open(`${API_BASE}/download-demo-csv`, '_blank');
}

export async function getTrendingSongs() {
  const res = await fetch(`${API_BASE}/trending-songs`);
  return res.json();
}

export async function getSimilarSongs(songId) {
  const res = await fetch(`${API_BASE}/similar-songs/${songId}`);
  return res.json();
}

export async function useCsv(type: 'default' | 'user') {
  const res = await fetch('http://localhost:5000/api/use-csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  return res.json();
}

export async function getCurrentCsv() {
  const res = await fetch('http://localhost:5000/api/current-csv');
  return res.json();
} 