/* =============================================================
   IMPRESIÓN CON FORMATO  (js/imprimir.js)
   Imprime solo un documento (una hoja de verificación o los
   registros) en tamaño carta, sin el encabezado, el menú ni el
   resto de la página. Se arma un documento aparte en un marco
   invisible y se manda a imprimir desde ahí.
   MPMImprimir.documento(titulo, html, cssExtra)
   ============================================================= */
window.MPMImprimir = (function () {
  var BASE = '@page{size:letter;margin:11mm 11mm 12mm}' +
    '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#1c2b2d;font-family:Arial,Helvetica,sans-serif;font-size:9pt;line-height:1.3;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'h1{font-size:13pt;margin:0 0 2mm}h2{font-size:11pt;margin:4mm 0 2mm}p{margin:1mm 0}' +
    'table{width:100%;border-collapse:collapse;table-layout:auto}td,th{border:.6pt solid #7d9597;padding:1.2mm 1.6mm;vertical-align:top;text-align:left}' +
    'th{background:#547071;color:#fff;font-weight:700}' +
    '.encabezado{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1.4pt solid #547071;padding-bottom:2mm;margin-bottom:3mm}' +
    '.encabezado small{color:#5a6b6d}.pie-doc{margin-top:3mm;color:#5a6b6d;font-size:7.5pt}';
  function documento(titulo, html, css) {
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    var d = f.contentWindow.document;
    d.open();
    d.write('<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>' + MPM.esc(titulo) + '</title><style>' + BASE + (css || '') + '</style></head><body>' + html + '</body></html>');
    d.close();
    setTimeout(function () {
      try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { window.print(); }
      setTimeout(function () { f.remove(); }, 4000);
    }, 250);
  }
  function hoy() { var d = new Date(); return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }); }
  return { documento: documento, hoy: hoy };
})();
