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
    const aboutText1 = document.getElementById('about-text-1');
    const aboutText2 = document.getElementById('about-text-2');
    let aboutTypingStarted = false;

    function typeText(element, text, speed = 30, callback) {
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

    // Observer para activar el efecto cuando la sección sea visible
    const aboutObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !aboutTypingStarted) {
                aboutTypingStarted = true;
                
                // Guardar los textos originales
                const text1 = aboutText1.textContent;
                const text2 = aboutText2.textContent;
                
                // Limpiar los textos
                aboutText1.textContent = '';
                aboutText2.textContent = '';
                
                // Escribir el primer párrafo
                typeText(aboutText1, text1, 30, () => {
                    // Cuando termine el primero, escribir el segundo
                    setTimeout(() => {
                        typeText(aboutText2, text2, 30);
                    }, 300);
                });
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    });

    if (aboutText1) {
        aboutObserver.observe(document.getElementById('sobre-mi'));
    }

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