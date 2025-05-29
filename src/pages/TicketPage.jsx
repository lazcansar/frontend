import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout'; // Ana layout
import { Link, useNavigate } from 'react-router-dom';    // Link ve yönlendirme

// Örnek kullanıcı verisi (Normalde Auth Context'ten veya Redux'tan gelir)
const initialCurrentUser = {
    id: 2, // Giriş yapmış kullanıcının ID'si
    name: 'Ahmet Yılmaz (Sicil No: 1001)', // Header'da gösterilecek kullanıcı adı/sicil no
    // ...diğer kullanıcı bilgileri
};


const fetchCities = async () => {
    try {
        const response = await fetch('http://localhost:5293/api/City/city');

        if (!response.ok) {
            // Yanıt başarılı değilse (örn. 404, 500), hata fırlat
            const errorData = await response.json();
            throw new Error(errorData.message || 'Şehirler çekilirken bir hata oluştu.');
        }

        const result = await response.json();

        // CitiesModel yapısına göre Success ve Data kontrolü
        if (result.success && result.data) {
            // Data özelliği şehir adlarının bir listesi (List<string>)
            return result.data;
        } else {
            // API'den gelen yanıtta başarı yoksa veya Data boşsa
            throw new Error(result.message || 'Beklenmedik bir veri formatı veya boş veri.');
        }

    } catch (error) {
        console.error("Şehirleri çekerken bir hata oluştu:", error);
        throw error; // Hatayı çağırana ilet
    }
};

const fetchUserTickets = async (userId) => {
    // const response = await fetch(`/api/user/${userId}/tickets`);
    // const data = await response.json();
    // return data;
    return [ // Örnek veri
        { id: 1, user_id: 2, changetype: 'İl İçi', city_id: 6, message: 'Ankara merkez birimlerine tayin talebi.', created_at: '2024-05-27 10:00:00' },
        { id: 3, user_id: 2, changetype: 'İl Dışı', city_id: 35, message: 'İzmir Adliyesi için tayin istiyorum.', created_at: '2024-05-20 09:00:00' },
    ];
};

const submitTicket = async (ticketData) => {
    // const response = await fetch('/api/tickets', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', /* ...diğer header'lar... */ },
    //   body: JSON.stringify(ticketData),
    // });
    // if (!response.ok) {
    //   const errorData = await response.json();
    //   throw errorData; // Hata mesajlarını veya detaylarını fırlat
    // }
    // return await response.json(); // Başarılı yanıtı dön
    console.log('Talep gönderiliyor:', ticketData);
    return { success: true, message: 'Tayin talebiniz başarıyla gönderildi!' }; // Örnek başarılı yanıt
};


function CreateTicketPage() {
    const [currentUser, setCurrentUser] = useState(initialCurrentUser); // Gerçek uygulamada Auth Context'ten alınmalı
    const navigate = useNavigate();

    // Form state'leri
    const [changeType, setChangeType] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [message, setMessage] = useState('');

    // Veri state'leri
    const [cities, setCities] = useState([]);
    const [userTickets, setUserTickets] = useState([]);

    // UI state'leri
    const [isLoading, setIsLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formSuccess, setFormSuccess] = useState('');
    const [formErrors, setFormErrors] = useState([]);

    // Şehirleri ve geçmiş talepleri yükle
    useEffect(() => {
        const loadInitialData = async () => {
            if (!currentUser || !currentUser.id) {
                // Eğer kullanıcı bilgisi yoksa, belki giriş sayfasına yönlendirilebilir
                // navigate('/giris');
                return;
            }
            setIsLoading(true);
            try {
                const citiesData = await fetchCities();
                setCities(citiesData);

                const ticketsData = await fetchUserTickets(currentUser.id);
                setUserTickets(ticketsData);
            } catch (error) {
                console.error("Veri yükleme hatası:", error);
                // Kullanıcıya hata mesajı gösterilebilir
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [currentUser]); // currentUser değişirse verileri yeniden yükle (login/logout durumları için)


    const handleLogout = () => {
        // Gerçek logout işlemleri (API çağrısı, token temizleme vb.)
        console.log('Çıkış yapıldı');
        navigate('/');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormLoading(true);
        setFormSuccess('');
        setFormErrors([]);

        if (!changeType || !selectedCity || !message) {
            setFormErrors(['Lütfen tüm alanları doldurun.']);
            setFormLoading(false);
            return;
        }

        try {
            const response = await submitTicket({
                user_id: currentUser.id,
                changetype: changeType,
                city_id: selectedCity,
                message: message,
            });
            setFormSuccess(response.message || 'Talep başarıyla gönderildi!');
            // Formu sıfırla
            setChangeType('');
            setSelectedCity('');
            setMessage('');
            // Geçmiş talepleri yeniden yükle (opsiyonel, yeni talep hemen listede görünsün diye)
            const ticketsData = await fetchUserTickets(currentUser.id);
            setUserTickets(ticketsData);
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
        const city = cities.find(c => c.id === parseInt(cityId));
        return city ? city.name : 'Bilinmiyor';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString('tr-TR', options);
        } catch (e) {
            return dateString;
        }
    };

    if (isLoading) {
        return <MainLayout pageTitle="Yükleniyor..."><div className="container mx-auto p-4 text-center">Veriler yükleniyor...</div></MainLayout>;
    }

    return (
        <MainLayout pageTitle="Tayin Talebi Oluştur">
            <section className="bg-sky-800 py-4 px-4 lg:px-0">
                <div className="container mx-auto">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="text-white text-2xl">Personel Ekranı - Tayin Talebi</h1>
                        <button
                            onClick={handleLogout}
                            className="text-gray-800 border border-gray-300 px-3 py-1.5 rounded bg-sky-100 transition hover:bg-sky-50 text-sm"
                        >
                            <i className="bi bi-door-closed mr-2"></i>Çıkış Yap
                        </button>
                    </div>
                </div>
            </section>

            <section className="bg-teal-100"> {/* Daha yumuşak bir ton */}
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
                            <div className="bg-amber-500 p-4 mb-4 text-white rounded"> {/* Blade'deki amber-800'den farklı, daha yumuşak */}
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
                                {/* SVG ikonu Tailwind ile daha kolay yönetilebilir veya çıkarılabilir */}
                            </div>

                            <div className="relative w-full mb-6">
                                <label htmlFor="cities" className="block text-sm font-medium text-gray-700 mb-1">Adliye Seçimi Yapın</label>
                                <select
                                    id="cities"
                                    name="cities"
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    required
                                    disabled={formLoading || cities.length === 0}
                                    className="w-full appearance-none border border-gray-300 rounded-md pl-3 pr-10 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm"
                                >
                                    <option value="" disabled>{cities.length === 0 ? 'Şehirler yükleniyor...' : 'Seçiniz...'}</option>
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