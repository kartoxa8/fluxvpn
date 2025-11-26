// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// API URL (замени на свой)
const API_URL = 'https://your-api-url.com/api';

// Состояние
let userData = null;

// Тарифы
const plans = [
    {
        id: 'week',
        name: '🚀 Неделя',
        duration: '7 дней',
        price: 99,
        oldPrice: 149,
        features: ['Безлимит трафика', '1 устройство', 'Поддержка 24/7']
    },
    {
        id: 'month',
        name: '⭐ Месяц',
        duration: '30 дней',
        price: 249,
        oldPrice: 399,
        features: ['Безлимит трафика', '3 устройства', 'Приоритет поддержки'],
        popular: true
    },
    {
        id: 'year',
        name: '👑 Год',
        duration: '365 дней',
        price: 1990,
        oldPrice: 2990,
        features: ['Безлимит трафика', '5 устройств', 'VIP поддержка', 'Бонус +30 дней']
    }
];

// Инициализация
async function init() {
    try {
        // Получаем данные пользователя из Telegram
        const tgUser = tg.initDataUnsafe?.user;
        
        if (tgUser) {
            document.getElementById('username').textContent = tgUser.first_name || 'User';
            document.getElementById('avatar').textContent = (tgUser.first_name || 'U')[0].toUpperCase();
        }

        // Загружаем данные с сервера
        await loadUserData();
        
        // Показываем интерфейс
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('main').classList.remove('hidden');
        
        // Рендерим тарифы
        renderPlans();
        
    } catch (error) {
        console.error('Init error:', error);
        showModal('❌', 'Ошибка', 'Не удалось загрузить данные');
    }
}

// Загрузка данных пользователя
async function loadUserData() {
    // В реальном приложении - запрос к API
    // const response = await fetch(`${API_URL}/user`, {
    //     headers: { 'Authorization': tg.initData }
    // });
    // userData = await response.json();
    
    // Демо данные (замени на реальный API)
    userData = {
        id: tg.initDataUnsafe?.user?.id || 123456,
        balance: 500,
        subscription: {
            active: true,
            plan: 'month',
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // +15 дней
            key: 'vless://uuid-here@server.com:443?encryption=none&security=tls&type=ws&host=server.com&path=/vless#MyVPN'
        },
        stats: {
            download: 12.5,
            upload: 3.2,
            server: 'Нидерланды'
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
    
    if (sub.active && new Date(sub.expiresAt) > new Date()) {
        // Активная подписка
        statusDot.classList.add('active');
        statusText.textContent = 'Подключено';
        subStatus.textContent = 'Активна';
        subStatus.classList.add('active');
        
        // Бейдж тарифа
        const planNames = { week: 'WEEK', month: 'PRO', year: 'VIP' };
        subBadge.textContent = planNames[sub.plan] || 'PRO';
        subBadge.className = 'sub-badge ' + (sub.plan === 'year' ? 'premium' : 'pro');
        
        // Прогресс
        const now = new Date();
        const expires = new Date(sub.expiresAt);
        const totalDays = sub.plan === 'week' ? 7 : sub.plan === 'month' ? 30 : 365;
        const daysLeft = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));
        const progress = (daysLeft / totalDays) * 100;
        
        progressBar.style.width = progress + '%';
        subTime.textContent = `Осталось: ${daysLeft} дн.`;
        progressContainer.classList.remove('hidden');
        
        // Показываем ключ
        renderActiveKey();
    } else {
        // Нет подписки или истекла
        statusDot.classList.remove('active');
        statusText.textContent = 'Отключено';
        subStatus.textContent = 'Неактивна';
        subStatus.classList.remove('active');
        subBadge.textContent = 'FREE';
        subBadge.className = 'sub-badge';
        progressContainer.classList.add('hidden');
        
        // Проверяем истекла ли подписка
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
            <div class="key-label">Ваш VLESS ключ</div>
            <div class="key-box" id="key-value">${userData.subscription.key}</div>
            <div class="key-actions">
                <button class="btn btn-primary" onclick="copyKey()">
                    📋 Копировать
                </button>
                <button class="btn btn-secondary" onclick="showQR()">
                    📱 QR
                </button>
            </div>
        </div>
    `;
}

// Рендер заблокированного ключа (нет подписки)
function renderLockedKey() {
    const section = document.getElementById('key-section');
    section.innerHTML = `
        <div class="key-locked">
            <div class="key-locked-icon">🔒</div>
            <div class="key-locked-title">Ключ недоступен</div>
            <div class="key-locked-text">Оформите подписку, чтобы получить доступ к VPN</div>
            <button class="btn btn-primary" onclick="switchTab('plans')">
                💎 Выбрать тариф
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
            <div class="key-expired-title">Подписка истекла</div>
            <div class="key-expired-text">Продлите подписку, чтобы продолжить пользоваться VPN</div>
            <button class="btn btn-primary" onclick="switchTab('plans')">
                🔄 Продлить подписку
            </button>
        </div>
    `;
}

// Копирование ключа
function copyKey() {
    const key = userData.subscription.key;
    navigator.clipboard.writeText(key).then(() => {
        tg.HapticFeedback.notificationOccurred('success');
        showModal('✅', 'Скопировано!', 'Ключ скопирован в буфер обмена');
    }).catch(() => {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = key;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        tg.HapticFeedback.notificationOccurred('success');
        showModal('✅', 'Скопировано!', 'Ключ скопирован в буфер обмена');
    });
}

// QR код (заглушка)
function showQR() {
    tg.HapticFeedback.impactOccurred('medium');
    showModal('📱', 'QR код', 'Функция QR кода будет добавлена позже');
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
                Купить за ${plan.price} ₽
            </button>
        </div>
    `).join('');
}

// Покупка тарифа
async function buyPlan(planId, price) {
    tg.HapticFeedback.impactOccurred('medium');
    
    if (userData.balance < price) {
        showModal('💰', 'Недостаточно средств', `Пополните баланс на ${price - userData.balance} ₽`);
        return;
    }
    
    // В реальном приложении - запрос к API
    // await fetch(`${API_URL}/buy`, {
    //     method: 'POST',
    //     headers: { 'Authorization': tg.initData },
    //     body: JSON.stringify({ planId })
    // });
    
    // Демо: обновляем локально
    userData.balance -= price;
    const days = planId === 'week' ? 7 : planId === 'month' ? 30 : 365;
    userData.subscription = {
        active: true,
        plan: planId,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        key: 'vless://new-uuid@server.com:443?encryption=none&security=tls&type=ws&host=server.com&path=/vless#MyVPN'
    };
    
    updateUI();
    switchTab('key');
    showModal('🎉', 'Успешно!', 'Подписка активирована. Ваш ключ готов!');
}

// Переключение вкладок
function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

// Обработчики вкладок
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
