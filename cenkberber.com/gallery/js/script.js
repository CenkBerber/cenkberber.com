document.addEventListener("DOMContentLoaded", function() {
    // Gallery container oluştur
    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'gallery-container';
    document.body.appendChild(galleryContainer);

    const gallery = document.createElement('div');
    gallery.className = 'gallery';
    galleryContainer.appendChild(gallery);

    const imageCount = 20;
    let animationsComplete = false;
    let current = 0;
    let target = 0;

    // RAF için cleanup ekleyin
    let rafId;

    // Resimleri oluştur
    const preloadImages = () => {
        const promises = [];
        for (let i = 1; i <= imageCount; i++) {
            promises.push(new Promise((resolve, reject) => {
                const img = new Image();
                img.src = `media/${i}.jpg`;
                img.onload = resolve;
                img.onerror = reject;
            }));
        }
        return Promise.all(promises);
    };

    // Mobil cihaz kontrolü
    const isMobile = window.innerWidth <= 768; // 768px altı mobil kabul edilsin

    if (isMobile) {
        // Mobil görünüm: Animasyonsuz ve dikey sıralama
        for (let i = 1; i <= imageCount; i++) {
            const img = document.createElement('img');
            img.src = `media/${i}.jpg`;
            img.style.display = 'block'; // Resmi blok element yap
            img.style.width = '95%'; // CSS'teki mobil genişliğiyle uyumlu
            img.style.height = 'auto';
            img.style.margin = '20px auto 5px auto'; // Dikey boşluk ve ortala
            img.dataset.imageId = i; // Modal için imageId ekle
            gallery.appendChild(img);

            img.onerror = function() {
                console.warn(`Resim yüklenemedi: media/${i}.jpg`);
                this.src = 'fallback.jpg';
            };
        }

        // Mobil görünümde yatay kaydırma ve animasyon mantığını atla
        animationsComplete = true; // Modalın açılması için true yap
        gallery.style.width = 'auto'; // Genişliği otomatik yap
        gallery.style.position = 'static'; // Pozisyonu statik yap
        gallery.style.display = 'block'; // Display block yap

         // Pencere boyutu değiştiğinde initGallery çağrılmasını engelle (isteğe bağlı)
        window.removeEventListener('resize', debounce(initGallery, 250));

    } else {
        // Masaüstü görünüm: Mevcut animasyon ve kaydırma mantığı
        for (let i = 1; i <= imageCount; i++) {
            const img = document.createElement('img');
            img.src = `media/${i}.jpg`;
            img.style.zIndex = i;
            img.dataset.originalZIndex = i;
            img.style.opacity = 0;
            img.style.position = 'absolute';
            img.style.left = '50%';
            img.style.top = '50%';
            img.style.transform = `translate(-50%, -50%) scale(0.5) rotate(${Math.random() * 10 - 5}deg)`;
            gallery.appendChild(img);

            setTimeout(() => {
                img.style.transition = `all 1s cubic-bezier(0.34, 1.56, 0.64, 1)`;
                img.style.opacity = 1;
                img.style.transform = `translate(-50%, -50%) scale(1) rotate(${Math.random() * 10 - 5}deg)`;
            }, i * 100);

            // Resim yükleme hatası kontrolü
            img.onerror = function() {
                console.warn(`Resim yüklenemedi: media/${i}.jpg`);
                this.src = 'fallback.jpg'; // Yedek resim göster
            };
        }

        // Dağılma animasyonuna geçiş
        setTimeout(() => {
            const images = document.querySelectorAll('.gallery img');
            
            // Ekranı grid şeklinde bölelim
            const cols = 4; // Yatayda kaç bölge
            const rows = 3; // Dikeyde kaç bölge
            
            const cellWidth = window.innerWidth / cols;
            const cellHeight = (window.innerHeight * 0.9) / rows; // Ekranın %90'ını kullan
            const topOffset = window.innerHeight * -0.1; // Üstten %10 boşluk bırak
            
            // Kullanılmış hücreleri takip edelim
            const usedCells = new Set();
            
            images.forEach((img) => {
                let cellX, cellY;
                let attempts = 0;
                
                // Boş bir hücre bulana kadar dene
                do {
                    cellX = Math.floor(Math.random() * cols);
                    cellY = Math.floor(Math.random() * rows);
                    attempts++;
                } while (usedCells.has(`${cellX}-${cellY}`) && attempts < 20);
                
                usedCells.add(`${cellX}-${cellY}`);
                
                // Hücre içinde rastgele bir pozisyon bul
                const padding = 50;
                const randomX = (cellX * cellWidth) + padding + Math.random() * (cellWidth - padding * 2);
                const randomY = topOffset + (cellY * cellHeight) + padding + Math.random() * (cellHeight - padding * 2);
                
                const randomRotate = Math.random() * 20 - 10;
                
                img.style.transition = `all 1s cubic-bezier(0.33, 0.00, 0.00, 1.00)`;
                img.style.transform = `translate(0, 0) rotate(${randomRotate}deg)`;
                img.style.left = `${randomX}px`;
                img.style.top = `${randomY}px`;
            });

            // Toplama animasyonuna geçiş
            setTimeout(() => {
                const imageWidth = 200;
                const gap = 20;
                
                images.forEach((img, index) => {
                    const targetX = index * (imageWidth + gap);
                    img.dataset.originalX = targetX;
                    
                    // Daha yumuşak bir easing kullanıyoruz
                    img.style.transition = 'all 0.75s cubic-bezier(0.33, 0.00, 0.00, 1.00)';
                    
                    img.style.transform = 'rotate(0deg) scale(1)';
                    img.style.left = `${targetX}px`;
                    img.style.top = '50%';
                    img.style.transform = 'translateY(-50%)';
                });

                gallery.style.width = `${imageCount * (imageWidth + gap) - gap}px`;
                
                setTimeout(() => {
                    galleryContainer.scrollLeft = 0;
                    animationsComplete = true;
                    
                    // Resimlerin yeni boyutlarını ayarla
                    const images = document.querySelectorAll('.gallery img');
                    const newGap = 25;
                    const leftPadding = 512;
                    
                    images.forEach((img, index) => {
                        img.style.width = '80px';
                        img.style.height = '200px';
                        img.style.marginRight = '0px';
                        img.style.borderRadius = '2px';                            
                        
                        const targetX = leftPadding + index * (80 + newGap);
                        img.style.left = `${targetX}px`;
                    });
                    
                    // Galeri genişliğini güncelle
                    gallery.style.width = `${leftPadding + imageCount * (80 + newGap) - newGap}px`;
                    
                    // Lerp fonksiyonu
                    const lerp = (start, end, factor) => (1 - factor) * start + factor * end;
                    
                    let current = 0;
                    let target = 0;
                    let ease = 0.075; // Yumuşaklık faktörü
                    
                    // Scroll limitlerini hesapla
                    const limit = {
                        min: 0,
                        max: gallery.offsetWidth - window.innerWidth
                    };

                    function smoothScroll() {
                        target = Math.max(Math.min(target, limit.max), limit.min);
                        current = lerp(current, target, ease);
                        current = parseFloat(current.toFixed(2));
                        gallery.style.transform = `translateX(${-current}px)`;
                        rafId = requestAnimationFrame(smoothScroll);
                    }

                    // Animasyonu başlat
                    requestAnimationFrame(smoothScroll);

                    // Mouse wheel eventi
                    galleryContainer.addEventListener('wheel', (e) => {
                        if (!animationsComplete) return;
                        
                        e.preventDefault();
                        
                        // Scroll miktarını ayarla
                        const scrollSpeed = 1.25; // Scroll hızı çarpanı
                        target += e.deltaY * scrollSpeed;
                    }, { passive: false });

                    // Touch ve Mouse sürükleme için
                    let isDragging = false;
                    let startX;
                    let startTarget;

                    const onPointerDown = (e) => {
                        isDragging = true;
                        galleryContainer.style.cursor = 'grabbing';
                        startX = e.pageX || e.touches[0].pageX;
                        startTarget = target;

                        // Event listeners
                        window.addEventListener('mousemove', onPointerMove);
                        window.addEventListener('touchmove', onPointerMove);
                        window.addEventListener('mouseup', onPointerUp);
                        window.addEventListener('touchend', onPointerUp);
                    };

                    const onPointerMove = (e) => {
                        if (!isDragging) return;
                        
                        const x = e.pageX || e.touches[0].pageX;
                        const diff = (startX - x) * 1.5;
                        target = startTarget + diff;
                    };

                    const onPointerUp = () => {
                        isDragging = false;
                        galleryContainer.style.cursor = 'grab';
                        
                        window.removeEventListener('mousemove', onPointerMove);
                        window.removeEventListener('touchmove', onPointerMove);
                        window.removeEventListener('mouseup', onPointerUp);
                        window.removeEventListener('touchend', onPointerUp);
                    };

                    // Event listeners ekle
                    galleryContainer.addEventListener('mousedown', onPointerDown);
                    galleryContainer.addEventListener('touchstart', onPointerDown);

                }, 800);

            }, 1200);

        }, imageCount * 100 + 800);
    }

    // Modal işlemleri için class oluşturalım
    class Modal {
        constructor() {
            this.modal = document.getElementById('imageModal');
            this.overlay = this.modal.querySelector('.modal-overlay');
            this.closeBtn = this.modal.querySelector('.modal-close');
            this.container = this.modal.querySelector('.modal-container');
            this.image = this.modal.querySelector('.modal-image'); // Modal içindeki img elementi
            this.currentElement = null;
            this.currentImageId = null;
            this.totalImages = imageCount;
            this.bindEvents();
        }

        bindEvents() {
            this.closeBtn.addEventListener('click', () => this.close());
            this.overlay.addEventListener('click', () => this.close());
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.close();
            });
            
            // Klavye navigasyonu için
            document.addEventListener('keydown', (e) => {
                if (!this.modal.classList.contains('active')) return;
                
                if (e.key === 'Escape') this.close();
            });
        }

        navigate(direction) {
            if (!this.currentImageId) return;

            let nextId;
            if (direction === 'prev') {
                nextId = this.currentImageId - 1;
                if (nextId < 1) nextId = this.totalImages;
            } else {
                nextId = this.currentImageId + 1;
                if (nextId > this.totalImages) nextId = 1;
            }

            const nextImage = document.querySelector(`.gallery img[data-image-id="${nextId}"]`);
            if (nextImage) {
                // currentElement'i güncelle
                this.currentElement = nextImage;
                
                // Geçiş animasyonu
                this.modal.classList.add('transitioning');
                this.container.style.opacity = '0';
                
                setTimeout(() => {
                    this.open(nextId, nextImage);
                    requestAnimationFrame(() => {
                        this.container.style.opacity = '1';
                        this.modal.classList.remove('transitioning');
                    });
                }, 300);
            }
        }

        open(imageId, clickedElement) {
            this.currentImageId = parseInt(imageId);
            this.currentElement = clickedElement;
            
            const rect = clickedElement.getBoundingClientRect();
            
            this.image.src = clickedElement.src;
            this.modal.style.display = 'block';
            
            // Başlangıç pozisyonunu ayarla
            this.container.style.width = `${rect.width}px`;
            this.container.style.height = `${rect.height}px`;
            this.container.style.top = `${rect.top}px`;
            this.container.style.left = `${rect.left}px`;
            
            // Bir sonraki frame'de animasyonu başlat
            requestAnimationFrame(() => {
                this.modal.classList.add('active');
                
                // Final pozisyonunu hesapla
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const finalWidth = Math.min(1200, windowWidth * 0.9);
                const finalHeight = windowHeight * 0.9;
                
                // Final pozisyonuna animasyon
                this.container.style.width = `${finalWidth}px`;
                this.container.style.height = `${finalHeight}px`;
                this.container.style.top = `${(windowHeight - finalHeight) / 2}px`;
                this.container.style.left = `${(windowWidth - finalWidth) / 2}px`;

                // Ana pencereye modalın açıldığını bildir
                if (window.parent) {
                    window.parent.postMessage('modal-open', '*');
                }
            });
        }

        close() {
            if (!this.currentElement) return;
            
            const rect = this.currentElement.getBoundingClientRect();
            this.modal.classList.add('closing');
            this.modal.classList.remove('active');
            
            // Kapanış animasyonunu başlat
            requestAnimationFrame(() => {
                // Mevcut galeri resminin gerçek boyutlarını al
                const galleryImageWidth = rect.width;
                const galleryImageHeight = rect.height;
                
                // Modal içeriğini küçült
                this.container.style.width = `80px`;
                this.container.style.height = `${galleryImageHeight}px`;
                this.container.style.top = `${rect.top}px`;
                this.container.style.left = `${rect.left}px`;
                
            
                
            });
            
            // Animasyon bitince temizle
            setTimeout(() => {
                this.modal.classList.remove('closing');
                this.modal.style.display = 'none';
                this.image.src = '';
                document.body.style.overflow = '';
                this.currentElement = null;
                
                // Tüm stilleri sıfırla
                this.container.style = '';
                this.image.style = '';

                // Ana pencereye modalın kapandığını bildir
                if (window.parent) {
                    window.parent.postMessage('modal-close', '*');
                }

            }, 250);
        }
    }

    // Modal nesnesini oluştur
    const modal = new Modal();

    // Resimlere tıklama olayını ekle
    function addImageClickHandlers() {
        const images = document.querySelectorAll('.gallery img');
        images.forEach((img, index) => {
            img.dataset.imageId = index + 1; // Resim ID'sini data attribute olarak ekle
            img.addEventListener('click', () => {
                if (animationsComplete) {
                    modal.open(index + 1, img);
                }
            });
        });
    }

    // Masaüstü görünümde tıklama olaylarını ekle
    if (!isMobile) {
        setTimeout(() => {
             addImageClickHandlers();
        }, imageCount * 100 + 2000);
    }
});

// Temizleme fonksiyonu
function cleanup() {
    cancelAnimationFrame(rafId);
    galleryContainer.removeEventListener('mousedown', onPointerDown);
    galleryContainer.removeEventListener('touchstart', onPointerDown);
    galleryContainer.removeEventListener('wheel', wheelHandler);
}

// Galeri için responsive değerler
function initGallery() {
    const images = document.querySelectorAll('.gallery img');
    const newGap = clamp(15, window.innerWidth * 0.02, 25); // Responsive boşluk
    const leftPadding = clamp(25, window.innerWidth * 0.03, 50); // Responsive padding
    
    images.forEach((img, index) => {
        const targetX = leftPadding + index * (img.offsetWidth + newGap);
        img.style.left = `${targetX}px`;
    });
    
    gallery.style.width = `${leftPadding + imageCount * (images[0].offsetWidth + newGap) - newGap}px`;
}

// Yardımcı fonksiyon
function clamp(min, value, max) {
    return Math.min(Math.max(value, min), max);
}

// Pencere boyutu değiştiğinde galeriyi güncelle
window.addEventListener('resize', debounce(initGallery, 250));

// Debounce fonksiyonu
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}