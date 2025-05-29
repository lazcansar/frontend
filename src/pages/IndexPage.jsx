import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { Link, useNavigate } from 'react-router-dom';

// API çağrısı için örnek fonksiyon (Admin için)
const fetchAdminDashboardData = async (token) => {
    // Bu fonksiyonu kendi API yapınıza göre doldurun
    // Örnek:
    // const response = await fetch('/api/admin/dashboard-summary', {
    //     headers: { 'Authorization': `Bearer ${token}` }
    // });
    // if (!response.ok) throw new Error('Admin verileri alınamadı');
    // return await response.json();

    // Şimdilik örnek veri:
    return {
        tickets: [
            { id: 1, user_id: 'guid-user-2', changetype: 'İl İçi', city_id: 6, message: 'Ankara merkez birimlerine tayin talebi.', created_at: '2024-05-27 10:00:00' },
            { id: 2, user_id: 'guid-user-3', changetype: 'İl Dışı', city_id: 34, message: 'İstanbul Adliyesi için tayin istiyorum.', created_at: '2024-05-26 14:30:00' },
        ],
        users: [ // Bu kullanıcı listesi adminin göreceği diğer kullanıcılar
            { id: 'guid-admin-1', name: 'Yönetici Adı', sicil_no: '001' },
            { id: 'guid-user-2', name: 'Ahmet Yılmaz', sicil_no: '1001' },
            { id: 'guid-user-3', name: 'Ayşe Kaya', sicil_no: '1002' },
        ],
        cities: [
            { id: 6, name: 'Ankara' },
            { id: 34, name: 'İstanbul' },
        ],
    };
};

// Giriş yapmış kullanıcının kendi bilgilerini getiren API çağrısı
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
            // Yetkisiz erişim, token geçersiz olabilir
            throw new Error('Unauthorized');
        }
        const errorData = await response.json().catch(() => ({ message: 'Profil bilgileri alınırken bir hata oluştu.' }));
        throw new Error(errorData.message || 'Profil bilgileri alınamadı.');
    }
    return await response.json();
};


