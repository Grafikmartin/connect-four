const ROWS = 6;
const COLS = 7;

let board = [];
let currentPlayer = "red"; // Spieler startet
const gameBoard = document.getElementById("game-board");
const statusText = document.getElementById("status");

// Sound-Objekte
const soundFiles = {
    circle: new Audio('assets/circle.mp3'),
    cross: new Audio('assets/cross.mp3'),
    win: new Audio('assets/you-won.mp3'),
    lose: new Audio('assets/you-loose.mp3')
};
let soundOn = true;

function createBoard() {
    gameBoard.innerHTML = "";
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = row;
            cell.dataset.col = col;
            gameBoard.appendChild(cell);
        }
    }

    gameBoard.addEventListener("click", handlePlayerMove);
}

function handlePlayerMove(e) {
    if (!e.target.classList.contains("cell")) return;

    const col = parseInt(e.target.dataset.col);
    const row = dropDisc(col);

    if (row === null) {
        alert("Diese Spalte ist voll!");
        return;
    }

    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    placeDisc(cell, currentPlayer);
    board[row][col] = currentPlayer;

    if (checkWin(row, col)) {
        statusText.textContent = `Player (Circle) won!`;
        playSound('win');
        gameBoard.removeEventListener("click", handlePlayerMove);
        return;
    }

    currentPlayer = "yellow";
    statusText.textContent = "Computer (Cross)'s turn...";
    gameBoard.removeEventListener("click", handlePlayerMove);

    setTimeout(computerMove, 500);
}

function dropDisc(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (!board[row][col]) {
            return row;
        }
    }
    return null;
}

function placeDisc(cell, color) {
    const disc = document.createElement("div");
    disc.classList.add("disc", color);
    if (color === "red") {
        // 16-Eck berechnen
        const points = [];
        const cx = 50, cy = 50, r = 35;
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        disc.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;"><polygon points="${points.join(' ')}" fill="none" stroke="#7fff00" stroke-width="14" shape-rendering="crispEdges" /></svg>`;
        playSound('circle');
    } else if (color === "yellow") {
        disc.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;"><g transform="rotate(45 50 50)"><rect x="44" y="20" width="12" height="60" fill="#7fff00" shape-rendering="crispEdges" /><rect x="20" y="44" width="60" height="12" fill="#7fff00" shape-rendering="crispEdges" /></g></svg>`;
        playSound('cross');
    }
    cell.appendChild(disc);
}

function computerMove() {
    let col = findBestMove();
    let row = dropDisc(col);

    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    placeDisc(cell, currentPlayer);
    board[row][col] = currentPlayer;

    if (checkWin(row, col)) {
        statusText.textContent = "The Computer (Cross) won!";
        playSound('lose');
        return;
    }

    currentPlayer = "red";
    statusText.textContent = "Player (Circle)'s turn!";
    gameBoard.addEventListener("click", handlePlayerMove);
}

