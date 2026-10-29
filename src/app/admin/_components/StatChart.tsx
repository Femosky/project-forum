'use client';

import { useState } from 'react';

const WIDTH = 320;
const HEIGHT = 96;
const PAD = { top: 8, right: 4, bottom: 18, left: 4 };

// One metric over time: a thin ink line on a quiet baseline, drawn as inline SVG (no chart library: the site's
// JS budget). Hovering, or moving along it with a finger, shows that day's value. One series per chart, so the
// heading names it and no legend is needed; the same numbers are in the table below the charts.
// summary: 'total' for counts that add up over days (visitors, posts), 'latest' for levels (active this month)
export function StatChart({ label, points, summary = 'total' }: { label: string; points: { date: string; value: number }[]; summary?: 'total' | 'latest' }) {
    const [hover, setHover] = useState<number | null>(null);
    if (points.length === 0) return null;

    const max = Math.max(...points.map((point) => point.value), 1);
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const x = (index: number) => PAD.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = (value: number) => PAD.top + innerH - (value / max) * innerH;
    const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join('');
    const shown = hover === null ? null : points[hover];
    const total = points.reduce((sum, point) => sum + point.value, 0);
    const short = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    function pick(clientX: number, rect: DOMRect) {
        const ratio = (clientX - rect.left) / rect.width;
        const index = Math.round(((ratio * WIDTH - PAD.left) / innerW) * (points.length - 1));
        setHover(Math.min(Math.max(index, 0), points.length - 1));
    }

    return (
        <figure className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-3">
            <figcaption className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-muted">{label}</span>
                <span className="text-sm font-semibold tabular-nums">
                    {shown
                        ? `${shown.value.toLocaleString()} · ${short(shown.date)}`
                        : summary === 'total'
                          ? `${total.toLocaleString()} total`
                          : `${points[points.length - 1].value.toLocaleString()} latest`}
                </span>
            </figcaption>
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="h-24 w-full touch-none text-text"
                role="img"
                aria-label={`${label}: ${points.length} days, highest ${max.toLocaleString()}, latest ${points[points.length - 1].value.toLocaleString()}`}
                onPointerMove={(event) => pick(event.clientX, event.currentTarget.getBoundingClientRect())}
                onPointerLeave={() => setHover(null)}
            >
                <line x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} className="stroke-border" strokeWidth={1} />
                <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                {shown && hover !== null && (
                    <>
                        <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} className="stroke-border-strong" strokeWidth={1} />
                        <circle cx={x(hover)} cy={y(shown.value)} r={4} fill="currentColor" className="stroke-surface" strokeWidth={2} />
                    </>
                )}
                <text x={PAD.left} y={HEIGHT - 4} className="fill-subtle text-[10px]">
                    {short(points[0].date)}
                </text>
                <text x={WIDTH - PAD.right} y={HEIGHT - 4} textAnchor="end" className="fill-subtle text-[10px]">
                    {short(points[points.length - 1].date)}
                </text>
            </svg>
        </figure>
    );
}

export default StatChart;
