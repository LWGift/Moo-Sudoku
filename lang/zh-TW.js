// 繁體中文語言包
const LANG_ZH_TW = {
    code: "zh-TW",
    name: "繁體中文",

    // 頁面
    appTitle: "Moo-Sudoku",

    // 模式
    btnStart: "開始解題",

    // 難度
    diffEasy: "簡單",
    diffMedium: "中等",
    diffHard: "困難",
    diffExpert: "專家",
    diffExtreme: "極限",
    btnGenerate: "自動出題",
    seedPlaceholder: "種子碼（例：M-K7X3NP）",
    seedCopied: "已複製！",
    inputModeNumFirst: "先選數字",
    inputModeCellFirst: "先選格子",
    btnNewGame: "新遊戲",

    // 工具列
    undo: "上一步",
    assist: "輔助",
    autoPencil: "自動鉛筆",
    pencil: "鉛筆開關",
    pencilMode: "鉛筆模式",
    chain: "鍊推理",
    submit: "提交",
    submitAnswer: "提交答案",

    // 鍊推理
    chainExit: "返回",
    chain1: "鍊 1",
    chain2: "鍊 2",
    chain3: "鍊 3",
    chainStrong: "強",
    chainWeak: "弱",
    chainSelectStart: "先選起點",
    chainType: "下一步類型",
    chainClearOne: "清此鍊",
    chainClearAll: "清全部",
    chainClearOneTitle: "清除此鍊",
    chainClearAllTitle: "全部清除",

    // 底部
    btnClearData: "清除所有資料",

    // 說明
    helpContent: `
<h2>🎯 基本玩法</h2>
<ul>
<li>在 9×9 格線中填入數字 1-9</li>
<li>每行、每列、每個 3×3 宮格中數字不可重複</li>
<li>先選數字，再點擊格子填入</li>
<li>右鍵點擊格子填入預選數（鉛筆標記）</li>
</ul>
<h2>📊 難度等級</h2>
<ul>
<li><b>簡單</b>：36 格空白（45 提示）</li>
<li><b>中等</b>：46 格空白（35 提示）</li>
<li><b>困難</b>：52 格空白（29 提示）</li>
<li><b>專家</b>：58 格空白（23 提示）</li>
<li><b>極限</b>：盡可能多的空白</li>
</ul>
<h2>🔧 按鈕說明</h2>
<ul>
<li><b>↩ 上一步</b>：還原上一次操作</li>
<li><b>📝 鉛筆模式</b>（手機）：開啟後點擊格子填預選</li>
<li><b>💡 輔助</b>：開啟數字高亮與自動移除預選</li>
<li><b>✏️ 自動鉛筆</b>：一鍵填入所有合法預選數</li>
<li><b>👁️ 鉛筆開關</b>：顯示/隱藏預選數</li>
<li><b>🔗 鍊推理</b>：標記推理鍊輔助思考</li>
<li><b>✔️ 提交</b>：檢查答案是否正確</li>
</ul>
<h2>💡 小技巧</h2>
<ul>
<li>長按橡皮擦：清除所有已填答案</li>
<li>長按鉛筆開關：清除所有預選數</li>
<li>點擊種子碼：複製種子分享給朋友</li>
<li>再次點擊已選數字：取消選取</li>
</ul>`,

    // 訊息
    msgNoUndo: "沒有可返回的步驟",
    msgIncomplete: "還有空格未填寫！",
    msgCorrect: "🎉 恭喜！答案正確！",
    msgWrong: "答案不正確，請再檢查。",
    msgLoadFail: "載入存檔失敗，使用預設值",
    msgClearConfirm: "確定要清除所有資料嗎？題目和進度都會被刪除。",
    msgPuzzleConflict: "題目有衝突，請檢查重複的數字。",
    msgPuzzleNoSolution: "此題目無解，請修正。",
    msgInvalidSeed: "種子碼格式不正確（例：M-K7X3NP）",
    msgResetConfirm: "確定要清除所有輸入嗎？",
    msgClearPencilConfirm: "確定要清除所有鉛筆標記嗎？",
};
