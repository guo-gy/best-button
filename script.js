document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('coolButtonV4');
    const buttonContainer = document.getElementById('buttonContainer');
    const particlesContainer = document.getElementById('particlesContainer');
    const buttonTextInner = document.getElementById('buttonTextInner');

    const MAX_ROTATION_X = 18;
    const MAX_ROTATION_Y = 18;
    const PERSPECTIVE = 1500; // 与CSS一致

    let mouseX = 0, mouseY = 0;
    let particlesArray = [];
    let animationFrameId = null;

    // --- 3D Button Shading & Tilt Logic ---
    function updateButton3D(rx, ry, scale = 1.0) {
        button.style.setProperty('--button-transform-idle-base', `perspective(${PERSPECTIVE}px) scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg)`);
        button.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${button.classList.contains('clicked-v4') ? 0.97 : (isMouseOverButton ? 1.08 : 1.0)})`;
        
        // Simulate lighting based on tilt
        // Light source assumed from top-left-ish for this example
        const lightAngleX = Math.sin(ry * Math.PI / 180); // -1 to 1 for Y rotation
        const lightAngleY = Math.sin(rx * Math.PI / 180); // -1 to 1 for X rotation

        // Dynamic Inset Shadows for depth
        const insetIntensity = 8; // Max px for inset shadow offset
        button.style.setProperty('--inset-shadow-x', `${-lightAngleX * insetIntensity}px`);
        button.style.setProperty('--inset-shadow-y', `${-lightAngleY * insetIntensity}px`);
        button.style.setProperty('--inset-shadow-x-neg', `${lightAngleX * insetIntensity * 0.7}px`);
        button.style.setProperty('--inset-shadow-y-neg', `${lightAngleY * insetIntensity * 0.7}px`);
        
        // Modulate inset shadow color/opacity based on light angle
        const highlightOpacity = 0.1 + Math.max(0, lightAngleX * 0.1) + Math.max(0, lightAngleY * 0.1);
        const shadowOpacity = 0.2 + Math.max(0, -lightAngleX * 0.1) + Math.max(0, -lightAngleY * 0.1);
        button.style.setProperty('--inset-shadow-color1', `rgba(255,255,255,${Math.min(0.3, highlightOpacity)})`);
        button.style.setProperty('--inset-shadow-color2', `rgba(0,0,0,${Math.min(0.4, shadowOpacity)})`);

        // Text Depth effect
        const textPush = 2; // Max Z push for text
        const textShadowOffsetX = -lightAngleX * 1.5;
        const textShadowOffsetY = -lightAngleY * 1.5 + 1; // slight base offset
        const textShadowBlur = 2;
        const textShadowColor = `rgba(0,0,0,${0.2 + Math.max(0, -lightAngleX * 0.1) + Math.max(0, -lightAngleY * 0.1)})`;
        
        buttonTextInner.style.setProperty('--text-depth-shadow', `${textShadowOffsetX}px ${textShadowOffsetY}px ${textShadowBlur}px ${textShadowColor}`);
        buttonTextInner.style.setProperty('--text-transform', `translateZ(${lightAngleY * textPush}px) translateX(${-lightAngleX * textPush * 0.5}px)`);

        // Dynamic background gradient (subtle shift)
        const bgPosX = 50 + lightAngleX * 10; // Shift gradient position
        const bgPosY = 50 + lightAngleY * 10;
        // This needs the 'auroraBackgroundV4' animation to be on background-position, or use a pseudo-element for it.
        // For simplicity, we'll rely on the inset shadows more for lighting.
        // button.style.setProperty('--button-bg-pos', `${bgPosX}% ${bgPosY}%`); 
        // (This would require CSS var in background-position if not using aurora keyframes for pos)
    }
    
    let isMouseOverButton = false;

    if (button) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        button.addEventListener('mousemove', (e) => {
            isMouseOverButton = true;
            if (button.classList.contains('clicked-v4')) return;

            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const deltaX = x - centerX;
            const deltaY = y - centerY;

            const rotateY = (deltaX / centerX) * MAX_ROTATION_Y * -1;
            const rotateX = (deltaY / centerY) * MAX_ROTATION_X;
            updateButton3D(rotateX, rotateY, 1.08); // Scale up on hover
        });

        button.addEventListener('mouseleave', () => {
            isMouseOverButton = false;
            if (button.classList.contains('clicked-v4')) return;
            // Reset to idle state transform, potentially with idle pulse's current transform
            const currentIdleTransform = getComputedStyle(button).getPropertyValue('--button-transform-idle-base') || 'scale(1)';
            const match = currentIdleTransform.match(/rotateX\(([^d]+)deg\) rotateY\(([^d]+)deg\)/);
            let idleRx = 0, idleRy = 0;
            if(match && match.length === 3) {
                idleRx = parseFloat(match[1]);
                idleRy = parseFloat(match[2]);
            }
            updateButton3D(idleRx, idleRy, 1.0); // Reset scale
        });

        button.addEventListener('mousedown', () => {
            button.classList.add('clicked-v4');
            const currentTransform = getComputedStyle(button).transform;
            const matrix = new DOMMatrix(currentTransform);
            // Extract existing rotations to maintain them during click
            // This is complex; simpler to just set a fixed click transform
            // For now, let's assume a simpler click where rotation might momentarily reset.
            // Or, get current rotation from mousemove and apply scale.
            const rect = button.getBoundingClientRect();
            const x = mouseX - rect.left;
            const y = mouseY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const deltaX = x - centerX;
            const deltaY = y - centerY;
            const rY = (deltaX / centerX) * MAX_ROTATION_Y * -1;
            const rX = (deltaY / centerY) * MAX_ROTATION_X;
            button.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${rX}deg) rotateY(${rY}deg) scale(0.97)`;
        });

        button.addEventListener('mouseup', (e) => {
            button.classList.remove('clicked-v4');
            // Re-trigger mousemove to get correct hover state
            const event = new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY, bubbles: true });
            // Check if mouse is still over button
            const rect = button.getBoundingClientRect();
             if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                 button.dispatchEvent(event);
             } else {
                 button.dispatchEvent(new MouseEvent('mouseleave', {bubbles: true}));
             }


            const clickRect = button.getBoundingClientRect(); // Use button for relative particle positions
            const clickX = e.clientX - clickRect.left;
            const clickY = e.clientY - clickRect.top;
            spawnParticles(clickX, clickY);
            // spawnShockwave(clickX, clickY); // Optional
        });
        
        // Initialize button state
        updateButton3D(0,0);
    }

    // --- Particle System with Gravity ---
    const PARTICLE_COUNT = 35; // 粒子数量可以保持不变，或按需调整
    const PARTICLE_LIFESPAN = 360; // 从 180 增加到 360，使粒子存活时间延长一倍 (约6秒 @60fps)
    const PARTICLE_PULL_RADIUS = 250; // 引力作用半径可以保持不变
    const PARTICLE_PULL_STRENGTH = 0.3; // 从 0.8 减小到 0.3，显著减弱引力
    const PARTICLE_DAMPING = 0.96; 

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1.5;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = Math.random() * 15 + 8; // 8px to 23px
            this.life = PARTICLE_LIFESPAN;
            this.color = `hsl(${Math.random() * 60 + 180}, 100%, ${Math.random() * 30 + 60}%)`; // Blues, cyans, purples

            this.element = document.createElement('div');
            this.element.classList.add('particle-v4');
            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            this.element.style.backgroundColor = this.color;
            this.element.style.position = 'absolute'; // Ensure correct positioning
            particlesContainer.appendChild(this.element);
        }

        update(mouseGlobalX, mouseGlobalY, buttonRect) {
            this.life--;

            // Mouse gravity
            if (isMouseOverButton || this.life > PARTICLE_LIFESPAN * 0.7) { // Apply gravity more strongly initially or when mouse is over
                const mouseLocalX = mouseGlobalX - buttonRect.left;
                const mouseLocalY = mouseGlobalY - buttonRect.top;
                const dx = mouseLocalX - this.x;
                const dy = mouseLocalY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < PARTICLE_PULL_RADIUS && distance > 1) { // distance > 1 to avoid division by zero
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    // Force inversely proportional to distance (or distance squared for stronger effect)
                    const force = (PARTICLE_PULL_STRENGTH / (distance * 0.2 + 1)); // Adjusted falloff
                    this.vx += forceDirectionX * force;
                    this.vy += forceDirectionY * force;
                }
            }
            
            this.vx *= PARTICLE_DAMPING;
            this.vy *= PARTICLE_DAMPING;
            this.x += this.vx;
            this.y += this.vy;

            // Boundary checks (simple bounce or remove) - optional
            // if (this.x < 0 || this.x > buttonRect.width) this.vx *= -0.5;
            // if (this.y < 0 || this.y > buttonRect.height) this.vy *= -0.5;


            const currentOpacity = Math.max(0, Math.min(1, this.life / (PARTICLE_LIFESPAN * 0.6)));
            const currentScale = Math.max(0, this.life / PARTICLE_LIFESPAN) * (this.size / (this.size > 15 ? 10 : 8)); // Scale based on life and initial size

            this.element.style.transform = `translate(${this.x - this.size / 2}px, ${this.y - this.size / 2}px) scale(${currentScale})`;
            this.element.style.opacity = currentOpacity;


            if (this.life <= 0) {
                this.element.remove();
                return false; // Mark for removal
            }
            return true;
        }
    }

    function spawnParticles(x, y) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particlesArray.push(new Particle(x, y));
        }
        if (!animationFrameId) {
            animationLoop();
        }
    }

    function animationLoop() {
        const buttonRect = button.getBoundingClientRect(); // Get button's current position and size
        particlesArray = particlesArray.filter(p => p.update(mouseX, mouseY, buttonRect));

        if (particlesArray.length > 0) {
            animationFrameId = requestAnimationFrame(animationLoop);
        } else {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
});