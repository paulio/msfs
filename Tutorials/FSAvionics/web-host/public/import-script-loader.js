// Auto loader for MSFS-like <script type="text/html" import-script="..."> tags
(function() {
  function loadImportScripts() {
    const candidates = document.querySelectorAll('script[import-script]');
    candidates.forEach(orig => {
      const url = orig.getAttribute('import-script');
      if (!url) return;
      // Prevent double processing
      if (orig.dataset.processed === '1') return;
      orig.dataset.processed = '1';
      const s = document.createElement('script');
      // Preserve ordering by inserting right after the original placeholder
      s.src = url;
      // If you need module semantics, toggle next line
      // s.type = 'module';
      s.onload = () => console.debug('[import-script-loader] loaded', url);
      s.onerror = (e) => console.error('[import-script-loader] failed', url, e);
      orig.insertAdjacentElement('afterend', s);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadImportScripts);
  } else {
    loadImportScripts();
  }
})();
