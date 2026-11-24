/* =============================================================
   CONFIGURACIÓN DEL ACCESO  (js/config.js)
   -------------------------------------------------------------
   PARA ELIMINAR UNA CONTRASEÑA TEMPORAL: borra su renglón de
   "accesosLocales" (o cambia activo: true por activo: false).
   Quien haya entrado con ella pierde la sesión en su siguiente visita.

   SEGURIDAD: el contenido del manual está cifrado (AES-256). Cada
   renglón guarda la llave del contenido cifrada con su contraseña;
   aquí no está ninguna contraseña ni la llave en claro.

   PARA CAMBIAR O AGREGAR UNA CONTRASEÑA: entra al manual con una
   contraseña vigente, abre admin/generar-acceso.html, escribe la
   nueva contraseña y pega aquí el renglón que te entrega.

   El acceso con Microsoft no entrega la llave del contenido cifrado:
   antes de activarlo habría que guardar la llave en un servidor.

   PARA ACTIVAR MICROSOFT (cuando la escuela registre la aplicación):
   1) llena clientId y tenantId, 2) pon habilitado: true,
   3) cambia modo a 'ambos' (contraseña + Microsoft) o 'microsoft'.
   ============================================================= */
window.MPM_CONFIG = {
  acceso: {
    modo: 'local',              // 'local' | 'ambos' | 'microsoft'
    duracionSesionHoras: 8,
    accesosLocales: [
      { id: 'acceso-1', etiqueta: 'Acceso temporal 1', sal: 'Vys2S1sRIt4AAAAAAAAAAA==', llave: 'rv0Ku+Tzf+DR6/dY/77aRsKG69+Cv9udzw3hYKSPpD3TSeXhC8M7YP7jezntfIkMmymiglx9afjY2LlH', activo: true },
      { id: 'acceso-2', etiqueta: 'Acceso temporal 2', sal: 'IT/86B4/cM0AAAAAAAAAAA==', llave: 'HyNFKJeXxtkkrDaRKi2Fzkiw/PFZTtODSnpBSOKltadAKrxFIC7BnBP1abbSQPqiaAJ+1rYFgBqLxs+y', activo: true }
    ],
    microsoft: {
      habilitado: false,
      clientId: '',             // Id. de aplicación (cliente) que entrega la escuela
      tenantId: '',             // Id. de directorio (inquilino) de la escuela
      redirectUri: '',          // vacío = la misma página de acceso
      dominiosPermitidos: ['ipn.mx', 'alumno.ipn.mx'],
      permisos: ['openid', 'profile', 'email'],
      msalCdn: 'https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js'
    }
  }
};
