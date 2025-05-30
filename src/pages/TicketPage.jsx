import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { Link, useNavigate } from 'react-router-dom';


const fetchCurrentUserProfile = async (token) => {
    const response = await fetch('http://localhost:5293/api/users/me', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
    });
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        const errorData = await response.json().catch(() => ({ message: 'Profil bilgileri alınırken bir hata oluştu.' }));
        throw new Error(errorData.message || 'Profil bilgileri alınamadı.');
    }
    return await response.json();
};


const fetchCities = async () => {
    try {
        const response = await fetch('http://localhost:5293/api/City/city');
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Şehirler çekilirken API hatası.'}));
            throw new Error(errorData.message || 'Şehirler çekilirken bir hata oluştu.');
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
            return result.data;
        } else {
            throw new Error(result.message || 'Şehir verileri beklenen formatta değil veya boş.');
        }
    } catch (error) {
        console.error("Şehirleri çekerken bir hata oluştu:", error);
        throw error;
    }
};

const fetchUserTickets = async (userId, token) => {

    const response = await fetch(`http://localhost:5293/api/tickets/user/${userId}`, { // API adresinizi kontrol edin
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    });
    if (!response.ok) {
        let errorData = { message: 'Geçmiş talepler alınamadı.' };
        try {
            errorData = await response.json();
        } catch (e) {
            console.error("Geçmiş talepler API yanıtı JSON formatında değil veya parse edilemedi.", e);
        }
        throw new Error(errorData.message || 'Geçmiş talepler çekilirken bir hata oluştu.');
    }
    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
        return result.data;
    } else {

        if (result.data === null || typeof result.data === 'undefined') return [];
        throw new Error(result.message || 'Geçmiş talep verileri beklenen formatta değil.');
    }
};

const submitTicket = async (ticketData, token) => {

    const response = await fetch('http://localhost:5293/api/tickets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData),
    });

    if (!response.ok) {

        let errorResponseData = { message: 'Talep gönderilemedi.' };
        try {
            errorResponseData = await response.json();
        } catch (e) {
            console.error("Talep gönderme API yanıtı JSON formatında değil veya parse edilemedi.", e);
        }

        const error = new Error(errorResponseData.message || 'Talep gönderilirken bir sunucu hatası oluştu.');
        if (errorResponseData.errors) {
            error.errors = errorResponseData.errors;
        }
        throw error;
    }
    return await response.json();
};


function CreateTicketPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    const [changeType, setChangeType] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [message, setMessage] = useState('');

    const [cities, setCities] = useState([]);
    const [userTickets, setUserTickets] = useState([]);

    const [pageLoading, setPageLoading] = useState(true);
    const [dataLoadingError, setDataLoadingError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formSuccess, setFormSuccess] = useState('');
    const [formErrors, setFormErrors] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('Token bulunamadı, giriş sayfasına yönlendiriliyor.');
            navigate('/');
            return;
        }

        const loadInitialData = async () => {
            setPageLoading(true);
            setDataLoadingError(null);
            try {
                const userProfileData = await fetchCurrentUserProfile(token);
                setCurrentUser(userProfileData);

                if (userProfileData && userProfileData.id) {
                    const [citiesData, ticketsData] = await Promise.all([
                        fetchCities(),
                        fetchUserTickets(userProfileData.id, token)
                    ]);
                    setCities(citiesData || []);
                    setUserTickets(ticketsData || []);
                } else {
                    throw new Error("Kullanıcı profili ID'si alınamadı.");
                }

            } catch (err) {
                if (err.message === 'Unauthorized') {
                    console.error('Yetkisiz erişim veya token geçersiz. Çıkış yapılıyor ve giriş sayfasına yönlendiriliyor.');
                    localStorage.removeItem('authToken');
                    navigate('/');
                } else {
                    console.error("Veri yükleme hatası:", err);
                    setDataLoadingError(err.message || "Veriler yüklenirken bir hata oluştu.");
                }
            } finally {
                setPageLoading(false);
            }
        };

        loadInitialData();
    }, [navigate]);


    const handleLogout = async () => {
        console.log('Çıkış yapılıyor...');
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                await fetch('http://localhost:5293/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error) {
                console.error('Logout API çağrısı sırasında hata:', error);
            }
        }
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        navigate('/');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormLoading(true);
        setFormSuccess('');
        setFormErrors([]);

        if (!currentUser || !currentUser.id) {
            setFormErrors(['Kullanıcı bilgileri yüklenemedi, lütfen tekrar deneyin.']);
            setFormLoading(false);
            return;
        }

        if (!changeType || !selectedCity || !message) {
            setFormErrors(['Lütfen tüm alanları doldurun.']);
            setFormLoading(false);
            return;
        }
        const token = localStorage.getItem('authToken');
        if (!token) {
            setFormErrors(['Oturumunuz zaman aşımına uğramış olabilir. Lütfen tekrar giriş yapın.']);
            navigate('/');
            return;
        }

        try {
            const cityIdAsInt = parseInt(selectedCity, 10);
            if (isNaN(cityIdAsInt)) {
                setFormErrors(['Geçerli bir şehir seçilmedi.']);
                setFormLoading(false);
                return;
            }

            const response = await submitTicket({
                userId: currentUser.id,
                changeType: changeType,
                cityId: cityIdAsInt,
                requestMessage: message
            }, token);

            setFormSuccess(response.message || 'Talep başarıyla gönderildi!');
            setChangeType('');
            setSelectedCity('');
            setMessage('');

            if (currentUser && currentUser.id) {
                const ticketsData = await fetchUserTickets(currentUser.id, token);
                setUserTickets(ticketsData || []);
            }
        } catch (error) {
            console.error("Talep gönderme hatası:", error);
            if (error.errors) {
                setFormErrors(Object.values(error.errors).flat());
            } else if (error.message) {
                setFormErrors([error.message]);
            } else {
                setFormErrors(['Talep gönderilirken bir hata oluştu.']);
            }
        } finally {
            setFormLoading(false);
        }
    };


    const getCityNameById = (cityId) => {

        const idToFind = parseInt(cityId, 10);
        const city = cities.find(c => c.id === idToFind);
        return city ? city.name : 'Bilinmiyor';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            if (dateString.length === 10) { // "yyyy-MM-dd"
                const dateOnlyOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                return new Date(dateString + 'T00:00:00Z').toLocaleDateString('tr-TR', dateOnlyOptions); // UTC olarak parse et
            }
            return new Date(dateString).toLocaleDateString('tr-TR', options);
        } catch (e) {
            console.error("Tarih formatlama hatası:", e, "Gelen değer:", dateString);
            return dateString;
        }
    };

    if (pageLoading) {
        return <MainLayout pageTitle="Yükleniyor..."><div className="container mx-auto p-4 text-center">Sayfa verileri yükleniyor...</div></MainLayout>;
    }

    if (dataLoadingError) {
        return (
            <MainLayout pageTitle="Hata">
                <div className="container mx-auto text-center py-20 text-red-500">
                    {dataLoadingError} Lütfen <Link to="/" className="text-sky-600 hover:underline">tekrar giriş yapmayı</Link> deneyin veya daha sonra tekrar deneyin.
                </div>
            </MainLayout>
        );
    }

    if (!currentUser) {
        return (
            <MainLayout pageTitle="Giriş Gerekli">
                <div className="container mx-auto text-center py-20">
                    Bu sayfayı görüntülemek için <Link to="/" className="text-sky-600 hover:underline">giriş yapın</Link>.
                </div>
            </MainLayout>
        );
    }


    return (
        <MainLayout pageTitle="Tayin Talebi Oluştur">
            <section className="bg-sky-800 py-4 px-4 lg:px-0">
                <div className="container mx-auto">
                    <div className="flex flex-row items-center justify-between">

                        <h1 className="text-white text-2xl">
                            Personel Ekranı ({currentUser.profile?.firstName || currentUser.personnelNumber || 'Kullanıcı'}) - Tayin Talebi
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="text-gray-800 border border-gray-300 px-3 py-1.5 rounded bg-sky-100 transition hover:bg-sky-50 text-sm"
                        >
                            <i className="bi bi-door-closed mr-2"></i>Çıkış Yap
                        </button>
                    </div>
                </div>
            </section>


            <section className="bg-teal-100">
                <div className="container mx-auto py-3 px-4 lg:px-0">
                    <nav aria-label="breadcrumb" className="font-medium text-gray-600 text-sm">
                        <ol className="list-none p-0 inline-flex space-x-2 items-center">
                            <li className="flex items-center">
                                <Link to="/personel-ekrani" className="hover:text-sky-700 hover:underline">Anasayfa</Link>
                            </li>
                            <li className="flex items-center" aria-current="page">
                                <svg className="fill-current w-3 h-3 mx-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-700">Tayin Talebi Oluştur</span>
                            </li>
                        </ol>
                    </nav>
                </div>
            </section>

            <section className="my-8">
                <div className="container mx-auto px-4 lg:px-0">
                    <div className="border border-gray-200 shadow-lg p-4 sm:p-6 rounded">
                        <h2 className="text-xl p-4 bg-sky-500 text-white rounded mb-6">Tayin Talebi Oluştur</h2>

                        {formSuccess && (
                            <div className="bg-green-500 p-4 mb-4 text-white rounded">
                                <p><i className="bi bi-check-circle-fill mr-2"></i> {formSuccess}</p>
                            </div>
                        )}

                        {formErrors.length > 0 && (
                            <div className="bg-amber-500 p-4 mb-4 text-white rounded">
                                <ul className="flex flex-col gap-2">
                                    {formErrors.map((error, index) => (
                                        <li key={index}><i className="bi bi-exclamation-triangle-fill mr-2"></i> {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="relative w-full mb-6">
                                <label htmlFor="changetype" className="block text-sm font-medium text-gray-700 mb-1">Talep Türü</label>
                                <select
                                    id="changetype"
                                    name="changetype"
                                    value={changeType}
                                    onChange={(e) => setChangeType(e.target.value)}
                                    required
                                    disabled={formLoading}
                                    className="w-full appearance-none border border-gray-300 rounded-md pl-3 pr-10 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm"
                                >
                                    <option value="" disabled>Seçiniz...</option>
                                    <option value="Tayin Talebi">Tayin talebi</option>
                                    <option value="Tayin talebim uygun görülmezse yerimde kalmak istiyorum.">Tayin talebim uygun görülmezse yerimde kalmak istiyorum.</option>
                                </select>
                            </div>

                            <div className="relative w-full mb-6">
                                <label htmlFor="cities" className="block text-sm font-medium text-gray-700 mb-1">Adliye Seçimi Yapın</label>
                                <select
                                    id="cities"
                                    name="cities"
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)} // selectedCity artık ID tutacak
                                    required
                                    disabled={formLoading || cities.length === 0}
                                    className="w-full appearance-none border border-gray-300 rounded-md pl-3 pr-10 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm"
                                >
                                    <option value="" disabled>{cities.length === 0 && !dataLoadingError ? 'Şehirler yükleniyor...' : (cities.length === 0 && dataLoadingError ? 'Şehirler yüklenemedi' : 'Seçiniz...')}</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.id}>{city.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-full mb-6">
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    disabled={formLoading}
                                    className="h-32 w-full appearance-none border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm"
                                    placeholder="Tayin talebinizle ilgili açıklama yazın..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={formLoading}
                                className="px-6 py-2 bg-sky-600 text-white rounded transition hover:bg-sky-500 cursor-pointer disabled:opacity-60"
                            >
                                {formLoading ? 'Gönderiliyor...' : 'Talep Gönder'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>


            <section className="my-8">
                <div className="container mx-auto px-4 lg:px-0">
                    <div className="border border-gray-200 shadow-lg p-4 sm:p-6 rounded">
                        <h2 className="text-xl p-4 bg-teal-600 text-white rounded mb-6">Geçmiş Tayin Talepleri</h2>
                        <div className="overflow-x-auto shadow-md sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-sky-500">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Talep Türü</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tayin İstenen Şehir</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Mesaj</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Talep Tarihi</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {userTickets && userTickets.length > 0 ? (
                                    userTickets.map(ticket => (
                                        <tr key={ticket.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 capitalize">{ticket.changetype}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{getCityNameById(ticket.city_id)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700 max-w-xs truncate" title={ticket.message}>{ticket.message}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{formatDate(ticket.created_at)}</div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                            Daha önce oluşturulmuş tayin talebiniz bulunmamaktadır.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}

export default CreateTicketPage;