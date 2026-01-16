/**
 * Architect's Stat Radar
 * A minimal, dependency-free interactive canvas radar chart.
 */

(function () {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return; // Only run if element exists (desktop)

    const container = document.getElementById('architect-radar');
    const tooltip = document.getElementById('radarTooltip');
    const ctx = canvas.getContext('2d');

    // Configuration
    const stats = [
        { label: "Logic", value: 1.0, desc: "Algorithmic thinking" },
        { label: "Creativity", value: 0.85, desc: "Innovative solutions" },
        { label: "Leadership", value: 0.9, desc: "Team scaling & mentorship" },
        { label: "Math", value: 0.95, desc: "Probability & models" },
        { label: "Optimization", value: 0.9, desc: "Performance tuning" }
    ];

    const colors = {
        primary: '#44CCCC', // #4CC
        primaryFade: 'rgba(68, 204, 204, 0.2)',
        primaryGlow: 'rgba(68, 204, 204, 0.6)',
        grid: 'rgba(255, 255, 255, 0.1)',
        text: '#FFFFFF',
        textFade: 'rgba(255, 255, 255, 0.7)'
    };

    // State
    let width, height, centerX, centerY, radius;
    let mouse = { x: 0, y: 0 };
    let isHovering = false;
    let activePoint = null;

    // Retina support & Sizing
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);

        width = rect.width;
        height = rect.height;
        centerX = width / 2;
        centerY = height / 2;
        radius = Math.min(width, height) / 2 * 0.75; // 75% of container
    }

    // Helper: Get point on circle
    function getPoint(index, value = 1.0) {
        const angle = (Math.PI * 2 * index) / stats.length - Math.PI / 2; // Start at top
        return {
            x: centerX + Math.cos(angle) * radius * value,
            y: centerY + Math.sin(angle) * radius * value
        };
    }

    // Draw Frame
    function draw() {
        ctx.clearRect(0, 0, width, height);

        // 1. Draw Grid (Concentric Pentagons)
        for (let i = 1; i <= 4; i++) {
            const level = i / 4;
            ctx.beginPath();
            for (let j = 0; j < stats.length; j++) {
                const p = getPoint(j, level);
                if (j === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
            ctx.strokeStyle = colors.grid;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 2. Draw Axes
        ctx.beginPath();
        for (let j = 0; j < stats.length; j++) {
            const p = getPoint(j, 1.0);
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // 3. Draw Data Polygon
        ctx.beginPath();
        const points = [];
        for (let j = 0; j < stats.length; j++) {
            const p = getPoint(j, stats[j].value);
            points.push(p);
            if (j === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = colors.primaryFade;
        ctx.fill();
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Draw Points & Labels
        activePoint = null;
        for (let j = 0; j < stats.length; j++) {
            const p = points[j];
            const maxP = getPoint(j, 1.25); // Label position

            // Check hover (simple distance check)
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const isPointHovered = dist < 20;

            if (isPointHovered) {
                activePoint = stats[j];
                // Draw glow pulse
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = colors.primaryGlow;
                ctx.fill();

                // Position tooltip
                tooltip.style.left = p.x + 'px';
                tooltip.style.top = p.y + 'px';
            }

            // Draw dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = isPointHovered ? '#FFF' : colors.primary;
            ctx.fill();

            // Draw Label
            ctx.fillStyle = isPointHovered ? '#FFF' : colors.textFade;
            ctx.font = isPointHovered ? '600 13px Inter' : '500 12px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(stats[j].label.toUpperCase(), maxP.x, maxP.y);
        }

        // Update Tooltip
        if (activePoint) {
            tooltip.innerHTML = `<strong>${activePoint.label}</strong><br>${activePoint.desc}`;
            tooltip.classList.add('visible');
            container.style.cursor = 'pointer';
        } else {
            tooltip.classList.remove('visible');
            container.style.cursor = 'default';
        }

        requestAnimationFrame(draw);
    }

    // Interaction Events
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;

        // 3D Tilt Effect
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((e.clientY - rect.top) - centerY) / 20; // Max tilt deg
        const rotateY = -((e.clientX - rect.left) - centerX) / 20;

        container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    container.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
        container.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    });

    // Init
    window.addEventListener('resize', resize);
    resize();
    draw();

})();
