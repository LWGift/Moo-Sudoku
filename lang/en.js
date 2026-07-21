// English Language Pack
const LANG_EN = {
    code: "en",
    name: "English",

    // Page
    appTitle: "Moo-Sudoku",

    // Mode
    btnStart: "Start",

    // Difficulty
    diffEasy: "Easy",
    diffMedium: "Medium",
    diffHard: "Hard",
    diffExpert: "Expert",
    diffExtreme: "Extreme",
    btnGenerate: "Generate",
    seedPlaceholder: "Seed (e.g. M-K7X3NP)",
    seedCopied: "Copied!",
    inputModeNumFirst: "Number First",
    inputModeCellFirst: "Cell First",
    btnNewGame: "New Game",

    // Toolbar
    undo: "Undo",
    assist: "Assist",
    autoPencil: "Auto Pencil",
    pencil: "Pencil",
    pencilMode: "Pencil Mode",
    chain: "Chain",
    submit: "Submit",
    submitAnswer: "Submit Answer",

    // Chain
    chainExit: "Back",
    chainUndo: "Undo",
    chain1: "Chain 1",
    chain2: "Chain 2",
    chain3: "Chain 3",
    chainStrong: "Strong",
    chainWeak: "Weak",
    chainSelectStart: "Select start",
    chainType: "Next link type",
    chainClearOne: "Clear",
    chainClearAll: "Clear All",
    chainClearOneTitle: "Clear this chain",
    chainClearAllTitle: "Clear all chains",

    // Footer
    btnClearData: "Clear All Data",

    // Help
    helpContent: `
<h2>🎯 How to Play</h2>
<ul>
<li>Fill digits 1-9 in the 9×9 grid</li>
<li>No repeats in any row, column, or 3×3 box</li>
<li>Select a number first, then tap a cell to fill it</li>
<li>Right click a cell to add pencil marks</li>
</ul>
<h2>📊 Difficulty Levels</h2>
<ul>
<li><b>Easy</b>: 36 blanks (45 clues)</li>
<li><b>Medium</b>: 46 blanks (35 clues)</li>
<li><b>Hard</b>: 52 blanks (29 clues)</li>
<li><b>Expert</b>: 58 blanks (23 clues)</li>
<li><b>Extreme</b>: As many blanks as possible</li>
</ul>
<h2>🔧 Toolbar</h2>
<ul>
<li><b>↩ Undo</b>: Revert last action</li>
<li><b>📝 Pencil Mode</b> (mobile): Tap fills pencil marks</li>
<li><b>💡 Assist</b>: Enables highlighting &amp; auto pencil removal</li>
<li><b>✏️ Auto Pencil</b>: Fill all valid pencil marks</li>
<li><b>👁️ Pencil Toggle</b>: Show/hide pencil marks</li>
<li><b>🔗 Chain</b>: Mark reasoning chains</li>
<li><b>✔️ Submit</b>: Check if the answer is correct</li>
</ul>
<h2>💡 Tips</h2>
<ul>
<li>Long press eraser: Clear all filled answers</li>
<li>Long press pencil toggle: Clear all pencil marks</li>
<li>Click seed code: Copy to clipboard for sharing</li>
<li>Click selected number again: Deselect</li>
</ul>`,

    // Messages
    msgNoUndo: "No more undo steps",
    msgIncomplete: "There are still empty cells!",
    msgCorrect: "🎉 Congratulations! Correct!",
    msgWrong: "Incorrect answer, please check again.",
    msgLoadFail: "Failed to load save data, using defaults",
    msgClearConfirm: "Clear all data? Puzzle and progress will be deleted.",
    msgPuzzleEmpty: "Please enter at least one number before starting.",
    msgPuzzleTooFew: "A valid puzzle requires at least 17 clues.",
    msgPuzzleConflict: "Puzzle has conflicts. Please check for duplicates.",
    msgPuzzleNoSolution: "This puzzle has no solution. Please fix it.",
    msgInvalidSeed: "Invalid seed format (e.g. M-K7X3NP)",
    msgResetConfirm: "Clear all your answers and pencil marks?",
    msgClearPencilConfirm: "Clear all pencil marks?",
};
