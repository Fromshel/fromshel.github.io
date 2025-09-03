/**
 * OnTaste - Интернет-кафе
 * Полная реализация функционала:
 * - Работа с корзиной
 * - Авторизация/регистрация
 * - Фильтрация меню
 * - Анимации
 */

// Глобальные переменные
let users = [];
let currentUser = null;
let cart = [];
let orders = [];

// Данные меню с множественными категориями
const menuItems = [
    { id: '1', name: 'Капучино', price: 200, image: 'images/cappuccino.jpg', categories: ['all', 'coffee'] },
    { id: '2', name: 'Латте', price: 220, image: 'images/latte.png', categories: ['all', 'coffee'] },
    { id: '3', name: 'Сэндвич', price: 180, image: 'images/sandwich.jpg', categories: ['all', 'food'] },
    { id: '4', name: 'Салат', price: 160, image: 'images/salad.png', categories: ['all', 'food'] },
    { id: '5', name: 'Чизкейк', price: 200, image: 'images/cheesecake.jpg', categories: ['all', 'desserts'] },
    { id: '6', name: 'Брауни', price: 180, image: 'images/brownie.png', categories: ['all', 'desserts'] }
];

try {
    users = JSON.parse(localStorage.getItem('users')) || [];
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    orders = JSON.parse(localStorage.getItem('orders')) || [];
    // Валидация данных корзины
    cart = cart.filter(item => 
        item.id && 
        item.name && 
        typeof item.price === 'number' && 
        item.price > 0 && 
        item.quantity > 0 && 
        item.image
    );
} catch (e) {
    console.error('Ошибка при загрузке данных из localStorage:', e);
    showAlert('Ошибка загрузки данных. Попробуйте снова.', 'error');
}

// Вспомогательные функции
function updateStorage() {
    try {
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('orders', JSON.stringify(orders));
    } catch (e) {
        console.error('Ошибка при сохранении в localStorage:', e);
        showAlert('Ошибка сохранения данных. Попробуйте снова.', 'error');
    }
}

function showAlert(message, type = 'success') {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) return; // Prevent multiple alerts
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}

// Форматирование числа с пробелами
function formatPrice(number) {
    return number.toLocaleString('ru-RU', { minimumFractionDigits: 0 });
}

// Система авторизации
function handleRegistration(e) {
    e.preventDefault();
    const name = document.querySelector('input[placeholder="Введите ваше имя"]').value;
    const email = document.querySelector('input[placeholder="Введите ваш email"]').value;
    const password = document.querySelector('input[placeholder="Создайте пароль"]').value;
    const confirmPassword = document.querySelector('input[placeholder="Повторите пароль"]').value;

    // Валидация
    if (users.some(user => user.email === email)) {
        showAlert('Пользователь с таким email уже существует!', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Пароли не совпадают!', 'error');
        return;
    }

    // Создание пользователя
    const newUser = { 
        id: Date.now().toString(),
        name, 
        email, 
        password,
        registrationDate: new Date().toISOString()
    };
    
    users.push(newUser);
    currentUser = newUser;
    updateStorage();
    
    showAlert('Регистрация прошла успешно!');
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    setTimeout(() => window.location.href = redirect === 'cart' ? 'cart.html' : 'account.html', 1500);
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.querySelector('input[placeholder="Введите ваш email"]').value;
    const password = document.querySelector('input[placeholder="Введите ваш пароль"]').value;

    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        updateStorage();
        showAlert(`Добро пожаловать, ${user.name}!`);
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        setTimeout(() => window.location.href = redirect === 'cart' ? 'cart.html' : 'account.html', 1500);
    } else {
        showAlert('Неверный email или пароль!', 'error');
    }
}

function handleLogout() {
    currentUser = null;
    cart = [];
    updateStorage();
    showAlert('Вы вышли из системы');
    setTimeout(() => window.location.href = 'index.html', 1000);
}

