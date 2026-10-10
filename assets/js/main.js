// Force scroll to top on refresh
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Language System
const translations = {
    en: {},
    sr: {}
};

// Initialize language
let currentLang = localStorage.getItem('language') || 'en';

// Apply a language to the page immediately (no fade, no early return)
function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);

    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('lang-sr').classList.toggle('active', lang === 'sr');

    // Update all translatable elements
    document.querySelectorAll('[data-en]').forEach(element => {
        const enText = element.getAttribute('data-en');
        const srText = element.getAttribute('data-sr');

        // Skip if this is the pagination info (it's handled by updatePaginationText)
        if (element.id === 'pageInfo') return;

        if (lang === 'sr' && srText) {
            element.innerHTML = srText;
        } else {
            element.innerHTML = enText;
        }
    });

    // Update pagination text
    updatePaginationText();

    // Update HTML lang attribute
    document.documentElement.lang = lang === 'sr' ? 'sr' : 'en';

    // Update voiceover button state (disable for Serbian)
    const voiceoverBtn = document.getElementById('voiceover-toggle');
    const voiceoverAudio = document.getElementById('about-me-voiceover');
    if (voiceoverBtn) {
        if (lang === 'sr') {
            voiceoverBtn.style.opacity = '0.3';
            voiceoverBtn.style.pointerEvents = 'none';
            if (voiceoverAudio && !voiceoverAudio.paused) {
                voiceoverAudio.pause();
                const icon = document.getElementById('voiceover-icon');
                if (icon) icon.className = 'fa fa-volume-up';
            }
        } else {
            voiceoverBtn.style.opacity = '1';
            voiceoverBtn.style.pointerEvents = 'auto';
        }
    }
}

// Switch language from the toggle buttons, with a fade transition
function setLanguage(lang) {
    if (currentLang === lang) return;

    const elements = document.querySelectorAll('[data-en]');

    // Trigger fade out
    elements.forEach(el => el.classList.add('lang-switching'));

    // Update buttons immediately for instant feedback
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('lang-sr').classList.toggle('active', lang === 'sr');

    // Wait for fade out to complete
    setTimeout(() => {
        applyLanguage(lang);

        // Trigger fade in
        elements.forEach(el => el.classList.remove('lang-switching'));
    }, 200);
}

// Store current pagination state globally
let paginationState = { current: 1, total: 1 };

function updatePaginationText() {
    const pageInfo = document.getElementById('pageInfo');
    const template = pageInfo.getAttribute(`data-${currentLang}`);
    pageInfo.textContent = template
        .replace('{current}', paginationState.current)
        .replace('{total}', paginationState.total);
}

// Event listeners for language toggle
document.getElementById('lang-en').addEventListener('click', () => setLanguage('en'));
document.getElementById('lang-sr').addEventListener('click', () => setLanguage('sr'));

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('preloader-active');
    applyLanguage(currentLang);
});

// Preloader Logic with Image Preloading
(function () {
    const preloader = document.getElementById('preloader');
    const progressBar = document.querySelector('.progress-bar');
    const percentageText = document.getElementById('loadingPercentage');
    const quoteText = document.getElementById('loadingQuote');
    const startTime = Date.now();
    const minLoadTime = 600; // Short minimum so the preloader doesn't just flash

    const quotes = [
        '"A game is a series of interesting choices." - Sid Meier',
        '"The goal is to create a game that is easy to learn but difficult to master." - Reiner Knizia',
        '"Code is read much more often than it is written." - Guido van Rossum',
        '"Simplicity is the soul of efficiency." - Austin Freeman'
    ];

    // Select a random starting quote
    let quoteIndex = Math.floor(Math.random() * quotes.length);
    if (quoteText) quoteText.textContent = quotes[quoteIndex];

    // Cycle quotes
    const quoteInterval = setInterval(() => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        if (quoteText) {
            quoteText.style.opacity = 0;
            setTimeout(() => {
                quoteText.textContent = quotes[quoteIndex];
                quoteText.style.opacity = 1;
            }, 500);
        }
    }, 3000);

    let progress = 0;

    // Ease the bar towards 90% until the page finishes loading
    // (gallery images stay lazy-loaded instead of being preloaded here)
    const progressInterval = setInterval(() => {
        progress += (90 - progress) * 0.15;
        progressBar.style.width = progress + '%';
        if (percentageText) percentageText.textContent = Math.round(progress) + '%';
    }, 50);

    window.addEventListener('load', () => {
        const loadTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - loadTime);

        setTimeout(() => {
            clearInterval(progressInterval);
            progress = 100;
            progressBar.style.width = '100%';
            if (percentageText) percentageText.textContent = '100%';
            clearInterval(quoteInterval);

            setTimeout(() => {
                preloader.classList.add('fade-out');
                document.body.classList.remove('preloader-active');
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 500);
            }, 500);
        }, remainingTime);
    });
})();

