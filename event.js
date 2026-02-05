/**
 * Senapelan Satu Pintu - Modern 2026 Website
 * Main JavaScript File
 */

class SenapelanPortal {
    constructor() {
        this.init();
    }

    init() {
        this.setupAudio();
        this.setupAnimations();
        this.setupParallax();
        this.setupHoverEffects();
        this.setupScrollAnimations();
        this.setupPerformance();
        this.setupEventListeners();
        console.log('Senapelan Portal 2026 initialized');
    }

    setupAudio() {
        this.bgMusic = document.getElementById('bgMusic');
        this.musicPlayed = false;
        
        const playMusic = () => {
            if (!this.musicPlayed && this.bgMusic) {
                this.bgMusic.volume = 0.3;
                this.bgMusic.play().catch(e => {
                    console.log('Audio autoplay prevented:', e.message);
                });
                this.musicPlayed = true;
            }
        };

        // Play music on first user interaction
        ['click', 'touchstart', 'keydown'].forEach(event => {
            document.addEventListener(event, playMusic, { once: true });
        });
    }

    setupAnimations() {
        // Initialize GSAP if available, otherwise use fallback
        if (typeof gsap !== 'undefined') {
            this.setupGSAPAnimations();
        } else {
            this.setupFallbackAnimations();
        }
    }

    setupGSAPAnimations() {
        // Hero title animation
        gsap.from('.hero-content', {
            duration: 1.5,
            y: 50,
            opacity: 0,
            ease: "power3.out"
        });

        // Portal animation
        gsap.from('.main-portal-section', {
            duration: 1,
            y: 30,
            opacity: 0,
            delay: 0.5,
            ease: "back.out(1.7)"
        });

        // Kelurahan items staggered animation
        gsap.from('.kelurahan-item', {
            duration: 0.8,
            y: 50,
            opacity: 0,
            stagger: 0.1,
            delay: 0.8,
            ease: "power2.out",
            scrollTrigger: {
                trigger: '.kelurahan-section',
                start: "top 80%",
                toggleActions: "play none none none"
            }
        });
    }

    setupFallbackAnimations() {
        // Fallback animations using CSS classes
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, observerOptions);

        // Observe kelurahan items
        document.querySelectorAll('.kelurahan-item').forEach(item => {
            observer.observe(item);
        });
    }

    setupParallax() {
        const bgElements = document.querySelectorAll('.bg-particle');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const speed = 0.3;
            
            bgElements.forEach((el, index) => {
                const yPos = -(scrolled * speed * (index + 1) * 0.1);
                el.style.transform = `translateY(${yPos}px) scale(${1 + (scrolled * 0.0001)})`;
            });
        });
    }

    setupHoverEffects() {
        const kelurahanItems = document.querySelectorAll('.kelurahan-item');
        const mainPortal = document.querySelector('.main-portal-link');

        // Kelurahan items hover effects
        kelurahanItems.forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const shine = document.createElement('div');
                shine.className = 'shine-effect';
                shine.style.cssText = `
                    position: absolute;
                    top: ${y}px;
                    left: ${x}px;
                    width: 100px;
                    height: 100px;
                    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 3;
                `;
                
                item.querySelector('.kelurahan-image-wrapper').appendChild(shine);
                
                setTimeout(() => {
                    if (shine.parentNode) {
                        shine.parentNode.removeChild(shine);
                    }
                }, 500);
            });

            // Glow effect on hover
            item.addEventListener('mouseenter', () => {
                const image = item.querySelector('.kelurahan-image');
                image.style.filter = 'drop-shadow(0 0 30px var(--accent-teal))';
            });

            item.addEventListener('mouseleave', () => {
                const image = item.querySelector('.kelurahan-image');
                image.style.filter = 'drop-shadow(0 0 15px rgba(0, 102, 255, 0.3))';
            });
        });

        // Main portal hover effect
        if (mainPortal) {
            mainPortal.addEventListener('mouseenter', () => {
                const glow = mainPortal.querySelector('.portal-glow');
                glow.style.opacity = '0.3';
            });

            mainPortal.addEventListener('mouseleave', () => {
                const glow = mainPortal.querySelector('.portal-glow');
                glow.style.opacity = '0.2';
            });
        }
    }

    setupScrollAnimations() {
        let ticking = false;
        
        const updateElements = () => {
            const scrolled = window.pageYOffset;
            const heroSection = document.querySelector('.hero-section');
            
            if (heroSection) {
                const heroRect = heroSection.getBoundingClientRect();
                const heroProgress = 1 - (heroRect.top / window.innerHeight);
                
                // Parallax effect for hero
                if (heroProgress > 0 && heroProgress < 1) {
                    heroSection.style.transform = `translateY(${scrolled * 0.3}px)`;
                }
            }
            
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateElements);
                ticking = true;
            }
        });
    }

    setupPerformance() {
        // Preload critical images
        const criticalImages = [
            'data/foto/kecamatansenapelan.png',
            'data/foto/kampungbandar.png',
            'data/foto/kampungbaru.png',
            'data/foto/kampungdalam.png',
            'data/foto/padangbulan.png',
            'data/foto/padangterubuk.png',
            'data/foto/sago.png'
        ];

        criticalImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });

        // Debounce resize events
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    handleResize() {
        // Adjust layout for different screen sizes
        const isMobile = window.innerWidth <= 768;
        const kelurahanItems = document.querySelectorAll('.kelurahan-item');
        
        if (isMobile) {
            kelurahanItems.forEach(item => {
                item.style.animationDelay = '0.1s';
            });
        }
    }

    setupEventListeners() {
        // Click sound effect (optional)
        const links = document.querySelectorAll('a[href^="http"], a[href^="/"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                // Add click feedback
                link.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    link.style.transform = '';
                }, 150);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open modals or menus
                console.log('Escape pressed - close modals');
            }
        });

        // Touch device detection
        this.isTouchDevice = 'ontouchstart' in window || 
                            navigator.maxTouchPoints > 0 || 
                            navigator.msMaxTouchPoints > 0;
        
        if (this.isTouchDevice) {
            document.body.classList.add('touch-device');
        }
    }

    // Theme management for future events
    setTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem('senapelan-theme', themeName);
        console.log(`Theme changed to: ${themeName}`);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('senapelan-theme') || 'default';
        this.setTheme(savedTheme);
    }

    // Analytics tracking (optional)
    trackEvent(eventName, data = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }
        console.log(`Event: ${eventName}`, data);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Remove no-js class
    document.documentElement.classList.remove('no-js');
    
    // Initialize portal
    window.senapelanPortal = new SenapelanPortal();
    
    // Load saved theme
    window.senapelanPortal.loadTheme();
    
    // Track page view
    window.senapelanPortal.trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href
    });
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Home/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Performance monitoring
window.addEventListener('load', () => {
    // Report performance metrics
    if ('PerformanceObserver' in window) {
        const perfObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                console.log(`${entry.name}: ${entry.startTime}`);
            }
        });
        
        perfObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    }
});