// Работа с корзиной
function addToCart(itemName, price, image) {
    if (!currentUser) {
        showAlert('Для добавления в корзину войдите в аккаунт', 'error');
        setTimeout(() => window.location.href = 'login.html?redirect=cart', 1500);
        return;
    }

    // Преобразование цены в число
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
        showAlert('Некорректная цена товара!', 'error');
        return;
    }

    const existingItem = cart.find(item => item.name === itemName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            id: Date.now().toString(),
            name: itemName, 
            price: parsedPrice, 
            image, 
            quantity: 1,
            addedAt: new Date().toISOString()
        });
    }
    
    updateStorage();
    updateCartCount();
    showAlert(`${itemName} добавлен в корзину!`);
}

function removeFromCart(itemId) {
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) itemElement.classList.add('cart-item-remove');
    
    setTimeout(() => {
        cart = cart.filter(item => item.id !== itemId);
        updateStorage();
        updateCartDisplay();
        updateCartCount();
    }, 400);
}

function updateCartCount() {
    const countElements = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    countElements.forEach(el => {
        if (el) {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    });
}

function updateCartDisplay() {
    const cartContainer = document.querySelector('.cart-container');
    if (!cartContainer) return;
    
    cartContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="empty-cart">Ваша корзина пуста</p>';
        document.querySelector('.total').textContent = 'Итого: 0 ₽';
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.dataset.itemId = item.id;
        cartItem.innerHTML = `
            <div class="image-wrapper">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <div class="cart-item-controls">
                    <button class="quantity-btn minus" onclick="changeQuantity('${item.id}', -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" onclick="changeQuantity('${item.id}', 1)">+</button>
                    <span class="item-price">${formatPrice(itemTotal)} ₽</span>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;
        
        cartContainer.appendChild(cartItem);
    });

    document.querySelector('.total').innerHTML = `
        <strong>Итого: ${formatPrice(total)} ₽</strong>
    `;
}

function changeQuantity(itemId, delta) {
    const item = cart.find(item => item.id === itemId);
    if (!item) return;
    
    item.quantity += delta;
    
    if (item.quantity < 1) {
        removeFromCart(itemId);
    } else {
        updateStorage();
        updateCartDisplay();
    }
}

// Работа с заказами
function handleOrder(e) {
    e.preventDefault();
    
    const orderButton = document.getElementById('orderButton');
    const pickupInput = document.getElementById('pickup');
    
    // Блокируем кнопку во время обработки
    orderButton.disabled = true;
    orderButton.textContent = 'Обработка...';

    if (!currentUser) {
        showAlert('Пожалуйста, войдите в аккаунт, чтобы оформить заказ', 'error');
        updateStorage(); // Ensure cart is saved before redirect
        setTimeout(() => {
            orderButton.disabled = false;
            orderButton.textContent = 'Оформить заказ';
            window.location.href = 'login.html?redirect=cart';
        }, 1500);
        return;
    }

    if (cart.length === 0) {
        showAlert('Корзина пуста! Добавьте товары перед оформлением заказа.', 'error');
        orderButton.disabled = false;
        orderButton.textContent = 'Оформить заказ';
        return;
    }

    const pickupTime = pickupInput.value;
    if (!pickupTime) {
        showAlert('Пожалуйста, выберите время самовывоза!', 'error');
        orderButton.disabled = false;
        orderButton.textContent = 'Оформить заказ';
        return;
    }

    // Валидация времени (с 8:00 до 20:00)
    const time = new Date(`1970-01-01T${pickupTime}:00`);
    const hours = time.getHours();
    if (hours < 8 || hours >= 20) {
        showAlert('Время самовывоза должно быть с 8:00 до 20:00!', 'error');
        orderButton.disabled = false;
        orderButton.textContent = 'Оформить заказ';
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newOrder = {
        id: Date.now().toString(),
        userEmail: currentUser.email,
        items: [...cart],
        total,
        pickupTime,
        date: new Date().toLocaleDateString('ru-RU'),
        status: 'В обработке',
        createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    cart = [];
    updateStorage();
    
    // Очистка формы
    pickupInput.value = '';
    
    showAlert('Заказ успешно оформлен! Вы будете перенаправлены в личный кабинет.');
    setTimeout(() => {
        orderButton.disabled = false;
        orderButton.textContent = 'Оформить заказ';
        window.location.href = 'account.html';
    }, 2000);
}

function updateProfileDisplay() {
    const userGreeting = document.querySelector('.user-greeting');
    const orderList = document.querySelector('.order-history ul');
    const loginPrompt = document.querySelector('.login-prompt');
    const logoutButton = document.querySelector('#logoutButton');

    if (!currentUser) {
        if (userGreeting) {
            userGreeting.style.display = 'none';
        }
        if (orderList) {
            orderList.style.display = 'none';
        }
        if (loginPrompt) {
            loginPrompt.style.display = 'block';
        }
        if (logoutButton) {
            logoutButton.style.display = 'none';
        }
        return;
    }

    if (userGreeting) {
        userGreeting.style.display = 'block';
        userGreeting.textContent = `Добро пожаловать, ${currentUser.name}!`;
    }
    if (loginPrompt) {
        loginPrompt.style.display = 'none';
    }
    if (logoutButton) {
        logoutButton.style.display = 'inline-block';
    }

    if (orderList) {
        orderList.style.display = 'block';
        orderList.innerHTML = '';
        const userOrders = orders
            .filter(order => order.userEmail === currentUser.email)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (userOrders.length === 0) {
            orderList.innerHTML = '<li class="no-orders">У вас пока нет заказов</li>';
            return;
        }

        userOrders.forEach(order => {
            const li = document.createElement('li');
            li.className = 'order-item';
            li.innerHTML = `
                <div class="order-header">
                    <span class="order-date">${order.date}</span>
                    <span class="order-status ${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span>
                </div>
                <div class="order-details">
                    <span class="order-total">${formatPrice(order.total)} ₽</span>
                    <span class="order-time">Время: ${order.pickupTime}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item-product">
                            <span>${item.name} × ${item.quantity}</span>
                            <span>${formatPrice(item.price * item.quantity)} ₽</span>
                        </div>
                    `).join('')}
                </div>
            `;
            orderList.appendChild(li);
        });
    }
}

