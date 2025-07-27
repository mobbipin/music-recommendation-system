import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { RecommendationForm } from './pages/RecommendationForm';
import { RecommendationResults } from './pages/RecommendationResults';
import { AdminDashboard } from './pages/AdminDashboard';
import { HomeRecommendations } from './pages/HomeRecommendations';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomeRecommendations />} />
          <Route path="/form" element={<RecommendationForm />} />
          <Route path="/results" element={<RecommendationResults />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;