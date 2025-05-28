import React, { useState } from 'react';
import MainLayout from '../components/Layout/MainLayout'; // MainLayout'u import ediyoruz
import { useNavigate } from 'react-router-dom';


function LoginPage() {
    const [personnelNumber, setPersonnelNumber] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setErrors([]);
        setSuccessMessage('');

        try {
            const response = await fetch('http://localhost:5293/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    PersonnelNumber: personnelNumber,
                    Password: password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setErrors(Object.values(data.errors).flat());
                } else if (data.message) {
                    setErrors([data.message]);
                } else {
                    setErrors(['Giriş işlemi sırasında bir hata oluştu.']);
                }
                setIsLoading(false);
                return;
            }

            setSuccessMessage(data.message || 'Giriş başarılı! Yönlendiriliyorsunuz...');
            setIsLoading(false);
        } catch (error) {
            console.error('Login error:', error);
            setErrors(['Ağ hatası veya sunucuyla iletişim kurulamadı.']);
            setIsLoading(false);
        }
    };

    return (
        <MainLayout pageTitle="Giriş Paneli" pageDescription="Personel tayin talebi uygulaması giriş ekranı.">
            <section className="w-full bg-sky-800 py-4 px-4 lg:px-0">
                <div className="container mx-auto">
                    <h1 className="text-white text-2xl text-center">Personel Tayin Talep Ekranı</h1>
                </div>
            </section>
            <section className="py-8">
                <div className="container mx-auto flex items-center justify-center">
                    <div className="md:w-lg sm:min-w-xl w-full max-w-md flex flex-col items-center justify-center border border-gray-100 shadow-lg rounded p-4 sm:p-6 md:p-8">
                        <i className="bi bi-person-bounding-box text-4xl text-sky-600 mb-4"></i>
                        <h1 className="text-xl mb-4 font-medium text-gray-800">Giriş Paneli</h1>

                        {successMessage && (
                            <div className="w-full bg-green-500 p-4 my-4 text-white rounded">
                                <p><i className="bi bi-info-circle"></i> {successMessage}</p>
                            </div>
                        )}

                        {errors.length > 0 && (
                            <div className="w-full bg-amber-600 p-4 my-4 text-white rounded">
                                <ul className="flex flex-col gap-2">
                                    {errors.map((error, index) => (
                                        <li key={index}><i className="bi bi-exclamation-triangle"></i> {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="w-full">
                            <div className="flex flex-col gap-4 w-full">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="personNumber">Sicil Numarası</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-800"
                                        name="personnelNumber"
                                        placeholder="Sicil Numaranız"
                                        id="personNumber"
                                        value={personnelNumber}
                                        onChange={(e) => setPersonnelNumber(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="password">Şifre</label>
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        name="password"
                                        id="password"
                                        placeholder="******"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-sky-600 text-white rounded transition hover:bg-sky-500 cursor-pointer disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}

export default LoginPage;