function findBestMove() {
    // 1. Gewinnzug setzen, wenn möglich
    for (let col = 0; col < COLS; col++) {
        const row = dropDisc(col);
        if (row !== null) {
            board[row][col] = "yellow";
            if (checkWin(row, col)) {
                board[row][col] = null;
                return col; // Gewinnzug
            }
            board[row][col] = null;
        }
    }

    // 2. Verhindern, dass Spieler gewinnt (horizontal, vertikal)
    for (let col = 0; col < COLS; col++) {
        const row = dropDisc(col);
        if (row !== null) {
            board[row][col] = "red";
            if (checkWin(row, col)) {
                board[row][col] = null;
                return col; // Blockiere Sieg
            }
            board[row][col] = null;
        }
    }

    // 3. Blockiere vertikale Bedrohungen (drei übereinander)
    for (let col = 0; col < COLS; col++) {
        for (let row = 2; row < ROWS; row++) {
            if (
                board[row][col] === "red" &&
                row - 1 >= 0 && board[row - 1][col] === "red" &&
                row - 2 >= 0 && board[row - 2][col] === "red" &&
                row - 3 >= 0 && board[row - 3][col] === null
            ) {
                return col; // Setze den Stein direkt über die drei roten Steine
            }
        }
    }

    // 4. Blockiere horizontale Bedrohungen (zwei nebeneinander)
    for (let row = ROWS - 1; row >= 0; row--) {
        for (let col = 0; col < COLS - 2; col++) {
            if (
                board[row][col] === "red" &&
                board[row][col + 1] === "red"
            ) {
                // Blockiere rechts
                if (col + 2 < COLS && board[row][col + 2] === null && dropDisc(col + 2) === row) {
                    return col + 2;
                }
                // Blockiere links
                if (col - 1 >= 0 && board[row][col - 1] === null && dropDisc(col - 1) === row) {
                    return col - 1;
                }
            }
        }
    }

    // 5. Blockiere diagonale Bedrohungen (drei in einer Diagonale)
    // Diagonal rechts unten (/)
    for (let row = 3; row < ROWS; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (
                board[row][col] === "red" &&
                row - 1 >= 0 && col + 1 < COLS && board[row - 1][col + 1] === "red" &&
                row - 2 >= 0 && col + 2 < COLS && board[row - 2][col + 2] === "red"
            ) {
                // Prüfe Feld oben rechts
                if (row - 3 >= 0 && col + 3 < COLS && board[row - 3][col + 3] === null && (row - 3 === ROWS - 1 || board[row - 2][col + 3] !== null)) {
                    return col + 3;
                }
                // Prüfe Feld unten links
                if (row + 1 < ROWS && col - 1 >= 0 && board[row + 1][col - 1] === null && (row + 1 === ROWS - 1 || board[row][col - 1] !== null)) {
                    return col - 1;
                }
            }
        }
    }
    // Diagonal links unten (\)
    for (let row = 3; row < ROWS; row++) {
        for (let col = 3; col < COLS; col++) {
            if (
                board[row][col] === "red" &&
                row - 1 >= 0 && col - 1 >= 0 && board[row - 1][col - 1] === "red" &&
                row - 2 >= 0 && col - 2 >= 0 && board[row - 2][col - 2] === "red"
            ) {
                // Prüfe Feld oben links
                if (row - 3 >= 0 && col - 3 >= 0 && board[row - 3][col - 3] === null && (row - 3 === ROWS - 1 || board[row - 2][col - 3] !== null)) {
                    return col - 3;
                }
                // Prüfe Feld unten rechts
                if (row + 1 < ROWS && col + 1 < COLS && board[row + 1][col + 1] === null && (row + 1 === ROWS - 1 || board[row][col + 1] !== null)) {
                    return col + 1;
                }
            }
        }
    }

    // 6. Verhindere, dass der Spieler direkt über einem Kreuz einen Vierer machen kann
    let safeCols = [];
    for (let col = 0; col < COLS; col++) {
        let row = dropDisc(col);
        if (row !== null) {
            // Simuliere Computerzug
            board[row][col] = "yellow";
            // Prüfe, ob Spieler im nächsten Zug direkt darüber gewinnen kann
            let nextRow = row - 1;
            let isSafe = true;
            if (nextRow >= 0) {
                board[nextRow][col] = "red";
                if (checkWin(nextRow, col)) {
                    isSafe = false;
                }
                board[nextRow][col] = null;
            }
            board[row][col] = null;
            if (isSafe) {
                safeCols.push(col);
            }
        }
    }
    if (safeCols.length > 0) {
        // Wähle eine sichere Spalte (bevorzugt Mitte)
        const middle = Math.floor(COLS / 2);
        if (safeCols.includes(middle)) {
            return middle;
        }
        return safeCols[Math.floor(Math.random() * safeCols.length)];
    }

    // 7. Spalten in der Mitte bevorzugen
    const middle = Math.floor(COLS / 2);
    if (dropDisc(middle) !== null) {
        return middle;
    }

    // 8. Zufällige Spalte
    let randomCol;
    do {
        randomCol = Math.floor(Math.random() * COLS);
    } while (dropDisc(randomCol) === null);
    return randomCol;
}

function checkWin(row, col) {
    const directions = [
        { r: 0, c: 1 },  // Horizontal
        { r: 1, c: 0 },  // Vertikal
        { r: 1, c: 1 },  // Diagonal rechts unten
        { r: 1, c: -1 }  // Diagonal links unten
    ];

    for (let { r, c } of directions) {
        let count = 1;
        count += countDirection(row, col, r, c);
        count += countDirection(row, col, -r, -c);

        if (count >= 4) {
            return true;
        }
    }

    return false;
}

function countDirection(row, col, rowInc, colInc) {
    let count = 0;

    for (let i = 1; i < 4; i++) {
        const newRow = row + rowInc * i;
        const newCol = col + colInc * i;

        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] === currentPlayer) {
            count++;
        } else {
            break;
        }
    }

    return count;
}

function resetGame() {
    currentPlayer = "red";
    statusText.textContent = "Spieler (Kreis) ist dran!";
    createBoard();
}

createBoard();

function chooseFirstPlayer() {
    const random = Math.random();
    if (random < 0.5) {
        currentPlayer = "red";
        statusText.textContent = "Spieler (Kreis) beginnt!";
    } else {
        currentPlayer = "yellow";
        statusText.textContent = "Der Computer (Kreuz) beginnt!";
        setTimeout(computerMove, 500);
    }
}

function resetGame() {
    createBoard();
    chooseFirstPlayer();  // Auslosung, wer beginnt
}

document.getElementById('fullscreen-toggle').addEventListener('click', () => {
    const fullscreenButton = document.getElementById('fullscreen-toggle');
    
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen(); // Vollbildmodus starten
        fullscreenButton.textContent = 'fullscreen_exit'; // Symbol auf Vollbild verlassen ändern
    } else {
        document.exitFullscreen(); // Vollbildmodus verlassen
        fullscreenButton.textContent = 'fullscreen'; // Symbol zurück auf Vollbild aktivieren ändern
    }
});
const hoverArrow = document.getElementById("hover-arrow");

function playSound(type) {
    if (soundOn && soundFiles[type]) {
        soundFiles[type].currentTime = 0;
        soundFiles[type].play();
    }
}

const soundToggleBtn = document.getElementById('sound-toggle');
if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
        soundOn = !soundOn;
        soundToggleBtn.textContent = soundOn ? 'volume_up' : 'volume_off';
    });
}


