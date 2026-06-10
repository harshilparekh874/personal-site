import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initLamp(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    container.className = 'lamp';
    container.innerHTML = `
        <div class="lamp__stage" aria-hidden="true">
            <div class="lamp__conic lamp__conic--left">
                <div class="lamp__mask lamp__mask--top"></div>
                <div class="lamp__mask lamp__mask--side lamp__mask--side-left"></div>
            </div>
            <div class="lamp__conic lamp__conic--right">
                <div class="lamp__mask lamp__mask--top"></div>
                <div class="lamp__mask lamp__mask--side lamp__mask--side-right"></div>
            </div>
            <div class="lamp__halo lamp__halo--wide"></div>
            <div class="lamp__halo lamp__halo--core"></div>
            <div class="lamp__beam-line"></div>
            <div class="lamp__floor"></div>
        </div>
    `;

    const stage = container.querySelector('.lamp__stage');
    const left = container.querySelector('.lamp__conic--left');
    const right = container.querySelector('.lamp__conic--right');
    const halos = container.querySelectorAll('.lamp__halo');
    const line = container.querySelector('.lamp__beam-line');

    gsap.set([left, right], { opacity: 0.55, width: '15rem' });
    gsap.set(halos, { opacity: 0, scale: 0.85 });
    gsap.set(line, { opacity: 0, scaleX: 0.6 });

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: container,
            start: 'top 82%',
            toggleActions: 'play none none none',
        },
    });

    tl.to([left, right], {
        opacity: 1,
        width: '36rem',
        duration: 0.9,
        ease: 'power2.inOut',
    }, 0.2)
        .to(halos, {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.08,
        }, 0.35)
        .to(line, {
            opacity: 1,
            scaleX: 1,
            duration: 0.7,
            ease: 'power2.out',
        }, 0.45);

    return {
        destroy() {
            tl.scrollTrigger?.kill();
            tl.kill();
            container.innerHTML = '';
        },
    };
}
