import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import IndexPage from "./pages/IndexPage";
import TicketPage from "./pages/TicketPage";
import RegisterPage from "./pages/Register";

function App() {
    return (
        <Router>
            <Routes>
                <Route
                    path="/" // LoginPage URL
                    element={<LoginPage />}
                />
                <Route path="/personel-ekrani" element={<IndexPage />}
                />
                <Route path="/yeni-tayin-talebi" element={<TicketPage />}
                />
                <Route path="/kayit-ol" element={<RegisterPage />}
                       />

            </Routes>
        </Router>
    );
}

export default App;