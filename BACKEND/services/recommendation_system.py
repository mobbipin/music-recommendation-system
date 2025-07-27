import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os
import json

class RecommendationSystem:
    def __init__(self, data_processor, feedback_path=None):
        self.data_processor = data_processor
        self.feedback_path = feedback_path
        self.pseudo_user_profiles = None
        self._load_feedback_and_build_profiles()

    def _load_feedback_and_build_profiles(self):
        # Load feedback and build pseudo-user profiles for collaborative filtering
        if self.feedback_path and os.path.exists(self.feedback_path):
            with open(self.feedback_path, 'r') as f:
                feedback_data = json.load(f)
            # Group feedback by user_preferences (simulate pseudo-users)
            profiles = {}
            for entry in feedback_data:
                prefs = tuple(sorted(entry.get('user_preferences', {}).items()))
                if prefs not in profiles:
                    profiles[prefs] = {'likes': [], 'dislikes': []}
                if entry['feedback'] == 'like':
                    profiles[prefs]['likes'].append(entry['song_id'])
                elif entry['feedback'] == 'dislike':
                    profiles[prefs]['dislikes'].append(entry['song_id'])
            self.pseudo_user_profiles = profiles
        else:
            self.pseudo_user_profiles = {}

    def recommend(self, user_input, top_n=10):
        # Content-based
        user_vec = self.data_processor.transform_user_input(user_input)
        df_scaled = self.data_processor.get_scaled_df()
        df = self.data_processor.get_raw_df()
        sim = cosine_similarity(user_vec, df_scaled)[0]
        content_scores = sim / sim.max() if sim.max() > 0 else sim

        # Collaborative filtering (synthetic)
        collab_scores = np.zeros(len(df))
        if self.pseudo_user_profiles:
            # Find closest pseudo-user profile
            input_prefs = tuple(sorted(user_input.items()))
            best_profile = None
            best_match = 0
            for prefs, feedback in self.pseudo_user_profiles.items():
                match = len(set(dict(prefs).keys()) & set(user_input.keys()))
                if match > best_match:
                    best_match = match
                    best_profile = feedback
            if best_profile and best_profile['likes']:
                liked_indices = [int(sid) for sid in best_profile['likes'] if str(sid).isdigit() and int(sid) < len(df)]
                collab_scores[liked_indices] = 1.0
        # Blend scores
        blend = 0.7 * content_scores + 0.3 * collab_scores
        top_idx = np.argsort(blend)[::-1][:top_n]
        results = [self.song_to_dict(df.iloc[i], i, blend[i]) for i in top_idx]
        return results

    def song_to_dict(self, row, idx, score=None):
        # Handle missing columns gracefully
        title = row.get('title', row.get('song_title', f"Song {idx}"))
        artist = row.get('artist', 'Unknown Artist')
        genre = row.get('genre', 'Unknown Genre')
        year = int(row.get('year', 2020))
        bpm = int(row.get('bpm', 120))
        energy = int(row.get('energy', 50))
        danceability = int(row.get('danceability', 50))
        duration = row.get('duration', 180)
        
        # Convert duration to MM:SS format
        if isinstance(duration, (int, float)):
            duration_str = f"{int(duration//60)}:{int(duration%60):02d}"
        else:
            duration_str = str(duration)
        
        d = {
            'id': str(row.name if hasattr(row, 'name') else idx),
            'title': title,
            'artist': artist,
            'genre': genre,
            'year': year,
            'bpm': bpm,
            'energy': energy,
            'danceability': danceability,
            'duration': duration_str
        }
        if score is not None:
            d['score'] = float(f'{score:.3f}')
        return d

    def retrain(self):
        self._load_feedback_and_build_profiles() 