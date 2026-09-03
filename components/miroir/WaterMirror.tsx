import React, { useEffect, useRef } from 'react';
import { subscribeWaterRipple } from '../../services/miroir/waterRipple';

/**
 * La nappe d'eau du menu « Miroir d'eau » (DS-M2b) — proposition 06 choisie
 * par la Direction le 3 septembre 2026.
 *
 * Portage fidèle du moteur `waterScene()` de `design-lab/menu-06-miroir-eau.html` :
 * un ciel dégradé au-dessus, une ligne d'eau à 58 % de la hauteur qui ondule
 * réellement (deux sinusoïdes de périodes différentes), une nappe de lumière
 * qui dérive lentement, trois passes de caustiques en composition additive,
 * des étincelles sur les crêtes, et une lueur sous le dock. Un appui sur un
 * emplacement du dock envoie une VRAIE onde à cet endroit (bosse amortie qui
 * se propage puis s'éteint), via `services/miroir/waterRipple.ts`.
 *
 * Décisions propres à la mise en production, absentes de la maquette (qui ne
 * vivait que dans un cadre de 390 px) :
 *  - pas de dessin du tout quand `prefers-reduced-motion` est demandé : une
 *    seule image fixe est peinte, aucune boucle d'animation n'est lancée et
 *    aucun abonnement aux ondes n'est pris (l'accessibilité passe avant
 *    l'effet, comme partout ailleurs dans ce dépôt) ;
 *  - la boucle s'arrête quand l'onglet passe en arrière-plan et reprend au
 *    retour — inutile de peindre de l'eau que personne ne regarde ;
 *  - le pas d'échantillonnage de la ligne s'élargit sur les écrans larges
 *    (4 px sur téléphone, jusqu'à 8 px au-delà de 1 200 px) : à 1 920 px un
 *    pas de 4 px demanderait 480 points × 4 passes à chaque image ;
 *  - la densité de pixels est plafonnée à 1,5 comme dans la maquette.
 *
 * Le composant est purement décoratif : `aria-hidden`, `pointer-events-none`,
 * et il ne rend jamais rien d'informatif. S'il échoue à obtenir un contexte
 * 2D (navigateur sans canevas), l'application reste entièrement utilisable —
 * le fond `--mir-bg` du bloc `[data-miroir]` prend le relais.
 */

/** Fraction de la hauteur où se situe la ligne d'eau (identique à la maquette). */
export const WATER_LINE_FRACTION = 0.58;

/** Pas d'échantillonnage de la ligne d'eau selon la largeur réelle du canevas. */
export function sampleStepForWidth(width: number): number {
    if (!Number.isFinite(width) || width <= 0) return 4;
    if (width <= 520) return 4;
    if (width <= 1200) return 6;
    return 8;
}

interface Bump {
    x: number;
    /** Âge en images ; la bosse disparaît au-delà de 95. */
    age: number;
}

