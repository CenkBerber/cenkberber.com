// Eğer localStorage'da tema kaydı yoksa, sistem temasını uygula
(function() {
    if (!localStorage.getItem('theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
})();

// AOS başlat
AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// Minimap oluşturma fonksiyonu
async function createMinimap() {
    const mainContent = document.querySelector('main');
    const minimapContainer = document.querySelector('.minimap-container');
    
    try {
        const canvas = await html2canvas(mainContent, {
            scale: 0.1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-color'),
            logging: true,
            width: mainContent.offsetWidth,
            height: mainContent.offsetHeight,
            onclone: (clonedDoc) => {
                // AOS animasyonlarını kaldır
                const clonedElements = clonedDoc.querySelectorAll('[data-aos]');
                clonedElements.forEach(el => {
                    el.removeAttribute('data-aos');
                    el.removeAttribute('data-aos-delay');
                });

                // Gereksiz elementleri gizle
                const elementsToHide = clonedDoc.querySelectorAll('.mobile-menu-btn, .mobile-menu, .menu-overlay, .welcome-overlay');
                elementsToHide.forEach(el => el.style.display = 'none');

                // Hero elementlerinin animasyonlarını kaldır ve görünür yap
                const heroElements = clonedDoc.querySelectorAll('.hero-greeting-wrapper, .hero-title, .hero-subtitle, .hero-bio, .hero-actions, .hero-image-wrapper');
                heroElements.forEach(el => {
                    el.style.animation = 'none';
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                    el.style.filter = 'none';
                    el.style.visibility = 'visible';
                    el.style.display = 'block';
                });

                // Hero başlığını tamamen sadeleştir ve düz metinle değiştir
                const heroTitle = clonedDoc.querySelector('.hero-title');
                if (heroTitle) {
                    const span = clonedDoc.createElement('span');
                    span.textContent = heroTitle.textContent;
                    span.style.color = '#1e293b';
                    span.style.fontSize = '3.5rem';
                    span.style.fontWeight = '800';
                    span.style.display = 'block';
                    heroTitle.parentNode.replaceChild(span, heroTitle);
                }
                // İletişim başlığını da sadeleştir
                const contactTitle = clonedDoc.querySelector('.contact-text h3');
                if (contactTitle) {
                    const span = clonedDoc.createElement('span');
                    span.textContent = contactTitle.textContent;
                    span.style.color = '#1e293b';
                    span.style.fontSize = '2.5rem';
                    span.style.fontWeight = '700';
                    span.style.display = 'block';
                    contactTitle.parentNode.replaceChild(span, contactTitle);
                }

                // Gradient başlıkları düzelt
                const gradientTitles = clonedDoc.querySelectorAll('.hero-title, .contact-text h3');
                gradientTitles.forEach(title => {
                    title.style.background = 'none';
                    title.style.backgroundImage = 'none';
                    title.style.color = '#1e293b'; // düz renk
                    title.style.webkitBackgroundClip = 'unset';
                    title.style.webkitTextFillColor = 'unset';
                    title.style.backgroundClip = 'unset';
                });
                // Pseudo-elementleri tamamen gizle (başlık altı çizgiler dahil)
                const style = clonedDoc.createElement('style');
                style.textContent = `
                    .hero-title::before, .hero-title::after,
                    .contact-text h3::before, .contact-text h3::after,
                    .section-title::after {
                        display: none !important;
                        content: none !important;
                        background: none !important;
                    }
                `;
                clonedDoc.head.appendChild(style);

                // Section başlıklarını da sadeleştir
                const sectionTitles = clonedDoc.querySelectorAll('.section-title');
                sectionTitles.forEach(title => {
                    const span = clonedDoc.createElement('span');
                    span.textContent = title.textContent;
                    span.style.color = '#1e293b';
                    span.style.fontSize = '2.5rem';
                    span.style.fontWeight = '700';
                    span.style.display = 'block';
                    title.parentNode.replaceChild(span, title);
                });
            }
        });

        // Canvas'ı minimap container'a ekle
        minimapContainer.innerHTML = '';
        minimapContainer.appendChild(canvas);
        
        // Canvas'ı container'a sığdır
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'cover';
    } catch (error) {
        console.error('Minimap oluşturma hatası:', error);
        minimapContainer.innerHTML = `
            <div style="
                width: 100%;
                height: 100%;
                background: var(--card-bg);
                border: 1px solid var(--border-color);
                border-radius: 6px;
            "></div>
        `;
    }
}

// Sayfa yüklendiğinde ve resize olduğunda minimap'i güncelle
window.addEventListener('load', () => {
    setTimeout(createMinimap, 1000); // Sayfa tam yüklendiğinden emin olmak için biraz bekle
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(createMinimap, 250);
});

// Tema değiştiğinde minimap'i güncelle
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
            setTimeout(createMinimap, 250);
        }
    });
});

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});

