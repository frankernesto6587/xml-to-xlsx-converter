# MerXbit - Conversor XML a XLSX

<div align="center">

**Aplicación web para convertir extractos bancarios de XML a Excel**

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?style=flat&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=flat&logo=tailwind-css)

🔒 **100% Privado** - Todo el procesamiento ocurre en tu navegador

</div>

---

## 📋 ¿Qué hace esta aplicación?

**MerXbit** es una herramienta web que convierte archivos XML de extractos bancarios al formato XLSX (Excel), facilitando el análisis y gestión de transacciones bancarias. La aplicación procesa los datos directamente en el navegador, garantizando que **tu información financiera nunca salga de tu dispositivo**.

### 🎯 Características Principales

- **🔄 Conversión Inteligente**: Parsea archivos XML complejos y extrae datos estructurados
- **📊 Dos Hojas Excel**:
  - **Transacciones**: Tabla detallada con todas las operaciones
  - **Resumen**: Saldos inicial, final y estadísticas
- **🔍 Extracción Automática**: Identifica y separa:
  - Ordenante (nombre, CI, cuenta, tarjeta)
  - Beneficiario (cuenta)
  - Canal de transacción
  - Concepto detallado
- **📈 Estadísticas en Tiempo Real**:
  - Saldo inicial y final
  - Total de transacciones
  - Créditos y débitos separados
  - Importes totales
- **👀 Vista Previa**: Visualiza las primeras 10 transacciones antes de descargar
- **🎨 Interfaz Moderna**: Diseño dark mode con drag & drop
- **🔒 Seguridad Total**: Sin servidores, sin envío de datos

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- pnpm (recomendado) o npm

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd xml-to-xlsx-converter

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Uso

1. **Arrastra o selecciona** tu archivo XML de extracto bancario
2. **Visualiza** los datos procesados y las estadísticas
3. **Descarga** el archivo XLSX generado

---

## 🛠️ Tecnologías

| Tecnología | Uso | Versión |
|-----------|-----|---------|
| **React** | Framework UI | 19.2 |
| **Vite** | Build tool y dev server | 7.1 |
| **Tailwind CSS** | Estilos y diseño | 4.1 |
| **xlsx (SheetJS)** | Generación de archivos Excel | 0.18 |
| **xml-js** | Parsing de XML | 1.6 |
| **pnpm** | Gestor de paquetes | - |

---

## 📁 Estructura del Proyecto

```
xml-to-xlsx-converter/
├── src/
│   ├── components/
│   │   └── FileUpload.jsx       # Componente drag & drop
│   ├── utils/
│   │   ├── xmlParser.js         # Parser XML con extracción inteligente
│   │   └── xlsxGenerator.js     # Generador Excel + estadísticas
│   ├── App.jsx                  # Componente principal
│   └── index.css                # Estilos Tailwind
├── public/
│   └── muestra_100_operaciones.xml  # Archivo de ejemplo
├── tailwind.config.js           # Configuración Tailwind
├── vite.config.js               # Configuración Vite
└── package.json
```

---

## 🔧 Comandos Disponibles

```bash
# Desarrollo
pnpm run dev          # Inicia servidor de desarrollo

# Producción
pnpm run build        # Construye para producción
pnpm run preview      # Preview del build de producción

# Calidad de código
pnpm run lint         # Ejecuta ESLint
```

---

## 📊 Formato XML Soportado

La aplicación procesa archivos XML con la siguiente estructura:

```xml
<NewDataSet>
  <Estado_x0020_de_x0020_Cuenta>
    <fecha>11/09/2025</fecha>
    <ref_corrie>YR50004013598</ref_corrie>
    <ref_origin>98025A4432777</ref_origin>
    <observ><!-- Detalles de la transacción --></observ>
    <importe>10200.00</importe>
    <tipo>Cr</tipo>
  </Estado_x0020_de_x0020_Cuenta>
</NewDataSet>
```

### Registros Especiales

La aplicación identifica automáticamente registros de saldo:
- **Saldo Contable Anterior** (Saldo inicial)
- **Saldo Contable Final**
- **Saldo Reservado**
- **Saldo Sobre Giro**
- **Saldo Disponible Final**

---

## 📋 Columnas Exportadas

El archivo Excel incluye las siguientes columnas:

| Columna | Descripción |
|---------|-------------|
| **Fecha** | Fecha de la transacción |
| **Ref. Corriente** | Referencia corriente |
| **Ref. Origen** | Referencia de origen |
| **Canal** | Canal de transacción (Banca Móvil, etc.) |
| **Ordenante** | Nombre de quien envía |
| **CI Ordenante** | Cédula de identidad |
| **Cuenta Ordenante** | Número de cuenta origen |
| **Tarjeta** | Número de tarjeta enmascarado |
| **Cuenta Beneficiario** | Cuenta destino |
| **Concepto** | Descripción de la transacción |
| **Importe** | Monto de la transacción |
| **Tipo** | Cr (Crédito) o Dr (Débito) |

---

## 🔒 Privacidad y Seguridad

### ✅ Tu información está segura

- ✅ **Procesamiento local**: Todo ocurre en tu navegador
- ✅ **Sin servidores**: No se envían datos a ningún servidor
- ✅ **Sin base de datos**: No se almacena ninguna información
- ✅ **Sin seguimiento**: No hay analytics ni cookies de terceros
- ✅ **Código abierto**: Puedes revisar todo el código

### 🛡️ Recomendaciones

- Usa la aplicación en un navegador actualizado
- Revisa los archivos descargados antes de compartirlos
- No compartas archivos XML con información sensible

---

## 🎨 Características de Diseño

- **Dark Mode** por defecto para reducir fatiga visual
- **Responsive**: Funciona en desktop, tablet y móvil
- **Drag & Drop**: Interfaz intuitiva para subir archivos
- **Animaciones sutiles**: Feedback visual en todas las acciones
- **Colores accesibles**: Alto contraste para mejor legibilidad

---

## 🚢 Despliegue

La aplicación puede desplegarse en cualquier servicio de hosting estático:

### Vercel
```bash
pnpm run build
vercel deploy
```

### Netlify
```bash
pnpm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
pnpm run build
# Subir carpeta dist/ a gh-pages branch
```

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

---

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📧 Soporte

Si encuentras algún problema o tienes sugerencias, por favor abre un issue en el repositorio.

---

<div align="center">

**Desarrollado con ❤️ por MerXbit**

</div>
