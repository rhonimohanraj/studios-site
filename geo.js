/* Trident Studios — location personalization
 *
 * Detects a visitor's approximate position from their IP address, finds the
 * nearest studio service city (Brandon, Winnipeg, or Regina), and personalizes
 * the homepage in place. The dedicated /brandon/, /winnipeg/, /regina/ pages
 * remain the crawlable, SEO-optimized source of truth — this only enhances the
 * experience for real visitors. Falls back silently to the static Brandon
 * defaults already in the HTML if anything fails.
 */

(() => {
  'use strict';

  /* Service cities — keep in sync with the static location pages + sitemap. */
  const LOCATIONS = {
    brandon: {
      name: 'Brandon',
      province: 'Manitoba',
      provinceAbbr: 'MB',
      lat: 49.8485,
      lng: -99.9501,
      url: '/brandon/',
      eyebrow: 'Brandon · Westman · Manitoba & Beyond',
      serving: 'Brandon, Westman & all of Manitoba',
    },
    winnipeg: {
      name: 'Winnipeg',
      province: 'Manitoba',
      provinceAbbr: 'MB',
      lat: 49.8951,
      lng: -97.1384,
      url: '/winnipeg/',
      eyebrow: 'Winnipeg · Manitoba & Beyond',
      serving: 'Winnipeg & all of Manitoba',
    },
    regina: {
      name: 'Regina',
      province: 'Saskatchewan',
      provinceAbbr: 'SK',
      lat: 50.4452,
      lng: -104.6189,
      url: '/regina/',
      eyebrow: 'Regina · Saskatchewan & Beyond',
      serving: 'Regina & southern Saskatchewan',
    },
  };

  const DEFAULT_KEY = 'brandon';
  const CACHE_KEY = 'ts-geo';
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  /* Great-circle distance (km) between two lat/lng points. */
  const distanceKm = (aLat, aLng, bLat, bLng) => {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const lat1 = toRad(aLat);
    const lat2 = toRad(bLat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const nearestKey = (lat, lng) => {
    let best = DEFAULT_KEY;
    let bestDist = Infinity;
    for (const key in LOCATIONS) {
      const loc = LOCATIONS[key];
      const d = distanceKm(lat, lng, loc.lat, loc.lng);
      if (d < bestDist) {
        bestDist = d;
        best = key;
      }
    }
    return best;
  };

  const readCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !LOCATIONS[parsed.key]) return null;
      if (Date.now() - parsed.ts > CACHE_TTL) return null;
      return parsed.key;
    } catch (e) {
      return null;
    }
  };

  const writeCache = (key) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ key, ts: Date.now() }));
    } catch (e) {
      /* storage unavailable — ignore */
    }
  };

  /* Apply the chosen location to the homepage DOM. */
  const personalize = (key) => {
    const loc = LOCATIONS[key];
    if (!loc) return;

    document.documentElement.setAttribute('data-geo', key);

    document.querySelectorAll('[data-geo-eyebrow]').forEach((el) => {
      el.textContent = loc.eyebrow;
    });
    document.querySelectorAll('[data-geo-serving]').forEach((el) => {
      el.textContent = loc.serving;
    });
    document.querySelectorAll('[data-geo-city]').forEach((el) => {
      el.textContent = loc.name;
    });

    /* Personalized call-to-action linking to the local landing page. */
    document.querySelectorAll('[data-geo-cta]').forEach((el) => {
      const link = el.querySelector('a') || el;
      link.setAttribute('href', loc.url);
      const label = el.querySelector('[data-geo-cta-label]');
      if (label) {
        label.textContent = `Planning a wedding near ${loc.name}? See our ${loc.name} page`;
      }
      el.hidden = false;
    });

    /* Float the matching testimonial to the front, if present. */
    const grid = document.querySelector('[data-geo-testimonials]');
    if (grid) {
      const match = grid.querySelector(`[data-city="${key}"]`);
      if (match && match !== grid.firstElementChild) {
        grid.insertBefore(match, grid.firstElementChild);
      }
    }
  };

  const detect = async () => {
    /* Free, no-key, HTTPS IP geolocation. */
    const res = await fetch('https://ipwho.is/?fields=success,latitude,longitude', {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('geo http ' + res.status);
    const data = await res.json();
    if (
      data &&
      data.success !== false &&
      typeof data.latitude === 'number' &&
      typeof data.longitude === 'number'
    ) {
      return nearestKey(data.latitude, data.longitude);
    }
    throw new Error('geo payload invalid');
  };

  const run = () => {
    const cached = readCache();
    if (cached) {
      personalize(cached);
      return;
    }
    detect()
      .then((key) => {
        writeCache(key);
        personalize(key);
      })
      .catch(() => {
        /* Leave the static Brandon defaults in place. */
      });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
