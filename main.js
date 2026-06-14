import { initBackgroundRipple } from './background-ripple.js';
import { initStackCards } from './stack-cards.js';
import { RubikCube } from './rubikscube.js';
import { initVortex } from './vortex.js';
import { initMagicCards, refreshMagicCardThemes } from './magic-card.js';
import { initExpandableProjects } from './expandable-projects.js';
import { initSpotlight } from './spotlight.js';
import { initTheme } from './theme.js';
import { initKineticText } from './kinetic-text.js';
import { initSocialButtons } from './social-buttons.js';
import { initSplineScene } from './spline-scene.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

document.documentElement.classList.add('js-ready');
gsap.registerPlugin(ScrollTrigger);

initTheme();
initKineticText('.hero-name-line');
initSocialButtons('#contact-socials');
initSplineScene('#contact-spline');

const siteRipple = initBackgroundRipple('site-ripple');
window.addEventListener('themechange', () => {
    siteRipple?.refresh?.();
    refreshMagicCardThemes();
});

try {
    new RubikCube('cube-canvas');
} catch (error) {
    console.error('Rubik cube failed to initialize:', error);
}
initSpotlight('hero-spotlight');

initVortex('projects-vortex', {
    baseHue: 142,
    rangeHue: 36,
    saturation: 68,
    lightness: 32,
    backgroundColor: 'transparent',
    particleCount: 600,
});
initMagicCards('.experience-section .magic-card');
initExpandableProjects();
initStackCards();

const header = document.getElementById('header');
const navBar = document.querySelector('.nav-bar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn && navBar) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        navBar.classList.toggle('menu-open');
    });

    navLinks?.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            navBar.classList.remove('menu-open');
        });
    });
}

window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 50);
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const headerHeight = header?.offsetHeight ?? 59;
            window.scrollTo({
                top: target.offsetTop - headerHeight,
                behavior: 'smooth',
            });
        }
    });
});

gsap.utils.toArray('.reveal').forEach((el) => {
    const isHero = el.closest('#hero');

    if (isHero) {
        gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            delay: 0.15 + [...el.parentElement.querySelectorAll('.reveal')].indexOf(el) * 0.1,
        });
    } else {
        gsap.fromTo(
            el,
            { opacity: 0, y: 20 },
            {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
            }
        );
    }
});

ScrollTrigger.batch('.expandable-project-item', {
    onEnter: (batch) =>
        gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.12,
            ease: 'power2.out',
            overwrite: true,
        }),
    start: 'top 88%',
    batchMax: 2,
});
