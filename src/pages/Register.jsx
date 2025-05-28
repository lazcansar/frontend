import React, { useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
    const [personnelNumber, setPersonnelNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState(''); // Yeni: Rol seçimi için state
    const [errors, setErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setErrors([]);
        setSuccessMessage('');


        if (password !== confirmPassword) {
            setErrors(['Şifreler eşleşmiyor.']);
            setIsLoading(false);
            return;
        }


        if (!selectedRole) {
            setErrors(['Lütfen bir rol seçin.']);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5293/api/Auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    PersonnelNumber: personnelNumber,
                    Email: email,
                    Password: password,
                    ConfirmPassword: confirmPassword,
                    Role: selectedRole
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.Errors && Array.isArray(data.Errors)) {
                    setErrors(data.Errors);
                } else if (data.Message) {
                    setErrors([data.Message]);
                } else {
                    setErrors(['Kayıt işlemi sırasında bir hata oluştu.']);
                }
                setIsLoading(false);
                return;
            }

            setSuccessMessage(data.Message || 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
            setIsLoading(false);

            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error) {
            console.error('Register error:', error);
            setErrors(['Ağ hatası veya sunucuyla iletişim kurulamadı.']);
            setIsLoading(false);
        }
    };

    return (
        <MainLayout pageTitle="Kayıt Ol" pageDescription="Personel tayin talebi uygulamasına kayıt ol.">
            <section className="w-full bg-sky-800 py-4 px-4 lg:px-0">
                <div className="container mx-auto">
                    <h1 className="text-white text-2xl text-center">Personel Tayin Talep Uygulaması</h1>
                </div>
            </section>
            <section className="py-8">
                <div className="container mx-auto flex items-center justify-center">
                    <div className="md:w-lg sm:min-w-xl w-full max-w-md flex flex-col items-center justify-center border border-gray-100 shadow-lg rounded p-4 sm:p-6 md:p-8">
                        <i className="bi bi-person-plus-fill text-4xl text-sky-600 mb-4"></i>
                        <h1 className="text-xl mb-4 font-medium text-gray-800">Kayıt Ol</h1>

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
                                    <label htmlFor="email">E-Posta</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-800"
                                        name="email"
                                        placeholder="E-Posta Adresiniz"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="confirmPassword">Şifre Tekrar</label>
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        name="confirmPassword"
                                        id="confirmPassword"
                                        placeholder="******"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                {/* Yeni: Rol Seçimi Alanı */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="roleSelect">Rol Seçimi</label>
                                    <select
                                        id="roleSelect"
                                        name="role"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        required // Rol seçimi zorunlu
                                        disabled={isLoading}
                                        className="w-full px-3 py-2 border border-gray-300 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-800"
                                    >
                                        <option value="" disabled>Lütfen bir rol seçin</option>
                                        <option value="Personel">Personel</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                        </svg>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-sky-600 text-white rounded transition hover:bg-sky-500 cursor-pointer disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Kaydediliyor...' : 'Kayıt Ol'}
                                </button>
                            </div>
                        </form>
                        <p className="mt-4 text-sm text-gray-600">
                            Zaten hesabınız var mı?{' '}
                            <Link to="/giris" className="text-sky-600 hover:underline">Giriş Yap</Link>
                        </p>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}

export default RegisterPage;