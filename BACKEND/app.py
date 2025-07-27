from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import os
import time
import json
from services.data_processor import DataProcessor
from services.recommendation_system import RecommendationSystem
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Initialize services
DATA_PATH = os.path.join(os.path.dirname(__file__), 'DATA', 'mainSong.csv')
FEEDBACK_PATH = os.path.join('DATA', 'feedback.json')
data_processor = DataProcessor(DATA_PATH)
recommender = RecommendationSystem(data_processor, feedback_path=FEEDBACK_PATH)

USER_SESSIONS_PATH = os.path.join('DATA', 'user_sessions.json')
CSV_TYPE_PATH = os.path.join(os.path.dirname(__file__), 'DATA', 'csv_type.json')

# Helper to set/get current CSV type
DEFAULT_CSV_PATH = os.path.join(os.path.dirname(__file__), 'DATA', 'mainSong.csv')
USER_CSV_PATH = os.path.join(os.path.dirname(__file__), 'DATA', 'user_uploaded.csv')

def set_csv_type(csv_type):
    with open(CSV_TYPE_PATH, 'w') as f:
        json.dump({'type': csv_type}, f)
def get_csv_type():
    if os.path.exists(CSV_TYPE_PATH):
        with open(CSV_TYPE_PATH, 'r') as f:
            return json.load(f).get('type', 'default')
    return 'default'

def reload_data_processor():
    global data_processor, recommender
    csv_type = get_csv_type()
    path = USER_CSV_PATH if csv_type == 'user' and os.path.exists(USER_CSV_PATH) else DEFAULT_CSV_PATH
    data_processor = DataProcessor(path)
    recommender = RecommendationSystem(data_processor, feedback_path=FEEDBACK_PATH)

# Save user session (called after recommendation or feedback)
def save_user_session(preferences, recommended_songs=None, feedback=None):
    import time
    session = {
        'timestamp': int(time.time()),
        'preferences': preferences,
        'recommended_songs': recommended_songs or [],
        'feedback': feedback or []
    }
    try:
        if os.path.exists(USER_SESSIONS_PATH):
            with open(USER_SESSIONS_PATH, 'r') as f:
                sessions = json.load(f)
        else:
            sessions = []
        sessions.append(session)
        with open(USER_SESSIONS_PATH, 'w') as f:
            json.dump(sessions, f, indent=2)
    except Exception as e:
        print('Error saving user session:', e)

