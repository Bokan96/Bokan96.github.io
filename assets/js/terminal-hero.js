/**
 * TERMINAL HERO SCROLL-AWAY
 * Hides the terminal banner when user scrolls down
 */
function initTerminalScrollAway() {
    const terminal = document.getElementById('hero-terminal');
    const container = document.querySelector('.terminal-container');
    if (!terminal || !container) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50 && currentScroll > lastScroll) {
            // Scrolling down - apply power off effect
            terminal.classList.add('hidden');
        } else if (currentScroll < lastScroll) {
            // Scrolling up - restore
            terminal.classList.remove('hidden');
        }

        lastScroll = currentScroll;
    });

    // Start power on sequence after preloader
    setTimeout(() => {
        container.classList.add('powered-on');
        // Start typing shortly after power-on animation finishes
        setTimeout(initTerminalTyping, 800);
    }, 4000);
}

/**
 * TERMINAL SEQUENTIAL TYPING ANIMATION
 * Types lines with speed variations and limited visibility window
 */
function initTerminalTyping() {
    const lines = document.querySelectorAll('[data-type-line]');
    const terminalBody = document.querySelector('.terminal-body');
    if (!lines.length || !terminalBody) return;

    let currentLineIndex = 0;
    const typingSpeedBase = 20; // Faster base speed
    const maxVisibleLines = 4;
    const visibleLines = [];

    function updateLineVisibility(newLine) {
        visibleLines.push(newLine);
        newLine.classList.add('visible');

        if (visibleLines.length > maxVisibleLines) {
            const oldLine = visibleLines.shift();
            oldLine.classList.remove('visible');
        }
    }

    function typeLine(lineElement) {
        return new Promise((resolve) => {
            const textElement = lineElement.querySelector('[data-text]');
            if (!textElement) {
                updateLineVisibility(lineElement);
                resolve();
                return;
            }

            const fullText = textElement.getAttribute('data-text');
            textElement.textContent = '';
            updateLineVisibility(lineElement);

            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            textElement.appendChild(cursor);

            let charIndex = 0;

            function typeCharacter() {
                if (charIndex < fullText.length) {
                    const char = fullText.charAt(charIndex);
                    textElement.textContent = fullText.substring(0, charIndex + 1);
                    textElement.appendChild(cursor);
                    charIndex++;

                    // Variable speed: Pause at punctuation or markers
                    let currentDelay = typingSpeedBase;
                    if (char === '.' || char === '!' || char === ']') currentDelay = 400;
                    else if (char === ',' || char === '[') currentDelay = 150;
                    else if (char === ' ') currentDelay = 60;

                    setTimeout(typeCharacter, currentDelay);
                } else {
                    cursor.remove();
                    // Small pause after line completion
                    setTimeout(resolve, 300);
                }
            }

            typeCharacter();
        });
    }

    async function typeAllLines() {
        for (let i = 0; i < lines.length; i++) {
            await typeLine(lines[i]);
        }

        // Show final prompt
        const finalLine = document.querySelector('.terminal-line:not([data-type-line])');
        if (finalLine) {
            updateLineVisibility(finalLine);
        }
    }

    typeAllLines();
}
