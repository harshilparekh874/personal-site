import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initLamp(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const stage = document.createElement('div');
    stage.className = 'lamp__stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = `
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
    `;

    container.prepend(stage);
    container.classList.add('lamp');

    const left = stage.querySelector('.lamp__conic--left');
    const right = stage.querySelector('.lamp__conic--right');
    const halos = stage.querySelectorAll('.lamp__halo');
    const line = stage.querySelector('.lamp__beam-line');
    const heading = container.querySelector('.section-header');

    gsap.set([left, right], { opacity: 0.5, width: '15rem' });
    gsap.set(halos, { opacity: 0.35, scale: 0.9 });
    gsap.set(line, { opacity: 0.4, scaleX: 0.65 });

    if (heading) {
        gsap.set(heading, { opacity: 0.5, y: 80 });
    }

    const tl = gsap.timeline({ paused: true, delay: 0.25 });

    tl.to([left, right], {
        opacity: 1,
        width: '34rem',
        duration: 0.85,
        ease: 'power2.inOut',
    }, 0)
        .to(halos, {
            opacity: 1,
            scale: 1,
            duration: 0.75,
            ease: 'power2.out',
            stagger: 0.06,
        }, 0.15)
        .to(line, {
            opacity: 1,
            scaleX: 1,
            duration: 0.65,
            ease: 'power2.out',
        }, 0.25);

    if (heading) {
        tl.to(
            heading,
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.inOut',
            },
            0.3,
        );
    }

    const trigger = ScrollTrigger.create({
        trigger: container,
        start: 'top 90%',
        once: true,
        onEnter: () => tl.play(0),
    });

    if (ScrollTrigger.isInViewport(container, 0.1)) {
        tl.play(0);
    }

    return {
        destroy() {
            trigger.kill();
            tl.kill();
            stage.remove();
            container.classList.remove('lamp');
        },
    };
}
