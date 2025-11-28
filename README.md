# Portafolio de Proyectos - Joselyn De Gracia

Portafolio web personal que muestra proyectos académicos y profesionales en Desarrollo y Gestión de Software. Incluye visualización de PDFs, efectos animados y un diseño moderno con colores pasteles.

## 🚀 Características

- **Diseño Responsive**: Adaptable a diferentes tamaños de pantalla
- **Visualizador de PDFs**: Integrado con PDF.js para ver proyectos directamente en el navegador
- **Efectos Animados**: Fuegos artificiales en colores pasteles en la sección de inicio
- **Navegación Suave**: Scroll suave entre secciones
- **Efecto de Escritura**: Animación de texto en la sección "Sobre Mí"
- **Tema Pastel**: Diseño moderno con colores pasteles (rosa, morado, azul, verde)

## 📁 Estructura del Proyecto

```
portafolio/
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos del portafolio
├── js/
│   └── main.js         # Funcionalidad JavaScript
├── assets/
│   ├── images/
│   │   └── profile.jpeg    # Foto de perfil
│   └── pdf/                # Archivos PDF de proyectos
│       ├── proyecto1-estructura-jerarquia.pdf
│       ├── proyecto2-unachi.pdf
│       ├── proyecto3-municipio-alanje.pdf
│       ├── proyecto4-junta-comunal-kali.pdf
│       ├── proyecto5-centro-lenguas-utp.pdf
│       ├── proyecto6-succesos-mas.pdf
│       ├── proyecto7-xampp-mysql.pdf
│       ├── proyecto8-chinos-cafe.pdf
│       └── proyecto10-nibarra.pdf
├── start-server.bat     # Script para iniciar servidor (Windows)
├── start-server.ps1     # Script para iniciar servidor (PowerShell)
└── README.md           # Este archivo
```

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos y animaciones
- **JavaScript (Vanilla)**: Funcionalidad interactiva
- **PDF.js**: Visualización de documentos PDF
- **Font Awesome**: Iconos
- **Google Fonts**: Tipografía (si se usa)

## 📦 Instalación y Uso

### Requisitos Previos

- Python 3.x (para el servidor local)
- Un navegador web moderno (Chrome, Firefox, Edge, Safari)

### Pasos para Ejecutar

1. **Clonar o descargar el proyecto**
   ```bash
   git clone [url-del-repositorio]
   cd portafolio
   ```

2. **Iniciar el servidor local**

   **Opción 1: Usando Python (Recomendado)**
   ```bash
   python -m http.server 8000
   ```

   **Opción 2: Usando los scripts incluidos**
   - Windows: Ejecutar `start-server.bat`
   - PowerShell: Ejecutar `start-server.ps1`

3. **Abrir en el navegador**
   - Navegar a: `http://localhost:8000`

### Nota Importante

⚠️ **Es necesario usar un servidor local** (no abrir el archivo HTML directamente) porque:
- Los PDFs requieren un servidor HTTP para cargar correctamente
- Evita problemas de CORS (Cross-Origin Resource Sharing)

## 🎨 Secciones del Portafolio

1. **Inicio**: Presentación con efectos de fuegos artificiales
2. **Sobre Mí**: Información personal con efecto de escritura animado
3. **Habilidades**: Tecnologías y herramientas que manejo
4. **Proyectos**: Galería de proyectos académicos y profesionales
5. **Contacto**: Información de contacto

## 📝 Personalización

### Cambiar la Foto de Perfil
Reemplazar `assets/images/profile.jpeg` con tu propia foto.

### Agregar/Modificar Proyectos
Editar la sección de proyectos en `index.html` y agregar los PDFs correspondientes en `assets/pdf/`.

### Modificar Colores
Los colores pasteles están definidos como variables CSS en `css/styles.css`:
```css
:root {
    --pastel-pink: #f4c2d2;
    --pastel-purple: #d4a5d9;
    --pastel-blue: #b3d4e5;
    /* ... más colores */
}
```

## 📧 Contacto

**Joselyn De Gracia González**  
Estudiante de Desarrollo y Gestión de Software  
Universidad Tecnológica de Panamá

- 📧 Email: [joselyn.degracia@utp.ac.pa](mailto:joselyn.degracia@utp.ac.pa)
- 📍 Ubicación: David, Chiriquí, Panamá

## 📄 Licencia

Este proyecto es de uso personal y académico.

## 🙏 Agradecimientos

- PDF.js por la librería de visualización de PDFs
- Font Awesome por los iconos
- Universidad Tecnológica de Panamá

---

**Última actualización**: 2024

