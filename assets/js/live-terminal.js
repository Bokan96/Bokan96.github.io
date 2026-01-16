/**
 * LIVE TERMINAL INTERACTIVE WIDGET
 * Handles typing animations, user interactions, and code snippets.
 */

(function () {
    const terminalWrapper = document.getElementById('live-terminal');
    const contentDiv = document.getElementById('terminal-content');
    const toggleBtn = document.getElementById('terminal-toggle');
    const bodyDiv = document.getElementById('terminal-body');
    const footerDiv = document.getElementById('terminal-footer');

    if (!terminalWrapper || !contentDiv || !footerDiv) return;

    // --- CONFIGURATION ---
    const TYPE_SPEED_MIN = 15;
    const TYPE_SPEED_MAX = 35;
    const PAUSE_SENTENCE = 800;
    const PAUSE_WORD = 60;

    // --- STATE ---
    let isTyping = false;
    let isPaused = false;
    let currentTask = null;
    let textQueue = [];
    let terminalState = 'intro'; // 'intro', 'menu', 'snippet'

    // --- CONTENT DATA ---
    const INTRO_SEQUENCE = [
        { text: "> Initializing environment...", class: "text-blue" },
        { text: "> Loading Bojan_Profile modules: [GameDesign, SystemArch, Analytics]", class: "text-green" },
        { text: "> Connection established.", class: "text-green", delay: 400 },
        { text: " " },
        { text: "Hello! I am an interactive terminal representing Bojan's codebase.", delay: 300 },
        { text: "I can show you actual code from his projects." },
        { text: " " },
        { text: "Choose from which project would you like to see some snippets:", class: "text-yellow", prompt: true }
    ];

    const SNIPPETS = {
        snowfight: [
            { text: "-- snowfight.lua (Lua Script)", class: "text-comment" },
            { text: "function hook_hit(id, source, weapon, hpdmg, apdmg)", class: "text-purple" },
            { text: "    -- Check for friendly fire", class: "text-comment" },
            { text: "    if (player(id, 'team') == player(source, 'team')) then" },
            { text: "        return 1" },
            { text: "    end" },
            { text: " " },
            { text: "    -- Snowball freezing logic", class: "text-comment" },
            { text: "    if weapon == 50 then" },
            { text: "        msg2(id, 'You got frosted!')", class: "text-green" },
            { text: "        speedmod(id, -5) -- Slow down player", class: "text-blue" },
            { text: "    end" },
            { text: "end" },
            { text: " ", prompt: true }
        ],
        village: [
            { text: "// VillagePillage.js (WebGL Logic)", class: "text-comment" },
            { text: "class VillageManager {", class: "text-purple" },
            { text: "  constructor(resources) {", class: "text-blue" },
            { text: "    this.food = resources.food;" },
            { text: "    this.wood = resources.wood;" },
            { text: "    this.population = 0;" },
            { text: "  }" },
            { text: " " },
            { text: "  update(dt) {", class: "text-blue" },
            { text: "    // Production cycle", class: "text-comment" },
            { text: "    this.food += this.farms * PRODUCTION_RATE * dt;" },
            { text: "    if (this.food > STORAGE_CAP) this.triggerEvent('overflow');" },
            { text: "    this.render();" },
            { text: "  }" },
            { text: "}", class: "text-purple" },
            { text: " ", prompt: true }
        ]
    };

    function clearButtons() {
        const options = footerDiv.querySelector('.terminal-options');
        if (options) options.remove();
        const menu = footerDiv.querySelector('.terminal-pause-menu');
        if (menu) menu.remove();

        // Ensure input line is visible if no buttons
        const inputLine = footerDiv.querySelector('.input-line');
        if (inputLine) inputLine.style.display = 'block';
    }

    function toggleTerminal() {
        terminalWrapper.classList.toggle('closed');
        const icon = toggleBtn.querySelector('i');

        if (terminalWrapper.classList.contains('closed')) {
            icon.className = 'fa fa-window-maximize';
            clearTimeout(currentTask);
            isTyping = false;
        } else {
            icon.className = 'fa fa-minus';
            resetTerminal();
        }
    }

    function resetTerminal() {
        clearTimeout(currentTask);
        textQueue = [];
        contentDiv.innerHTML = '';
        clearButtons();
        isTyping = false;
        isPaused = false;
        terminalWrapper.classList.remove('paused');
        terminalState = 'intro';

        textQueue = [...INTRO_SEQUENCE];
        processQueue();
    }

    bodyDiv.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        if (terminalState !== 'snippet') return; // Only allow pause menu for snippets

        if (isTyping) {
            if (!isPaused) {
                terminalWrapper.dataset.finishLine = "true";
            }
        }
    });

    function showPauseMenu() {
        if (footerDiv.querySelector('.terminal-pause-menu')) return;
        clearButtons();

        const inputLine = footerDiv.querySelector('.input-line');
        if (inputLine) inputLine.style.display = 'none';

        const menuDiv = document.createElement('div');
        menuDiv.className = 'terminal-pause-menu';

        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'terminal-option-btn';
        resumeBtn.textContent = "▶ Continue Printing";
        resumeBtn.onclick = () => {
            isPaused = false;
            terminalWrapper.classList.remove('paused');
            menuDiv.remove();
            if (inputLine) inputLine.style.display = 'block';
        };

        const menuBtn = document.createElement('button');
        menuBtn.className = 'terminal-option-btn';
        menuBtn.textContent = "☰ Back to Main Menu";
        menuBtn.onclick = () => {
            resetTerminal();
        };

        menuDiv.appendChild(resumeBtn);
        menuDiv.appendChild(menuBtn);
        footerDiv.appendChild(menuDiv);
    }

    function typeLine(lineObj, callback) {
        if (!lineObj) {
            if (callback) callback();
            return;
        }

        const lineEl = document.createElement('div');
        lineEl.className = 'terminal-line ' + (lineObj.class || '');
        contentDiv.appendChild(lineEl);
        bodyDiv.scrollTop = bodyDiv.scrollHeight;

        let text = lineObj.text || "";
        let charIndex = 0;

        const currentLineRef = lineEl;

        function typeChar() {
            if (terminalWrapper.classList.contains('closed')) return;

            if (isPaused) {
                if (terminalState === 'snippet' && !footerDiv.querySelector('.terminal-pause-menu')) {
                    showPauseMenu();
                }
                currentTask = setTimeout(typeChar, 100);
                return;
            }

            if (charIndex < text.length) {
                if (terminalWrapper.dataset.finishLine === "true") {
                    currentLineRef.textContent = text;
                    charIndex = text.length;
                    terminalWrapper.dataset.finishLine = "false";
                    isPaused = true;
                    terminalWrapper.classList.add('paused');
                    currentTask = setTimeout(typeChar, 50);
                    return;
                }

                currentLineRef.textContent += text.charAt(charIndex);
                charIndex++;

                let delay = Math.random() * (TYPE_SPEED_MAX - TYPE_SPEED_MIN) + TYPE_SPEED_MIN;

                // Emphasis pauses
                if (text.charAt(charIndex - 1) === ' ') delay += PAUSE_WORD;
                if (text.charAt(charIndex - 1) === '.') delay += PAUSE_SENTENCE;
                if (text.charAt(charIndex - 1) === ',') delay += 150;

                bodyDiv.scrollTop = bodyDiv.scrollHeight;
                currentTask = setTimeout(typeChar, delay);
            } else {
                currentTask = setTimeout(() => {
                    if (callback) callback();
                }, lineObj.delay || (text.trim() === "" ? 100 : PAUSE_SENTENCE));
            }
        }

        typeChar();
    }

    function processQueue() {
        if (textQueue.length === 0) return;

        isTyping = true;
        const lineItem = textQueue.shift();

        typeLine(lineItem, () => {
            if (lineItem.prompt) {
                showOptions();
            } else {
                processQueue();
            }
        });
    }

    function showOptions() {
        terminalState = 'menu';
        isTyping = false;
        clearButtons();

        const inputLine = footerDiv.querySelector('.input-line');
        if (inputLine) inputLine.style.display = 'none';

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'terminal-options';

        const btn1 = document.createElement('button');
        btn1.className = 'terminal-option-btn';
        btn1.textContent = "snowfight.lua";
        btn1.onclick = () => loadSnippet('snowfight');

        const btn2 = document.createElement('button');
        btn2.className = 'terminal-option-btn';
        btn2.textContent = "VillagePillage.js";
        btn2.onclick = () => loadSnippet('village');

        optionsDiv.appendChild(btn1);
        optionsDiv.appendChild(btn2);
        footerDiv.appendChild(optionsDiv);
    }

    function loadSnippet(key) {
        terminalState = 'snippet';
        contentDiv.innerHTML = '';
        clearButtons();

        const loading = document.createElement('div');
        loading.className = 'terminal-line text-yellow';
        loading.textContent = `> Accessing ${key}...`;
        contentDiv.appendChild(loading);

        setTimeout(() => {
            loading.remove();
            const divider = { text: "----------------------------------------", class: "text-comment" };
            textQueue = [divider, ...SNIPPETS[key]];
            processQueue();
        }, 800);
    }

    let hasUserInteracted = false;

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hasUserInteracted = true;
            toggleTerminal();
        });
    }

    const headerEl = document.querySelector('.terminal-header');
    if (headerEl) {
        headerEl.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            hasUserInteracted = true; // Also count header click
            toggleTerminal();
        });
    }

    // Auto-expand after 6 seconds if not interacted
    setTimeout(() => {
        if (!hasUserInteracted && terminalWrapper.classList.contains('closed')) {
            toggleTerminal();
        }
    }, 6000);

})();
