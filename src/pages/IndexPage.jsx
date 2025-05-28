import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout'; // Ana layout bileşenimiz
import { Link, useNavigate } from 'react-router-dom'; // Yönlendirme ve linkler için

// Örnek kullanıcı ve veri yapısı (Gerçek uygulamada Auth Context veya Redux'tan gelir)
// Bu, API'den giriş yapıldığında alınacak kullanıcı bilgisi varsayımıdır.
const initialUser = {
    id: null, // Kullanıcı ID'si
    name: '', // Genellikle sicil no veya kullanıcı adı (Auth::user()->name gibi)
    role: null, // 0: Personel, 1: Yönetici
    profile: { // Personel detayları ($userDetail gibi)
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        vac: '', // Yıllık izin
        kadro: '', // Kadro / Derece
        startyear: '', // İşe başlama tarihi
    },
};

// API çağrıları için örnek fonksiyonlar (Bunları kendi API yapınıza göre uyarlayın)
const fetchAdminDashboardData = async () => {
    // const ticketsResponse = await fetch('/api/admin/tickets');
    // const usersResponse = await fetch('/api/users'); // Tüm kullanıcılar (dikkatli kullanılmalı)
    // const citiesResponse = await fetch('/api/cities');
    // const tickets = await ticketsResponse.json();
    // const users = await usersResponse.json();
    // const cities = await citiesResponse.json();
    // return { tickets, users, cities };

    // Şimdilik örnek veri:
    return {
        tickets: [
            { id: 1, user_id: 2, changetype: 'İl İçi', city_id: 6, message: 'Ankara merkez birimlerine tayin talebi.', created_at: '2024-05-27 10:00:00' },
            { id: 2, user_id: 3, changetype: 'İl Dışı', city_id: 34, message: 'İstanbul Adliyesi için tayin istiyorum.', created_at: '2024-05-26 14:30:00' },
        ],
        users: [
            { id: 1, name: 'Yönetici Adı', sicil_no: '001' }, // Yönetici de bir kullanıcı olabilir
            { id: 2, name: 'Ahmet Yılmaz', sicil_no: '1001' },
            { id: 3, name: 'Ayşe Kaya', sicil_no: '1002' },
        ],
        cities: [
            { id: 6, name: 'Ankara' },
            { id: 34, name: 'İstanbul' },
        ],
    };
};

const fetchPersonnelDashboardData = async (userId) => {
    // const userDetailResponse = await fetch(`/api/user/${userId}/details`);
    // const userDetail = await userDetailResponse.json();
    // return userDetail;

    // Şimdilik örnek veri (giriş yapan kullanıcıya göre):
    // Bu veriler genellikle giriş yapıldığında gelen ana kullanıcı objesinde olur.
    // Burada currentUser.profile kısmını kullanacağız.
    return {}; // Ana kullanıcı objesinden alınacak
};


