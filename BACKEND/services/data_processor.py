import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import os

class DataProcessor:
    def __init__(self, data_path):
        self.data_path = data_path
        self.col_map = {
            'the genre of the track': 'genre',
            'Beats.Per.Minute -The tempo of the song': 'bpm',
            'Energy- The energy of a song - the higher the value, the more energtic': 'energy',
            'Danceability - The higher the value, the easier it is to dance to this song': 'danceability',
            'Loudness/dB - The higher the value, the louder the song': 'loudness',
            'Liveness - The higher the value, the more likely the song is a live recording': 'liveness',
            'Valence - The higher the value, the more positive mood for the song': 'valence',
            'Length - The duration of the song': 'duration',
            'Acousticness - The higher the value the more acoustic the song is': 'acousticness',
            'Speechiness - The higher the value the more spoken word the song contains': 'speechiness',
            'Popularity- The higher the value the more popular the song is': 'popularity',
            # Add mapping for tableConvert.com_in82t7.csv format
            'song_title': 'title',
            'BPM': 'bpm',
        }
        self.feature_cols = ['bpm', 'energy', 'danceability', 'loudness', 'liveness', 'valence', 'duration', 'acousticness', 'speechiness', 'popularity', 'year']
        self.df = None
        self.scaler = None
        self.df_scaled = None
        self.load_and_preprocess()

    def load_and_preprocess(self):
        raw_df = pd.read_csv(self.data_path)
        df = raw_df.rename(columns=self.col_map)
        
        # Handle missing columns by adding default values
        for col in self.feature_cols:
            if col not in df.columns:
                if col == 'energy':
                    df[col] = 50  # Default energy value
                elif col == 'danceability':
                    df[col] = 50  # Default danceability value
                elif col == 'loudness':
                    df[col] = -10  # Default loudness value
                elif col == 'liveness':
                    df[col] = 10  # Default liveness value
                elif col == 'valence':
                    df[col] = 50  # Default valence value
                elif col == 'acousticness':
                    df[col] = 20  # Default acousticness value
                elif col == 'speechiness':
                    df[col] = 5   # Default speechiness value
                elif col == 'popularity':
                    df[col] = 50  # Default popularity value
                else:
                    df[col] = 0   # Default for other columns
        
        # Convert numeric columns and handle NaN values
        for col in self.feature_cols:
            if col in df.columns:
                # Convert to numeric, coercing errors to NaN
                df[col] = pd.to_numeric(df[col], errors='coerce')
                # Fill NaN values with mean or default
                if df[col].isna().any():
                    if col in ['bpm', 'duration', 'year']:
                        df[col] = df[col].fillna(df[col].mean())
                    else:
                        # For other features, use reasonable defaults
                        defaults = {
                            'energy': 50, 'danceability': 50, 'loudness': -10,
                            'liveness': 10, 'valence': 50, 'acousticness': 20,
                            'speechiness': 5, 'popularity': 50
                        }
                        df[col] = df[col].fillna(defaults.get(col, 0))
        
        # Ensure title column exists
        if 'title' not in df.columns and 'song_title' in raw_df.columns:
            df['title'] = raw_df['song_title']
        elif 'title' not in df.columns:
            df['title'] = [f"Song {i+1}" for i in range(len(df))]
        
        # Ensure artist column exists
        if 'artist' not in df.columns:
            df['artist'] = "Unknown Artist"
        
        # Ensure genre column exists
        if 'genre' not in df.columns:
            df['genre'] = "Unknown Genre"
        
        df['genre'] = df['genre'].astype(str)
        df['artist'] = df['artist'].astype(str)
        
        self.df = df
        
        # Create scaler and scale the features
        self.scaler = StandardScaler()
        feature_data = df[self.feature_cols].values
        self.df_scaled = self.scaler.fit_transform(feature_data)

    def get_raw_df(self):
        return self.df

    def get_scaled_df(self):
        return self.df_scaled

    def transform_user_input(self, user):
        # Get default values from the dataset
        default_values = {
            'loudness': self.df['loudness'].mean(),
            'liveness': self.df['liveness'].mean(),
            'valence': self.df['valence'].mean(),
            'acousticness': self.df['acousticness'].mean(),
            'speechiness': self.df['speechiness'].mean(),
            'popularity': self.df['popularity'].mean()
        }
        
        user_vec = [
            np.clip(user.get('bpmMin', 60), 60, 200),
            user.get('energy', 50),
            user.get('danceability', 50),
            default_values['loudness'],
            default_values['liveness'],
            default_values['valence'],
            self.df['duration'].mean(),
            default_values['acousticness'],
            default_values['speechiness'],
            default_values['popularity'],
            np.clip(user.get('yearMin', 1990), 1950, 2024)
        ]
        return self.scaler.transform([user_vec]) 