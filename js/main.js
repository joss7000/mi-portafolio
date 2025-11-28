// ========================================
// PDF.JS CONFIGURATION
// ========================================
// Configurar PDF.js worker antes de que se use
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ========================================
// NAVIGATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Active navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    // Smooth scroll
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop;
                window.scrollTo({
                    top: offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update active nav on scroll
    function updateActiveNav() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').substring(1) === current) {
                item.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);

    // ========================================
    // PROFILE IMAGE MODAL
    // ========================================
    const profileImage = document.getElementById('profileImage');
    const profileModal = document.getElementById('profileModal');
    const profileClose = document.querySelector('.profile-close');

    if (profileImage && profileModal) {
        // Abrir modal al hacer clic en la foto
        profileImage.addEventListener('click', function() {
            profileModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        // Cerrar modal
        if (profileClose) {
            profileClose.addEventListener('click', function() {
                profileModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        }

        // Cerrar al hacer clic fuera de la imagen
        profileModal.addEventListener('click', function(e) {
            if (e.target === profileModal) {
                profileModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });

        // Cerrar con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && profileModal.classList.contains('active')) {
                profileModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // ========================================
    // MODAL PDF VIEWER WITH PDF.JS
    // ========================================
    const modal = document.getElementById('pdfModal');
    const modalClose = document.querySelector('.modal-close');
    const modalTitle = document.getElementById('modalTitle');
    const btnViewProjects = document.querySelectorAll('.btn-view-project');
    const pdfCanvas = document.getElementById('pdfCanvas');
    const pdfFallback = document.getElementById('pdfFallback');
    const pdfContainer = document.querySelector('.pdf-container');
    const pdfLoading = document.getElementById('pdfLoading');
    const pageNum = document.getElementById('pageNum');
    const pageCount = document.getElementById('pageCount');
    const zoomLevel = document.getElementById('zoomLevel');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const downloadBtn = document.getElementById('downloadPdf');

    let pdfDoc = null;
    let pageNumCurrent = 1;
    let pageRendering = false;
    let pageNumPending = null;
    let scale = 1.2;
    const scaleDelta = 0.2;

    // Renderizar página del PDF
    function renderPage(num) {
        pageRendering = true;
        
        pdfDoc.getPage(num).then(function(page) {
            const viewport = page.getViewport({ scale: scale });
            const ctx = pdfCanvas.getContext('2d');
            
            // Configurar dimensiones del canvas
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            const renderTask = page.render(renderContext);

            renderTask.promise.then(function() {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        pageNum.textContent = num;
    }

    // Función para hacer cola de renderizado
    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    // Página anterior
    function onPrevPage() {
        if (pageNumCurrent <= 1) return;
        pageNumCurrent--;
        queueRenderPage(pageNumCurrent);
    }

    // Página siguiente
    function onNextPage() {
        if (pageNumCurrent >= pdfDoc.numPages) return;
        pageNumCurrent++;
        queueRenderPage(pageNumCurrent);
    }

    // Zoom in
    function onZoomIn() {
        if (scale >= 3.0) return;
        scale += scaleDelta;
        zoomLevel.textContent = Math.round(scale * 100) + '%';
        queueRenderPage(pageNumCurrent);
    }

    // Zoom out
    function onZoomOut() {
        if (scale <= 0.5) return;
        scale -= scaleDelta;
        zoomLevel.textContent = Math.round(scale * 100) + '%';
        queueRenderPage(pageNumCurrent);
    }

    // Función para cambiar a iframe
    function switchToIframe(url) {
        console.log('Activando iframe con URL:', url);
        pdfCanvas.style.display = 'none';
        if (pdfFallback) {
            pdfFallback.src = url;
            pdfFallback.style.display = 'block';
            pdfFallback.style.width = '100%';
            pdfFallback.style.height = '100%';
            pdfFallback.style.minHeight = '600px';
            pdfFallback.style.border = 'none';
            console.log('Iframe configurado');
        } else {
            console.error('Elemento pdfFallback no encontrado');
        }
    }

    // Cargar PDF con PDF.js
    function loadPdf(url) {
        pdfLoading.style.display = 'flex';
        pdfContainer.style.display = 'none';
        pdfLoading.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Cargando PDF...</p>';

        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js no está cargado');
            pdfLoading.innerHTML = '<p>Error: PDF.js no está disponible. Por favor, recarga la página.</p>';
            return;
        }

        // Ocultar iframe y mostrar canvas
        pdfFallback.style.display = 'none';
        pdfCanvas.style.display = 'block';
        
        // Mostrar controles de navegación
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        pageNum.parentElement.style.display = 'inline';
        zoomInBtn.style.display = 'flex';
        zoomOutBtn.style.display = 'flex';
        zoomLevel.parentElement.style.display = 'inline';

        // Usar fetch para cargar el PDF como blob
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                return pdfjsLib.getDocument({ 
                    url: blobUrl,
                    verbosity: 0,
                    stopAtErrors: false
                }).promise;
            })
            .then(function(pdfDoc_) {
                pdfDoc = pdfDoc_;
                pageCount.textContent = pdfDoc.numPages;
                pageNumCurrent = 1;
                scale = 1.2;
                zoomLevel.textContent = Math.round(scale * 100) + '%';
                
                pdfCanvas.setAttribute('data-pdf-url', url);
                
                pdfLoading.style.display = 'none';
                pdfContainer.style.display = 'flex';
                pdfCanvas.style.display = 'block';
                
                renderPage(pageNumCurrent);
            })
            .catch(function(error) {
                console.error('Error al cargar PDF:', error);
                pdfLoading.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="color: #e74c3c; margin-bottom: 15px;"></i>
                    <p style="margin-bottom: 10px;">Error al cargar el PDF.</p>
                    <p style="font-size: 0.9rem; color: #666;">${error.message}</p>
                `;
            });
    }

    // Event listeners para controles
    prevBtn.addEventListener('click', onPrevPage);
    nextBtn.addEventListener('click', onNextPage);
    zoomInBtn.addEventListener('click', onZoomIn);
    zoomOutBtn.addEventListener('click', onZoomOut);

    // Descargar PDF
    downloadBtn.addEventListener('click', function() {
        const pdfUrl = pdfCanvas.getAttribute('data-pdf-url');
        if (pdfUrl) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = pdfUrl.split('/').pop();
            link.click();
        }
    });

    // Navegación con teclado
    document.addEventListener('keydown', function(e) {
        if (!modal.classList.contains('active')) return;
        
        if (e.key === 'ArrowLeft') {
            onPrevPage();
        } else if (e.key === 'ArrowRight') {
            onNextPage();
        } else if (e.key === '+' || e.key === '=') {
            onZoomIn();
        } else if (e.key === '-') {
            onZoomOut();
        }
    });

    // Open modal
    btnViewProjects.forEach(btn => {
        btn.addEventListener('click', function() {
            const pdfFile = this.getAttribute('data-pdf');
            const projectTitle = this.closest('.project-card').querySelector('.project-title').textContent;
            const pdfUrl = `assets/pdf/${pdfFile}`;
            
            modalTitle.textContent = projectTitle;
            pdfCanvas.setAttribute('data-pdf-url', pdfUrl);
            loadPdf(pdfUrl);
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Close modal
    modalClose.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    function closeModal() {
        modal.classList.remove('active');
        pdfDoc = null;
        pageNumCurrent = 1;
        pdfContainer.style.display = 'none';
        pdfLoading.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // ========================================
    // SCROLL ANIMATIONS
    // ========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animate elements
    const animatedElements = document.querySelectorAll('.project-card, .skill-card, .info-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // ========================================
    // MOBILE MENU TOGGLE (if needed)
    // ========================================
    // You can add a hamburger menu button for mobile
    const createMobileMenuButton = () => {
        const button = document.createElement('button');
        button.className = 'mobile-menu-toggle';
        button.innerHTML = '<i class="fas fa-bars"></i>';
        button.style.cssText = `
            display: none;
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1001;
            background: linear-gradient(135deg, var(--pastel-purple) 0%, var(--pastel-pink) 100%);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        `;

        document.body.appendChild(button);

        button.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });

        // Show button on mobile
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleMediaChange = (e) => {
            button.style.display = e.matches ? 'flex' : 'none';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
        };
        
        mediaQuery.addListener(handleMediaChange);
        handleMediaChange(mediaQuery);
    };

    createMobileMenuButton();

    // ========================================
    // TYPING EFFECT FOR HERO TITLE (Optional)
    // ========================================
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const text = heroTitle.innerHTML;
        heroTitle.innerHTML = '';
        let i = 0;
        
        const typeWriter = () => {
            if (i < text.length) {
                heroTitle.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        // Uncomment to enable typing effect
        // typeWriter();
    }

    // ========================================
    // TYPING EFFECT FOR ABOUT SECTION
    // ========================================
    function initTypingEffect() {
        const aboutText1 = document.getElementById('about-text-1');
        const aboutText2 = document.getElementById('about-text-2');
        const sobreMiSection = document.getElementById('sobre-mi');
        
        if (!aboutText1 || !aboutText2 || !sobreMiSection) {
            console.log('Elementos de "Sobre Mí" no encontrados');
            return;
        }
        
        let aboutTypingStarted = false;

        function typeText(element, text, speed = 30, callback) {
            if (!element || !text) return;
            
            element.textContent = '';
            element.classList.add('typing');
            let i = 0;
            
            const typeWriter = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, speed);
                } else {
                    element.classList.remove('typing');
                    if (callback) callback();
                }
            };
            
            typeWriter();
        }

        // Guardar los textos originales ANTES de que se modifiquen
        const originalText1 = aboutText1.textContent.trim();
        const originalText2 = aboutText2.textContent.trim();
        
        // Limpiar los textos inicialmente
        aboutText1.textContent = '';
        aboutText2.textContent = '';

        // Observer para activar el efecto cuando la sección sea visible
        const aboutObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting && !aboutTypingStarted) {
                    aboutTypingStarted = true;
                    
                    // Escribir el primer párrafo
                    typeText(aboutText1, originalText1, 30, () => {
                        // Cuando termine el primero, escribir el segundo
                        setTimeout(() => {
                            typeText(aboutText2, originalText2, 30);
                        }, 300);
                    });
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        });

        aboutObserver.observe(sobreMiSection);
    }
    
    // Inicializar el efecto de escritura
    initTypingEffect();

    // ========================================
    // SMOOTH REVEAL ON PAGE LOAD
    // ========================================
    window.addEventListener('load', () => {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    });
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Scroll to top button (optional)
function createScrollTopButton() {
    const button = document.createElement('button');
    button.className = 'scroll-top-btn';
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, var(--pastel-purple) 0%, var(--pastel-pink) 100%);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 999;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    `;

    document.body.appendChild(button);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    });

    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Uncomment to enable scroll to top button
// createScrollTopButton();

// ========================================
// CONTACT SECTION - HAPPY FACES AND HEARTS
// ========================================
(function() {
    const canvas = document.getElementById('contactCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    // Emojis relacionados con contacto
    const emojis = ['📞', '📱', '✉️', '📧', '💌', '📬', '📮', '📠', '☎️', '📲', '💬', '📨'];
    
    // Clase para emojis flotantes
    class FloatingEmoji {
        constructor(x, y, emoji) {
            this.x = x;
            this.y = y;
            this.emoji = emoji;
            this.size = Math.random() * 30 + 20;
            this.velocity = {
                x: (Math.random() - 0.5) * 2,
                y: Math.random() * 2 + 1  // Caen hacia abajo
            };
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.05;
            this.opacity = Math.random() * 0.5 + 0.5;
            this.life = 1.0;
            this.decay = Math.random() * 0.01 + 0.005;
        }
        
        update() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.velocity.y += 0.1; // Gravedad
            this.rotation += this.rotationSpeed;
            this.life -= this.decay;
            this.opacity = this.life;
            
            // Rebote suave en los bordes laterales
            if (this.x < 0 || this.x > canvas.width) {
                this.velocity.x *= -1;
            }
        }
        
        draw() {
            if (this.life <= 0) return;
            
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
            ctx.restore();
        }
        
        isDead() {
            return this.life <= 0 || this.y > canvas.height + 50;
        }
    }
    
    let emojisArray = [];
    
    function resizeCanvas() {
        const contactSection = document.getElementById('contacto');
        if (contactSection) {
            canvas.width = contactSection.offsetWidth;
            canvas.height = contactSection.offsetHeight;
        }
    }
    
    function createEmoji() {
        const x = Math.random() * canvas.width;
        const y = -20; // Empiezan desde arriba
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        emojisArray.push(new FloatingEmoji(x, y, emoji));
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Crear nuevos emojis ocasionalmente
        if (Math.random() < 0.08 && emojisArray.length < 15) {
            createEmoji();
        }
        
        // Actualizar y dibujar emojis
        emojisArray = emojisArray.filter(emoji => {
            emoji.update();
            emoji.draw();
            return !emoji.isDead();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Inicializar
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Crear algunos emojis iniciales
    setTimeout(() => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => createEmoji(), i * 200);
        }
        animate();
    }, 500);
    
    // Pausar animación cuando no está visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) {
                    animate();
                }
            } else {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        });
    }, { threshold: 0.1 });
    
    const contactSection = document.getElementById('contacto');
    if (contactSection) {
        observer.observe(contactSection);
    }
})();

// ========================================
// SKILLS SECTION - CODE RAIN EFFECT
// ========================================
(function() {
    const canvas = document.getElementById('skillsCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    // Símbolos de código para la lluvia
    const codeSymbols = ['{', '}', '<', '>', '/', '*', '(', ')', '[', ']', '=', '+', '-', ';', ':', '&', '|', '%', '#', '@', '!', '?'];
    
    // Clase para partículas de código
    class CodeParticle {
        constructor(x, y, symbol) {
            this.x = x;
            this.y = y;
            this.symbol = symbol;
            this.size = Math.random() * 16 + 12;
            this.velocity = {
                x: (Math.random() - 0.5) * 0.5,
                y: Math.random() * 2 + 1
            };
            this.opacity = Math.random() * 0.3 + 0.7; // Más opaco (0.7 a 1.0)
            this.life = 1.0;
            this.decay = Math.random() * 0.008 + 0.005;
            // Colores pasteles aleatorios (más opacos)
            const pastelColors = [
                'rgba(212, 165, 217, 0.9)', // purple
                'rgba(179, 212, 229, 0.9)', // blue
                'rgba(244, 194, 210, 0.9)', // pink
                'rgba(196, 229, 196, 0.9)', // green
                'rgba(245, 230, 168, 0.9)', // yellow
                'rgba(255, 212, 168, 0.9)'  // peach
            ];
            this.color = pastelColors[Math.floor(Math.random() * pastelColors.length)];
        }
        
        update() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.velocity.y += 0.05; // Gravedad suave
            this.life -= this.decay;
            this.opacity = this.life * 0.6;
        }
        
        draw() {
            if (this.life <= 0) return;
            
            ctx.save();
            ctx.globalAlpha = Math.min(this.opacity, 0.9); // Máximo 90% de opacidad
            ctx.fillStyle = this.color;
            ctx.font = `bold ${this.size}px 'Courier New', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.symbol, this.x, this.y);
            ctx.restore();
        }
        
        isDead() {
            return this.life <= 0 || this.y > canvas.height + 50;
        }
    }
    
    let particles = [];
    
    function resizeCanvas() {
        const skillsSection = document.getElementById('habilidades');
        if (skillsSection) {
            canvas.width = skillsSection.offsetWidth;
            canvas.height = skillsSection.offsetHeight;
        }
    }
    
    function createParticle() {
        const x = Math.random() * canvas.width;
        const y = -20; // Empiezan desde arriba
        const symbol = codeSymbols[Math.floor(Math.random() * codeSymbols.length)];
        particles.push(new CodeParticle(x, y, symbol));
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Crear nuevas partículas ocasionalmente
        if (Math.random() < 0.15 && particles.length < 20) {
            createParticle();
        }
        
        // Actualizar y dibujar partículas
        particles = particles.filter(particle => {
            particle.update();
            particle.draw();
            return !particle.isDead();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Inicializar
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Crear algunas partículas iniciales
    setTimeout(() => {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => createParticle(), i * 150);
        }
        animate();
    }, 500);
    
    // Pausar animación cuando no está visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) {
                    animate();
                }
            } else {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        });
    }, { threshold: 0.1 });
    
    const skillsSection = document.getElementById('habilidades');
    if (skillsSection) {
        observer.observe(skillsSection);
    }
})();

// ========================================
// PROJECTS SECTION - LIGHTNING EFFECT
// ========================================
(function() {
    const canvas = document.getElementById('lightningCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    // Colores pasteles para los rayos (más opacos)
    const lightningColors = [
        'rgba(212, 165, 217, 1)', // purple
        'rgba(179, 212, 229, 1)', // blue
        'rgba(244, 194, 210, 1)', // pink
        'rgba(196, 229, 196, 1)', // green
        'rgba(255, 255, 255, 1)'  // white (brillo)
    ];
    
    // Clase para rayos
    class Lightning {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = -50; // Empiezan desde arriba (fuera del canvas)
            this.targetY = canvas.height + 50; // Van hasta abajo
            this.targetX = this.x + (Math.random() - 0.5) * 300; // Más variación horizontal
            this.segments = [];
            this.life = 1.0;
            this.decay = 0.015; // Más lento para que duren más
            this.color = lightningColors[Math.floor(Math.random() * lightningColors.length)];
            this.createSegments();
        }
        
        createSegments() {
            const numSegments = 12 + Math.floor(Math.random() * 8); // Más segmentos para rayos más largos
            this.segments = [{ x: this.x, y: this.y }];
            
            for (let i = 1; i < numSegments; i++) {
                const progress = i / numSegments;
                const baseX = this.x + (this.targetX - this.x) * progress;
                const baseY = this.y + (this.targetY - this.y) * progress;
                
                // Agregar variación aleatoria más pronunciada para hacer el rayo más zigzagueante
                const offsetX = (Math.random() - 0.5) * 60;
                const offsetY = (Math.random() - 0.5) * 40;
                
                this.segments.push({
                    x: baseX + offsetX,
                    y: baseY + offsetY
                });
            }
            
            this.segments.push({ x: this.targetX, y: this.targetY });
        }
        
        update() {
            this.life -= this.decay;
        }
        
        draw() {
            if (this.life <= 0) return;
            
            ctx.save();
            ctx.globalAlpha = Math.min(this.life, 0.95); // Más opaco
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4; // Más grueso
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 15; // Efecto de brillo/glow
            ctx.shadowColor = this.color;
            
            // Dibujar el rayo principal
            ctx.beginPath();
            ctx.moveTo(this.segments[0].x, this.segments[0].y);
            
            for (let i = 1; i < this.segments.length; i++) {
                ctx.lineTo(this.segments[i].x, this.segments[i].y);
            }
            
            ctx.stroke();
            
            // Agregar brillo adicional (capa interna más brillante)
            ctx.globalAlpha = this.life * 0.7;
            ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.stroke();
            
            ctx.restore();
        }
        
        isDead() {
            return this.life <= 0;
        }
    }
    
    let lightnings = [];
    let lastLightningTime = 0;
    
    function resizeCanvas() {
        const projectsSection = document.getElementById('proyectos');
        if (projectsSection) {
            canvas.width = projectsSection.offsetWidth;
            canvas.height = projectsSection.offsetHeight;
        }
    }
    
    function createLightning() {
        lightnings.push(new Lightning());
        lastLightningTime = Date.now();
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Crear nuevos rayos más frecuentemente (cada 1.5-3 segundos)
        const now = Date.now();
        if (now - lastLightningTime > 1500 + Math.random() * 1500 && lightnings.length < 3) {
            createLightning();
        }
        
        // Actualizar y dibujar rayos
        lightnings = lightnings.filter(lightning => {
            lightning.update();
            lightning.draw();
            return !lightning.isDead();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Inicializar
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Crear un rayo inicial después de un delay
    setTimeout(() => {
        createLightning();
        animate();
    }, 1000);
    
    // Pausar animación cuando no está visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) {
                    animate();
                }
            } else {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        });
    }, { threshold: 0.1 });
    
    const projectsSection = document.getElementById('proyectos');
    if (projectsSection) {
        observer.observe(projectsSection);
    }
})();

// ========================================
// FIREWORKS EFFECT - PASTEL COLORS
// ========================================
(function() {
    const canvas = document.getElementById('fireworksCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    // Colores pasteles
    const pastelColors = [
        '#f4c2d2', // pastel-pink
        '#d4a5d9', // pastel-purple
        '#b3d4e5', // pastel-blue
        '#c4e5c4', // pastel-green
        '#f5e6a8', // pastel-yellow
        '#ffd4a8', // pastel-peach
        '#e6d5f0'  // pastel-lavender
    ];
    
    // Clase para partículas
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.velocity = {
                x: (Math.random() - 0.5) * 8,
                y: (Math.random() - 0.5) * 8
            };
            this.life = 1.0;
            this.decay = Math.random() * 0.02 + 0.015;
            this.size = Math.random() * 3 + 2;
        }
        
        update() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.velocity.y += 0.1; // gravedad
            this.life -= this.decay;
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Clase para fuegos artificiales
    class Firework {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.exploded = false;
            this.particles = [];
            this.color = pastelColors[Math.floor(Math.random() * pastelColors.length)];
        }
        
        explode() {
            this.exploded = true;
            const particleCount = 50 + Math.random() * 30;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = Math.random() * 5 + 2;
                const particle = new Particle(this.x, this.y, this.color);
                particle.velocity.x = Math.cos(angle) * speed;
                particle.velocity.y = Math.sin(angle) * speed;
                this.particles.push(particle);
            }
        }
        
        update() {
            if (!this.exploded) {
                this.explode();
            }
            
            this.particles = this.particles.filter(particle => {
                particle.update();
                return particle.life > 0;
            });
        }
        
        draw() {
            this.particles.forEach(particle => particle.draw());
        }
        
        isDead() {
            return this.exploded && this.particles.length === 0;
        }
    }
    
    let fireworks = [];
    
    function resizeCanvas() {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            canvas.width = heroSection.offsetWidth;
            canvas.height = heroSection.offsetHeight;
        }
    }
    
    function createFirework() {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.5) + 50; // En la parte superior
        fireworks.push(new Firework(x, y));
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Crear nuevos fuegos artificiales ocasionalmente
        if (Math.random() < 0.03 && fireworks.length < 3) {
            createFirework();
        }
        
        // Actualizar y dibujar fuegos artificiales
        fireworks = fireworks.filter(firework => {
            firework.update();
            firework.draw();
            return !firework.isDead();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Inicializar
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Crear algunos fuegos artificiales iniciales
    setTimeout(() => {
        for (let i = 0; i < 2; i++) {
            setTimeout(() => createFirework(), i * 500);
        }
        animate();
    }, 500);
    
    // Pausar animación cuando no está visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) {
                    animate();
                }
            } else {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        });
    }, { threshold: 0.1 });
    
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        observer.observe(heroSection);
    }
})();