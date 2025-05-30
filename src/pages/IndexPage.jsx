import React, {useState, useEffect} from 'react';
import MainLayout from '../components/Layout/MainLayout';
import {Link, useNavigate}from 'react-router-dom';

// Get All Cities
const fetchCities = async (token) => {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch('http://localhost:5293/api/City/city', { headers });
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

// Get All Change Ticket
const fetchAllTicketsForAdmin = async (token) => {
    const response = await fetch('http://localhost:5293/api/tickets/admin/all', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        let errorData = { message: 'Yönetici bilet verileri alınamadı.' };
        try {
            errorData = await response.json();
        } catch (e) {
            console.error("Yönetici bilet API yanıtı JSON formatında değil veya parse edilemedi.", e);
        }
        throw new Error(errorData.message || 'Yönetici bilet verileri çekilirken bir hata oluştu.');
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
        return result.data;
    } else {
        throw new Error(result.message || 'Yönetici bilet verileri beklenen formatta değil.');
    }
};

// Get All Users
const fetchAllUsersForAdmin = async (token) => {
    const response = await fetch('http://localhost:5293/api/users/admin/all', { // API endpoint'i
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        let errorData = { message: 'Kullanıcı listesi alınamadı.' };
        try {
            errorData = await response.json();
        } catch (e) {
            console.error("Kullanıcı listesi API yanıtı JSON formatında değil veya parse edilemedi.", e);
        }
        throw new Error(errorData.message || 'Kullanıcı listesi çekilirken bir hata oluştu.');
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
        return result.data;
    } else {
        throw new Error(result.message || 'Kullanıcı verileri beklenen formatta değil.');
    }
};


// Get Login User Profile
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
        const errorData = await response.json().catch(() => ({message: 'Profil bilgileri alınırken bir hata oluştu.'}));
        throw new Error(errorData.message || 'Profil bilgileri alınamadı.');
    }
    return await response.json();
};


function DashboardPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [adminData, setAdminData] = useState({tickets: [], users: [], cities: []});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('Token bulunamadı, giriş sayfasına yönlendiriliyor.');
            navigate('/');
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const userProfileData = await fetchCurrentUserProfile(token);
                setCurrentUser(userProfileData);

                if (userProfileData.role === 'Admin') {
                    const [ticketsData, citiesData, usersData] = await Promise.all([
                        fetchAllTicketsForAdmin(token),
                        fetchCities(token),
                        fetchAllUsersForAdmin(token)
                    ]);

                    setAdminData({
                        tickets: ticketsData || [],
                        cities: citiesData || [],
                        users: usersData || []
                    });
                }
            } catch (err) {
                if (err.message === 'Unauthorized') {
                    console.error('Yetkisiz erişim veya token geçersiz. Çıkış yapılıyor ve giriş sayfasına yönlendiriliyor.');
                    localStorage.removeItem('authToken');
                    navigate('/');
                } else {
                    setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
                    console.error(err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    const handleLogout = async () => {
        console.log('Çıkış yapılıyor...');
        const token = localStorage.getItem('authToken');

        if (token) {
            try {
                const response = await fetch('http://localhost:5293/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(data.message || 'Sunucu tarafı çıkış başarılı.');
                } else {
                    console.error('Sunucu tarafı çıkış işlemi başarısız oldu. Durum:', response.status);
                }
            } catch (error) {
                console.error('Logout API çağrısı sırasında bir ağ hatası veya başka bir sorun oluştu:', error);
            }
        } else {
            console.log('Saklanmış bir token bulunamadı, sadece istemci tarafı çıkış yapılıyor.');
        }

        localStorage.removeItem('authToken');
        setCurrentUser(null);
        console.log('İstemci tarafı temizlik tamamlandı.');
        navigate('/');
    };

    if (isLoading) {
        return (
            <MainLayout pageTitle="Yükleniyor...">
                <div className="container mx-auto text-center py-20">Yükleniyor...</div>
            </MainLayout>
        );
    }

    if (error && !currentUser) {
        return (
            <MainLayout pageTitle="Hata">
                <div className="container mx-auto text-center py-20 text-red-500">
                    {error} Lütfen <Link to="/" className="text-sky-600 hover:underline">tekrar giriş
                    yapmayı</Link> deneyin.
                </div>
            </MainLayout>
        );
    }

    if (!currentUser) {
        return (
            <MainLayout pageTitle="Giriş Gerekli">
                <div className="container mx-auto text-center py-20">
                    Bu sayfayı görüntülemek için lütfen <Link to="/" className="text-sky-600 hover:underline">giriş
                    yapın</Link>.
                </div>
            </MainLayout>
        );
    }

    if (error && currentUser.role === 'Admin' && (!adminData.tickets.length || !adminData.cities.length || !adminData.users.length) ) {
        console.warn("Admin verileri (biletler, şehirler veya kullanıcılar) yüklenirken hata oluştu:", error);
    }

    const getUserNameById = (userId) => {
        if (!adminData || !adminData.users || adminData.users.length === 0) return 'Bilinmeyen Kullanıcı';
        const user = adminData.users.find(u => u.id === userId);
        if (user) {
            if (user.profile && user.profile.firstName) {
                return `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
            }
            if (user.personnelNumber) return user.personnelNumber;

            return `Kullanıcı (${userId.substring(0, 6)}...)`;
        }
        return `Bilinmeyen Kullanıcı (${userId.substring(0, 6)}...)`;
    };

    const getCityNameById = (cityId) => {
        if (!adminData || !adminData.cities || adminData.cities.length === 0) return 'Bilinmeyen Şehir';
        const numericCityId = typeof cityId === 'string' ? parseInt(cityId, 10) : cityId;
        const city = adminData.cities.find(c => c.id === numericCityId);
        return city ? city.name : `Şehir ID: ${cityId}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const options = {year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'};
            if (dateString.length === 10 && !dateString.includes('T')) {
                const dateOnlyOptions = {year: 'numeric', month: 'long', day: 'numeric'};
                return new Date(dateString + 'T00:00:00Z').toLocaleDateString('tr-TR', dateOnlyOptions);
            }
            return new Date(dateString).toLocaleDateString('tr-TR', options);
        } catch (e) {
            console.error("Tarih formatlama hatası:", e, "Gelen değer:", dateString);
            return dateString;
        }
    };

    const isUserAdmin = currentUser.role === 'Admin';

    return (
        <MainLayout pageTitle={isUserAdmin ? 'Yönetici Paneli' : 'Kişisel Bilgilerim'}>
            <section className="bg-sky-800 py-4 px-4 lg:px-0">
                <div className="container mx-auto">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <h1 className="text-white text-xl md:text-2xl text-center sm:text-left">
                            {isUserAdmin ? `Yönetici Ekranı (${currentUser.profile?.firstName || currentUser.personnelNumber || currentUser.userName || 'Yönetici'})`
                                : `Personel Ekranı (${currentUser.profile?.firstName || currentUser.personnelNumber || currentUser.userName || 'Personel'})`}
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

            {error && (!isUserAdmin || (isUserAdmin && (!adminData.tickets.length || !adminData.cities.length || !adminData.users.length))) && (
                <section className="my-8">
                    <div className="container mx-auto">
                        <div className="text-red-700 p-4 bg-red-100 border border-red-400 rounded mb-4">
                            <strong>Hata:</strong> {error} Lütfen daha sonra tekrar deneyin veya sistem yöneticisi ile iletişime geçin.
                        </div>
                    </div>
                </section>
            )}


            {isUserAdmin && !error && (
                <section className="my-8">
                    <div className="container mx-auto">
                        <div className="border border-gray-200 shadow-lg p-4 sm:p-6 rounded-lg">
                            <h2 className="text-xl font-semibold p-4 bg-sky-600 text-white rounded-t-lg mb-0">Tüm Tayin Talepleri</h2>
                            <div className="overflow-x-auto shadow-md sm:rounded-b-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                    <tr>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Talep Eden</th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Talep Türü</th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tayin İstenen Şehir</th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Mesaj</th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Talep Tarihi</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {adminData.tickets && adminData.tickets.length > 0 ? (
                                        adminData.tickets.map((ticket) => (
                                            <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 capitalize">{getUserNameById(ticket.user_id)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 capitalize">{ticket.changetype}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{getCityNameById(ticket.city_id)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-700 max-w-xs truncate hover:whitespace-normal hover:overflow-visible" title={ticket.message}>
                                                        {ticket.message}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{formatDate(ticket.created_at)}</div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                                {isLoading ? 'Yükleniyor...' : (error && adminData.tickets.length === 0 ? 'Veri yüklenirken hata oluştu.' : 'Gösterilecek tayin talebi bulunamadı.')}
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {currentUser.profile && (
                <>
                    <section className="my-8">
                        <div className="container mx-auto">
                            <div className="border border-gray-200 shadow-lg p-4 sm:p-6 rounded-lg">
                                <h2 className="text-xl font-semibold p-4 bg-sky-500 text-white rounded-t-lg mb-0">Personel Bilgileri</h2>
                                <div className="p-4 bg-white rounded-b-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                                        <div className="p-3 bg-sky-50 rounded-md shadow-sm"><strong>Ad Soyad:</strong> {currentUser.profile.firstName} {currentUser.profile.lastName}</div>
                                        <div className="p-3 bg-sky-50 rounded-md shadow-sm"><strong>Sicil No:</strong> {currentUser.personnelNumber}</div>
                                        <div className="p-3 bg-sky-50 rounded-md shadow-sm"><strong>E-Mail:</strong> {currentUser.email}</div>
                                        <div className="p-3 bg-sky-50 rounded-md shadow-sm"><strong>Telefon:</strong> {currentUser.profile.phone}</div>
                                        <div className="p-3 bg-sky-50 rounded-md shadow-sm"><strong>Kurum:</strong> {currentUser.profile.company}</div>
                                        <div className="p-3 bg-sky-50 rounded-md shadow-sm"><strong>Adres:</strong> {currentUser.profile.address}</div>
                                        <div className="p-3 bg-sky-50 rounded-md shadow-sm"><strong>Yıllık İzin:</strong> {currentUser.profile.vac} GÜN</div>
                                        <div className="p-3 bg-sky-50 rounded-md shadow-sm"><strong>Kadro/Derece:</strong> {currentUser.profile.kadro}</div>
                                        <div className="p-3 bg-sky-50 rounded-md shadow-sm"><strong>İşe Başlama:</strong> {formatDate(currentUser.profile.startYear)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {!isUserAdmin && (
                        <section className="my-8">
                            <div className="container mx-auto">
                                <div className="border border-gray-200 shadow-lg p-4 sm:p-6 rounded-lg">
                                    <h2 className="text-xl font-semibold p-4 bg-sky-500 text-white rounded-t-lg mb-0">Talep Oluştur</h2>
                                    <div className="p-4 bg-white rounded-b-lg text-center">
                                        <Link
                                            to="/yeni-tayin-talebi"
                                            className="px-6 py-3 inline-block bg-teal-600 transition hover:bg-teal-700 text-white font-semibold rounded-md shadow-md"
                                        >
                                            Yeni Tayin Talebinde Bulun
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </>
            )}
        </MainLayout>
    );
}

export default DashboardPage;
