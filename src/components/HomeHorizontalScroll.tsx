// [CodeGuard Feature Index]
// - AnimeJS panel entrance and indicator animation -> line 52
// - Horizontal panel navigation and wheel scrolling -> line 94
// - Interactive particle canvas background -> line 118
// - Panel rendering and page indicator controls -> line 251
// [/CodeGuard Feature Index]

"use client";

import { animate, stagger } from 'animejs';
import { Children, type ReactNode, useEffect, useRef, useState } from 'react';

const PANEL_IDS = ['hero', 'features', 'functions', 'themes', 'tech', 'quick', 'footer'];

type HomeHorizontalScrollProps = {
    children: ReactNode;
};

type CursorState = {
    x: number;
    y: number;
    active: number;
};

type Particle = {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    vx: number;
    vy: number;
    size: number;
    hue: number;
};

export default function HomeHorizontalScroll({ children }: HomeHorizontalScrollProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastWheelAt = useRef(0);
    const activeIndexRef = useRef(0);
    const cursorRef = useRef<CursorState>({ x: 0, y: 0, active: 0 });
    const [activeIndex, setActiveIndex] = useState(0);
    const panels = Children.toArray(children);

    useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const panel = container.querySelectorAll<HTMLElement>('[data-home-panel-content]')[activeIndex];
        const indicator = container.querySelectorAll<HTMLElement>('[data-home-indicator]')[activeIndex];
        if (!panel) return;

        animate(panel, {
            opacity: [0.36, 1],
            scale: [0.64, 1.015, 1],
            translateY: [44, -4, 0],
            filter: ['blur(12px)', 'blur(1px)', 'blur(0px)'],
            duration: 1280,
            ease: 'outElastic(1, .72)',
        });

        const elements = panel.querySelectorAll<HTMLElement>('h1, h2, h3, p, [data-enter-card], button, a');
        if (elements.length) {
            animate(elements, {
                opacity: [0, 1],
                translateY: [30, 0],
                scale: [0.9, 1],
                duration: 860,
                delay: stagger(54, { start: 180 }),
                ease: 'outExpo',
            });
        }

        if (indicator) {
            animate(indicator, {
                scaleX: [0.55, 1.16, 1],
                scaleY: [1.7, 0.88, 1],
                duration: 760,
                ease: 'outElastic(1, .62)',
            });
        }
    }, [activeIndex]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scrollToPanel = (index: number) => {
            const nextIndex = Math.max(0, Math.min(index, panels.length - 1));
            activeIndexRef.current = nextIndex;
            setActiveIndex(nextIndex);
            container.scrollTo({ left: nextIndex * container.clientWidth, behavior: 'smooth' });
        };

        const syncFromHash = () => {
            const hash = window.location.hash.replace('#', '');
            const index = PANEL_IDS.indexOf(hash);
            if (index >= 0) scrollToPanel(index);
        };

        const onWheel = (event: WheelEvent) => {
            const now = window.performance.now();
            const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
            if (Math.abs(delta) < 12) return;

            event.preventDefault();
            if (now - lastWheelAt.current < 520) return;

            lastWheelAt.current = now;
            scrollToPanel(activeIndexRef.current + (delta > 0 ? 1 : -1));
        };

        const onResize = () => {
            container.scrollTo({ left: activeIndexRef.current * container.clientWidth });
        };

        syncFromHash();
        container.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('hashchange', syncFromHash);
        window.addEventListener('resize', onResize);

        return () => {
            container.removeEventListener('wheel', onWheel);
            window.removeEventListener('hashchange', syncFromHash);
            window.removeEventListener('resize', onResize);
        };
    }, [panels.length]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        let animationFrame = 0;
        let width = 0;
        let height = 0;
        let particles: Particle[] = [];

        const resetParticles = () => {
            const count = width < 900 ? 54 : 90;
            particles = Array.from({ length: count }, (_, index) => {
                const column = index % 15;
                const row = Math.floor(index / 15);
                const baseX = (column + 0.5) * (width / 15);
                const baseY = (row + 0.5) * (height / Math.ceil(count / 15));
                return {
                    x: baseX,
                    y: baseY,
                    baseX,
                    baseY,
                    vx: 0,
                    vy: 0,
                    size: 1.4 + (index % 5) * 0.45,
                    hue: index % 3 === 0 ? 188 : index % 3 === 1 ? 214 : 318,
                };
            });
        };

        const resize = () => {
            const ratio = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = Math.max(0, window.innerHeight - 64);
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            resetParticles();
        };

        const render = () => {
            context.clearRect(0, 0, width, height);
            context.save();
            context.globalCompositeOperation = 'screen';

            const pointer = cursorRef.current;
            particles.forEach((particle) => {
                const dx = pointer.x - particle.x;
                const dy = pointer.y - particle.y;
                const distance = Math.max(28, Math.hypot(dx, dy));
                const influence = pointer.active ? Math.max(0, 1 - distance / 260) : 0;
                const angle = Math.atan2(dy, dx) + Math.PI / 2;

                particle.vx += Math.cos(angle) * influence * 1.8;
                particle.vy += Math.sin(angle) * influence * 1.8;
                particle.vx += (particle.baseX - particle.x) * 0.018;
                particle.vy += (particle.baseY - particle.y) * 0.018;
                particle.vx *= 0.88;
                particle.vy *= 0.88;
                particle.x += particle.vx;
                particle.y += particle.vy;

                const alpha = 0.2 + influence * 0.65;
                context.beginPath();
                context.fillStyle = `hsla(${particle.hue}, 88%, ${72 + influence * 14}%, ${alpha})`;
                context.shadowColor = `hsla(${particle.hue}, 88%, 70%, ${0.35 + influence * 0.45})`;
                context.shadowBlur = 10 + influence * 22;
                context.arc(particle.x, particle.y, particle.size + influence * 3, 0, Math.PI * 2);
                context.fill();

                if (influence > 0.26) {
                    context.beginPath();
                    context.strokeStyle = `rgba(165, 243, 252, ${influence * 0.18})`;
                    context.lineWidth = 1;
                    context.moveTo(pointer.x, pointer.y);
                    context.lineTo(particle.x, particle.y);
                    context.stroke();
                }
            });

            context.restore();
            animationFrame = window.requestAnimationFrame(render);
        };

        resize();
        render();
        window.addEventListener('resize', resize);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', resize);
        };
    }, []);

    const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
        cursorRef.current = {
            x: event.clientX,
            y: event.clientY - 64,
            active: 1,
        };
    };

    return (
        <div
            ref={containerRef}
            className="home-horizontal-scroll relative h-[calc(100vh-64px)] overflow-hidden bg-[#020617]"
            onMouseMove={handlePointerMove}
            onMouseLeave={() => {
                cursorRef.current = { ...cursorRef.current, active: 0 };
            }}
        >
            <div className="pointer-events-none fixed inset-x-0 bottom-0 top-16 z-40" aria-hidden="true">
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" />
            </div>

            <div className="flex h-full w-max snap-x snap-mandatory">
                {panels.map((panel, index) => (
                    <section
                        key={PANEL_IDS[index] ?? index}
                        className="h-full w-screen shrink-0 snap-start snap-always overflow-hidden"
                    >
                        <div data-home-panel-content className="home-panel-content h-full w-full">
                            {panel}
                        </div>
                    </section>
                ))}
            </div>

            <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-slate-950/54 px-3 py-2 backdrop-blur-xl">
                {panels.map((_, index) => (
                    <span
                        key={PANEL_IDS[index] ?? index}
                        data-home-indicator
                        className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-8 bg-cyan-200' : 'w-1.5 bg-white/30'}`}
                    />
                ))}
            </div>

            <style>{`
                .home-horizontal-scroll {
                    overscroll-behavior: none;
                }
                .home-horizontal-scroll::-webkit-scrollbar {
                    display: none;
                }
                .home-panel-content {
                    transform-origin: center;
                    will-change: transform, opacity, filter;
                }
                @media (max-width: 768px), (prefers-reduced-motion: reduce) {
                    .home-horizontal-scroll canvas {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