export const WaterMirror: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const reduceMotion =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let width = 0;
        let height = 0;
        let step = 4;
        let bumps: Bump[] = [];
        let raf = 0;
        let time = 0;
        let last = 0;
        let disposed = false;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            width = canvas.clientWidth || window.innerWidth || 1;
            height = canvas.clientHeight || window.innerHeight || 1;
            step = sampleStepForWidth(width);
            canvas.width = Math.max(1, Math.round(width * dpr));
            canvas.height = Math.max(1, Math.round(height * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        /** La ligne d'eau échantillonnée, ondulations et ondes d'appui comprises. */
        const surface = (t: number): Array<[number, number]> => {
            const waterTop = height * WATER_LINE_FRACTION;
            const points: Array<[number, number]> = [];
            for (let x = 0; x <= width; x += step) {
                let y = waterTop + Math.sin(x * 0.012 + t) * 7 + Math.sin(x * 0.031 - t * 1.4) * 3.5;
                for (const bump of bumps) {
                    const dx = Math.abs(x - bump.x);
                    if (dx < 150) {
                        y -= Math.cos(dx / 46) * 20 * Math.exp(-dx / 78) * Math.exp(-bump.age / 26);
                    }
                }
                points.push([x, y]);
            }
            return points;
        };

        const paint = (t: number, advance: boolean) => {
            const waterTop = height * WATER_LINE_FRACTION;
            ctx.clearRect(0, 0, width, height);

            // Le ciel : très clair, presque blanc à l'horizon haut.
            const sky = ctx.createLinearGradient(0, 0, 0, waterTop);
            sky.addColorStop(0, '#F5FCFF');
            sky.addColorStop(1, '#DCF3FA');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, width, waterTop);

            const points = surface(t);

            // Le corps de l'eau, sous la ligne.
            ctx.beginPath();
            ctx.moveTo(0, waterTop);
            for (const p of points) ctx.lineTo(p[0], p[1]);
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            const body = ctx.createLinearGradient(0, waterTop, 0, height);
            body.addColorStop(0, 'rgba(160,235,250,.35)');
            body.addColorStop(1, 'rgba(60,170,200,.55)');
            ctx.fillStyle = body;
            ctx.fill();

            ctx.save();
            ctx.clip();

            // La nappe de lumière qui dérive d'un bord à l'autre.
            const lx = width * (0.5 + 0.36 * Math.sin(t * 0.28));
            const ly = waterTop + (height - waterTop) * 0.3;
            const light = ctx.createRadialGradient(lx, ly, 0, lx, ly, (height - waterTop) * 1.6);
            light.addColorStop(0, 'rgba(255,255,255,.5)');
            light.addColorStop(0.5, 'rgba(255,255,255,.16)');
            light.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = light;
            ctx.fillRect(0, waterTop, width, height - waterTop);

            // Trois passes de caustiques, en composition additive.
            ctx.globalCompositeOperation = 'lighter';
            for (let k = 0; k < 3; k++) {
                const off = (k + 1) * 16;
                ctx.beginPath();
                points.forEach((p, i) => {
                    const sw = Math.sin(p[0] / 44 + t * 1.7 + k * 2.1) * (6 - k);
                    const y = p[1] + off + sw;
                    if (i) ctx.lineTo(p[0], y);
                    else ctx.moveTo(p[0], y);
                });
                ctx.strokeStyle = `rgba(255,255,255,${0.22 - k * 0.06})`;
                ctx.lineWidth = 1.4;
                ctx.stroke();
            }

            // Les étincelles sur les crêtes.
            for (let i = 0; i < points.length; i += 9) {
                const p = points[i];
                const sp = Math.pow(Math.max(0, Math.sin(i * 0.73 + t * 2.2)), 10);
                if (sp > 0.35) {
                    ctx.beginPath();
                    ctx.arc(p[0], p[1], 0.7 + sp * 1.6, 0, 6.3);
                    ctx.fillStyle = `rgba(255,255,255,${sp * 0.95})`;
                    ctx.fill();
                }
            }
            ctx.restore();
            ctx.globalCompositeOperation = 'source-over';

            // La ligne d'eau elle-même, nette et lumineuse.
            ctx.beginPath();
            points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
            ctx.shadowColor = 'rgba(200,250,255,.9)';
            ctx.shadowBlur = 14;
            ctx.strokeStyle = 'rgba(255,255,255,.85)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // La lueur qui accompagne le dock, en bas de l'écran.
            const glow = ctx.createRadialGradient(width / 2, height - 26, 0, width / 2, height - 26, width * 0.28);
            glow.addColorStop(0, `rgba(255,255,255,${0.28 + 0.1 * Math.sin(t * 1.3)})`);
            glow.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, Math.max(waterTop, height - 90), width, 90);

            if (advance) {
                bumps = bumps.filter(b => (b.age += 1) < 95);
            }
        };

        resize();

        if (reduceMotion) {
            // Une seule image, calme : aucune boucle, aucun abonnement.
            paint(0, false);
            const onResizeStatic = () => {
                if (disposed) return;
                resize();
                paint(0, false);
            };
            window.addEventListener('resize', onResizeStatic);
            return () => {
                disposed = true;
                window.removeEventListener('resize', onResizeStatic);
            };
        }

        const frame = (now: number) => {
            if (disposed) return;
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            time += dt;
            paint(time, true);
            raf = requestAnimationFrame(frame);
        };

        const start = () => {
            if (disposed || raf) return;
            last = typeof performance !== 'undefined' ? performance.now() : 0;
            raf = requestAnimationFrame(frame);
        };
        const stop = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
        };

        const onVisibility = () => {
            if (document.hidden) stop();
            else start();
        };
        const onResize = () => {
            if (disposed) return;
            resize();
            if (!raf) paint(time, false);
        };

        const unsubscribe = subscribeWaterRipple(xFraction => {
            bumps.push({ x: xFraction * width, age: 0 });
            // Au-delà de quelques ondes simultanées, l'eau devient du bruit.
            if (bumps.length > 6) bumps = bumps.slice(-6);
        });

        window.addEventListener('resize', onResize);
        document.addEventListener('visibilitychange', onVisibility);
        start();

        return () => {
            disposed = true;
            stop();
            unsubscribe();
            window.removeEventListener('resize', onResize);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="mir-scene"
            aria-hidden="true"
            data-testid="miroir-water-scene"
        />
    );
};

export default WaterMirror;
