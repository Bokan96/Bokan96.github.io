/**
 * Interactive Tile Mapper
 * A retro grid-based level editor & pathfinding visualizer.
 */

(function () {
    const container = document.getElementById('tile-mapper');
    if (!container) return;

    const canvas = document.getElementById('tileCanvas');
    const ctx = canvas.getContext('2d');
    const statusIconEl = document.getElementById('mapper-status-icon');

    // Config
    const TILE_SIZE = 24;
    const ROWS = 10;
    const COLS = 12;
    const WIDTH = COLS * TILE_SIZE;
    const HEIGHT = ROWS * TILE_SIZE;

    // Set canvas size (retina aware)
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.width = WIDTH + "px";
    canvas.style.height = HEIGHT + "px";

    // Assets / Colors
    const COLORS = {
        floor: '#222',
        wall: '#555',
        start: '#27c93f',
        end: '#ff5f56',
        path: '#4cc',
        grid: '#333'
    };

    // State
    // 0: Floor, 1: Wall
    let grid = [];
    let startPos = { x: 1, y: 1 };
    let endPos = { x: COLS - 2, y: ROWS - 2 };
    let botPos = { ...startPos };
    let isDrawing = false;
    let path = [];
    let botPathIndex = 0;
    let lastBotMove = 0;

    // Init Grid
    function initGrid() {
        grid = [];
        for (let y = 0; y < ROWS; y++) {
            let row = [];
            for (let x = 0; x < COLS; x++) {
                // Border walls
                if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
                    row.push(1);
                } else {
                    // Random obstacles
                    row.push(Math.random() > 0.8 ? 1 : 0);
                }
            }
            grid.push(row);
        }
        // Ensure start/end clear
        grid[startPos.y][startPos.x] = 0;
        grid[endPos.y][endPos.x] = 0;
    }

    // Pathfinding (BFS)
    function findPath() {
        const queue = [[startPos]];
        const visited = new Set();
        visited.add(`${startPos.x},${startPos.y}`);

        while (queue.length > 0) {
            const currentPath = queue.shift();
            const curr = currentPath[currentPath.length - 1];

            if (curr.x === endPos.x && curr.y === endPos.y) {
                return currentPath;
            }

            const moves = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
            ];

            for (let m of moves) {
                const nx = curr.x + m.x;
                const ny = curr.y + m.y;
                const key = `${nx},${ny}`;

                if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS &&
                    grid[ny][nx] === 0 && !visited.has(key)) {
                    visited.add(key);
                    queue.push([...currentPath, { x: nx, y: ny }]);
                }
            }
        }
        return null;
    }

    function updatePath() {
        const newPath = findPath();
        if (newPath) {
            path = newPath;
            statusIconEl.innerHTML = '<i class="fa fa-check-circle"></i>';
            statusIconEl.className = "path-found";
        } else {
            path = [];
            statusIconEl.innerHTML = '<i class="fa fa-times-circle"></i>';
            statusIconEl.className = "path-blocked";
        }
    }

    // Drawing
    function draw() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Draw Map
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                ctx.fillStyle = grid[y][x] === 1 ? COLORS.wall : COLORS.floor;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                // Grid lines
                ctx.strokeStyle = COLORS.grid;
                ctx.lineWidth = 1;
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw Path (Dots)
        ctx.fillStyle = COLORS.path;
        for (let p of path) {
            if ((p.x !== startPos.x || p.y !== startPos.y) &&
                (p.x !== endPos.x || p.y !== endPos.y)) {
                ctx.beginPath();
                ctx.arc(p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw Start/End
        ctx.fillStyle = COLORS.start;
        ctx.fillRect(startPos.x * TILE_SIZE + 4, startPos.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);

        ctx.fillStyle = COLORS.end;
        ctx.fillRect(endPos.x * TILE_SIZE + 4, endPos.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);

        // Draw Bot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        const bx = botPos.x * TILE_SIZE + TILE_SIZE / 2;
        const by = botPos.y * TILE_SIZE + TILE_SIZE / 2;
        ctx.arc(bx, by, 6, 0, Math.PI * 2);
        ctx.fill();
        // Bot glow
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Bot Animation Loop
    function animateBot(timestamp) {
        if (timestamp - lastBotMove > 200) { // Move every 200ms
            if (path.length > 0) {
                botPathIndex++;
                if (botPathIndex >= path.length) botPathIndex = 0; // Loop or stay? 
                // Let's make it loop from start immediately once reached

                if (botPathIndex < path.length) {
                    botPos = path[botPathIndex];
                } else {
                    botPos = startPos;
                    botPathIndex = 0;
                }
            } else {
                botPos = startPos; // Stay at start if blocked
            }
            lastBotMove = timestamp;
            draw();
        }
        requestAnimationFrame(animateBot);
    }

    // Interaction
    function getTilePos(e) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
        return { x, y };
    }

    let dragAction = null; // 'add' or 'remove'

    function handleInput(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;

        // Prevent modifying start/end unless moving them
        if ((x === startPos.x && y === startPos.y) || (x === endPos.x && y === endPos.y)) return;

        if (dragAction === 'add') {
            grid[y][x] = 1;
        } else if (dragAction === 'remove') {
            grid[y][x] = 0;
        }

        updatePath();
        draw();
    }

    canvas.addEventListener('mousedown', (e) => {
        const p = getTilePos(e);
        if (p.x < 0 || p.x >= COLS || p.y < 0 || p.y >= ROWS) return;

        // Determine action based on clicked tile
        if (grid[p.y][p.x] === 1) {
            dragAction = 'remove';
        } else {
            dragAction = 'add';
        }

        isDrawing = true;
        handleInput(p.x, p.y);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            const p = getTilePos(e);
            handleInput(p.x, p.y);
        }
    });

    window.addEventListener('mouseup', () => {
        isDrawing = false;
        dragAction = null;
    });

    // Tools
    document.getElementById('tool-clear')?.addEventListener('click', function () {
        initGrid();
        updatePath();
        draw();
    });



    const toggleBtn = document.getElementById('mapper-toggle');
    const headerEl = document.getElementById('mapper-header');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMapper();
        });
    }

    if (headerEl) {
        headerEl.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('.mapper-controls')) return;
            toggleMapper();
        });
    }

    function toggleMapper() {
        container.classList.toggle('closed');
        const icon = toggleBtn.querySelector('i');
        if (container.classList.contains('closed')) {
            icon.className = 'fa fa-window-maximize';
        } else {
            icon.className = 'fa fa-minus';
        }
    }

    // Init
    initGrid();
    updatePath();
    requestAnimationFrame(animateBot);

    // Expansion Observer
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (container.classList.contains('closed')) {
                        toggleMapper();
                    }
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 }); // 30% visible

        observer.observe(container);
    }

})();
