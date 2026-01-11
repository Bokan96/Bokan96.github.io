// Language System
const translations = {
    en: {},
    sr: {}
};

// Initialize language
let currentLang = localStorage.getItem('language') || 'en';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);

    // Update button states
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('lang-sr').classList.toggle('active', lang === 'sr');

    // Update all translatable elements
    document.querySelectorAll('[data-en]').forEach(element => {
        const enText = element.getAttribute('data-en');
        const srText = element.getAttribute('data-sr');

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
    setLanguage(currentLang);
});

// Preloader Logic with Image Preloading
(function () {
    const preloader = document.getElementById('preloader');
    const progressBar = document.querySelector('.progress-bar');
    const percentageText = document.getElementById('loadingPercentage');
    const quoteText = document.getElementById('loadingQuote');
    const startTime = Date.now();
    const minLoadTime = 2500; // Increased to allow reading quotes

    const quotes = [
        '"The best games are made by those who play." - Unknown',
        '"Games are the only way to save the world." - Jane McGonigal',
        '"A game is a series of interesting choices." - Sid Meier'
    ];

    // Cycle quotes
    let quoteIndex = 0;
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
    let assetsLoaded = false;

    // Preload gallery images
    const galleryImages = document.querySelectorAll('.gallery-item img');
    let imagesLoaded = 0;
    const totalImages = galleryImages.length;

    galleryImages.forEach(img => {
        const image = new Image();
        image.onload = image.onerror = () => {
            imagesLoaded++;
            progress = (imagesLoaded / totalImages) * 90;
            progressBar.style.width = progress + '%';
            if (percentageText) percentageText.textContent = Math.round(progress) + '%';
        };
        image.src = img.src;
    });

    window.addEventListener('load', () => {
        assetsLoaded = true;
        const loadTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - loadTime);

        setTimeout(() => {
            progress = 100;
            progressBar.style.width = '100%';
            if (percentageText) percentageText.textContent = '100%';
            clearInterval(quoteInterval);

            setTimeout(() => {
                preloader.classList.add('fade-out');
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
    const itemsPerPage = 9;
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

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            currentFilter = this.getAttribute('data-filter');
            currentPage = 1;

            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            updatePagination();
        });
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
            document.querySelector('.gallery-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        const filtered = getFilteredItems();
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
            document.querySelector('.gallery-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    updatePagination();
});

$(".main-menu li:first").addClass("active");

var showSection = function showSection(section, isAnimate) {
    var direction = section.replace(/#/, ""),
        reqSection = $(".section").filter('[data-section="' + direction + '"]'),
        reqSectionPos = reqSection.offset().top - 0;

    if (isAnimate) {
        $("body, html").animate({ scrollTop: reqSectionPos }, 800);
    } else {
        $("body, html").scrollTop(reqSectionPos);
    }
};

var checkSection = function checkSection() {
    $(".section").each(function () {
        var $this = $(this),
            topEdge = $this.offset().top - 80,
            bottomEdge = topEdge + $this.height(),
            wScroll = $(window).scrollTop();
        if (topEdge < wScroll && bottomEdge > wScroll) {
            var currentId = $this.data("section"),
                reqLink = $("a").filter("[href*=\\#" + currentId + "]");
            reqLink.closest("li").addClass("active").siblings().removeClass("active");
        }
    });
};

$(".main-menu").on("click", "a", function (e) {
    e.preventDefault();
    showSection($(this).attr("href"), true);
});

$(window).scroll(function () {
    checkSection();
});

// Smooth Scrolling and Section Tracking
document.addEventListener('DOMContentLoaded', function () {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Active section tracking
    const sections = document.querySelectorAll('.section');
    const menuItems = document.querySelectorAll('.main-menu li');

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
