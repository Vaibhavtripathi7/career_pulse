// Percentiles from raw samples, and Prometheus histogram parsing / quantiles.

/** Linear-interpolated quantile (the "type 7" estimator) of raw samples. */
export function quantile(values: readonly number[], q: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const a = sorted[lo]!;
  const b = sorted[hi]!;
  return a + (b - a) * (pos - lo);
}

export function median(values: readonly number[]): number {
  return quantile(values, 0.5);
}

export interface Histogram {
  /** Cumulative counts per upper bound, ascending, ending with +Inf. */
  buckets: { le: number; count: number }[];
  count: number;
  sum: number;
}

/** Reads one histogram from a Prometheus text exposition (prom-client output). */
export function parseHistogram(text: string, name: string): Histogram | null {
  const buckets = new Map<number, number>();
  let count = 0;
  let sum = 0;
  let found = false;

  for (const line of text.split("\n")) {
    if (line.startsWith(`${name}_bucket{`)) {
      const le = /le="([^"]+)"/.exec(line)?.[1];
      const value = Number(line.slice(line.lastIndexOf(" ") + 1));
      if (le === undefined) continue;
      buckets.set(le === "+Inf" ? Number.POSITIVE_INFINITY : Number(le), value);
      found = true;
    } else if (line.startsWith(`${name}_sum`)) {
      sum = Number(line.slice(line.lastIndexOf(" ") + 1));
    } else if (line.startsWith(`${name}_count`)) {
      count = Number(line.slice(line.lastIndexOf(" ") + 1));
    }
  }
  if (!found) return null;
  return {
    buckets: [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([le, c]) => ({ le, count: c })),
    count,
    sum,
  };
}

/** Sums histograms from several processes (same bucket layout), like Prometheus `sum by (le)`. */
export function mergeHistograms(histograms: readonly Histogram[]): Histogram | null {
  const first = histograms[0];
  if (!first) return null;
  return {
    buckets: first.buckets.map((b, i) => ({
      le: b.le,
      count: histograms.reduce((acc, h) => acc + (h.buckets[i]?.count ?? 0), 0),
    })),
    count: histograms.reduce((acc, h) => acc + h.count, 0),
    sum: histograms.reduce((acc, h) => acc + h.sum, 0),
  };
}

/**
 * Same algorithm as PromQL histogram_quantile(): find the bucket holding the
 * rank, then interpolate linearly inside it (lower bound 0 for the first bucket).
 * If the rank falls in +Inf, return the highest finite bound.
 */
export function histogramQuantile(q: number, h: Histogram): number {
  const total = h.buckets.at(-1)?.count ?? 0;
  if (total === 0) return Number.NaN;
  const rank = q * total;

  for (let i = 0; i < h.buckets.length; i++) {
    const bucket = h.buckets[i]!;
    if (bucket.count < rank) continue;
    if (!Number.isFinite(bucket.le)) return h.buckets[i - 1]?.le ?? Number.NaN;
    const prev = h.buckets[i - 1];
    const start = prev?.le ?? 0;
    const below = prev?.count ?? 0;
    const inBucket = bucket.count - below;
    return inBucket === 0 ? bucket.le : start + (bucket.le - start) * ((rank - below) / inBucket);
  }
  return Number.NaN;
}