// Scroll olayını dinle ve minimap'i güncelle
window.addEventListener('scroll', () => {
    updateMinimap();
}, { passive: true });

// Minimap indikatörü için scroll olayı
const minimapDots = document.querySelectorAll('.minimap-dot');
const sections = document.querySelectorAll('section');
const minimapContainer = document.querySelector('.minimap-container');

function updateMinimap() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const currentScroll = window.scrollY;
    
    // Scroll yüzdesini doğrudan hesapla
    const scrollPercentage = (currentScroll) / (documentHeight - windowHeight) * 100;
    
    // İndikatör pozisyonunu güncelle
    const containerHeight = minimapContainer.offsetHeight;
    const indicatorHeight = 40;
    const maxOffset = containerHeight - indicatorHeight;
    const offset = Math.min(Math.max((scrollPercentage / 100) * maxOffset, 0), maxOffset);
    
    minimapContainer.style.setProperty('--indicator-offset', `${offset}px`);

    // Aktif bölümü belirle
    let currentSection = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (currentScroll + (windowHeight / 2) >= sectionTop && 
            currentScroll + (windowHeight / 2) <= sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    // Aktif noktayı güncelle
    minimapDots.forEach(dot => {
        dot.classList.remove('active');
        if (dot.getAttribute('data-section') === currentSection) {
            dot.classList.add('active');
        }
    });
}

