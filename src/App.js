import React from 'react';
import MainLayout from './components/Layout/MainLayout'; // Page General Layout Design
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        <MainLayout pageTitle="Ana Sayfa">
                        </MainLayout>
                    }
                />
                <Route
                    path="/giris" // LoginPage için URL yolu
                    element={<LoginPage />}
                />
                {/* Diğer sayfalarınız için Route'lar */}
            </Routes>
        </Router>
    );
}

export default App;