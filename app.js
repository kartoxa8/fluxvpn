// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// API URL - ЗАМЕНИ НА СВОЙ после деплоя API
const API_URL = 'https://33c1aba78713.ngrok-free.app/';

// Состояние
let userData = null;

// Тарифы
const plans = [
    {
        id: 'week',
        name: '⚡ WEEK',
        duration: '7 дней',
        price: 99,
        oldPrice: 149,
        features: ['Безлимит', '1 девайс', '24/7']
    },
    {
        id: 'month',
        name: '🔥 MONTH',
        duration: '30 дней',
        price: 249,
        oldPrice: 399,
        features: ['Безлимит', '3 девайса', 'Приоритет'],
        popular: true
    },
    {
        id: 'year',
        name: '👑 YEAR',
        duration: '365 дней',
        price: 1990,
        oldPrice: 2990,
        features: ['Безлимит', '5 девайсов', 'VIP', '+30 дней']
    }
];

// Инициализация
async function init() {
    try {
        const tgUser = tg.initDataUnsafe?.user;
        
        if (tgUser) {
            document.getElementById('username').textContent = tgUser.first_name || 'USER';
            document.getElementById('avatar').textContent = (tgUser.first_name || 'U')[0].toUpperCase();
        }

        // Загружаем данные с сервера
        await loadUserData();
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('main').classList.remove('hidden');
        
        renderPlans();
        
    } catch (error) {
        console.error('Init error:', error);
        // Показываем демо-данные если API недоступен
        loadDemoData();
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('main').classList.remove('hidden');
        renderPlans();
    }
}

// Загрузка данных с API
async function loadUserData() {
    const response = await fetch(`${API_URL}/api/user`, {
        method: 'GET',
        headers: {
            'Authorization': tg.initData,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('API error');
    }
    
    userData = await response.json();
    updateUI();
}

// Демо данные (если API недоступен)
function loadDemoData() {
    userData = {
        id: tg.initDataUnsafe?.user?.id || 123456,
        balance: 0,
        subscription: {
            active: false,
            plan: null,
            expiresAt: null,
            key: null
        },
        stats: {
            download: 0,
            upload: 0,
            server: 'N/A'
        }
    };
    updateUI();
}


// Обновление UI
function updateUI() {
    // Баланс
    document.getElementById('balance').textContent = userData.balance + ' ₽';
    
    // Статистика
    document.getElementById('download').textContent = userData.stats.download + ' GB';
    document.getElementById('upload').textContent = userData.stats.upload + ' GB';
    document.getElementById('server').textContent = userData.stats.server;
    
    // Подписка
    const sub = userData.subscription;
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');
    const subStatus = document.getElementById('sub-status');
    const subBadge = document.getElementById('sub-badge');
    const progressBar = document.getElementById('progress-bar');
    const subTime = document.getElementById('sub-time');
    const progressContainer = document.getElementById('progress-container');
    
    const isActive = sub.active && sub.expiresAt && new Date(sub.expiresAt) > new Date();
    
    if (isActive) {
        statusDot.classList.add('active');
        statusText.textContent = 'ONLINE';
        subStatus.textContent = 'ACTIVE';
        subStatus.classList.add('active');
        
        const planNames = { week: 'WEEK', month: 'PRO', year: 'VIP' };
        subBadge.textContent = planNames[sub.plan] || 'PRO';
        subBadge.className = 'sub-badge ' + (sub.plan === 'year' ? 'premium' : 'pro');
        
        const now = new Date();
        const expires = new Date(sub.expiresAt);
        const totalDays = sub.plan === 'week' ? 7 : sub.plan === 'month' ? 30 : 365;
        const daysLeft = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));
        const progress = (daysLeft / totalDays) * 100;
        
        progressBar.style.width = progress + '%';
        subTime.textContent = `>>> ${daysLeft} DAYS LEFT`;
        progressContainer.classList.remove('hidden');
        
        renderActiveKey();
    } else {
        statusDot.classList.remove('active');
        statusText.textContent = 'OFFLINE';
        subStatus.textContent = 'INACTIVE';
        subStatus.classList.remove('active');
        subBadge.textContent = 'FREE';
        subBadge.className = 'sub-badge';
        progressContainer.classList.add('hidden');
        
        if (sub.expiresAt && new Date(sub.expiresAt) <= new Date()) {
            renderExpiredKey();
        } else {
            renderLockedKey();
        }
    }
}

