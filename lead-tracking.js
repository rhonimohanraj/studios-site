/*
 * Trident lead tracking (v1, 2026-11-12).
 * Sends two key events to GA4, and to the Meta Pixel / PostHog when they are on the page:
 *   inquiry_click  - a visitor clicks a link to an inquiry form, booking page or contact page
 *   generate_lead  - an OpnForm inquiry form embedded on this page is submitted successfully
 *   book_call      - a Cal.com call is booked (Films booking page)
 *   contact_click  - a mailto: / tel: link is clicked (tracked, not a key event)
 * Only the form's slug and the link are sent. Form answers are never read or forwarded.
 * Same file on every Trident site; edit the canonical copy and redeploy everywhere.
 */
(function () {
  if (window.__tridentLeadTracking) return;
  window.__tridentLeadTracking = true;

  var FORM_ORIGIN = 'https://forms.tridenteventgroup.ca';

  // Meta Pixel: loaded when the script tag carries data-meta-pixel="<pixel id>".
  var me = document.currentScript || document.querySelector('script[src*="lead-tracking.js"]');
  var pixelId = me && me.getAttribute('data-meta-pixel');
  if (pixelId && /^\d{6,20}$/.test(pixelId) && typeof window.fbq !== 'function') {
    /* Meta's standard base code */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }
  var INQUIRY_PATH = /(^|\/)(inquiry|inquire|book|contact)(\.html)?\/?$/i;
  var INQUIRY_HASH = /^#(contact|inquire|inquiry|book)$/i;

  function track(name, params, metaEvent) {
    params = params || {};
    params.page_path = location.pathname;
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch (e) {}
    try {
      if (metaEvent && typeof window.fbq === 'function') {
        window.fbq('track', metaEvent, { content_name: params.form_slug || params.link_url || name });
      }
    } catch (e) {}
    try { if (window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture(name, params); } catch (e) {}
  }
  window.tridentTrack = track;

  // Successful OpnForm submissions (the form posts this to its parent page after the server accepts it).
  var lastSubmit = {};
  window.addEventListener('message', function (e) {
    if (e.origin !== FORM_ORIGIN) return;
    var d = e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (x) { return; } }
    if (!d || d.type !== 'form-submitted') return;
    var slug = (d.form && d.form.slug) || 'unknown';
    var now = Date.now();
    if (lastSubmit[slug] && now - lastSubmit[slug] < 10000) return;
    lastSubmit[slug] = now;
    track('generate_lead', { form_slug: slug, lead_source: 'opnform' }, 'Lead');
  });

  // Clicks on inquiry / booking / contact links.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var raw = a.getAttribute('href') || '';
    var url;
    try { url = new URL(a.href, location.href); } catch (x) { return; }
    var text = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);

    if (url.protocol === 'mailto:' || url.protocol === 'tel:') {
      track('contact_click', { contact_method: url.protocol === 'tel:' ? 'phone' : 'email', link_text: text }, 'Contact');
      return;
    }

    var type = null;
    if (url.origin === FORM_ORIGIN) type = 'form';
    else if (/(^|\.)(cal\.com|calendly\.com)$/i.test(url.hostname)) type = 'booking';
    else if (url.origin === location.origin) {
      if (raw.charAt(0) === '#' ? INQUIRY_HASH.test(raw) : INQUIRY_PATH.test(url.pathname)) {
        var samePage = url.pathname.replace(/\.html$|\/$/, '') === location.pathname.replace(/\.html$|\/$/, '');
        if (samePage && raw.charAt(0) !== '#') return; // nav link to the page we are already on
        type = /book/i.test(url.pathname) ? 'booking' : /contact/i.test(url.pathname + raw) ? 'contact' : 'form';
      }
    }
    if (!type) return;
    track('inquiry_click', { cta_type: type, link_url: url.origin + url.pathname, link_text: text }, 'ViewContent');
  }, true);
})();
