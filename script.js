/* ==========================================================================
   PANAGOS THEODOROS - CLASSICAL GUITAR PORTFOLIO (COMPLETE LOGIC)
   ========================================================================== */


// 1. KILL NATIVE SCROLL RESTORATION (Prevents Instagram browser from remembering scroll)
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// 2. CLEAR HIDDEN HASHES (If the URL accidentally has #videos attached to it)
if (window.location.hash) {
    window.history.replaceState(null, null, window.location.pathname);
}

// 3. AGGRESSIVE FORCE-TOP AFTER FULL LOAD (Beats the dynamic JSON loading jump)
window.addEventListener('load', () => {
    setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 50); // Small delay guarantees the browser respects the command
});



   document.addEventListener("DOMContentLoaded", () => {
    
    // Global State Variables
    let currentAudio = null;
    let currentBtn = null;
    let filteredCards = [];
    let visibleVideosCount = 0;

    // --- 1. SCROLL PROGRESS BAR ---
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const progressEl = document.getElementById("scroll-progress");
        if (progressEl) progressEl.style.width = scrolled + "%";
    });

    // --- 2. SMART NAVBAR & PARALLAX HERO ---
    const nav = document.getElementById('main-nav');
    const heroContent = document.querySelector('.hero-content-wrapper');
    
    if (nav) {
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            // Subtle Parallax effect on Hero
            if (heroContent && currentScrollY < 800) {
                heroContent.style.transform = `translateY(${currentScrollY * 0.2}px)`;
                heroContent.style.opacity = 1 - (currentScrollY / 700);
            }

            // Navbar Hide/Show logic
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                nav.classList.add('navbar--hidden');
            } else {
                nav.classList.remove('navbar--hidden');
            }
            lastScrollY = currentScrollY;
        });
    }

    // --- 3. SCROLL REVEAL ENGINE ---
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    function refreshReveal() {
        document.querySelectorAll('.fade-up').forEach(el => revealObserver.observe(el));
    }

    // --- 4. UNIVERSAL IMAGE MODAL LOGIC ---
    const imageModal = document.getElementById("image-modal");
    const modalImg = document.getElementById("full-modal-img");
    const closeImageModalBtn = document.getElementById("close-image-modal");

    function openImageModal(imageSrc) {
        if (imageModal && modalImg) {
            modalImg.src = imageSrc;
            imageModal.style.display = "flex";
            document.body.style.overflow = "hidden";
        }
    }

    if (closeImageModalBtn) {
        closeImageModalBtn.addEventListener("click", () => {
            imageModal.style.display = "none";
            document.body.style.overflow = "auto";
        });
    }

    // --- 5. HELPER: STOP ALL MEDIA ---
    function stopAllMedia() {
        // Stop YouTube iframes
        document.querySelectorAll('iframe').forEach(iframe => {
            const src = iframe.src;
            iframe.src = src; 
        });

        // Stop Audio
        if (currentAudio) {
            currentAudio.pause();
            if (currentBtn) {
                currentBtn.querySelector('i').classList.replace('fa-circle-pause', 'fa-circle-play');
            }
        }
    }

    // --- 6. DYNAMIC DATA LOADER ---
    async function loadPortfolioData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error("Data load failed");
            const data = await response.json();

            // Render Videos
            const videoGrid = document.getElementById('video-grid');
            if (videoGrid && data.videos) {
                videoGrid.innerHTML = data.videos.map(video => {
                    const videoType = video.type || 'Classical guitar cover';
                    const embedUrl = video.embedUrl.includes('?') ? `${video.embedUrl}&enablejsapi=1` : `${video.embedUrl}?enablejsapi=1`;
                    return `
                    <div class="artwork-card video-card" data-title="${video.searchTags}" data-type="${videoType}">
                        <div class="video-wrapper">
                            <iframe src="${embedUrl}" allowfullscreen loading="lazy"></iframe>
                        </div>
                        <div class="artwork-caption">
                            <p class="art-title">${video.title}</p>
                            <p class="art-details">${videoType}</p>
                            <span class="theater-trigger" data-url="${embedUrl}" data-title="${video.title}" data-details="${videoType}">
                                <i class="fa-solid fa-expand"></i> Theater Mode
                            </span>
                        </div>
                    </div>`;
                }).join('');
            }

            // Render Scores
            const scoreGrid = document.getElementById('score-grid');
            if (scoreGrid && data.scores) {
                scoreGrid.innerHTML = data.scores.map(score => {
                    const notationHtml = score.notationType ? `<span style="color: var(--accent);"> • ${score.notationType}</span>` : '';
                    return `
                    <div class="score-card fade-up" data-title="${score.searchTags}">
                        <div class="score-image-wrapper">
                            <img src="${score.imageUrl || 'images/cv-classical-guitar.jpg'}" alt="${score.title}" loading="lazy">
                            <div class="score-preview-label">Preview</div>
                        </div>
                        <div class="score-info">
                            <div>
                                <h3 class="score-title">${score.title}</h3>
                                <span class="score-type">${score.type}${notationHtml}</span>
                                ${score.audioUrl ? `
                                <div class="audio-player">
                                    <button class="audio-play-btn" data-audio-src="${score.audioUrl}">
                                        <i class="fa-solid fa-circle-play"></i> Listen
                                    </button>
                                    <div class="audio-controls">
                                        <span class="time-current">0:00</span>
                                        <input type="range" class="audio-progress" value="0" min="0" max="100">
                                        <span class="time-duration">0:00</span>
                                    </div>
                                </div>` : ''}
                            </div>
                            <div class="score-buy-section">
                                <span class="price-badge ${score.isFree ? 'free' : ''}">${score.isFree ? 'Free' : '€' + score.priceText}</span>
                                ${score.isFree ? `<a href="${score.link}" download class="action-btn">Download</a>` : `<button class="action-btn cart-btn">Buy Score</button>`}
                            </div>
                        </div>
                    </div>`;
                }).join('');
            }

            // --- Local Audio Logic ---
            setupAudioPlayers();

            // Setup Search, Filters, and Load More
            initGalleryLogic();
            
            // Activate Reveal
            refreshReveal();

        } catch (e) { console.error(e); }
    }

    function setupAudioPlayers() {
        const formatTime = (t) => {
            if (isNaN(t)) return "0:00";
            const m = Math.floor(t / 60);
            const s = Math.floor(t % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        document.querySelectorAll('.audio-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const src = btn.getAttribute('data-audio-src');
                const icon = btn.querySelector('i');
                const player = btn.closest('.audio-player');
                const progress = player.querySelector('.audio-progress');
                const curTime = player.querySelector('.time-current');
                const durTime = player.querySelector('.time-duration');

                if (currentAudio && currentAudio.src.includes(encodeURI(src))) {
                    if (currentAudio.paused) { currentAudio.play(); icon.classList.replace('fa-circle-play', 'fa-circle-pause'); }
                    else { currentAudio.pause(); icon.classList.replace('fa-circle-pause', 'fa-circle-play'); }
                    return;
                }

                stopAllMedia();
                currentAudio = new Audio(src);
                currentBtn = btn;
                currentAudio.play();
                icon.classList.replace('fa-circle-play', 'fa-circle-pause');

                currentAudio.addEventListener('loadedmetadata', () => {
                    durTime.textContent = formatTime(currentAudio.duration);
                    progress.max = currentAudio.duration;
                });

                currentAudio.addEventListener('timeupdate', () => {
                    curTime.textContent = formatTime(currentAudio.currentTime);
                    progress.value = currentAudio.currentTime;
                });

                progress.addEventListener('input', () => currentAudio.currentTime = progress.value);
                currentAudio.addEventListener('ended', () => {
                    icon.classList.replace('fa-circle-pause', 'fa-circle-play');
                    progress.value = 0;
                });
            });
        });
    }

    // --- 7. GALLERY & THEATER LOGIC ---
    function initGalleryLogic() {
        const videoCards = Array.from(document.querySelectorAll('.video-card'));
        const isMobile = window.innerWidth <= 768;
        visibleVideosCount = isMobile ? 6 : 9;
        filteredCards = videoCards;

        updateVisibility();

        // Search Logic
        document.getElementById('video-search')?.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            stopAllMedia();
            filteredCards = videoCards.filter(c => c.getAttribute('data-title').toLowerCase().includes(term));
            visibleVideosCount = term === "" ? (isMobile ? 6 : 9) : filteredCards.length;
            updateVisibility();
        });

        // Filter Logic
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter');
                stopAllMedia();
                filteredCards = filter === 'all' ? videoCards : videoCards.filter(c => c.getAttribute('data-type') === filter);
                visibleVideosCount = isMobile ? 6 : 9;
                updateVisibility();
            });
        });

        // Load More
        document.getElementById('load-more-btn')?.addEventListener('click', () => {
            visibleVideosCount += (isMobile ? 4 : 6);
            updateVisibility();
        });

        // Image Modal Triggers
        document.querySelectorAll('.score-image-wrapper').forEach(w => {
            w.addEventListener('click', () => openImageModal(w.querySelector('img').src));
        });
        document.getElementById('cv-thumbnail')?.addEventListener('click', (e) => openImageModal(e.target.src));
    }

    function updateVisibility() {
        const videoCards = document.querySelectorAll('.video-card');
        videoCards.forEach(c => c.classList.remove('show'));
        filteredCards.slice(0, visibleVideosCount).forEach(c => c.classList.add('show'));
        
        const container = document.getElementById('load-more-container');
        if (container) container.style.display = filteredCards.length > visibleVideosCount ? 'block' : 'none';
    }

    // --- 8. THEATER MODE ---
    const theaterOverlay = document.getElementById('theater-overlay');
    const theaterVideo = document.getElementById('theater-video-container');
    const theaterTitle = document.getElementById('theater-title');
    const theaterDetails = document.getElementById('theater-details');

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.theater-trigger');
        if (trigger && theaterOverlay) {
            const url = trigger.getAttribute('data-url');
            stopAllMedia();
            theaterTitle.textContent = trigger.getAttribute('data-title');
            theaterDetails.textContent = trigger.getAttribute('data-details');
            theaterVideo.innerHTML = `<iframe src="${url}&autoplay=1" allow="autoplay; fullscreen"></iframe>`;
            theaterOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    });

    function closeTheater() {
        if (theaterOverlay) {
            theaterOverlay.style.display = 'none';
            theaterVideo.innerHTML = '';
            document.body.style.overflow = 'auto';
        }
    }

    document.querySelector('.close-theater')?.addEventListener('click', closeTheater);
    window.addEventListener('keydown', (e) => { if(e.key === "Escape") closeTheater(); });

    // --- 9. FORMSPREE CONTACT LOGIC ---
    const contactForm = document.getElementById('contact-form');
    const sendBtn = document.getElementById('send-btn');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const endpoint = "https://formspree.io/f/mlgwzvdw";
            const formData = new FormData(contactForm);
            sendBtn.textContent = "Sending...";
            sendBtn.disabled = true;

            try {
                const res = await fetch(endpoint, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
                if (res.ok) {
                    sendBtn.textContent = "Message Sent!";
                    sendBtn.style.backgroundColor = "#28a745";
                    contactForm.reset();
                    setTimeout(() => { sendBtn.textContent = "Send Message"; sendBtn.disabled = false; sendBtn.style.backgroundColor = ""; }, 4000);
                } else { throw new Error(); }
            } catch {
                alert("Error sending message.");
                sendBtn.textContent = "Try Again";
                sendBtn.disabled = false;
            }
        });
    }

    // --- 10. MOBILE MENU ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : 'initial';
        });
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = 'initial';
            });
        });
    }

    // Startup
    loadPortfolioData();
});