function DashboardPage() {
    // Bu 'currentUser' normalde bir AuthContext'ten veya Redux store'dan gelir.
    // Örnek olarak burada tanımlıyoruz, giriş yapıldığında bu bilgi set edilmeli.
    const [currentUser, setCurrentUser] = useState({
        id: 2, // Giriş yapmış kullanıcının ID'si
        name: '1001', // Giriş yapmış kullanıcının sicil numarası (Auth::user()->name)
        role: 0, // 0: Personel, 1: Yönetici (Giriş yapmış kullanıcının rolü)
        profile: { // Personel detayları ($userDetail)
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            email: 'ahmet.yilmaz@example.com',
            phone: '5551112233',
            company: 'Adalet Bakanlığı - Ankara Adliyesi',
            address: 'Ankara, Türkiye',
            vac: '20 gün',
            kadro: 'Zabıt Katibi / 3. Derece',
            startyear: '2015-03-10',
        }
    });

    const [adminData, setAdminData] = useState({ tickets: [], users: [], cities: [] });
    // Personel detayları zaten currentUser.profile içinde olduğundan ayrı bir state'e gerek olmayabilir.
    // Eğer API'den ayrı çekiliyorsa: const [personnelDetails, setPersonnelDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (currentUser && currentUser.role === 1) { // Yönetici
                    const data = await fetchAdminDashboardData();
                    setAdminData(data);
                } else if (currentUser && currentUser.role === 0) { // Personel
                    // Personel detayları zaten `currentUser.profile` içinde varsayılıyor.
                    // Eğer API'den ayrı çekilecekse:
                    // const data = await fetchPersonnelDashboardData(currentUser.id);
                    // setPersonnelDetails(data); // Eğer ayrı state kullanılıyorsa
                }
            } catch (err) {
                setError('Veriler yüklenirken bir hata oluştu.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentUser && currentUser.id) {
            loadData();
        } else {
            setIsLoading(false);
        }
    }, [currentUser]); // currentUser değiştiğinde (örn. login/logout) tekrar veri çek.

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
        console.log('İstemci tarafı temizlik tamamlandı.');

        navigate('/');
    };

    // Veri yüklenirken veya kullanıcı yoksa gösterilecek içerik
    if (isLoading) {
        return (
            <MainLayout pageTitle="Yükleniyor...">
                <div className="container mx-auto text-center py-20">Yükleniyor...</div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout pageTitle="Hata">
                <div className="container mx-auto text-center py-20 text-red-500">{error}</div>
            </MainLayout>
        );
    }

    if (!currentUser || currentUser.id === null) {
        // Bu durum normalde Router'da PrivateRoute/AuthGuard ile yönetilir.
        // Kullanıcı yoksa ve yükleme bittiyse (örn. doğrudan bu sayfaya gelindiyse)
        // Login'e yönlendirme useEffect içinde yapılabilir veya burada bir mesaj gösterilebilir.
        return (
            <MainLayout pageTitle="Giriş Gerekli">
                <div className="container mx-auto text-center py-20">
                    Bu sayfayı görüntülemek için lütfen <Link to="/giris" className="text-sky-600 hover:underline">giriş yapın</Link>.
                </div>
            </MainLayout>
        );
    }


    // Kullanıcı adı ve şehir adlarını bulmak için yardımcı fonksiyonlar (Admin tablosu için)
    // Not: Büyük veri setlerinde bu yaklaşım performanssız olabilir.
    // Backend'den verinin ilişkili isimlerle gelmesi veya frontend'de map oluşturmak daha iyi olur.
    const getUserNameById = (userId) => {
        const user = adminData.users.find(u => u.id === userId);
        return user ? user.name : 'Bilinmeyen Kullanıcı';
    };

    const getCityNameById = (cityId) => {
        const city = adminData.cities.find(c => c.id === cityId);
        return city ? city.name : 'Bilinmeyen Şehir';
    };

    // Tarih formatlama
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString('tr-TR', options);
        } catch (e) {
            return dateString; // Hata durumunda orijinal string'i dön
        }
    };


    return (
        <MainLayout pageTitle={currentUser.role === 1 ? 'Yönetici Paneli' : 'Kişisel Bilgilerim'}>
            <section className="bg-sky-800 py-4 px-4 lg:px-0">
                <div className="container mx-auto">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="text-white text-2xl">
                            {currentUser.role === 1 ? 'Yönetici Ekranı' : 'Personel Ekranı'}
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

            {/* Yönetici İçeriği (role == 1) */}
            {currentUser.role === 1 && (
                <section className="my-8">
                    <div className="container mx-auto">
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

            {/* Personel İçeriği (role == 0) */}
            {currentUser.role === 0 && currentUser.profile && (
                <>
                    <section className="my-8">
                        <div className="container mx-auto">
                            <div className="border border-gray-200 shadow p-4 rounded">
                                <h2 className="text-xl p-4 bg-sky-500 text-white rounded mb-4">Personel Bilgileri</h2>
                                <div className="flex flex-row flex-wrap -m-2 text-gray-800"> {/* Negatif margin ile p-2'leri dengeler */}
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>Ad Soyad:</strong> {currentUser.profile.firstName} {currentUser.profile.lastName}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>Sicil No:</strong> {currentUser.name} {/* Auth::user()->name Blade'de sicil no idi */}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 p-2">
                                        <div className="px-4 py-3 bg-sky-100 rounded h-full">
                                            <strong>E-Mail:</strong> {currentUser.profile.email}
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
                                            <strong>İşe Başlama Tarihi:</strong> {formatDate(currentUser.profile.startyear)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="my-8">
                        <div className="container mx-auto">
                            <div className="border border-gray-200 shadow p-4 rounded">
                                <h2 className="text-xl p-4 bg-sky-500 text-white rounded mb-4">Talep Ekranı</h2>
                                <Link
                                    to="/yeni-tayin-talebi" // Bu yolun React Router'da tanımlı olması gerekir
                                    className="px-4 py-2 inline-block bg-teal-700 transition hover:bg-teal-600 text-white rounded"
                                >
                                    Tayin Talebinde Bulun!
                                </Link>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </MainLayout>
    );
}

export default DashboardPage;