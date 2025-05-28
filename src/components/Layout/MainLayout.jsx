import React, { useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
const MainLayout = ({ children, pageTitle = "Sayfa Başlığı", pageDescription = "Varsayılan açıklama." }) => {
    useEffect(() => {
        document.title = `${pageTitle} - Personel Tayin Talebi Uygulaması`;

        // Basit meta description ayarı (Örnek - react-helmet-async daha iyi bir çözümdür)
        let descriptionMeta = document.querySelector('meta[name="description"]');
        if (!descriptionMeta) {
            descriptionMeta = document.createElement('meta');
            descriptionMeta.setAttribute('name', 'description');
            document.head.appendChild(descriptionMeta);
        }
        descriptionMeta.setAttribute('content', pageDescription);

    }, [pageTitle, pageDescription]);

    return (
        <>
            <header>
                <section className="bg-gradient-to-l from-sky-600 to-white">
                    <div className="container mx-auto py-4">
                        <div className="flex flex-row items-center justify-between">
                            <div className="logo flex flex-row gap-4 items-center">
                                <img
                                    src="https://pgm.adalet.gov.tr/Assets/front/images/logo.png"
                                    alt="Adalet Bakanlığı"
                                    style={{ height: '75px' }}
                                />
                                {/* React Router kullanıyorsanız <Link to="/"> kullanın */}
                                <a href="/public">
                                    <h1 className="text-3xl text-red-600 font-semibold">Personel Genel Müdürlüğü</h1>
                                </a>
                            </div>
                            <div className="social flex flex-row gap-3">
                                <a href="https://www.instagram.com/adaletpgm/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200">
                                    <i className="bi bi-instagram text-lg"></i>
                                </a>
                                <a href="https://www.facebook.com/AdaletPGM" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200">
                                    <i className="bi bi-facebook text-lg"></i>
                                </a>
                                <a href="https://twitter.com/AdaletPGM" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200">
                                    <i className="bi bi-twitter-x text-lg"></i>
                                </a>
                                <a href="https://www.youtube.com/@adaletbakanligi" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200">
                                    <i className="bi bi-youtube text-lg"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </header>

            <main className="min-h-[calc(100vh-230px)]">
                {children}
            </main>

            <footer>
                <div className="bg-sky-800 text-center text-gray-200 py-5">
          <span className="block">
            Copyright © {new Date().getFullYear()} - Personel Tayin Talebi Uygulaması. Tüm hakları saklıdır.
          </span>
                    <a
                        href="mailto:abdullahgoksal@outlook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:text-white text-sm transition mt-3"
                    >
                        Tasarım ve Kodlaması <span className="font-medium"><i className="bi bi-code-slash text-gray-50"></i> Abdullah GÖKSAL - 204376</span> tarafından yapılmıştır.
                    </a>
                </div>
            </footer>
        </>
    );
};

export default MainLayout;