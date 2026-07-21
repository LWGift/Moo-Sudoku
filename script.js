// Moo-Sudoku - 玩家互動版

(function () {
    "use strict";

    // ===== 多語系 =====
    const NS = "moo-sudoku:"; // localStorage namespace，避免與同源其他頁面衝突
    const STORAGE_KEY_LANG = NS + "lang";
    const LANGS = [LANG_ZH_TW, LANG_EN]; // 新增語言只需加入此陣列
    let lang = LANG_EN; // 預設語言（無匹配時使用英文）

    const langSelect = document.getElementById("lang-select");

    // 初始化語言選擇器
    function initLang() {
        LANGS.forEach(l => {
            const opt = document.createElement("option");
            opt.value = l.code;
            opt.textContent = l.name;
            langSelect.appendChild(opt);
        });

        // 讀取儲存的語言偏好，若無則根據瀏覽器語言自動選擇
        const saved = localStorage.getItem(STORAGE_KEY_LANG);
        const found = LANGS.find(l => l.code === saved);
        if (found) {
            lang = found;
        } else {
            const browserLang = navigator.language || "";
            const matched = LANGS.find(l => browserLang.startsWith(l.code))
                || LANGS.find(l => browserLang.split("-")[0] === l.code.split("-")[0]);
            if (matched) lang = matched;
        }
        langSelect.value = lang.code;

        langSelect.addEventListener("change", () => {
            lang = LANGS.find(l => l.code === langSelect.value) || LANGS[0];
            localStorage.setItem(STORAGE_KEY_LANG, lang.code);
            applyLang();
        });

        applyLang();
    }

    // 將語言套用到所有 data-i18n 元素
    function applyLang() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.dataset.i18n;
            if (lang[key] !== undefined) {
                el.textContent = lang[key];
            }
        });
        document.querySelectorAll("[data-i18n-title]").forEach(el => {
            const key = el.dataset.i18nTitle;
            if (lang[key] !== undefined) {
                el.title = lang[key];
            }
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (lang[key] !== undefined) {
                el.placeholder = lang[key];
            }
        });
        document.documentElement.lang = lang.code;
    }

    // 取得語言文字的便捷函式
    function t(key) {
        return lang[key] || key;
    }

    // ===== DOM 元素 =====
    const gridEl = document.getElementById("sudoku-grid");
    const btnStart = document.getElementById("btn-start");
    const btnUndo = document.getElementById("btn-undo");
    const btnSubmit = document.getElementById("btn-submit");
    const btnClearData = document.getElementById("btn-clear-data");
    const btnGenerate = document.getElementById("btn-generate");
    const btnAutoPencil = document.getElementById("btn-auto-pencil");
    const btnPencilToggle = document.getElementById("btn-pencil-toggle");
    const btnAssist = document.getElementById("btn-assist");
    const btnPencilMode = document.getElementById("btn-pencil-mode");
    const difficultySelect = document.getElementById("difficulty-select");
    const editBar = document.getElementById("edit-bar");
    const playBar = document.getElementById("play-bar");
    const btnInputMode = document.getElementById("input-mode-checkbox");
    const inputModeSwitch = document.getElementById("input-mode-switch");
    const btnNewGame = document.getElementById("btn-new-game");
    const controlPanel = document.getElementById("control-panel");
    const messageEl = document.getElementById("message");
    const numBtns = document.querySelectorAll(".num-btn");
    const chainSelectBtns = document.querySelectorAll(".chain-select");
    let cellEls; // createGrid 後賦值

    // ===== 狀態 =====
    const STORAGE_KEY_PUZZLE = NS + "puzzle";
    const STORAGE_KEY_PLAYER = NS + "player";
    const MAX_UNDO = 10;

    let mode = "edit"; // "edit" 或 "play"
    let puzzle = createEmptyBoard();     // 題目（固定數字）
    let playerValues = createEmptyBoard();  // 玩家填入的答案
    let playerPencils = createEmptyPencils(); // 玩家的預選數
    let selectedNum = -1;  // 目前選中的數字（-1=無選取, 0=橡皮擦）
    let selectedCell = null; // 目前選中的格子 {row, col}
    let undoStack = [];   // 返回步驟紀錄
    let cachedAutoPencils = null; // 自動預選數快取（只根據題目計算一次）
    let assistEnabled = false;  // 輔助功能開關（預設關閉）
    let pencilMode = false;    // 預選模式（手機用）
    let pencilVisible = true;  // 預選數顯示開關（輔助關閉時使用）
    let autoPencilUsed = false; // 自動鉛筆是否已使用
    let currentSeed = "";      // 目前題目的種子碼
    let inputMode = "num-first"; // 填入模式：num-first 或 cell-first

    // ===== 初始化 =====
    function init() {
        initLang();
        initDarkMode();
        createGrid();
        loadData();
        bindEvents();

        // 檢查網址是否帶有種子參數
        const urlSeed = new URLSearchParams(window.location.search).get("seed");
        if (urlSeed) {
            const parsed = parseSeed(urlSeed);
            if (parsed) {
                if (parsed.type === "custom") {
                    loadFromCustomSeed(parsed.board, urlSeed);
                } else {
                    loadFromSeed(parsed.difficulty, parsed.code, urlSeed.toUpperCase());
                }
                // 清除網址參數避免重新整理重複載入
                history.replaceState(null, "", window.location.pathname);
                return;
            }
        }

        renderMode();
    }

    // ===== 暗色模式 =====
    const STORAGE_KEY_DARK = NS + "dark";
    const btnDarkMode = document.getElementById("btn-dark-mode");

    function initDarkMode() {
        const saved = localStorage.getItem(STORAGE_KEY_DARK);
        // 預設暗色，除非明確設為 false
        if (saved !== "false") {
            document.documentElement.setAttribute("data-theme", "dark");
            btnDarkMode.textContent = "☀️";
        }
        btnDarkMode.addEventListener("click", toggleDarkMode);
    }

    function toggleDarkMode() {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        if (isDark) {
            document.documentElement.removeAttribute("data-theme");
            btnDarkMode.textContent = "🌙";
            localStorage.setItem(STORAGE_KEY_DARK, "false");
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
            btnDarkMode.textContent = "☀️";
            localStorage.setItem(STORAGE_KEY_DARK, "true");
        }
    }

    // ===== 說明視窗 =====
    const btnHelp = document.getElementById("btn-help");
    const helpModal = document.getElementById("help-modal");
    const btnHelpClose = document.getElementById("btn-help-close");
    const helpBody = document.getElementById("help-body");

    btnHelp.addEventListener("click", () => {
        helpBody.innerHTML = t("helpContent");
        helpModal.classList.remove("hidden");
    });

    btnHelpClose.addEventListener("click", () => {
        helpModal.classList.add("hidden");
    });

    helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) helpModal.classList.add("hidden");
    });

    // 建立空白 9x9 陣列
    function createEmptyBoard() {
        return Array.from({ length: 9 }, () => Array(9).fill(0));
    }

    // 建立空白預選數陣列（每格為 Set）
    function createEmptyPencils() {
        return Array.from({ length: 9 }, () =>
            Array.from({ length: 9 }, () => new Set())
        );
    }

    // ===== 格線建立 =====
    function createGrid() {
        gridEl.innerHTML = "";
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (col === 2 || col === 5) cell.classList.add("border-right");
                if (row === 2 || row === 5) cell.classList.add("border-bottom");

                gridEl.appendChild(cell);
            }
        }
        cellEls = gridEl.querySelectorAll(".cell");
    }

    // ===== 事件綁定 =====
    function bindEvents() {
        btnStart.addEventListener("click", startPlay);
        btnNewGame.addEventListener("click", backToEdit);
        btnInputMode.addEventListener("change", toggleInputMode);
        btnUndo.addEventListener("click", undo);
        btnSubmit.addEventListener("click", submitAnswer);
        btnClearData.addEventListener("click", clearAllData);
        btnGenerate.addEventListener("click", generatePuzzle);
        btnAutoPencil.addEventListener("click", autoPencil);
        btnPencilToggle.addEventListener("click", togglePencilVisible);

        // 鉛筆開關長按：清除所有預選數
        let pencilLongTimer = null;
        btnPencilToggle.addEventListener("pointerdown", () => {
            pencilLongTimer = setTimeout(() => {
                pencilLongTimer = null;
                if (mode !== "play") return;
                if (confirm(t("msgClearPencilConfirm"))) {
                    playerPencils = createEmptyPencils();
                    saveData();
                    renderPlayGrid();
                }
            }, 600);
        });
        btnPencilToggle.addEventListener("pointerup", () => {
            if (pencilLongTimer) { clearTimeout(pencilLongTimer); pencilLongTimer = null; }
        });
        btnPencilToggle.addEventListener("pointerleave", () => {
            if (pencilLongTimer) { clearTimeout(pencilLongTimer); pencilLongTimer = null; }
        });
        btnAssist.addEventListener("click", toggleAssistFn);
        btnPencilMode.addEventListener("click", togglePencilMode);

        // 數字按鈕
        numBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const num = parseInt(btn.dataset.num);
                if (chainMode) {
                    handleChainNumSelect(num);
                    return;
                }

                // cell-first 模式：已選格子 + 按數字 → 填入
                if (inputMode === "cell-first" && selectedCell && mode === "play") {
                    const { row, col } = selectedCell;
                    if (puzzle[row][col] === 0) {
                        const isPencil = pencilMode && window.innerWidth <= 520;
                        applyNumber(row, col, num, isPencil);
                    }
                    return;
                }

                selectedNum = (num === selectedNum) ? -1 : num;
                updateNumButtons();
                if (assistEnabled && mode === "play") renderPlayGrid();
            });
        });

        // 橡皮擦長按：清除所有玩家輸入
        const eraseBtn = document.querySelector(".num-btn-erase");
        let eraseLongTimer = null;
        eraseBtn.addEventListener("pointerdown", () => {
            eraseLongTimer = setTimeout(() => {
                eraseLongTimer = null;
                if (mode !== "play") return;
                if (confirm(t("msgResetConfirm"))) {
                    playerValues = createEmptyBoard();
                    playerPencils = createEmptyPencils();
                    undoStack = [];
                    selectedNum = -1;
                    updateNumButtons();
                    saveData();
                    renderPlayGrid();
                }
            }, 600);
        });
        eraseBtn.addEventListener("pointerup", () => {
            if (eraseLongTimer) { clearTimeout(eraseLongTimer); eraseLongTimer = null; }
        });
        eraseBtn.addEventListener("pointerleave", () => {
            if (eraseLongTimer) { clearTimeout(eraseLongTimer); eraseLongTimer = null; }
        });

        // 格子點擊（左鍵）
        gridEl.addEventListener("click", (e) => {
            const cell = e.target.closest(".cell");
            if (!cell) return;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            handleCellClick(row, col, false);
        });

        // 格子右鍵（預選）
        gridEl.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            const cell = e.target.closest(".cell");
            if (!cell) return;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            handleCellClick(row, col, true);
        });

        // 防止格子內 input 的右鍵選單
        gridEl.addEventListener("mousedown", (e) => {
            if (e.button === 2) e.preventDefault();
        });
    }

    // 輔助開關
    function toggleAssistFn() {
        assistEnabled = !assistEnabled;
        btnAssist.classList.toggle("active", assistEnabled);
        updateAutoPencilState();
        if (mode === "play") renderPlayGrid();
    }

    // 預選模式切換（手機）
    function togglePencilMode() {
        pencilMode = !pencilMode;
        btnPencilMode.classList.toggle("pencil-active", pencilMode);
    }

    // 更新自動鉛筆按鈕狀態
    function updateAutoPencilState() {
        // 輔助開啟且尚未使用自動鉛筆：顯示自動鉛筆按鈕，隱藏鉛筆開關
        if (assistEnabled && !autoPencilUsed) {
            btnAutoPencil.classList.remove("hidden");
            btnPencilToggle.classList.add("hidden");
        } else {
            // 否則：隱藏自動鉛筆，顯示鉛筆開關
            btnAutoPencil.classList.add("hidden");
            btnPencilToggle.classList.remove("hidden");
            btnPencilToggle.classList.toggle("active", pencilVisible);
        }
    }

    // ===== 模式切換 =====
    let conflictCells = new Set(); // 衝突格子的 key (row*9+col)

    function startPlay() {
        // 讀取輸入框的值作為題目
        readPuzzleFromInputs();

        // 檢查題目數字是否足夠
        const filled = puzzle.flat().filter(v => v !== 0).length;
        if (filled < 17) {
            showMessage(t("msgPuzzleTooFew"), false);
            return;
        }

        // 檢查題目合理性
        conflictCells = findConflicts(puzzle);
        if (conflictCells.size > 0) {
            renderEditGrid();
            showMessage(t("msgPuzzleConflict"), false);
            return;
        }

        // 檢查是否有解
        if (countSolutions(puzzle) === 0) {
            showMessage(t("msgPuzzleNoSolution"), false);
            return;
        }

        conflictCells = new Set();
        mode = "play";
        selectedCell = null;
        undoStack = [];
        cachedAutoPencils = null;
        autoPencilUsed = false;
        // 手動輸入題目時生成 custom 種子
        if (!currentSeed) {
            currentSeed = "C-" + encodeBoard(puzzle);
        }
        saveData();
        renderMode();
        clearMessage();
    }

    // 找出所有衝突格子，回傳 Set<row*9+col>
    function findConflicts(board) {
        const conflicts = new Set();
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const num = board[r][c];
                if (num === 0) continue;
                board[r][c] = 0;
                if (!isSafe(board, r, c, num)) {
                    conflicts.add(r * 9 + c);
                    // 找出與此格衝突的其他格
                    for (let i = 0; i < 9; i++) {
                        if (board[r][i] === num) conflicts.add(r * 9 + i);
                        if (board[i][c] === num) conflicts.add(i * 9 + c);
                    }
                    const sr = Math.floor(r / 3) * 3;
                    const sc = Math.floor(c / 3) * 3;
                    for (let br = sr; br < sr + 3; br++) {
                        for (let bc = sc; bc < sc + 3; bc++) {
                            if (board[br][bc] === num) conflicts.add(br * 9 + bc);
                        }
                    }
                }
                board[r][c] = num;
            }
        }
        return conflicts;
    }

    function toggleInputMode() {
        inputMode = btnInputMode.checked ? "cell-first" : "num-first";
        inputModeSwitch.classList.toggle("cell-first", btnInputMode.checked);

        // 切換時清除選取狀態
        selectedNum = -1;
        selectedCell = null;
        updateNumButtons();
        renderPlayGrid();
    }

    function backToEdit() {
        mode = "edit";
        puzzle = createEmptyBoard();
        playerValues = createEmptyBoard();
        playerPencils = createEmptyPencils();
        undoStack = [];
        cachedAutoPencils = null;
        autoPencilUsed = false;
        assistEnabled = false;
        btnAssist.classList.remove("active");
        selectedNum = -1;
        selectedCell = null;
        currentSeed = "";

        // 清空種子輸入欄
        seedInput.value = "";

        // 退出鍊模式
        chainMode = false;
        chains = [{ nodes: [] }, { nodes: [] }, { nodes: [] }];
        toolbarNormal.classList.remove("hidden");
        toolbarChain.classList.add("hidden");
        if (chainSvg) chainSvg.innerHTML = "";

        updateNumButtons();
        saveData();
        renderMode();
        clearMessage();
    }

    function renderMode() {
        if (mode === "edit") {
            editBar.classList.remove("hidden");
            playBar.classList.add("hidden");
            controlPanel.classList.add("hidden");
            // 清除網址種子參數
            if (window.location.search) {
                history.replaceState(null, "", window.location.pathname);
            }
            renderEditGrid();
        } else {
            editBar.classList.add("hidden");
            playBar.classList.remove("hidden");
            controlPanel.classList.remove("hidden");
            updateAutoPencilState();
            // 顯示種子
            seedDisplay.textContent = currentSeed ? `#${currentSeed}` : "";
            // 更新網址帶入種子參數
            if (currentSeed) {
                history.replaceState(null, "", "?seed=" + currentSeed);
            }
            // 同步開關狀態
            btnInputMode.checked = (inputMode === "cell-first");
            inputModeSwitch.classList.toggle("cell-first", btnInputMode.checked);
            renderPlayGrid();
        }
    }

    // ===== 編輯模式：渲染輸入框 =====
    function renderEditGrid() {
        cellEls.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            cell.classList.remove("given", "selected", "conflict");
            cell.innerHTML = "";

            // 衝突標示
            if (conflictCells.has(row * 9 + col)) {
                cell.classList.add("conflict");
            }

            const input = document.createElement("input");
            input.type = "text";
            input.maxLength = 1;
            input.setAttribute("inputmode", "numeric");
            input.value = puzzle[row][col] || "";

            input.addEventListener("input", (e) => {
                const val = e.target.value;
                if (val && !/^[1-9]$/.test(val)) {
                    e.target.value = "";
                }
                // 修改數字時清除衝突標示
                if (conflictCells.size > 0) {
                    conflictCells = new Set();
                    cellEls.forEach(c => c.classList.remove("conflict"));
                    clearMessage();
                }
            });

            cell.appendChild(input);
        });
    }

    // 從輸入框讀取題目
    function readPuzzleFromInputs() {
        puzzle = createEmptyBoard();
        cellEls.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const input = cell.querySelector("input");
            if (input && input.value) {
                puzzle[row][col] = parseInt(input.value);
            }
        });
    }

    // ===== 解題模式：渲染格線 =====
    function renderPlayGrid() {
        // 輔助高亮：選中數字 > 0 時，計算相關格
        const highlightNum = (assistEnabled && selectedNum > 0) ? selectedNum : 0;

        cellEls.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            cell.innerHTML = "";
            cell.classList.remove("given", "selected", "highlight-related", "highlight-same");

            // 判斷此格是否含有選中數字（題目或玩家答案）
            const cellValue = puzzle[row][col] || playerValues[row][col];
            if (highlightNum && cellValue === highlightNum) {
                cell.classList.add("highlight-same");
            }

            // 題目固定數字
            if (puzzle[row][col] !== 0) {
                cell.classList.add("given");
                const valEl = document.createElement("span");
                valEl.className = "cell-value";
                valEl.textContent = puzzle[row][col];
                cell.appendChild(valEl);
                return;
            }

            // 玩家答案
            if (playerValues[row][col] !== 0) {
                const valEl = document.createElement("span");
                valEl.className = "cell-value";
                valEl.textContent = playerValues[row][col];
                cell.appendChild(valEl);
            } else if (pencilVisible) {
                // 預選數（鉛筆開關開啟時才顯示）
                const pencilGrid = document.createElement("div");
                pencilGrid.className = "pencil-marks";
                for (let n = 1; n <= 9; n++) {
                    const span = document.createElement("span");
                    if (playerPencils[row][col].has(n)) {
                        span.textContent = n;

                        // 高亮匹配的預選數
                        if (highlightNum && n === highlightNum) {
                            span.classList.add("pencil-highlight");
                        }

                        // 鍊節點標記
                        const chainMark = getChainNodeMark(row, col, n);
                        if (chainMark) {
                            span.classList.add("chain-node");
                            span.style.border = `2px solid ${chainMark.color}`;
                            span.style.color = chainMark.color;
                        }
                    }
                    pencilGrid.appendChild(span);
                }
                cell.appendChild(pencilGrid);
            }

            // 選中狀態
            if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                cell.classList.add("selected");
            }
        });

        updateNumButtons();
    }

    // ===== 格子點擊處理 =====
    function handleCellClick(row, col, isRightClick) {
        if (mode === "edit") return;

        // 鍊推理模式下走不同邏輯
        if (chainMode) {
            handleChainCellClick(row, col);
            return;
        }

        // 不能修改題目格
        if (puzzle[row][col] !== 0) return;

        // cell-first 模式：點格子選中，等待數字
        if (inputMode === "cell-first") {
            selectedCell = { row, col };
            renderPlayGrid();
            return;
        }

        // num-first 模式：需已選數字
        // 判斷是否為預選模式
        let isPencil = isRightClick;
        // 手機鉛筆模式開啟時，左鍵走預選邏輯
        if (!isRightClick && window.innerWidth <= 520 && pencilMode) {
            isPencil = true;
        }

        if (selectedNum === -1) return; // 無選取數字時不操作

        applyNumber(row, col, selectedNum, isPencil);
    }

    // 將數字填入指定格子
    function applyNumber(row, col, num, isPencil) {
        if (num === 0) {
            // 橡皮擦模式：清除格子
            pushUndo(row, col);
            playerValues[row][col] = 0;
            playerPencils[row][col] = new Set();
        } else if (isPencil) {
            // 預選模式（預選數隱藏時不允許操作）
            if (!pencilVisible) return;
            if (playerValues[row][col] !== 0) return; // 已有答案則不操作
            pushUndo(row, col);
            const pencils = playerPencils[row][col];
            if (pencils.has(num)) {
                pencils.delete(num);
            } else {
                pencils.add(num);
            }
        } else {
            // 填入答案
            pushUndo(row, col);
            playerValues[row][col] = num;
            playerPencils[row][col] = new Set();
            // 輔助開啟時才自動移除相關預選數
            if (assistEnabled) {
                removePencilsForAnswer(row, col, num);
            }
        }

        saveData();
        renderPlayGrid();
    }

    // 對指定格子的所有相關格（同列、同行、同宮）執行 callback，每格只處理一次
    function forEachRelatedCell(row, col, callback) {
        const visited = new Set();

        const visit = (r, c) => {
            const key = r * 9 + c;
            if (visited.has(key)) return;
            visited.add(key);
            callback(r, c);
        };

        // 同列
        for (let c = 0; c < 9; c++) visit(row, c);
        // 同行
        for (let r = 0; r < 9; r++) visit(r, col);

        // 同 3x3 宮格
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                visit(r, c);
            }
        }
    }

    // 填入答案時，自動移除同行、同列、同宮格中的該數字預選數
    function removePencilsForAnswer(row, col, num) {
        forEachRelatedCell(row, col, (r, c) => {
            playerPencils[r][c].delete(num);
        });
    }

    // 自動填入所有合法預選數
    function autoPencil() {
        if (mode !== "play") return;
        if (!assistEnabled) return;

        if (!cachedAutoPencils) {
            cachedAutoPencils = createEmptyPencils();
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (puzzle[r][c] !== 0) continue;
                    const possible = new Set();
                    for (let num = 1; num <= 9; num++) {
                        if (isSafe(puzzle, r, c, num)) {
                            possible.add(num);
                        }
                    }
                    cachedAutoPencils[r][c] = possible;
                }
            }
        }

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (puzzle[r][c] !== 0 || playerValues[r][c] !== 0) continue;
                playerPencils[r][c] = new Set(cachedAutoPencils[r][c]);
            }
        }

        autoPencilUsed = true;
        pencilVisible = true;
        updateAutoPencilState();
        saveData();
        renderPlayGrid();
    }

    // 切換預選數顯示
    function togglePencilVisible() {
        if (mode !== "play") return;
        pencilVisible = !pencilVisible;
        btnPencilToggle.classList.toggle("active", pencilVisible);
        renderPlayGrid();
    }

    // ===== 返回功能 =====
    function pushUndo(row, col) {
        const snapshot = {
            row,
            col,
            value: playerValues[row][col],
            pencils: new Set(playerPencils[row][col]),
            // 儲存整排相關預選數以便完整復原
            relatedPencils: getRelatedPencilsSnapshot(row, col)
        };
        undoStack.push(snapshot);
        if (undoStack.length > MAX_UNDO) {
            undoStack.shift();
        }
    }

    function getRelatedPencilsSnapshot(row, col) {
        const snapshot = [];
        forEachRelatedCell(row, col, (r, c) => {
            snapshot.push({ row: r, col: c, pencils: new Set(playerPencils[r][c]) });
        });
        return snapshot;
    }

    function undo() {
        if (undoStack.length === 0) {
            showMessage(t("msgNoUndo"), false);
            return;
        }

        const snapshot = undoStack.pop();
        playerValues[snapshot.row][snapshot.col] = snapshot.value;
        playerPencils[snapshot.row][snapshot.col] = snapshot.pencils;

        // 復原相關預選數
        snapshot.relatedPencils.forEach(item => {
            playerPencils[item.row][item.col] = item.pencils;
        });

        saveData();
        renderPlayGrid();
        clearMessage();
    }

    // ===== 提交答案 =====
    function submitAnswer() {
        // 檢查是否填滿
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (puzzle[r][c] === 0 && playerValues[r][c] === 0) {
                    showMessage(t("msgIncomplete"), false);
                    return;
                }
            }
        }

        // 合併題目與玩家答案
        const board = createEmptyBoard();
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                board[r][c] = puzzle[r][c] || playerValues[r][c];
            }
        }

        // 驗證規則
        if (validateComplete(board)) {
            selectedNum = -1;
            updateNumButtons();
            showMessage(t("msgCorrect"), true, true);
        } else {
            showMessage(t("msgWrong"), false);
        }
    }

    // 完整驗證整個棋盤
    function validateComplete(board) {
        // 檢查每列
        for (let r = 0; r < 9; r++) {
            if (!isValidGroup(board[r])) return false;
        }
        // 檢查每行
        for (let c = 0; c < 9; c++) {
            const col = [];
            for (let r = 0; r < 9; r++) col.push(board[r][c]);
            if (!isValidGroup(col)) return false;
        }
        // 檢查每個 3x3 宮格
        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                const box = [];
                for (let r = br * 3; r < br * 3 + 3; r++) {
                    for (let c = bc * 3; c < bc * 3 + 3; c++) {
                        box.push(board[r][c]);
                    }
                }
                if (!isValidGroup(box)) return false;
            }
        }
        return true;
    }

    // 檢查一組 9 個數字是否為 1-9 各出現一次
    function isValidGroup(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        for (let i = 0; i < 9; i++) {
            if (sorted[i] !== i + 1) return false;
        }
        return true;
    }

    // ===== 數字按鈕更新 =====
    function updateNumButtons() {
        // 計算每個數字在盤面上出現的次數
        const counts = Array(10).fill(0);
        if (assistEnabled && mode === "play") {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    const val = puzzle[r][c] || playerValues[r][c];
                    if (val > 0) counts[val]++;
                }
            }
        }

        numBtns.forEach(btn => {
            const num = parseInt(btn.dataset.num);
            btn.classList.toggle("active", num === selectedNum);

            // 輔助模式：數字填滿 9 次則 disable
            if (num > 0 && assistEnabled && mode === "play") {
                btn.classList.toggle("num-complete", counts[num] >= 9);
            } else {
                btn.classList.remove("num-complete");
            }
        });
    }

    // ===== 訊息 =====
    function showMessage(text, isSuccess, highlight) {
        messageEl.textContent = text;
        let cls = "message";
        if (isSuccess) cls += " success";
        if (highlight) cls += " highlight";
        messageEl.className = cls;
        messageEl.classList.remove("hidden");
    }

    function clearMessage() {
        messageEl.textContent = "";
        messageEl.className = "message hidden";
    }

    // ===== 資料存取（localStorage）=====
    function saveData() {
        const puzzleData = JSON.stringify(puzzle);
        const playerData = JSON.stringify({
            values: playerValues,
            pencils: pencilsToArray(),
            mode: mode,
            seed: currentSeed
        });
        localStorage.setItem(STORAGE_KEY_PUZZLE, puzzleData);
        localStorage.setItem(STORAGE_KEY_PLAYER, playerData);
    }

    function loadData() {
        try {
            const puzzleRaw = localStorage.getItem(STORAGE_KEY_PUZZLE);
            const playerRaw = localStorage.getItem(STORAGE_KEY_PLAYER);

            if (puzzleRaw) {
                puzzle = JSON.parse(puzzleRaw);
            }

            if (playerRaw) {
                const data = JSON.parse(playerRaw);
                playerValues = data.values || createEmptyBoard();
                playerPencils = arrayToPencils(data.pencils);
                mode = data.mode || "edit";
                currentSeed = data.seed || "";
            }
        } catch (e) {
            console.warn(t("msgLoadFail"), e);
        }
    }

    // Set 轉為陣列以便 JSON 序列化
    function pencilsToArray() {
        return playerPencils.map(row =>
            row.map(set => [...set])
        );
    }

    // 陣列轉回 Set
    function arrayToPencils(arr) {
        if (!arr) return createEmptyPencils();
        return arr.map(row =>
            row.map(items => new Set(items || []))
        );
    }

    // 清除所有資料
    function clearAllData() {
        if (!confirm(t("msgClearConfirm"))) return;
        Object.keys(localStorage)
            .filter(k => k.startsWith(NS))
            .forEach(k => localStorage.removeItem(k));
        puzzle = createEmptyBoard();
        playerValues = createEmptyBoard();
        playerPencils = createEmptyPencils();
        undoStack = [];
        cachedAutoPencils = null;
        autoPencilUsed = false;
        selectedNum = -1;
        selectedCell = null;
        mode = "edit";

        // 清除鍊推理
        chains = [{ nodes: [] }, { nodes: [] }, { nodes: [] }];
        chainMode = false;
        if (chainSvg) chainSvg.innerHTML = "";
        toolbarNormal.classList.remove("hidden");
        toolbarChain.classList.add("hidden");

        updateNumButtons();
        renderMode();
        clearMessage();
    }

    // ===== 自動出題 =====

    // 難度對應的空格數量
    const DIFFICULTY_BLANKS = {
        easy: 36,
        medium: 46,
        hard: 52,
        expert: 58,
        extreme: 64
    };

    // 生成完整合法的數獨解
    function generateFullSolution() {
        const board = createEmptyBoard();
        fillBoard(board);
        return board;
    }

    // 用回溯法隨機填入完整數獨
    function fillBoard(board) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (const num of nums) {
                        if (isSafe(board, r, c, num)) {
                            board[r][c] = num;
                            if (fillBoard(board)) return true;
                            board[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    // 檢查在該位置填入該數字是否安全
    function isSafe(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
            if (board[i][col] === num) return false;
        }
        const sr = Math.floor(row / 3) * 3;
        const sc = Math.floor(col / 3) * 3;
        for (let r = sr; r < sr + 3; r++) {
            for (let c = sc; c < sc + 3; c++) {
                if (board[r][c] === num) return false;
            }
        }
        return true;
    }

    // 隨機打亂陣列（使用 seeded PRNG）
    let rng = Math.random; // 預設用原生 random

    // Mulberry32 seeded PRNG
    function mulberry32(seed) {
        return function () {
            seed |= 0;
            seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    // 將字串種子轉為數字
    function seedToNumber(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    // 難度碼對應
    const DIFF_TO_CODE = { easy: "E", medium: "M", hard: "H", expert: "X", extreme: "Z" };
    const CODE_TO_DIFF = { E: "easy", M: "medium", H: "hard", X: "expert", Z: "extreme" };

    // 產生隨機種子碼（6 位英數）
    function generateSeedCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    // 組合完整種子（含難度）
    function buildFullSeed(difficulty, code) {
        return DIFF_TO_CODE[difficulty] + "-" + code;
    }

    // 解析種子，回傳 { difficulty, code } 或 null
    function parseSeed(seed) {
        // 演算法生成的種子：E/M/H/X/Z-XXXXXX
        const match = seed.match(/^([EMHXZ])-([A-Z0-9]{6})$/i);
        if (match) {
            const diffCode = match[1].toUpperCase();
            const diff = CODE_TO_DIFF[diffCode];
            if (!diff) return null;
            return { type: "generated", difficulty: diff, code: match[2].toUpperCase() };
        }

        // 自訂題目的種子：C-<encoded>
        const customMatch = seed.match(/^C-(.+)$/i);
        if (customMatch) {
            const board = decodeBoard(customMatch[1]);
            if (board) return { type: "custom", board: board };
        }

        return null;
    }

    // 盤面編碼：將 81 格壓縮為短字串
    // 編碼規則：
    //   '1'-'9'：前面無空格，直接填入該數字
    //   'A'-'I'：空 1 格後填 1-9
    //   'J'-'R'：空 2 格後填 1-9
    //   'S'-'Z'+'a'：空 3 格後填 1-9（S=31, T=32...Z=38, a=39）
    //   'b'-'j'：空 4 格後填 1-9
    //   'k'-'s'：空 5 格後填 1-9
    //   't'-'z'：純空格 6-12 格（t=6, u=7...z=12）
    //   '0'：1 個空格（無後接數字時用）

    // 空格數 + 數字的對照表
    const ENCODE_MAP = [
        null,                                          // gap=0 不用（直接寫數字）
        "ABCDEFGHI",                                   // gap=1, 數字 1-9
        "JKLMNOPQR",                                   // gap=2, 數字 1-9
        "STUVWXYZa",                                   // gap=3, 數字 1-9
        "bcdefghij",                                   // gap=4, 數字 1-9
        "klmnopqrs",                                   // gap=5, 數字 1-9
    ];
    const PURE_GAP = "tuvwxyz"; // 純空格 6-12（t=6, u=7...z=12）

    function encodeBoard(board) {
        let flat = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                flat.push(board[r][c]);
            }
        }

        let encoded = "";
        let i = 0;
        while (i < flat.length) {
            if (flat[i] !== 0) {
                // 前面無空格的數字
                encoded += flat[i].toString();
                i++;
            } else {
                // 計算連續空格數
                let gap = 0;
                while (i + gap < flat.length && flat[i + gap] === 0) {
                    gap++;
                }

                // 用盡可能多的 gap 合併到下一個數字
                while (gap > 0) {
                    // 看空格後面是否有數字可以一起編碼
                    const nextNumIdx = i + gap;
                    if (gap <= 5 && nextNumIdx < flat.length && flat[nextNumIdx] !== 0) {
                        // 空格 + 數字 一起編碼
                        const num = flat[nextNumIdx];
                        encoded += ENCODE_MAP[gap][num - 1];
                        i = nextNumIdx + 1;
                        gap = 0;
                    } else if (gap >= 6) {
                        // 純空格 6-12
                        const chunk = Math.min(gap, 12);
                        encoded += PURE_GAP[chunk - 6];
                        i += chunk;
                        gap -= chunk;
                    } else {
                        // gap 1-5 但後面沒數字（末尾的空格）
                        encoded += "0";
                        i++;
                        gap--;
                    }
                }
            }
        }
        return encoded;
    }

    function decodeBoard(encoded) {
        const flat = [];

        for (let i = 0; i < encoded.length; i++) {
            const ch = encoded[i];

            if (ch >= "1" && ch <= "9") {
                flat.push(parseInt(ch));
            } else if (ch === "0") {
                flat.push(0);
            } else if (ch >= "A" && ch <= "I") {
                flat.push(0);
                flat.push(ch.charCodeAt(0) - 64); // A=1...I=9
            } else if (ch >= "J" && ch <= "R") {
                flat.push(0, 0);
                flat.push(ch.charCodeAt(0) - 73); // J=1...R=9
            } else if ((ch >= "S" && ch <= "Z") || ch === "a") {
                flat.push(0, 0, 0);
                const num = ch === "a" ? 9 : ch.charCodeAt(0) - 82; // S=1...Z=8, a=9
                flat.push(num);
            } else if (ch >= "b" && ch <= "j") {
                flat.push(0, 0, 0, 0);
                flat.push(ch.charCodeAt(0) - 97); // b=1...j=9
            } else if (ch >= "k" && ch <= "s") {
                flat.push(0, 0, 0, 0, 0);
                flat.push(ch.charCodeAt(0) - 106); // k=1...s=9
            } else if (ch >= "t" && ch <= "z") {
                const count = ch.charCodeAt(0) - 110; // t=6...z=12
                for (let g = 0; g < count; g++) flat.push(0);
            } else {
                return null; // 無效字元
            }
        }

        if (flat.length !== 81) return null;

        const board = createEmptyBoard();
        for (let i = 0; i < 81; i++) {
            board[Math.floor(i / 9)][i % 9] = flat[i];
        }
        return board;
    }

    function shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // 挖空產生題目
    function digHoles(solution, blanks) {
        const board = solution.map(row => [...row]);
        const positions = shuffleArray(
            Array.from({ length: 81 }, (_, i) => i)
        );

        let removed = 0;
        for (const pos of positions) {
            if (removed >= blanks) break;
            const r = Math.floor(pos / 9);
            const c = pos % 9;
            const backup = board[r][c];
            board[r][c] = 0;

            // 確認唯一解
            if (countSolutions(board) === 1) {
                removed++;
            } else {
                board[r][c] = backup;
            }
        }
        return board;
    }

    // 計算解的數量（找到超過 1 就停止）
    function countSolutions(board) {
        let count = 0;

        function solver(b) {
            if (count > 1) return;
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (b[r][c] === 0) {
                        for (let num = 1; num <= 9; num++) {
                            if (isSafe(b, r, c, num)) {
                                b[r][c] = num;
                                solver(b);
                                b[r][c] = 0;
                            }
                        }
                        return;
                    }
                }
            }
            count++;
        }

        const copy = board.map(row => [...row]);
        solver(copy);
        return count;
    }

    // 自動出題按鈕處理
    const seedInput = document.getElementById("seed-input");
    const seedDisplay = document.getElementById("seed-display");

    // 點擊種子碼複製到剪貼簿
    seedDisplay.addEventListener("click", () => {
        if (currentSeed) {
            navigator.clipboard.writeText(currentSeed);
            seedDisplay.textContent = t("seedCopied");
            setTimeout(() => {
                seedDisplay.textContent = `#${currentSeed}`;
            }, 1500);
        }
    });

    // 輸入種子後失去焦點或按 Enter 生成盤面
    seedInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            seedInput.blur();
        }
    });
    seedInput.addEventListener("blur", () => {
        applySeedInput();
    });

    function applySeedInput() {
        const input = seedInput.value.trim();
        if (!input) return;

        const parsed = parseSeed(input);
        if (!parsed) {
            showMessage(t("msgInvalidSeed"), false);
            return;
        }

        if (parsed.type === "custom") {
            loadFromCustomSeed(parsed.board, input);
        } else {
            loadFromSeed(parsed.difficulty, parsed.code, input.toUpperCase());
        }
    }

    // 載入自訂種子盤面
    function loadFromCustomSeed(board, fullSeed) {
        puzzle = board;
        playerValues = createEmptyBoard();
        playerPencils = createEmptyPencils();
        undoStack = [];
        cachedAutoPencils = null;
        autoPencilUsed = false;
        currentSeed = fullSeed;
        mode = "edit";
        saveData();
        renderMode();
        clearMessage();
    }

    // 根據種子生成盤面並停在編輯模式（等使用者按 Start）
    function loadFromSeed(difficulty, code, fullSeed) {
        const blanks = DIFFICULTY_BLANKS[difficulty];
        const seedNum = seedToNumber(code + difficulty);
        rng = mulberry32(seedNum);

        const solution = generateFullSolution();
        const generated = digHoles(solution, blanks);

        puzzle = generated;
        playerValues = createEmptyBoard();
        playerPencils = createEmptyPencils();
        undoStack = [];
        cachedAutoPencils = null;
        autoPencilUsed = false;
        currentSeed = fullSeed;
        mode = "edit";

        rng = Math.random;

        difficultySelect.value = difficulty;
        saveData();
        renderMode();
        clearMessage();
    }

    // Generate 按鈕：產生全新題目並直接進入解題
    function generatePuzzle() {
        const difficulty = difficultySelect.value;
        const blanks = DIFFICULTY_BLANKS[difficulty];
        const code = generateSeedCode();
        currentSeed = buildFullSeed(difficulty, code);

        // 設定 seeded PRNG
        const seedNum = seedToNumber(code + difficulty);
        rng = mulberry32(seedNum);

        // 用 setTimeout 讓 UI 更新後再執行計算
        setTimeout(() => {
            const solution = generateFullSolution();
            const generated = digHoles(solution, blanks);

            puzzle = generated;
            playerValues = createEmptyBoard();
            playerPencils = createEmptyPencils();
            undoStack = [];
            cachedAutoPencils = null;
            autoPencilUsed = false;
            mode = "play";

            // 恢復原生 random
            rng = Math.random;

            saveData();
            renderMode();
            clearMessage();
        }, 50);
    }

    // ===== 鍊推理功能 =====

    const chainSvg = document.getElementById("chain-svg");
    const toolbarNormal = document.getElementById("toolbar-normal");
    const toolbarChain = document.getElementById("toolbar-chain");
    const btnChainMode = document.getElementById("btn-chain-mode");
    const btnChainExit = document.getElementById("btn-chain-exit");
    const btnChainType = document.getElementById("btn-chain-type");
    const btnChainClearOne = document.getElementById("btn-chain-clear-one");
    const btnChainClearAll = document.getElementById("btn-chain-clear-all");
    const chainTypeIcon = document.getElementById("chain-type-icon");
    const chainTypeLabel = document.getElementById("chain-type-label");

    let chainMode = false;       // 是否處於鍊推理模式
    let activeChainIdx = 0;      // 目前操作的鍊（0, 1, 2）
    let nextLinkStrong = true;   // 下一步是否為強鍊

    // 每條鍊的資料結構：{ nodes: [{row, col, num, linkType}] }
    // linkType: null（第一個節點，無鍊段）、"strong"、"weak"（此節點與前一節點之間的連結類型）
    let chains = [
        { nodes: [] },
        { nodes: [] },
        { nodes: [] }
    ];

    // 三條鍊的強/弱配色
    // 鍊 1: 紅/綠、鍊 2: 藍/橘、鍊 3: 紫/黃
    const CHAIN_COLORS = [
        { strong: "#d63031", weak: "#27ae60" },
        { strong: "#2980b9", weak: "#e67e22" },
        { strong: "#8e44ad", weak: "#f1c40f" }
    ];

    function getChainColor(chainIdx, isStrong) {
        const pair = CHAIN_COLORS[chainIdx];
        return isStrong ? pair.strong : pair.weak;
    }

    // 取得節點的顯示顏色（第一個節點用強色表示起點）
    function getNodeColor(chainIdx, node) {
        if (node.linkType === null) {
            return CHAIN_COLORS[chainIdx].strong;
        }
        return getChainColor(chainIdx, node.linkType === "strong");
    }

    // 綁定鍊推理事件
    function bindChainEvents() {
        btnChainMode.addEventListener("click", enterChainMode);
        btnChainExit.addEventListener("click", exitChainMode);
        btnChainType.addEventListener("click", toggleChainType);
        btnChainClearOne.addEventListener("click", clearActiveChain);
        btnChainClearAll.addEventListener("click", clearAllChains);

        chainSelectBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                activeChainIdx = parseInt(btn.dataset.chain);
                updateChainSelectButtons();
                syncChainType();
                updateChainNumButtons();
                renderChainOverlay();
            });
        });
    }

    function enterChainMode() {
        chainMode = true;
        toolbarNormal.classList.add("hidden");
        toolbarChain.classList.remove("hidden");
        syncChainType();
        updateChainSelectButtons();
        updateChainNumButtons();
        renderPlayGrid();
        renderChainOverlay();
    }

    function exitChainMode() {
        chainMode = false;
        toolbarNormal.classList.remove("hidden");
        toolbarChain.classList.add("hidden");
        // 恢復所有數字按鈕
        numBtns.forEach(btn => {
            btn.classList.remove("chain-disabled");
        });
        renderPlayGrid();
        renderChainOverlay();
    }

    function toggleChainType() {
        const chain = chains[activeChainIdx];
        // 沒有起點時不能切換
        if (chain.nodes.length < 1) return;
        nextLinkStrong = !nextLinkStrong;
        updateChainTypeUI();
    }

    // 根據鍊的最後一段連結自動設定下一段強弱
    function syncChainType() {
        const chain = chains[activeChainIdx];
        if (chain.nodes.length <= 1) {
            // 只有起點或空鍊，下一段預設為強
            nextLinkStrong = true;
        } else {
            // 上一段的反向
            const lastNode = chain.nodes[chain.nodes.length - 1];
            nextLinkStrong = lastNode.linkType !== "strong";
        }
        updateChainTypeUI();
    }

    function updateChainTypeUI() {
        const chain = chains[activeChainIdx];
        const hasStart = chain.nodes.length >= 1;

        // 起點還沒選時，禁用強弱切換
        if (!hasStart) {
            chainTypeIcon.textContent = "—";
            chainTypeLabel.textContent = t("chainSelectStart");
            btnChainType.classList.remove("active");
            btnChainType.classList.add("disabled");
            btnChainType.style.borderColor = "";
            btnChainType.style.background = "";
            chainTypeIcon.style.color = "";
            chainTypeLabel.style.color = "";
            return;
        }

        btnChainType.classList.remove("disabled");
        btnChainType.classList.add("active");

        // 取得對應鍊的強/弱色
        const color = getChainColor(activeChainIdx, nextLinkStrong);

        if (nextLinkStrong) {
            chainTypeIcon.textContent = "S";
            chainTypeLabel.textContent = t("chainStrong");
        } else {
            chainTypeIcon.textContent = "W";
            chainTypeLabel.textContent = t("chainWeak");
        }

        // 套用鍊色
        btnChainType.style.borderColor = color;
        btnChainType.style.background = color + "18"; // 加透明度作底色
        chainTypeIcon.style.color = color;
        chainTypeLabel.style.color = color;
    }

    function updateChainSelectButtons() {
        chainSelectBtns.forEach(btn => {
            const idx = parseInt(btn.dataset.chain);
            btn.classList.toggle("active", idx === activeChainIdx);
        });
    }

    // 更新數字按鈕可用性（鍊模式下只亮起被選格的預選數）
    function updateChainNumButtons() {
        if (!chainMode) return;

        // 鍊模式下所有數字按鈕先全部禁用
        numBtns.forEach(btn => {
            btn.classList.add("chain-disabled");
            btn.classList.remove("active");
        });

        // 如果沒有選中格子，不啟用任何數字
        // 數字在格子點擊時才啟用
    }

    // 鍊模式下的格子點擊
    function handleChainCellClick(row, col) {
        // 取得該格的預選數
        const pencils = playerPencils[row][col];
        if (pencils.size === 0) return; // 無預選數的格子不可選

        // 如果此格已有答案，不可選
        if (puzzle[row][col] !== 0 || playerValues[row][col] !== 0) return;

        // 更新數字按鈕：只啟用此格有的預選數
        numBtns.forEach(btn => {
            const num = parseInt(btn.dataset.num);
            if (num === 0) {
                btn.classList.add("chain-disabled");
                return;
            }
            if (pencils.has(num)) {
                btn.classList.remove("chain-disabled");
            } else {
                btn.classList.add("chain-disabled");
            }
        });

        // 記錄選中的格子，等待數字選擇
        selectedCell = { row, col };
        renderPlayGrid();
    }

    // 鍊模式下選擇數字 → 確定加入節點
    function handleChainNumSelect(num) {
        if (!chainMode || !selectedCell) return;
        if (num === 0) return;

        const { row, col } = selectedCell;
        const pencils = playerPencils[row][col];
        if (!pencils.has(num)) return;

        const chain = chains[activeChainIdx];

        if (chain.nodes.length === 0) {
            // 第一個節點：起點，無鍊段
            chain.nodes.push({
                row,
                col,
                num,
                linkType: null
            });
            // 起點選完後預設下一段為強
            nextLinkStrong = true;
        } else {
            // 後續節點：帶有與前一節點之間的連結類型
            chain.nodes.push({
                row,
                col,
                num,
                linkType: nextLinkStrong ? "strong" : "weak"
            });
            // 自動交替
            nextLinkStrong = !nextLinkStrong;
        }

        updateChainTypeUI();
        selectedCell = null;
        updateChainNumButtons();
        renderPlayGrid();
        renderChainOverlay();
    }

    function clearActiveChain() {
        chains[activeChainIdx] = { nodes: [] };
        syncChainType();
        updateChainNumButtons();
        renderPlayGrid();
        renderChainOverlay();
    }

    function clearAllChains() {
        chains = [{ nodes: [] }, { nodes: [] }, { nodes: [] }];
        syncChainType();
        updateChainNumButtons();
        renderPlayGrid();
        renderChainOverlay();
    }

    // 取得某格某預選數的鍊節點標記（如果有的話）
    function getChainNodeMark(row, col, num) {
        for (let ci = 0; ci < 3; ci++) {
            const chain = chains[ci];
            for (const node of chain.nodes) {
                if (node.row === row && node.col === col && node.num === num) {
                    return { color: getNodeColor(ci, node) };
                }
            }
        }
        return null;
    }

    // 渲染鍊線條（SVG overlay）
    function renderChainOverlay() {
        chainSvg.innerHTML = "";

        // 加入箭頭 marker 定義
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

        for (let ci = 0; ci < 3; ci++) {
            for (let strong = 0; strong <= 1; strong++) {
                const color = getChainColor(ci, !!strong);
                const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
                marker.setAttribute("id", `arrow-${ci}-${strong}`);
                marker.setAttribute("markerWidth", "6");
                marker.setAttribute("markerHeight", "6");
                marker.setAttribute("refX", "5");
                marker.setAttribute("refY", "3");
                marker.setAttribute("orient", "auto");
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", "M0,0.5 L0,5.5 L5.5,3 z");
                path.setAttribute("fill", color);
                marker.appendChild(path);
                defs.appendChild(marker);
            }
        }
        chainSvg.appendChild(defs);

        const gridRect = gridEl.getBoundingClientRect();
        const svgRect = chainSvg.getBoundingClientRect();
        const cellW = gridRect.width / 9;
        const cellH = gridRect.height / 9;
        const offsetX = gridRect.left - svgRect.left;
        const offsetY = gridRect.top - svgRect.top;

        for (let ci = 0; ci < 3; ci++) {
            const chain = chains[ci];
            if (chain.nodes.length < 2) continue;

            for (let i = 0; i < chain.nodes.length - 1; i++) {
                const from = chain.nodes[i];
                const to = chain.nodes[i + 1];

                // 計算預選數在格子內的精確位置（3x3 九宮排列）
                const cx1 = offsetX + getPencilX(from.col, from.num, cellW);
                const cy1 = offsetY + getPencilY(from.row, from.num, cellH);
                const cx2 = offsetX + getPencilX(to.col, to.num, cellW);
                const cy2 = offsetY + getPencilY(to.row, to.num, cellH);

                // 計算方向向量，從起點邊緣出發，到終點邊緣結束
                const radius = Math.min(cellW, cellH) / 6 * 0.55;
                const dx = cx2 - cx1;
                const dy = cy2 - cy1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 1) continue;

                const ux = dx / dist;
                const uy = dy / dist;

                // 起點往外偏移 radius，終點往內偏移 radius
                const x1 = cx1 + ux * radius;
                const y1 = cy1 + uy * radius;
                const x2 = cx2 - ux * radius;
                const y2 = cy2 - uy * radius;

                // 鍊段類型由 to 節點的 linkType 決定
                const isStrong = to.linkType === "strong";
                const color = getChainColor(ci, isStrong);

                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", x1);
                line.setAttribute("y1", y1);
                line.setAttribute("x2", x2);
                line.setAttribute("y2", y2);
                line.setAttribute("stroke", color);
                line.setAttribute("stroke-width", "1.5");
                line.setAttribute("marker-end", `url(#arrow-${ci}-${isStrong ? 1 : 0})`);

                if (!isStrong) {
                    line.setAttribute("stroke-dasharray", "4,3");
                }

                chainSvg.appendChild(line);
            }
        }
    }

    // 計算某數字在格子內的 X 座標（預選數 3x3 排列）
    function getPencilX(col, num, cellW) {
        // num 1-9 在 3x3 網格中的欄位 (0, 1, 2)
        const pencilCol = (num - 1) % 3;
        // 格子左邊 + 預選數欄位中心
        return col * cellW + (pencilCol + 0.5) * (cellW / 3);
    }

    // 計算某數字在格子內的 Y 座標（預選數 3x3 排列）
    function getPencilY(row, num, cellH) {
        // num 1-9 在 3x3 網格中的列位 (0, 1, 2)
        const pencilRow = Math.floor((num - 1) / 3);
        // 格子上邊 + 預選數列位中心
        return row * cellH + (pencilRow + 0.5) * (cellH / 3);
    }

    // ===== 啟動 =====
    init();
    bindChainEvents();

    // 視窗大小改變時重繪鍊線條
    window.addEventListener("resize", () => {
        if (chainMode || chains.some(c => c.nodes.length > 0)) {
            renderChainOverlay();
        }
    });
})();
