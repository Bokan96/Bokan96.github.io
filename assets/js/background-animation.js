class ParticleNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.options = {
            particleColor: 'rgba(255, 255, 255, 0.5)',
            lineColor: 'rgba(68, 204, 204, 0.4)', // Teal color to match theme
            particleAmount: 100,
            defaultSpeed: 0.5,
            variantSpeed: 1,
            defaultRadius: 2,
            variantRadius: 2,
            linkRadius: 120,
        };

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.animate();

        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles(); // Recreate to fit new screen
        });
    }

    resize() {
        this.w = this.canvas.width = window.innerWidth;
        this.h = this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        const particleCount = Math.floor((this.w * this.h) / 12000); // Responsive count

        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(this));
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.w, this.h);

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
            this.particles[i].draw();
            this.joinParticles(this.particles[i]);
        }

        requestAnimationFrame(this.animate.bind(this));
    }

    joinParticles(particle) {
        for (let i = 0; i < this.particles.length; i++) {
            const p2 = this.particles[i];
            if (particle === p2) continue;

            const dx = particle.x - p2.x;
            const dy = particle.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.options.linkRadius) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = this.options.lineColor;
                this.ctx.globalAlpha = 1 - (dist / this.options.linkRadius);
                this.ctx.lineWidth = 0.5;
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
        }
    }
}

class Particle {
    constructor(network) {
        this.network = network;
        this.x = Math.random() * network.w;
        this.y = Math.random() * network.h;
        this.vx = (Math.random() - 0.5) * network.options.defaultSpeed;
        this.vy = (Math.random() - 0.5) * network.options.defaultSpeed;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > this.network.w) this.vx *= -1;
        if (this.y < 0 || this.y > this.network.h) this.vy *= -1;
    }

    draw() {
        this.network.ctx.beginPath();
        this.network.ctx.fillStyle = this.network.options.particleColor;
        this.network.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.network.ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ParticleNetwork('bg-canvas');
});
