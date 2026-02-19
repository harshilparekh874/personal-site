import { BlackHoleBackground } from './blackhole.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Initialize Black Hole Background
const bh = new BlackHoleBackground('bg-canvas');

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking on a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
            mobileMenuBtn.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

// Header Scroll Effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Reveal Animations on Scroll
const revealElements = document.querySelectorAll('.reveal');
revealElements.forEach((el) => {
    gsap.fromTo(el,
        {
            opacity: 0,
            y: 50
        },
        {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        }
    );
});

// Project Cards Hover Animation (handled by CSS mostly, but GSAP for entrance)
gsap.from('.project-card', {
    scrollTrigger: {
        trigger: '.projects-grid',
        start: 'top 80%',
    },
    y: 100,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: 'power4.out'
});

// Skills Staggered Entrance
gsap.from('.skill-category', {
    scrollTrigger: {
        trigger: '.skills-grid',
        start: 'top 80%',
    },
    x: -50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power2.out'
});

// Smooth Scroll for Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Form Submission (Simulated)
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'Sending...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerText = 'Message Sent!';
            btn.style.background = '#00ff88';
            contactForm.reset();

            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 3000);
        }, 1500);
    });
}

// Skills Keyboard Interaction
const keys = document.querySelectorAll('.key');

keys.forEach(key => {
    key.addEventListener('mouseenter', () => {
        // Animations or effects can be added here if needed
    });
});

// Section Title Reveal
gsap.utils.toArray('.section-title').forEach(title => {
    gsap.to(title, {
        scrollTrigger: title,
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });
});

// Project Cards Reveal - 2 by 2 Batch
ScrollTrigger.batch('.project-card', {
    onEnter: batch => gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2, // Small stagger between the pair
        ease: 'power3.out',
        overwrite: true
    }),
    start: 'top 85%',
    batchMax: 2 // Reveal in pairs
});

// Timeline Items Reveal
gsap.to('.timeline-item', {
    scrollTrigger: '.timeline',
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.2,
    ease: 'power3.out'
});

// Show More Skills Toggle
const showMoreBtn = document.getElementById('show-more-skills');
const moreSkillsContainer = document.getElementById('more-skills-container');

if (showMoreBtn && moreSkillsContainer) {
    showMoreBtn.addEventListener('click', () => {
        const isVisible = moreSkillsContainer.classList.toggle('visible');
        showMoreBtn.innerText = isVisible ? 'Show Less Skills' : 'Show More Skills';

        // Refresh ScrollTrigger to account for layout change
        ScrollTrigger.refresh();
    });
}

// Initial Reveal for Hero
document.addEventListener('DOMContentLoaded', () => {
    const heroTimeline = gsap.timeline();

    heroTimeline.to('.hero-text-overlay .reveal', {
        opacity: 1,
        y: 0,
        duration: 1.5,
        stagger: 0.3,
        ease: 'power4.out',
        delay: 0.5,
        onComplete: startTyping
    });
});

function startTyping() {
    const firstNameTarget = document.getElementById('typing-first');
    const lastNameTarget = document.getElementById('typing-last');
    const cursorFirst = document.getElementById('cursor-first');
    const cursorLast = document.getElementById('cursor-last');

    const firstName = "Harshil";
    const lastName = "Parekh";
    let firstIndex = 0;
    let lastIndex = 0;

    function typeFirstName() {
        if (firstIndex < firstName.length) {
            firstNameTarget.innerHTML += firstName.charAt(firstIndex);
            firstIndex++;
            setTimeout(typeFirstName, 150);
        } else {
            // Move cursor to next line
            cursorFirst.style.display = 'none';
            cursorLast.style.display = 'inline-block';
            setTimeout(typeLastName, 500);
        }
    }

    function typeLastName() {
        if (lastIndex < lastName.length) {
            lastNameTarget.innerHTML += lastName.charAt(lastIndex);
            lastIndex++;
            setTimeout(typeLastName, 150);
        }
    }

    typeFirstName();
}
