// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Состояние игры
let gameState = {
    coins: 0,
    perClick: 1,
    upgrades: {
        doubleClick: { level: 0, baseCost: 50, multiplier: 2 },
        autoClicker: { level: 0, baseCost: 200, multiplier: 2.5 },
        megaClick: { level: 0, baseCost: 500, multiplier: 3 }
    }
};

// Загрузка сохранения
function loadGame() {
    const saved = localStorage.getItem('clickerGame');
    if (saved) {
        gameState = JSON.parse(saved);
    }
    updateUI();
}

// Сохранение игры
function saveGame() {
    localStorage.setItem('clickerGame', JSON.stringify(gameState));
}

// Обновление интерфейса
function updateUI() {
    document.getElementById('coin-count').textContent = formatNumber(gameState.coins);
    document.getElementById('per-click').textContent = gameState.perClick;
    renderShop();
}

// Форматирование чисел
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num);
}

// Расчет стоимости улучшения
function getUpgradeCost(upgrade) {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.multiplier, upgrade.level));
}

// Товары магазина
const shopItems = [
    {
        id: 'doubleClick',
        icon: '✨',
        name: 'Двойной клик',
        desc: '+1 к клику'
    },
    {
        id: 'autoClicker',
        icon: '🤖',
        name: 'Авто-кликер',
        desc: '+1 монета/сек'
    },
    {
        id: 'megaClick',
        icon: '💎',
        name: 'Мега клик',
        desc: '+5 к клику'
    }
];


// Рендер магазина
function renderShop() {
    const container = document.getElementById('shop-items');
    container.innerHTML = shopItems.map(item => {
        const upgrade = gameState.upgrades[item.id];
        const cost = getUpgradeCost(upgrade);
        const canBuy = gameState.coins >= cost;
        
        return `
            <div class="shop-item">
                <div class="item-icon">${item.icon}</div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.desc}</div>
                    <div class="item-level">Уровень: ${upgrade.level}</div>
                </div>
                <button class="buy-btn" ${!canBuy ? 'disabled' : ''} onclick="buyUpgrade('${item.id}')">
                    🪙 ${formatNumber(cost)}
                </button>
            </div>
        `;
    }).join('');
}

// Покупка улучшения
function buyUpgrade(id) {
    const upgrade = gameState.upgrades[id];
    const cost = getUpgradeCost(upgrade);
    
    if (gameState.coins >= cost) {
        gameState.coins -= cost;
        upgrade.level++;
        
        // Применяем эффект
        if (id === 'doubleClick') {
            gameState.perClick += 1;
        } else if (id === 'megaClick') {
            gameState.perClick += 5;
        }
        
        tg.HapticFeedback.impactOccurred('medium');
        saveGame();
        updateUI();
    }
}

// Обработка клика
function handleClick(e) {
    gameState.coins += gameState.perClick;
    
    // Анимация +N
    const floatText = document.createElement('div');
    floatText.className = 'float-text';
    floatText.textContent = '+' + gameState.perClick;
    floatText.style.left = (e.clientX - 20) + 'px';
    floatText.style.top = (e.clientY - 20) + 'px';
    document.body.appendChild(floatText);
    setTimeout(() => floatText.remove(), 800);
    
    tg.HapticFeedback.impactOccurred('light');
    saveGame();
    updateUI();
}

// Авто-кликер
function startAutoClicker() {
    setInterval(() => {
        const autoLevel = gameState.upgrades.autoClicker.level;
        if (autoLevel > 0) {
            gameState.coins += autoLevel;
            saveGame();
            updateUI();
        }
    }, 1000);
}

// Переключение вкладок
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
    });
});

// Кнопка клика
document.getElementById('click-btn').addEventListener('click', handleClick);

// Запуск
loadGame();
startAutoClicker();