// Scroll Progress
window.addEventListener('scroll', () => {
    const scrollProgress = document.getElementById('scroll-progress');
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (scrollTop / scrollHeight) * 100;
    if (scrollProgress) {
        scrollProgress.style.width = scrolled + '%';
    }
});

// Gallery Filtering and Pagination
document.addEventListener('DOMContentLoaded', function () {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const itemsPerPage = 4;
    let currentPage = 1;
    let currentFilter = 'all';

    function getFilteredItems() {
        return Array.from(galleryItems).filter(item => {
            const category = item.getAttribute('data-category');
            return currentFilter === 'all' || category === currentFilter;
        });
    }

    function updatePagination() {
        const filtered = getFilteredItems();
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        // Store pagination state globally
        paginationState = { current: currentPage, total: totalPages };

        // Hide all items
        galleryItems.forEach(item => item.classList.add('hidden'));

        // Show current page items
        filtered.forEach((item, index) => {
            if (index >= start && index < end) {
                item.classList.remove('hidden');
            }
        });

        // Update pagination controls
        const pageInfo = document.getElementById('pageInfo');
        const template = pageInfo.getAttribute(`data-${currentLang}`);
        pageInfo.textContent = template
            .replace('{current}', currentPage)
            .replace('{total}', totalPages);

        document.getElementById('prevBtn').disabled = currentPage === 1;
        document.getElementById('nextBtn').disabled = currentPage === totalPages;
        document.querySelector('.gallery-pagination').style.display =
            totalPages > 1 ? 'flex' : 'none';
    }

    function setFilter(filter) {
        currentFilter = filter;
        filterBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === filter));
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            setFilter(this.getAttribute('data-filter'));
            currentPage = 1;
            updatePagination();
        });
    });

    // Filter and paginate so a specific gallery item is visible, then scroll to it
    window.showGalleryItem = function (id) {
        const targetItem = document.getElementById(id);
        if (!targetItem) return;

        setFilter(targetItem.getAttribute('data-category'));
        const index = getFilteredItems().indexOf(targetItem);
        currentPage = Math.floor(index / itemsPerPage) + 1;
        updatePagination();

        targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        const filtered = getFilteredItems();
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
        }
    });

    updatePagination();
});

// Smooth Scrolling and Section Tracking
document.addEventListener('DOMContentLoaded', function () {
    // Smooth scroll for anchor links (gallery links are handled separately below)
    document.querySelectorAll('a[href^="#"]:not(.inline-gallery-link)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href === '#') return;

            // Menu links point to #sectionN, which maps to [data-section="sectionN"]
            const id = href.substring(1);
            const target = document.getElementById(id) ||
                document.querySelector(`.section[data-section="${id}"]`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Active section tracking
    const sections = document.querySelectorAll('.section');
    const menuItems = document.querySelectorAll('.main-menu li');
    if (menuItems.length) menuItems[0].classList.add('active');

    window.addEventListener('scroll', function () {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('data-section');
            }
        });

        menuItems.forEach(li => {
            li.classList.remove('active');
            const link = li.querySelector('a');
            if (link && link.getAttribute('href').includes(current)) {
                li.classList.add('active');
            }
        });
    });
});

// Menu Toggle Functionality
document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const menu = document.getElementById('menu');

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            menu.classList.add('open');
        });
    }

    if (menuClose) {
        menuClose.addEventListener('click', function () {
            menu.classList.remove('open');
        });
    }

    // Close menu when clicking on menu items
    const menuLinks = document.querySelectorAll('.main-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function () {
            menu.classList.remove('open');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
        if (!menu.contains(event.target) && !menuToggle.contains(event.target) && menu.classList.contains('open')) {
            menu.classList.remove('open');
        }
    });

    // Close menu on scroll
    window.addEventListener('scroll', function () {
        if (menu.classList.contains('open')) {
            menu.classList.remove('open');
        }
    }, { passive: true });
});