// Minimap noktalarına tıklama olayı
minimapDots.forEach(dot => {
    dot.addEventListener('click', () => {
        const sectionId = dot.getAttribute('data-section');
        const targetSection = document.getElementById(sectionId);
        
        if (targetSection) {
            lenis.scrollTo(targetSection, {
                offset: 0,
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        }
    });
});

// Galeri fonksiyonları ve tema değiştirme için ortak değişkenler
const galleryOverlay = document.querySelector('.gallery-overlay');
const galleryFrame = document.getElementById('galleryFrame');
const galleryTrigger = document.getElementById('galleryTrigger');
const galleryTriggerMobile = document.getElementById('galleryTriggerMobile');
const galleryClose = document.querySelector('.gallery-close');
const darkModeToggle = document.getElementById('darkModeToggle');
const htmlElement = document.documentElement;

// Mesaj dinleyici ekle
window.addEventListener('message', function(event) {
    // Güvenlik kontrolü: Mesajın beklenen kaynaktan geldiğinden emin olun
    // Gerçek bir uygulamada, kaynağı (origin) kontrol etmek çok önemlidir.
    // if (event.origin !== 'http://izinverilen-kaynak.com') return;

    if (event.data === 'modal-open') {
        // Modal açıldı, galeri kapatma butonunu gizle (CSS ile)
        galleryClose.classList.add('hidden-on-modal');
    } else if (event.data === 'modal-close') {
        // Modal kapandı, galeri kapatma butonunu göster (CSS ile)
        galleryClose.classList.remove('hidden-on-modal');
    }
});

// Galeri fonksiyonları
let scrollPosition = 0;
let galleryOriginX = 0;
let galleryOriginY = 0;

function openGallery(e) {
    // Mevcut scroll pozisyonunu kaydet
    scrollPosition = window.scrollY;
    
    // Tıklanan elementin pozisyonunu al
    const trigger = e.currentTarget;
    const rect = trigger.getBoundingClientRect();
    
    // Başlangıç pozisyonunu kaydet
    galleryOriginX = rect.left + (rect.width / 2);
    galleryOriginY = rect.top + (rect.height / 2);
    
    // CSS değişkenlerini ayarla
    galleryOverlay.style.setProperty('--origin-x', `${galleryOriginX}px`);
    galleryOverlay.style.setProperty('--origin-y', `${galleryOriginY}px`);
    
    // Animasyon sınıfını ekle
    galleryOverlay.classList.add('animating');
    
    // Galeriyi aç
    galleryFrame.src = 'gallery/gallery.html';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollPosition}px`;
    galleryOverlay.classList.add('active');
    
    // Mobil menüyü kapat
    if (window.innerWidth <= 768) {
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
    }
}

function closeGallery() {
    // Kaydedilen başlangıç pozisyonunu kullan
    galleryOverlay.style.setProperty('--origin-x', `${galleryOriginX}px`);
    galleryOverlay.style.setProperty('--origin-y', `${galleryOriginY}px`);

    // Kapanma animasyonunu başlat
    galleryOverlay.classList.add('closing');

    // Mobil görünümde kaydırmayı hemen yap
    if (window.innerWidth <= 768) {
        window.scrollTo(0, 0); // Mobil: Sayfanın en üstüne normal scroll
    }

    // Animasyon tamamlandıktan sonra galeriyi kapat
    setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        galleryOverlay.classList.remove('active', 'closing', 'animating');

        // Kaydedilen scroll pozisyonuna geri dön (veya ana sayfaya kaydır)
        // Masaüstü: Lenis ile smooth scroll (timeout içinde kalır)
        if (window.innerWidth > 768 && lenis) {
            lenis.scrollTo('#hero', {
                offset: 0,
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        }

        // iframe'i temizle
        galleryFrame.src = 'about:blank';
    }, 250); // Gecikme süresi azaltıldı
}

// Galeri event listener'ları
if (galleryTrigger) {
    galleryTrigger.addEventListener('click', openGallery);
}

if (galleryTriggerMobile) {
    galleryTriggerMobile.addEventListener('click', openGallery);
}

const aboutGalleryTrigger = document.getElementById('aboutGalleryTrigger');
if (aboutGalleryTrigger) {
    aboutGalleryTrigger.addEventListener('click', openGallery);
}

if (galleryClose) {
    galleryClose.addEventListener('click', closeGallery);
}

// ESC tuşu ile kapatma
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && galleryOverlay.classList.contains('active')) {
        closeGallery();
    }
});

// Galeri overlay'ine tıklama ile kapatma
galleryOverlay.addEventListener('click', (e) => {
    // Eğer tıklanan element overlay'in kendisiyse (içeriğe değilse) kapat
    if (e.target === galleryOverlay) {
        closeGallery();
    }
});

// Karanlık mod
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);

darkModeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Geçiş başlamadan önce performans optimizasyonu
    requestAnimationFrame(() => {
        // Tema değişikliğini uygula
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Galeri iframe'ine tema değişikliğini ilet
        if (galleryFrame && galleryFrame.contentWindow) {
            galleryFrame.contentWindow.postMessage(newTheme, '*');
        }
        
        // Tema değişikliğinde minimap'i güncelle
        requestAnimationFrame(() => {
            setTimeout(createMinimap, 100);
        });
    });
});

// Lenis smooth scroll
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 2
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Sayfa içi linkler için smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                lenis.scrollTo(target, {
                    offset: 0,
                    duration: 1.2,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            }
        }
    });
});

// Karşılama ekranı
window.addEventListener('load', () => {
    setTimeout(() => {
        const welcomeOverlay = document.querySelector('.welcome-overlay');
        welcomeOverlay.classList.add('hide');
        
        // Hero elementlerini seç
        const heroElements = document.querySelectorAll('.hero-greeting-wrapper, .hero-title, .hero-subtitle, .hero-bio, .hero-actions, .hero-image-wrapper');
        
        // Animasyonları sıfırla ve yeniden başlat
        heroElements.forEach(element => {
            element.style.animation = 'none';
            element.offsetHeight; // Reflow
            element.style.animation = null;
        });
        
        setTimeout(() => {
            welcomeOverlay.style.display = 'none';
            animateNavLinks(); // Preloader tamamen kaybolduktan sonra nav-link animasyonunu başlat
        }, 500);
    }, 3000);
});

// Minimap container'a tıklama olayı
minimapContainer.addEventListener('click', (e) => {
    const containerRect = minimapContainer.getBoundingClientRect();
    const clickY = e.clientY - containerRect.top;
    const containerHeight = containerRect.height;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    const clickPercentage = clickY / containerHeight;
    
    lenis.scrollTo(documentHeight * clickPercentage, {
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Minimap'i oluştur
    createMinimap();
});

// Hero animasyonlarını başlat
function startHeroAnimations() {
    const heroElements = [
        { selector: '.hero-greeting-wrapper', delay: 200 },
        { selector: '.hero-title', delay: 400 },
        { selector: '.hero-subtitle', delay: 600 },
        { selector: '.hero-bio', delay: 800 },
        { selector: '.hero-actions', delay: 1000 },
        { selector: '.hero-image-wrapper', delay: 1200 },
    ];

    heroElements.forEach(({ selector, delay }) => {
        const element = document.querySelector(selector);
        if (element) {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'none';
            }, delay);
        }
    });
}

// Navigasyon linklerine animasyon ekle
function animateNavLinks() {
    const navLinks = document.querySelectorAll('.nav-link');
    const themeToggle = document.getElementById('darkModeToggle');
    const languageToggle = document.getElementById('languageToggle');
    const allNavItems = [...navLinks, themeToggle, languageToggle];
    allNavItems.forEach((item, i) => {
        setTimeout(() => {
            item.classList.add('animated');
        }, 200 + i * 80);
    });
}

// Dil değiştirme fonksiyonları
const translations = {
    tr: {
        "page-title": "CB | Portföy",
        "copyright": "© 2025 Cenk Berber. Tüm hakları saklıdır.",
        welcome: "Hoş Geldiniz",
        performance: "Performans",
        loading: "Yükleme",
        experience: "Deneyim",
        home: "Ana Sayfa",
        about: "Hakkımda",
        projects: "Projeler",
        contact: "İletişim",
        gallery: "Galeri",
        "view-gallery": "Galeriye Git",
        hello: "Merhaba, Ben",
        "hero-title": "Fikirleri Piksellere Dönüştürüyorum",
        "hero-subtitle": "Yazılım Geliştiricisi ve Web Tasarımcısı",
        "hero-bio": "Modern web tasarımları ve Windows sistemleri konusunda uzmanlaşmış bir yazılım geliştiricisiyim.",
        "contact-me": "İletişime Geç",
        "view-projects": "Projeleri İncele",
        "lets-work": "Birlikte Çalışalım!",
        "work-description": "Liderlik vasfı yüksek, takım çalışmasına yatkın ve koordineli çalışmaya uygun bir birey olarak iş tekliflerine her zaman açığım.",
        "years-experience": "Yıl Deneyim",
        available: "Müsait",
        "about-title": "Akıcı animasyonlara bayılıyorum!",
        "about-text-1": "Merhaba! Ben Cenk Berber. Modern ve kullanıcı dostu web arayüzleri geliştiren tutkulu bir web geliştiricisiyim.",
        "about-text-2": "Web arayüzleri geliştirmemin yanı sıra, özel olarak temiz ve akıcı bir kullanıcı deneyimi sunan özelleştirilmiş Windows imajları oluşturuyorum.",
        "about-text-3": "Akıcı animasyonlar, kaliteli kullanıcı deneyimi ve göze hitap eden tasarımlar gibi konularla ilgilenmemin yanı sıra mobil fotoğrafçılık ile ilgileniyorum.",
        skills: "Yeteneklerim",
        frontend: "Frontend ve Tasarım",
        programming: "Programlama Dilleri",
        hobbies: "Hobi Olarak",
        "lets-work-together": "Birlikte Çalışalım",
        "contact-description": "Projeniz veya iş birliği fırsatları için benimle iletişime geçebilirsiniz.",
        email: "E-posta",
        linkedin: "LinkedIn",
        twitter: "Twitter / X",
        telegram: "Telegram",
        github: "GitHub",
        location: "Konum",
        city: "İzmit, Kocaeli",
        windows: "Microsoft Windows",
        ai: "Yapay Zeka Teknolojileri",
        automation: "Otomasyon Yazılımları",
        robotics: "Robotik Kodlama",
        language: "Dil",
        theme: "Tema",
        "project1-title": "Kişisel Web Sitem",
        "project1-desc": "Portföyümü sunmak ve kendimi tanıtmak için oluşturduğum web sitesinin kaynak kodları burada.",
        "project2-title": "rOctopus 7134",
        "project2-desc": "FRC'nin düzenlemiş olduğu robotik kodlama yarışmalarına yazılım gelişticisi olarak katıldım."
    },
    en: {
        "page-title": "CB | Portfolio",
        "copyright": "© 2025 Cenk Berber. All rights reserved.",
        welcome: "Welcome",
        performance: "Performance",
        loading: "Loading",
        experience: "Experience",
        home: "Home",
        about: "About",
        projects: "Projects",
        contact: "Contact",
        gallery: "Gallery",
        "view-gallery": "View Gallery",
        hello: "Hello, I'm",
        "hero-title": "Turning Ideas into Pixels",
        "hero-subtitle": "Software Developer and Web Designer",
        "hero-bio": "I am a software developer specialized in modern web designs and Windows systems.",
        "contact-me": "Contact Me",
        "view-projects": "View Projects",
        "lets-work": "Let's Work Together!",
        "work-description": "As an individual with high leadership qualities, team-oriented and suitable for coordinated work, I am always open to job offers.",
        "years-experience": "Years Experience",
        available: "Available",
        "about-title": "I love smooth animations!",
        "about-text-1": "Hello! I'm Cenk Berber. I am a passionate web developer who creates modern and user-friendly web interfaces.",
        "about-text-2": "In addition to developing web interfaces, I create customized Windows images that offer a clean and smooth user experience.",
        "about-text-3": "In addition to my interest in smooth animations, quality user experience, and visually appealing designs, I am also interested in mobile photography.",
        skills: "Skills",
        frontend: "Frontend and Design",
        programming: "Programming Languages",
        hobbies: "As Hobbies",
        "lets-work-together": "Let's Work Together",
        "contact-description": "You can contact me for your project or collaboration opportunities.",
        email: "Email",
        linkedin: "LinkedIn",
        twitter: "Twitter / X",
        telegram: "Telegram",
        github: "GitHub",
        location: "Location",
        city: "Izmit, Kocaeli",
        windows: "Microsoft Windows",
        ai: "Artificial Intelligence Technologies",
        automation: "Automation Softwares",
        robotics: "Robotics Software",
        language: "Language",
        theme: "Theme",
        "project1-title": "Personal Portfolio",
        "project1-desc": "Source code of the website that I created for my portfolio.",
        "project2-title": "rOctopus 7134",
        "project2-desc": "I participated in robotics competitions organized by FRC as a member of the 'rOctopus 7134' team."
    }
};

let currentLanguage = localStorage.getItem('language') || 'tr';
const languageToggle = document.getElementById('languageToggle');
const languageText = languageToggle.querySelector('.language-text');

function updateLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    languageText.textContent = lang.toUpperCase();

    document.querySelectorAll('[data-tr]').forEach(element => {
        const key = element.getAttribute('data-tr');
        if (translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else if (element.tagName === 'TITLE') {
                document.title = translations[lang][key];
            } else {
                // Hero başlığı için özel işlem
                if (element.classList.contains('hero-title')) {
                    element.textContent = translations[lang][key];
                    element.setAttribute('data-text', translations[lang][key]);
                } else if (element.tagName === 'SPAN') {
                    // Sadece span elementlerinin içeriğini güncelle
                    element.textContent = translations[lang][key];
                } else if (!element.querySelector('i')) {
                    // İkon içermeyen elementlerin içeriğini güncelle
                    element.textContent = translations[lang][key];
                }
            }
        }
    });
}

languageToggle.addEventListener('click', () => {
    const newLang = currentLanguage === 'tr' ? 'en' : 'tr';
    updateLanguage(newLang);
});

// Sayfa yüklendiğinde dil ayarını uygula
document.addEventListener('DOMContentLoaded', () => {
    updateLanguage(currentLanguage);
});