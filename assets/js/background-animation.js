class ParticleNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = {
            x: null,
            y: null,
            radius: 120 // Radius of mouse influence (reduced for subtler effect)
        };
        this.options = {
            particleColor: 'rgba(255, 255, 255, 0.4)', // More transparent for better text readability
            lineColor: 'rgba(68, 204, 204, 0.5)', // Teal color to match theme
            particleAmount: 160, // Increased density
            defaultSpeed: 0.3,
            variantSpeed: 0.5,
            defaultRadius: 1.5, // Slightly smaller nodes
            variantRadius: 2, // Restored variance
            linkRadius: 180, // Increased connection range for less empty space
            mouseForce: 0.5 // Reduced for gentle push effect
        };

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.animate();
        this.setupMouseInteraction();

        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles(); // Recreate to fit new screen
        });
    }

    setupMouseInteraction() {
        // Track mouse position
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Reset mouse position when leaving window
        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    resize() {
        this.w = this.canvas.width = window.innerWidth;
        this.h = this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        // Determine density based on screen area
        const particleCount = Math.max(30, Math.floor((this.w * this.h) / 10000));

        // Calculate grid for even distribution
        // We want cols/rows ratio to match aspect ratio approximates
        const aspectRatio = this.w / this.h;
        const cols = Math.floor(Math.sqrt(particleCount * aspectRatio));
        const rows = Math.ceil(particleCount / cols);

        const colWidth = this.w / cols;
        const rowHeight = this.h / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Place partially random within grid cell (with padding to prevent clustering)
                // Using 0.15 buffer on each side ensures nodes are never too close
                const x = c * colWidth + (colWidth * 0.15) + Math.random() * (colWidth * 0.7);
                const y = r * rowHeight + (rowHeight * 0.15) + Math.random() * (rowHeight * 0.7);
                this.particles.push(new Particle(this, x, y));
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.w, this.h);

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
            this.particles[i].draw();
            this.linkParticles(this.particles[i]);
        }

        requestAnimationFrame(this.animate.bind(this));
    }

    linkParticles(particle) {
        for (let i = 0; i < this.particles.length; i++) {
            const p2 = this.particles[i];
            if (particle === p2) continue;

            const dx = particle.x - p2.x;
            const dy = particle.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.options.linkRadius) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = this.options.lineColor;
                // Fade based on distance
                this.ctx.globalAlpha = (1 - (dist / this.options.linkRadius)) * 0.8;
                this.ctx.lineWidth = 1;
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
        }
    }
}

class Particle {
    constructor(network, x, y) {
        this.network = network;
        // Use provided coordinates or fallback to random
        this.x = x !== undefined ? x : Math.random() * network.w;
        this.y = y !== undefined ? y : Math.random() * network.h;
        this.baseX = this.x;
        this.baseY = this.y;
        this.vx = (Math.random() - 0.5) * network.options.defaultSpeed;
        this.vy = (Math.random() - 0.5) * network.options.defaultSpeed;
        this.size = Math.random() * network.options.variantRadius + network.options.defaultRadius;
    }

    update() {
        // Natural floating movement
        this.baseX += this.vx;
        this.baseY += this.vy;

        // Bounce off walls
        if (this.baseX < 0 || this.baseX > this.network.w) this.vx *= -1;
        if (this.baseY < 0 || this.baseY > this.network.h) this.vy *= -1;

        // Mouse interaction - gentle push effect
        if (this.network.mouse.x !== null && this.network.mouse.y !== null) {
            const dx = this.network.mouse.x - this.baseX;
            const dy = this.network.mouse.y - this.baseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.network.mouse.radius) {
                // Calculate gentle repulsion force
                const force = (this.network.mouse.radius - dist) / this.network.mouse.radius;
                const angle = Math.atan2(dy, dx);
                const forceX = Math.cos(angle) * force * this.network.options.mouseForce;
                const forceY = Math.sin(angle) * force * this.network.options.mouseForce;

                // Apply gentle force (gradually shift away from cursor)
                const targetX = this.baseX - forceX * 30;
                const targetY = this.baseY - forceY * 30;
                this.x += (targetX - this.x) * 0.08; // Smooth interpolation
                this.y += (targetY - this.y) * 0.08;
            } else {
                // Smoothly return to base position
                this.x += (this.baseX - this.x) * 0.05;
                this.y += (this.baseY - this.y) * 0.05;
            }
        } else {
            // No mouse, smoothly return to base position
            this.x += (this.baseX - this.x) * 0.05;
            this.y += (this.baseY - this.y) * 0.05;
        }
    }

    draw() {
        this.network.ctx.beginPath();
        this.network.ctx.fillStyle = this.network.options.particleColor;
        this.network.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.network.ctx.fill();

        // Add a subtle glow effect
        this.network.ctx.shadowBlur = 8;
        this.network.ctx.shadowColor = 'rgba(68, 204, 204, 0.4)';
        this.network.ctx.fill();
        this.network.ctx.shadowBlur = 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ParticleNetwork('bg-canvas');
});
