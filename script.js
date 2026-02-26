/* ==========================================================================
   PANAGOS THEODOROS - CLASSICAL GUITAR PORTFOLIO (JS LOGIC & INTERACTIONS)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    
    // Global Audio Variables
    let currentAudio = null;
    let currentBtn = null;

    // --- 1. SMART NAVBAR & PARALLAX HERO ---
    const nav = document.getElementById('main-nav');
    const heroContent = document.querySelector('.hero-overlay');
    
    if (nav) {
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            // Subtle Parallax effect on Hero Text
            if (heroContent && currentScrollY < 600) {
                heroContent.style.transform = `translateY(${currentScrollY * 0.3}px)`;
                heroContent.style.opacity = 1 - (currentScrollY / 400);
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

    // --- 2. SCROLL REVEAL ENGINE ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 }); 
    
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // --- Variables for Load More (RESPONSIVE) ---
    function getDisplaySettings() {
        const isMobile = window.innerWidth <= 768;
        return {
            initial: isMobile ? 6 : 9, 
            increment: isMobile ? 4 : 6
        };
    }

    let displaySettings = getDisplaySettings();
    let visibleVideosCount = displaySettings.initial; 
    let filteredCards = [];

    window.addEventListener('resize', () => {
        displaySettings = getDisplaySettings();
    });

    // --- HELPER: STOP VIDEOS & AUDIO ---
    function stopAllVideos() {
        // Stop YouTube iframes
        const iframes = document.querySelectorAll('.video-card iframe');
        iframes.forEach(iframe => {
            const currentSrc = iframe.src;
            iframe.src = currentSrc; 
        });

        // Stop local audio if playing
        if (currentAudio) {
            currentAudio.pause();
            if (currentBtn) {
                currentBtn.querySelector('i').classList.replace('fa-circle-pause', 'fa-circle-play');
            }
        }
    }

    // --- 3. UNIVERSAL IMAGE MODAL LOGIC (CV & Score Previews) ---
    const imageModal = document.getElementById("image-modal");
    const modalImg = document.getElementById("full-modal-img");
    const closeImageModalBtn = document.getElementById("close-image-modal");

    function openImageModal(imageSrc) {
        if (imageModal && modalImg) {
            modalImg.src = imageSrc;
            imageModal.style.display = "flex";
            imageModal.style.alignItems = "center";
            imageModal.style.justifyContent = "center";
            document.body.style.overflow = "hidden";
        }
    }

    if (imageModal && closeImageModalBtn) {
        closeImageModalBtn.addEventListener("click", () => {
            imageModal.style.display = "none";
            document.body.style.overflow = "auto";
        });

        imageModal.addEventListener("click", (e) => {
            if (e.target === imageModal) {
                imageModal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        });
    }

    const cvImg = document.getElementById("cv-thumbnail");
    if (cvImg) {
        cvImg.addEventListener("click", () => {
            openImageModal(cvImg.src);
        });
    }

    // --- 4. DYNAMIC DATA LOADER ---
    async function loadPortfolioData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error("Failed to load data.json");
            
            const data = await response.json();

            // Render Videos
            const videoGrid = document.getElementById('video-grid');
            if (videoGrid && data.videos) {
                videoGrid.innerHTML = data.videos.map((video, index) => {
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
                        </div>
                    </div>
                `}).join('');
            }

            // Render Scores
            const scoreGrid = document.getElementById('score-grid');
            if (scoreGrid && data.scores) {
                scoreGrid.innerHTML = data.scores.map(score => {
                    const isFree = score.isFree;
                  const priceHtml = isFree ? `<span class="price-badge free">Free</span>` : `<span class="price-badge">€${score.priceText}</span>`;
                    const btnHtml = isFree 
                        ? `<a href="${score.link}" download class="action-btn"><i class="fa-solid fa-download"></i> Download</a>`
                        : `<button class="action-btn cart-btn" data-title="${score.title}"><i class="fa-solid fa-cart-shopping"></i> Buy Score</button>`;
                    
                    const imageUrl = score.imageUrl || 'images/cv-classical-guitar.jpg';
                    const notationHtml = score.notationType ? `<span style="color: var(--accent);"> • ${score.notationType}</span>` : '';
                    
                    // Create the Audio Player with Progress Bar
                    const audioHtml = score.audioUrl ? `
                        <div class="audio-player">
                            <button class="audio-play-btn" data-audio-src="${score.audioUrl}">
                                <i class="fa-solid fa-circle-play"></i> Listen
                            </button>
                            <div class="audio-controls">
                                <span class="time-current">0:00</span>
                                <input type="range" class="audio-progress" value="0" min="0" max="100" step="1">
                                <span class="time-duration">0:00</span>
                            </div>
                        </div>
                    ` : '';

                    return `
                    <div class="score-card fade-up" data-title="${score.searchTags}">
                        <div class="score-image-wrapper" style="cursor: pointer;">
                            <img src="${imageUrl}" alt="${score.title} sheet music" loading="lazy">
                            <div class="score-preview-label">Preview</div>
                        </div>
                        <div class="score-info">
                            <div>
                                <h3 class="score-title">${score.title}</h3>
                                <span class="score-type">${score.type}${notationHtml}</span>
                                <br>
                                ${audioHtml}
                            </div>
                            <div class="score-buy-section">
                                ${priceHtml}
                                ${btnHtml}
                            </div>
                        </div>
                    </div>
                    `;
                }).join('');
            }

            // --- Local Audio Player Logic ---
          // --- Local Audio Player Logic ---
            const audioBtns = document.querySelectorAll('.audio-play-btn');
            
            // Format time helper (seconds to M:SS)
            const formatTime = (time) => {
                if (isNaN(time)) return "0:00";
                const minutes = Math.floor(time / 60);
                const seconds = Math.floor(time % 60);
                return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            };

            audioBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    
                    const src = btn.getAttribute('data-audio-src');
                    const icon = btn.querySelector('i');
                    const playerContainer = btn.closest('.audio-player');
                    const progressBar = playerContainer.querySelector('.audio-progress');
                    const currentTimeEl = playerContainer.querySelector('.time-current');
                    const durationEl = playerContainer.querySelector('.time-duration');

                    // Check if clicking the SAME track
                    const isSameTrack = currentAudio && currentAudio.src.includes(encodeURI(src));

                    if (isSameTrack) {
                        // Toggle play/pause without resetting
                        if (currentAudio.paused) {
                            currentAudio.play();
                            icon.classList.replace('fa-circle-play', 'fa-circle-pause');
                        } else {
                            currentAudio.pause();
                            icon.classList.replace('fa-circle-pause', 'fa-circle-play');
                        }
                        return;
                    }

                    // If DIFFERENT track, stop background videos and previous track first
                    stopAllVideos(); 

                    // Reset previous button icon if exists
                    if (currentBtn) {
                        currentBtn.querySelector('i').classList.replace('fa-circle-pause', 'fa-circle-play');
                    }

                    // Play the new track
                    currentAudio = new Audio(src);
                    currentBtn = btn;
                    currentAudio.play();
                    icon.classList.replace('fa-circle-play', 'fa-circle-pause');

                    // Update duration when loaded
                    currentAudio.addEventListener('loadedmetadata', () => {
                        durationEl.textContent = formatTime(currentAudio.duration);
                        progressBar.max = currentAudio.duration;
                    });

                    // Update progress bar as song plays
                    currentAudio.addEventListener('timeupdate', () => {
                        currentTimeEl.textContent = formatTime(currentAudio.currentTime);
                        progressBar.value = currentAudio.currentTime;
                    });

                    // Scrubbing (seeking) functionality
                    progressBar.addEventListener('input', (event) => {
                        currentAudio.currentTime = event.target.value;
                    });

                    // Reset when song finishes
                    currentAudio.addEventListener('ended', () => {
                        icon.classList.replace('fa-circle-pause', 'fa-circle-play');
                        progressBar.value = 0;
                        currentTimeEl.textContent = "0:00";
                    });
                });
            });

            document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
            
            const scorePreviews = document.querySelectorAll('.score-image-wrapper');
            scorePreviews.forEach(wrapper => {
                wrapper.addEventListener('click', () => {
                    const img = wrapper.querySelector('img');
                    if (img) openImageModal(img.src);
                });
            });

            const allCards = Array.from(document.querySelectorAll('.video-card'));
            filteredCards = allCards; 
            updateVideoVisibility();

            setupLiveSearch('video-search', 'video-grid', '.video-card', true); 
            setupLiveSearch('score-search', 'score-grid', '.score-card', false);
            setupFilters(); 

            const loadMoreBtn = document.getElementById('load-more-btn');
            if(loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => {
                    visibleVideosCount += displaySettings.increment;
                    updateVideoVisibility();
                });
            }

        } catch (error) {
            console.error("Error loading portfolio data:", error);
        }
    }

    loadPortfolioData();

    // --- 5. LOAD MORE VISIBILITY LOGIC ---
    function updateVideoVisibility() {
        const allCards = document.querySelectorAll('.video-card');
        
        allCards.forEach(card => card.classList.remove('show'));

        for(let i = 0; i < visibleVideosCount && i < filteredCards.length; i++) {
            filteredCards[i].classList.add('show');
        }

        const loadMoreContainer = document.getElementById('load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = (filteredCards.length > visibleVideosCount) ? 'block' : 'none';
        }
    }

    // --- 6. CATEGORY FILTERS LOGIC ---
    function setupFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const allCards = Array.from(document.querySelectorAll('.video-card'));
        const searchInput = document.getElementById('video-search');

        if (!filterBtns.length || !allCards.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                stopAllVideos();

                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');
                if (searchInput) searchInput.value = '';

                visibleVideosCount = displaySettings.initial;

                if (filterValue === 'all') {
                    filteredCards = allCards;
                } else {
                    filteredCards = allCards.filter(card => card.getAttribute('data-type') === filterValue);
                }

                updateVideoVisibility();
            });
        });
    }

    // --- 7. LIVE SEARCH FILTER ---
    function setupLiveSearch(inputId, gridId, cardClass, isVideoSection) {
        const searchInput = document.getElementById(inputId);
        const grid = document.getElementById(gridId);
        
        if (!searchInput || !grid) return;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();

            if (isVideoSection) {
                stopAllVideos();

                const filterBtns = document.querySelectorAll('.filter-btn');
                filterBtns.forEach(b => b.classList.remove('active'));
                const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
                if(allBtn) allBtn.classList.add('active');

                const allCards = Array.from(grid.querySelectorAll(cardClass));
                
                if(searchTerm === '') {
                    filteredCards = allCards;
                    visibleVideosCount = displaySettings.initial;
                } else {
                    filteredCards = allCards.filter(card => {
                        const searchableText = card.getAttribute('data-title').toLowerCase();
                        return searchableText.includes(searchTerm);
                    });
                    visibleVideosCount = filteredCards.length; 
                }
                
                updateVideoVisibility();
            } else {
                const cards = grid.querySelectorAll(cardClass);
                cards.forEach(card => {
                    const searchableText = card.getAttribute('data-title').toLowerCase();
                    card.style.display = searchableText.includes(searchTerm) ? '' : 'none'; 
                });
            }
        });
    }

    // --- 8. CONTACT FORM LOGIC ---
  // --- 8. CONTACT FORM LOGIC (FORMSPREE) ---
    const contactForm = document.getElementById('contact-form');
    const sendBtn = document.getElementById('send-btn');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formspreeEndpoint = "https://formspree.io/f/mlgwzvdw"; 

            const formData = new FormData(contactForm);
            sendBtn.textContent = "Sending...";
            sendBtn.disabled = true;

            try {
                const response = await fetch(formspreeEndpoint, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    sendBtn.textContent = "Message Sent!";
                    sendBtn.style.backgroundColor = "#28a745"; // Changes to green on success
                    contactForm.reset();
                    setTimeout(() => {
                        sendBtn.textContent = "Send Message";
                        sendBtn.disabled = false;
                        sendBtn.style.backgroundColor = ""; // Resets to original gold
                    }, 4000);
                } else {
                    throw new Error();
                }
            } catch (error) {
                alert("Oops! There was a problem sending your message.");
                sendBtn.textContent = "Error! Try Again";
                sendBtn.disabled = false;
            }
        });
    }

    // --- 9. MOBILE MENU LOGIC ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const allLinks = document.querySelectorAll('.nav-links a');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : 'initial';
        });

        allLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = 'initial';
            });
        });
    }
});