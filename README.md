# Moo-Sudoku

A pure front-end Sudoku game with puzzle generation, seed sharing, pencil marks, and chain reasoning.

> 純前端數獨遊戲，支援自動出題、種子分享、鉛筆標記與鍊推理。

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

## ✨ Features

- **Puzzle Generation** — Five difficulty levels (Easy / Medium / Hard / Expert / Extreme), guaranteed unique solution via backtracking
- **Seed System** — Every puzzle has a unique seed code; share via URL or seed string
- **Custom Puzzles** — Enter any puzzle manually and get an auto-generated share code
- **Two Input Modes** — Number-first or Cell-first
- **Assist Mode** — Number highlighting and automatic pencil mark removal
- **Pencil Marks** — Fill manually or via Auto Pencil; toggle visibility anytime
- **Chain Reasoning** — Three independent chains with strong/weak link visualization
- **i18n** — Traditional Chinese & English; auto-detects browser language
- **Dark Mode** — Dark by default, toggleable
- **Responsive** — Works on desktop and mobile
- **Local Save** — Progress auto-saved to `localStorage`

## 🚀 Getting Started

No server or build tools required. Just open `index.html` in any browser.

```bash
git clone https://github.com/your-username/Moo-Sudoku.git
cd Moo-Sudoku
# open index.html in your browser
```

## 🎮 How to Play

### Generate a Puzzle
1. Select a difficulty and click **Generate**
2. Or enter a seed code (e.g. `M-K7X3NP`) in the seed field and press Enter
3. Or type numbers directly into the grid and click **Start**

### Share a Puzzle
- The URL automatically includes a `?seed=` parameter while playing — just copy and share it
- Click the seed code to copy it to clipboard

### Seed Format

| Format | Description |
|--------|-------------|
| `E-XXXXXX` | Easy |
| `M-XXXXXX` | Medium |
| `H-XXXXXX` | Hard |
| `X-XXXXXX` | Expert |
| `Z-XXXXXX` | Extreme |
| `C-xxxxxxx` | Custom puzzle (compressed encoding) |

### Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Fill answer | Select number → left click cell | Select number → tap cell |
| Fill pencil mark | Select number → right click cell | Enable Pencil Mode → tap cell |
| Erase cell | Select eraser → click cell | Same |
| Clear all answers | Long press eraser | Same |
| Clear all pencil marks | Long press pencil toggle | Same |
| Deselect number | Click selected number again | Same |

## 📁 File Structure

```
├── index.html       # Page structure
├── style.css        # Styles (dark mode, responsive)
├── script.js        # Game logic
├── lang/
│   ├── zh-TW.js     # Traditional Chinese language pack
│   └── en.js        # English language pack
└── README.md
```

## 🌐 Adding a Language

1. Create a new file in `lang/` (e.g. `lang/ja.js`)
2. Define a language object following the existing format (e.g. `const LANG_JA = { ... }`)
3. Add `<script src="lang/ja.js"></script>` in `index.html`
4. Add `LANG_JA` to the `LANGS` array in `script.js`

## 🔧 Technical Notes

- Pure HTML / CSS / JavaScript — zero dependencies
- Mulberry32 PRNG for reproducible seeds
- Unique-solution validation via backtracking (stops at 2 solutions)
- Custom board compression algorithm for seed encoding
- CSS variables for theming; `color-mix()` for highlight overlays

## 📄 License

[MIT License](LICENSE)

---

*Built with the assistance of [Kiro](https://kiro.dev), an AI-powered development environment.*
