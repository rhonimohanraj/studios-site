// WebMCP: in-page tools for browser AI agents (https://webmachinelearning.github.io/webmcp/).
// Configured by data attributes on this script tag: data-brand, data-inquiry.
(function () {
  var mc = document.modelContext || navigator.modelContext;
  if (!mc || typeof mc.registerTool !== 'function') return;

  var script = document.currentScript;
  var brand = (script && script.dataset.brand) || document.title;
  var inquiry = new URL((script && script.dataset.inquiry) || '/contact', location.origin).href;

  function text(t) {
    return { content: [{ type: 'text', text: t }] };
  }

  function fetchText(path, accept) {
    return fetch(new URL(path, location.origin).href, { headers: { Accept: accept } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + path);
      return r.text();
    });
  }

  var tools = [
    {
      name: 'get_site_guide',
      description: 'Read the ' + brand + ' guide for AI agents: what the business offers, where it works, when it is the right fit, and how to book.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      execute: function () {
        return fetchText('/llms.txt', 'text/plain').then(text);
      },
    },
    {
      name: 'get_page_markdown',
      description: 'Get any page of this website as clean Markdown. Pass a site path such as "/" or "/contact".',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Site path starting with "/"', default: '/' } },
      },
      annotations: { readOnlyHint: true },
      execute: function (input) {
        var path = (input && input.path) || '/';
        if (path.charAt(0) !== '/') path = '/' + path;
        return fetchText(path, 'text/markdown').then(text);
      },
    },
    {
      name: 'open_inquiry_form',
      description: 'Open the ' + brand + ' inquiry form so the user can request availability and a quote for their event. The user fills in and submits the form themselves.',
      inputSchema: { type: 'object', properties: {} },
      execute: function () {
        location.assign(inquiry);
        return text('Opening the inquiry form at ' + inquiry + '. The user completes and submits it.');
      },
    },
  ];

  tools.forEach(function (tool) {
    try {
      mc.registerTool(tool);
    } catch (e) {
      /* tool already registered or API shape changed; leave the page untouched */
    }
  });
})();