function DashboardPage() {
    const [currentUser, setCurrentUser] = useState(null); // Başlangıçta null
    const [adminData, setAdminData] = useState({ tickets: [], users: [], cities: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('Token bulunamadı, giriş sayfasına yönlendiriliyor.');
            navigate('/'); // Token yoksa giriş sayfasına yönlendir
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const userProfileData = await fetchCurrentUserProfile(token);
                setCurrentUser(userProfileData); // API'den gelen kullanıcı bilgisi

                // API'den gelen rol string ("Admin", "Personel")
                // Frontend'de rolü 0 ve 1 olarak kullanıyorsanız burada dönüşüm yapabilirsiniz
                // Veya API'nin sayısal rol dönmesini sağlayabilirsiniz.
                // Şimdilik API'den gelen string role göre kontrol yapalım.
                if (userProfileData.role === 'Admin') {
                    const data = await fetchAdminDashboardData(token);
                    setAdminData(data);
                }
                // Personel için ek bir veri çekmeye gerek yok, userProfileData zaten kendi bilgileri.

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
    }, [navigate]); // navigate dependency array'de olmalı

    const handleLogout = async () => {
        console.log('Çıkış yapılıyor...');
        const token = localStorage.getItem('authToken');

        if (token) {
            try {
                const response = await fetch('http://localhost:5293/api/auth/logout', { // API adresinizi doğrulayın
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
                    // Hata olsa bile istemci tarafı temizliği yap
                }
            } catch (error) {
                console.error('Logout API çağrısı sırasında bir ağ hatası veya başka bir sorun oluştu:', error);
                // Hata olsa bile istemci tarafı temizliği yap
            }
        } else {
            console.log('Saklanmış bir token bulunamadı, sadece istemci tarafı çıkış yapılıyor.');
        }

        localStorage.removeItem('authToken');
        setCurrentUser(null); // Kullanıcı state'ini temizle
        console.log('İstemci tarafı temizlik tamamlandı.');
        navigate('/'); // Ana sayfaya veya giriş sayfasına yönlendir
    };

    if (isLoading) {
        return (
            <MainLayout pageTitle="Yükleniyor...">
                <div className="container mx-auto text-center py-20">Yükleniyor...</div>
            </MainLayout>
        );
    }

    // currentUser yüklenmeden önce hata oluştuysa veya kullanıcı yoksa (useEffect yönlendirmesi sonrası bir anlık durum)
    if (error && !currentUser) {
        return (
            <MainLayout pageTitle="Hata">
                <div className="container mx-auto text-center py-20 text-red-500">
                    {error} Lütfen <Link to="/" className="text-sky-600 hover:underline">tekrar giriş yapmayı</Link> deneyin.
                </div>
            </MainLayout>
        );
    }

    // currentUser null ise (henüz yüklenmemiş veya yüklenememişse ve token yoksa useEffect zaten yönlendirir)
    // Bu kontrol genellikle AuthContext ile daha merkezi yönetilir.
    if (!currentUser) {
        // Bu durum, token var ama kullanıcı bilgisi çekilemediyse veya
        // useEffect içindeki navigate('/') henüz render döngüsünü tamamlamadıysa görülebilir.
        // Genellikle isLoading true iken bu bloğa girilmez.
        return (
            <MainLayout pageTitle="Giriş Gerekli">
                <div className="container mx-auto text-center py-20">
                    Bu sayfayı görüntülemek için lütfen <Link to="/" className="text-sky-600 hover:underline">giriş yapın</Link>.
                </div>
            </MainLayout>
        );
    }

    // Hata varsa ve kullanıcı bilgisi de varsa (örneğin admin verisi çekilirken hata oldu)
    if (error && currentUser) {
        // Sadece admin verisi çekilirken hata olduysa, personel kendi bilgilerini görebilir.
        // Bu durumu daha spesifik yönetmek isteyebilirsiniz.
        // Şimdilik genel bir hata mesajı gösterelim.
        console.warn("Veri yükleme hatası (currentUser mevcut):", error);
    }


    // Admin tablosu için yardımcı fonksiyonlar (API'den gelen user_id string ise ona göre ayarlandı)
    const getUserNameById = (userId) => {
        if (!adminData || !adminData.users) return 'Bilinmeyen Kullanıcı';
        const user = adminData.users.find(u => u.id === userId); // API'den gelen user_id string ise === ile karşılaştır
        return user ? user.name : 'Bilinmeyen Kullanıcı';
    };

    const getCityNameById = (cityId) => {
        if (!adminData || !adminData.cities) return 'Bilinmeyen Şehir';
        const city = adminData.cities.find(c => c.id === cityId);
        return city ? city.name : 'Bilinmeyen Şehir';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            // API'den gelen tarih "yyyy-MM-dd" formatında ise saat bilgisi olmaz.
            // Eğer saat bilgisi de varsa ve farklı formatta geliyorsa new Date() parse etmeyebilir.
            // Sadece tarih için:
            if (dateString.length === 10) { // "yyyy-MM-dd"
                const dateOnlyOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                return new Date(dateString + 'T00:00:00').toLocaleDateString('tr-TR', dateOnlyOptions); // Saat ekleyerek parse et
            }
            return new Date(dateString).toLocaleDateString('tr-TR', options);
        } catch (e) {
            console.error("Tarih formatlama hatası:", e, "Gelen değer:", dateString);
            return dateString;
        }
    };

    // Rol kontrolü API'den gelen string değere göre yapılıyor
    const isUserAdmin = currentUser.role === 'Admin';

    return (
        <MainLayout pageTitle={isUserAdmin ? 'Yönetici Paneli' : 'Kişisel Bilgilerim'}>
            <section className="bg-sky-800 py-4 px-4 lg:px-0">
                <div className="container mx-auto">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="text-white text-2xl">
                            {isUserAdmin ? `Yönetici Ekranı (${currentUser.profile?.firstName || currentUser.personnelNumber})` : `Personel Ekranı (${currentUser.profile?.firstName || currentUser.personnelNumber})`}
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

            {/* Yönetici İçeriği */}
            {isUserAdmin && (
                <section className="my-8">
                    <div className="container mx-auto">
                        {error && adminData.tickets.length === 0 && <div className="text-red-500 p-4 bg-red-100 rounded mb-4">Admin verileri yüklenirken hata oluştu: {error}</div>}
                        <div className="border border-gray-200 shadow p-4 rounded">
                            <h2 className="text-xl p-4 bg-sky-600 text-white rounded mb-4">Tüm Tayin Talepleri</h2>
                            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-sky-500">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Talep Eden</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Talep Türü</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tayin İstenen Şehir</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Mesaj</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Talep Tarihi</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {adminData.tickets && adminData.tickets.length > 0 ? (
                                        adminData.tickets.map((ticket) => (
                                            <tr key={ticket.id}>
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
                                                    <div className="text-sm text-gray-700 max-w-xs truncate" title={ticket.message}>
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
                                                Gösterilecek talep bulunamadı.
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

            {/* Personel İçeriği (Her zaman gösterilir, çünkü currentUser kendi bilgileridir) */}
            {currentUser.profile && ( // currentUser.profile API'den geliyorsa kontrol et
                <>
                    <section className="my-8">
                        <div className="container mx-auto">
                            <div className="border border-gray-200 shadow p-4 rounded">
                                <h2 className="text-xl p-4 bg-sky-500 text-white rounded mb-4">Personel Bilgileri</h2>
                                <div className="flex flex-row flex-wrap -m-2 text-gray-800">
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>Ad Soyad:</strong> {currentUser.profile.firstName} {currentUser.profile.lastName}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>Sicil No:</strong> {currentUser.personnelNumber}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>E-Mail:</strong> {currentUser.email}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>Telefon Numarası:</strong> {currentUser.profile.phone}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>Çalıştığı Kurum:</strong> {currentUser.profile.company}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>İkamet Adresi:</strong> {currentUser.profile.address}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>Yıllık İzin:</strong> {currentUser.profile.vac}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>Kadro / Derece:</strong> {currentUser.profile.kadro}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>İşe Başlama Tarihi:</strong> {formatDate(currentUser.profile.startYear)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Personel ise tayin talebi bölümünü göster */}
                    {!isUserAdmin && (
                        <section className="my-8">
                            <div className="container mx-auto">
                                <div className="border border-gray-200 shadow p-4 rounded">
                                    <h2 className="text-xl p-4 bg-sky-500 text-white rounded mb-4">Talep Ekranı</h2>
                                    <Link
                                        to="/yeni-tayin-talebi"
                                        className="px-4 py-2 inline-block bg-teal-700 transition hover:bg-teal-600 text-white rounded"
                                    >
                                        Tayin Talebinde Bulun!
                                    </Link>
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
