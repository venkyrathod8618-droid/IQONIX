// Defensive checks and reduced-motion
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu
    const navWrap = document.querySelector('.nav-wrap');
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            const open = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!open));
            links.style.display = open ? 'none' : 'flex';
        });
    }

    // Sticky nav background
    const onScroll = () => {
        if (window.scrollY > 30) navWrap.classList.add('scrolled'); else navWrap.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', throttle(onScroll, 50));

    // Intersection observer for section reveals and counters
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('inview');
                if (entry.target.matches('.about')) startCounters();
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('section').forEach(s => observer.observe(s));

    // Airplane/ship animation using GSAP if available
    const airplane = document.getElementById('airplane');
    const ship = document.getElementById('ship');

    // Airplane/ship animation using GSAP if available, otherwise use a light scroll-driven fallback
    const hero = document.getElementById('hero');
    const useGSAP = !prefersReduced && typeof gsap !== 'undefined';

    if (useGSAP && airplane) {
        try {
            // Try to use ScrollTrigger if available, but don't crash if not
            if (typeof gsap.registerPlugin === 'function' && (window.ScrollTrigger || (gsap.plugins && gsap.plugins.ScrollTrigger))) {
                if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
                else if (gsap.plugins && gsap.plugins.ScrollTrigger) gsap.registerPlugin(gsap.plugins.ScrollTrigger);
                gsap.to(airplane, { x: window.innerWidth + 400, duration: 5, repeat: 0, ease: 'power1.inOut', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.8 } });
                gsap.to(ship, { x: '-50%', opacity: 1, duration: 1.6, scrollTrigger: { trigger: '#hero', start: '30% bottom', end: '80% top', scrub: 0.6 } });
            } else {
                // Basic GSAP animations without ScrollTrigger
                gsap.to(airplane, { y: '-=20', yoyo: true, repeat: -1, opacity: 1, duration: 3, ease: 'sine.inOut' });
                gsap.to(ship, { y: '-=8', yoyo: true, repeat: -1, duration: 4, ease: 'sine.inOut' });
            }
        } catch (e) {
            console.warn('GSAP animation failed, falling back to lightweight scroll animations', e);
            animateOnScrollFallback();
        }
    } else {
        // Fallback: simple scroll-driven transforms to avoid dependency on ScrollTrigger
        animateOnScrollFallback();
    }

    function animateOnScrollFallback() {
        if (!airplane && !ship) return;
        const update = () => {
            const rect = hero.getBoundingClientRect();
            const h = rect.height || window.innerHeight;
            const progress = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + h), 0), 1);
            // airplane: from left -20% to 120%
            if (airplane) {
                const start = -20; const end = 120;
                const left = start + (end - start) * progress;
                airplane.style.left = left + '%';
                airplane.style.transform = `translateY(${Math.sin(progress * Math.PI) * -6}px)`;
                airplane.style.opacity = 0.9 + 0.1 * progress;
            }
            // ship: appear from right (120%) to center (40%) as progress goes 0.3->1
            if (ship) {
                const p = Math.min(Math.max((progress - 0.25) / 0.75, 0), 1);
                const left = 120 - 80 * p;
                ship.style.left = left + '%';
                ship.style.opacity = p;
                ship.style.transform = `translateY(${(1 - p) * 20}px)`;
            }
        };
        update();
        window.addEventListener('scroll', throttle(update, 30));
        window.addEventListener('resize', throttle(update, 200));
    }

    // Smooth in-page links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (href.length > 1) {
                const el = document.querySelector(href);
                if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

});

function startCounters() {
    document.querySelectorAll('.stat .num').forEach(el => {
        const target = parseInt(el.getAttribute('data-target')) || 0;
        const isPercent = el.textContent.trim().endsWith('%');
        if (target > 0) {
            let curr = 0; const step = Math.max(1, Math.floor(target / 60));
            const iv = setInterval(() => {
                curr += step; if (curr >= target) { curr = target; clearInterval(iv) }
                el.textContent = curr + (isPercent ? '%' : '+');
            }, 16);
        }
    });
}

function throttle(fn, wait) { let last = 0; return function (...args) { const now = Date.now(); if (now - last > wait) { last = now; fn.apply(this, args); } } }

// Simple defensive export for testing
if (typeof module !== 'undefined') module.exports = { throttle };