// Работа с меню
function renderMenuItems(category = 'all') {
    const menuGrid = document.querySelector('#menuGrid');
    if (!menuGrid) return;

    menuGrid.innerHTML = '';

    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.categories.includes(category));

    if (filteredItems.length === 0) {
        menuGrid.innerHTML = '<p class="no-items">Товары в этой категории отсутствуют</p>';
        return;
    }

    filteredItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <div class="image-wrapper">
                <img src="${item.image}" alt="${item.name}" class="menu-item-image" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p class="price">${formatPrice(item.price)} ₽</p>
                <button class="add-to-cart btn" 
                        data-name="${item.name}" 
                        data-price="${item.price}" 
                        data-image="${item.image}">
                    В корзину
                </button>
            </div>
        `;
        menuGrid.appendChild(menuItem);
    });
}

// Инициализация страницы
function initPage() {
    // Пропускаем полную инициализацию на странице логина/регистрации
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
        updateCartCount();
        return;
    }

    updateCartCount();
    updateCartDisplay();
    updateProfileDisplay();

    // Инициализация меню
    if (window.location.pathname.includes('menu.html')) {
        renderMenuItems('all'); // Показать все товары по умолчанию

        // Делегирование событий для кнопок фильтрации
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Удаляем класс active у всех кнопок
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Добавляем класс active к текущей кнопке
                button.classList.add('active');
                const category = button.dataset.category;
                renderMenuItems(category);
            });
        });

        // Делегирование событий для кнопок "В корзину"
        const menuGrid = document.querySelector('#menuGrid');
        if (menuGrid) {
            menuGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('.add-to-cart');
                if (btn) {
                    const name = btn.dataset.name;
                    const price = btn.dataset.price;
                    const image = btn.dataset.image;
                    if (name && price && image) {
                        addToCart(name, price, image);
                    } else {
                        showAlert('Ошибка добавления товара!', 'error');
                    }
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initPage();
    
    // Обработчики анимации кнопок
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.classList.add('button-press');
        });
        button.addEventListener('mouseup', function() {
            this.classList.remove('button-press');
        });
        button.addEventListener('mouseleave', function() {
            this.classList.remove('button-press');
        });
    });
});