// Рендер активного ключа
function renderActiveKey() {
    const section = document.getElementById('key-section');
    section.innerHTML = `
        <div class="key-active">
            <div class="key-label">>> YOUR VLESS KEY</div>
            <div class="key-box" id="key-value">${userData.subscription.key || 'NO KEY'}</div>
            <div class="key-actions">
                <button class="btn btn-primary" onclick="copyKey()">
                    📋 COPY
                </button>
                <button class="btn btn-secondary" onclick="showQR()">
                    📱 QR
                </button>
            </div>
        </div>
    `;
}

// Рендер заблокированного ключа
function renderLockedKey() {
    const section = document.getElementById('key-section');
    section.innerHTML = `
        <div class="key-locked">
            <div class="key-locked-icon">🔒</div>
            <div class="key-locked-title">ACCESS DENIED</div>
            <div class="key-locked-text">Купи подписку чтобы получить VPN ключ</div>
            <button class="btn btn-primary" onclick="switchTab('plans')">
                💎 КУПИТЬ
            </button>
        </div>
    `;
}

// Рендер истекшего ключа
function renderExpiredKey() {
    const section = document.getElementById('key-section');
    section.innerHTML = `
        <div class="key-expired">
            <div class="key-expired-icon">⏰</div>
            <div class="key-expired-title">EXPIRED</div>
            <div class="key-expired-text">Подписка истекла. Ключ деактивирован.</div>
            <button class="btn btn-primary" onclick="switchTab('plans')">
                🔄 ПРОДЛИТЬ
            </button>
        </div>
    `;
}

// Копирование ключа
function copyKey() {
    const key = userData.subscription.key;
    if (!key) return;
    
    navigator.clipboard.writeText(key).then(() => {
        tg.HapticFeedback.notificationOccurred('success');
        showModal('✅', 'COPIED!', 'Ключ скопирован в буфер');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = key;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        tg.HapticFeedback.notificationOccurred('success');
        showModal('✅', 'COPIED!', 'Ключ скопирован в буфер');
    });
}

function showQR() {
    tg.HapticFeedback.impactOccurred('medium');
    showModal('📱', 'QR CODE', 'Функция в разработке...');
}

// Рендер тарифов
function renderPlans() {
    const container = document.getElementById('plans-list');
    container.innerHTML = plans.map(plan => `
        <div class="plan-card ${plan.popular ? 'popular' : ''}">
            <div class="plan-header">
                <div>
                    <div class="plan-name">${plan.name}</div>
                    <div class="plan-duration">${plan.duration}</div>
                </div>
                <div class="plan-price">
                    <div class="plan-price-value">${plan.price} ₽</div>
                    ${plan.oldPrice ? `<div class="plan-price-old">${plan.oldPrice} ₽</div>` : ''}
                </div>
            </div>
            <div class="plan-features">
                ${plan.features.map(f => `<span class="plan-feature">✓ ${f}</span>`).join('')}
            </div>
            <button class="plan-btn" onclick="buyPlan('${plan.id}', ${plan.price})">
                [ КУПИТЬ ${plan.price} ₽ ]
            </button>
        </div>
    `).join('');
}

// Покупка тарифа
async function buyPlan(planId, price) {
    tg.HapticFeedback.impactOccurred('medium');
    
    if (userData.balance < price) {
        showModal('💰', 'НЕТ ДЕНЕГ', `Пополни баланс на ${price - userData.balance} ₽`);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/buy`, {
            method: 'POST',
            headers: {
                'Authorization': tg.initData,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ planId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Purchase failed');
        }
        
        const result = await response.json();
        
        // Обновляем данные
        await loadUserData();
        
        switchTab('key');
        showModal('🎉', 'SUCCESS!', 'Подписка активирована!');
        
    } catch (error) {
        console.error('Buy error:', error);
        showModal('❌', 'ERROR', error.message || 'Ошибка покупки');
    }
}

// Переключение вкладок
function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// Модальное окно
function showModal(icon, title, text) {
    document.getElementById('modal-icon').textContent = icon;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// Запуск
init();
