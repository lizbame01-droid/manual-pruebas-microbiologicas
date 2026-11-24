/* =============================================================
   EXCEL SIN LIBRERÍAS  (js/xlsx-mini.js)
   Arma un archivo .xlsx (Office Open XML) en el navegador.
   MPMXlsx.descargar('archivo.xlsx', [{ nombre, columnas:[{t, ancho}], filas:[[...]] }])
   Las celdas numéricas se guardan como número; el resto como texto.
   La primera fila (encabezados) va en negritas, con filtro y fija.
   ============================================================= */
window.MPMXlsx = (function () {
  var enc = new TextEncoder();
  var TABLA = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = TABLA[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function x(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  function col(i) { var s = ''; i++; while (i) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }

  /* ZIP sin compresión */
  function zip(archivos) {
    var partes = [], central = [], off = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    archivos.forEach(function (a) {
      var nom = enc.encode(a.nombre), dat = enc.encode(a.texto), crc = crc32(dat);
      var loc = [].concat([0x50, 0x4b, 3, 4], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(dat.length), u32(dat.length), u16(nom.length), u16(0));
      partes.push(new Uint8Array(loc), nom, dat);
      central.push(new Uint8Array([].concat([0x50, 0x4b, 1, 2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(dat.length), u32(dat.length), u16(nom.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), nom);
      off += loc.length + nom.length + dat.length;
    });
    var tam = central.reduce(function (s, p) { return s + p.length; }, 0);
    var fin = new Uint8Array([].concat([0x50, 0x4b, 5, 6], u16(0), u16(0), u16(archivos.length), u16(archivos.length), u32(tam), u32(off), u16(0)));
    return new Blob(partes.concat(central, [fin]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function hoja(h) {
    var filas = [h.columnas.map(function (c) { return c.t; })].concat(h.filas);
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>' +
      '<cols>' + h.columnas.map(function (c, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (c.ancho || 16) + '" customWidth="1"/>'; }).join('') + '</cols><sheetData>';
    filas.forEach(function (f, r) {
      xml += '<row r="' + (r + 1) + '">';
      f.forEach(function (v, c) {
        var ref = col(c) + (r + 1), s = r === 0 ? ' s="1"' : ' s="2"';
        if (typeof v === 'number' && isFinite(v)) xml += '<c r="' + ref + '"' + s + '><v>' + v + '</v></c>';
        else if (v !== '' && v != null) xml += '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
      });
      xml += '</row>';
    });
    xml += '</sheetData><autoFilter ref="A1:' + col(h.columnas.length - 1) + Math.max(1, filas.length) + '"/><pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="1" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
    return xml;
  }

  function descargar(nombre, hojas) {
    var arch = [
      { nombre: '[Content_Types].xml', texto: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + hojas.map(function (h, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' },
      { nombre: '_rels/.rels', texto: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { nombre: 'xl/workbook.xml', texto: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + hojas.map(function (h, i) { return '<sheet name="' + x(h.nombre).slice(0, 31) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets><definedNames>' + hojas.map(function (h, i) { return '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + x(h.nombre) + '\'!$A$1:$' + col(h.columnas.length - 1) + '$' + Math.max(1, h.filas.length + 1) + '</definedName>'; }).join('') + '</definedNames></workbook>' },
      { nombre: 'xl/_rels/workbook.xml.rels', texto: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + hojas.map(function (h, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') + '<Relationship Id="rId' + (hojas.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { nombre: 'xl/styles.xml', texto: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF547071"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFC8DFE2"/></left><right style="thin"><color rgb="FFC8DFE2"/></right><top style="thin"><color rgb="FFC8DFE2"/></top><bottom style="thin"><color rgb="FFC8DFE2"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' }
    ].concat(hojas.map(function (h, i) { return { nombre: 'xl/worksheets/sheet' + (i + 1) + '.xml', texto: hoja(h) }; }));
    var a = document.createElement('a'); a.href = URL.createObjectURL(zip(arch)); a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  return { descargar: descargar, _zip: zip, _hoja: hoja };
})();
