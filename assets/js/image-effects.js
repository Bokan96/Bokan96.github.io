/**
 * IMAGE EFFECTS
 * Handles 3D parallax tilt and mouse-following shine.
 */

(function () {
    const cards = document.querySelectorAll('.parallax-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (centerY - y) / 10; // Max 10 degrees
            const rotateY = (x - centerX) / 10;

            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;

            // Handle Shine follow
            const shineX = (x / rect.width) * 100;
            const shineY = (y / rect.height) * 100;

            card.style.setProperty('--shine-x', `${shineX}%`);
            card.style.setProperty('--shine-y', `${shineY}%`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
            card.style.setProperty('--shine-opacity', '0');
        });

        card.addEventListener('mouseenter', () => {
            card.style.setProperty('--shine-opacity', '1');
        });
    });
})();