def save_feedback(feedback_entry):
    try:
        if os.path.exists(FEEDBACK_PATH):
            with open(FEEDBACK_PATH, 'r') as f:
                feedback_data = json.load(f)
        else:
            feedback_data = []
        feedback_data.append(feedback_entry)
        with open(FEEDBACK_PATH, 'w') as f:
            json.dump(feedback_data, f, indent=2)
    except Exception as e:
        print('Error saving feedback:', e)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'DATA')
ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload-csv', methods=['POST'])
def upload_csv():
    global data_processor, recommender
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = USER_CSV_PATH
        file.save(file_path)
        
        # Set CSV type to user
        set_csv_type('user')
        
        # Reload DataProcessor with new CSV
        try:
            reload_data_processor()
            return jsonify({'status': 'success'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/download-demo-csv', methods=['GET'])
def download_demo_csv():
    demo_path = os.path.join(UPLOAD_FOLDER, 'mainSong.csv')
    return send_file(demo_path, as_attachment=True)

@app.route('/api/songs', methods=['GET'])
def get_songs():
    df = data_processor.get_raw_df()
    return jsonify([recommender.song_to_dict(row, idx) for idx, row in df.iterrows()])

@app.route('/api/recommend', methods=['POST'])
def recommend():
    user = request.json
    results = recommender.recommend(user, top_n=10)
    save_user_session(user, [r['id'] for r in results])
    return jsonify(results)

@app.route('/api/feedback', methods=['POST'])
def feedback():
    data = request.json
    feedback_entry = {
        'song_id': data.get('song_id'),
        'feedback': data.get('feedback'),  # 'like' or 'dislike'
        'timestamp': int(time.time()),
        'user_preferences': data.get('user_preferences', {})
    }
    save_feedback(feedback_entry)
    save_user_session(data.get('user_preferences', {}), feedback=[feedback_entry])
    return jsonify({'status': 'success'})

@app.route('/api/retrain', methods=['POST'])
def retrain():
    recommender.retrain()
    return jsonify({'status': 'retraining complete'})

@app.route('/api/admin/feedback-stats', methods=['GET'])
def feedback_stats():
    if os.path.exists(FEEDBACK_PATH):
        with open(FEEDBACK_PATH, 'r') as f:
            feedback_data = json.load(f)
        like_count = sum(1 for entry in feedback_data if entry['feedback'] == 'like')
        dislike_count = sum(1 for entry in feedback_data if entry['feedback'] == 'dislike')
        return jsonify({'likes': like_count, 'dislikes': dislike_count, 'total': len(feedback_data)})
    else:
        return jsonify({'likes': 0, 'dislikes': 0, 'total': 0})

@app.route('/api/admin/song-popularity', methods=['GET'])
def song_popularity():
    if os.path.exists(FEEDBACK_PATH):
        with open(FEEDBACK_PATH, 'r') as f:
            feedback_data = json.load(f)
        song_likes = {}
        for entry in feedback_data:
            if entry['feedback'] == 'like':
                sid = entry['song_id']
                song_likes[sid] = song_likes.get(sid, 0) + 1
        # Return top 10 most liked songs
        top_songs = sorted(song_likes.items(), key=lambda x: x[1], reverse=True)[:10]
        return jsonify({'top_songs': top_songs})
    else:
        return jsonify({'top_songs': []})

@app.route('/api/admin/user-sessions', methods=['GET'])
def user_sessions():
    if os.path.exists(USER_SESSIONS_PATH):
        with open(USER_SESSIONS_PATH, 'r') as f:
            sessions = json.load(f)
        # Return last 20 sessions
        return jsonify({'sessions': sessions[-20:]})
    else:
        return jsonify({'sessions': []})

@app.route('/api/trending-songs', methods=['GET'])
def trending_songs():
    if os.path.exists(FEEDBACK_PATH):
        with open(FEEDBACK_PATH, 'r') as f:
            feedback_data = json.load(f)
        song_likes = {}
        for entry in feedback_data:
            if entry['feedback'] == 'like':
                sid = entry['song_id']
                song_likes[sid] = song_likes.get(sid, 0) + 1
        top_songs = sorted(song_likes.items(), key=lambda x: x[1], reverse=True)[:10]
        df = data_processor.get_raw_df()
        details = []
        for sid, count in top_songs:
            try:
                row = df.iloc[int(sid)]
                details.append({
                    'id': str(row.name),
                    'title': row['title'],
                    'artist': row['artist'],
                    'genre': row['genre'],
                    'year': int(row['year']),
                    'bpm': int(row['bpm']),
                    'energy': int(row['energy']),
                    'danceability': int(row['danceability']),
                    'duration': str(int(row['duration']//60)) + ':' + str(int(row['duration']%60)).zfill(2),
                    'likes': count
                })
            except Exception:
                continue
        return jsonify({'trending': details})
    else:
        return jsonify({'trending': []})

@app.route('/api/similar-songs/<song_id>', methods=['GET'])
def similar_songs(song_id):
    try:
        df = data_processor.get_raw_df()
        idx = int(song_id)
        if idx < 0 or idx >= len(df):
            return jsonify({'similar': []})
        row = df.iloc[idx]
        # Use feature columns for similarity
        features = data_processor.feature_cols
        song_vec = df.loc[idx, features].values.reshape(1, -1)
        df_features = df[features].values
        sim = cosine_similarity(song_vec, df_features)[0]
        # Exclude the song itself
        sim[idx] = -1
        top_idx = np.argsort(sim)[::-1][:10]
        results = []
        for i in top_idx:
            r = df.iloc[i]
            results.append({
                'id': str(r.name),
                'title': r['title'],
                'artist': r['artist'],
                'genre': r['genre'],
                'year': int(r['year']),
                'bpm': int(r['bpm']),
                'energy': int(r['energy']),
                'danceability': int(r['danceability']),
                'duration': str(int(r['duration']//60)) + ':' + str(int(r['duration']%60)).zfill(2),
                'score': float(f'{sim[i]:.3f}')
            })
        return jsonify({'similar': results})
    except Exception as e:
        return jsonify({'similar': [], 'error': str(e)})

@app.route('/api/csv-meta', methods=['GET'])
def csv_meta():
    df = data_processor.get_raw_df()
    genres = sorted(df['genre'].dropna().unique().tolist()) if 'genre' in df else []
    artists = sorted(df['artist'].dropna().unique().tolist()) if 'artist' in df else []
    moods = sorted(df['mood'].dropna().unique().tolist()) if 'mood' in df else []
    return jsonify({'genres': genres, 'artists': artists, 'moods': moods})

@app.route('/api/use-csv', methods=['POST'])
def use_csv():
    data = request.json
    csv_type = data.get('type', 'default')
    if csv_type not in ['default', 'user']:
        return jsonify({'error': 'Invalid type'}), 400
    set_csv_type(csv_type)
    reload_data_processor()
    return jsonify({'status': 'success', 'type': csv_type})

@app.route('/api/current-csv', methods=['GET'])
def current_csv():
    return jsonify({'type': get_csv_type()})

# On startup, ensure correct CSV is loaded
reload_data_processor()

if __name__ == '__main__':
    app.run(debug=True) 