// =========================================
// PHASE B: Button & Interaction Enhancements
// =========================================
document.addEventListener('DOMContentLoaded', function () {
    // Select all buttons that should have effects
    const buttons = document.querySelectorAll('.white-button a, .filter-btn, .pagination-btn, button');

    buttons.forEach(btn => {
        // Add ripple class for CSS positioning
        btn.classList.add('ripple-btn');

        btn.addEventListener('click', function (e) {
            // 1. Bounce Effect
            this.classList.add('btn-bounce-anim');
            setTimeout(() => {
                this.classList.remove('btn-bounce-anim');
            }, 400); // Match CSS animation duration

            // 2. Ripple Effect
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');

            // Get button dimensions
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);

            // Calculate click position relative to button
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            // Set size and position
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            // Add to button
            this.appendChild(ripple);

            // Remove after animation
            setTimeout(() => {
                ripple.remove();
            }, 600); // Match CSS animation duration
        });
    });
});

// Inline Gallery Link Auto-Filter
document.addEventListener('DOMContentLoaded', function () {
    const galleryLinks = document.querySelectorAll('.inline-gallery-link');
    galleryLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#') && href.length > 1) {
                e.preventDefault();
                window.showGalleryItem(href.substring(1));
            }
        });
    });
});
// Email Copy Functionality
document.addEventListener('DOMContentLoaded', function () {
    const emailBtn = document.getElementById('email-btn');
    const originalLabel = "contact@bojanbozovic.com";

    // Localization object for JS
    const jsTranslations = {
        en: { emailCopied: "Email copied!" },
        sr: { emailCopied: "Email kopiran!" }
    };

    if (emailBtn) {
        emailBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // Get current language from global state or localStorage
            const lang = currentLang || localStorage.getItem('language') || 'en';
            const copiedLabel = jsTranslations[lang].emailCopied;

            // Copy to clipboard
            navigator.clipboard.writeText(originalLabel).then(() => {
                // Change tooltip text
                this.setAttribute('aria-label', copiedLabel);

                // Add a class for potential styling changes if needed
                this.classList.add('copied');

                // Revert after 2 seconds
                setTimeout(() => {
                    this.setAttribute('aria-label', originalLabel);
                    this.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback for older browsers or if clipboard fails
                const textArea = document.createElement("textarea");
                textArea.value = originalLabel;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    this.setAttribute('aria-label', copiedLabel);
                    setTimeout(() => {
                        this.setAttribute('aria-label', originalLabel);
                    }, 2000);
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            });
        });
    }
});

/**
 * SCROLL REVEAL ANIMATIONS
 * Triggers fade-in animations when elements enter the viewport
 */
document.addEventListener('DOMContentLoaded', function () {
    const observerOptions = {
        threshold: 0.05,
        rootMargin: '0px 0px -10px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Stop observing once it's visible to keep it there (only animate once)
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-card');
    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
});

// =========================================
// Voiceover Functionality
// =========================================
document.addEventListener('DOMContentLoaded', function () {
    const voiceoverBtn = document.getElementById('voiceover-toggle');
    const voiceoverAudio = document.getElementById('about-me-voiceover');
    const voiceoverIcon = document.getElementById('voiceover-icon');
    const sentences = document.querySelectorAll('.vo-sentence');

    if (voiceoverBtn && voiceoverAudio && voiceoverIcon) {
        voiceoverBtn.addEventListener('click', function () {
            if (voiceoverAudio.paused) {
                voiceoverAudio.play();
                voiceoverIcon.className = 'fa fa-pause';
            } else {
                voiceoverAudio.pause();
                voiceoverIcon.className = 'fa fa-volume-up';
            }
        });

        // Highlight sentences as audio plays
        voiceoverAudio.addEventListener('timeupdate', function () {
            const currentTime = voiceoverAudio.currentTime;

            sentences.forEach(sentence => {
                const start = parseFloat(sentence.getAttribute('data-start'));
                const end = parseFloat(sentence.getAttribute('data-end'));

                if (!voiceoverAudio.paused && currentTime >= start && currentTime < end) {
                    sentence.classList.add('highlight-sentence');
                } else {
                    sentence.classList.remove('highlight-sentence');
                }
            });
        });

        // Reset highlight when paused or ended
        voiceoverAudio.addEventListener('pause', function () {
            voiceoverIcon.className = 'fa fa-volume-up';
            sentences.forEach(sentence => {
                sentence.classList.remove('highlight-sentence');
            });
        });

        voiceoverAudio.addEventListener('ended', function () {
            voiceoverIcon.className = 'fa fa-volume-up';
            sentences.forEach(sentence => {
                sentence.classList.remove('highlight-sentence');
            });
        });
    }
});
