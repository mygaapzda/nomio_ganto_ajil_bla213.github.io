const LOCATIONS = [
    { id: 'shop', name: 'Дэлгүүр' },
    { id: 'warehouse', name: 'Агуулах' },
    { id: 'defect', name: 'Дипэкт' }
];

const PAYMENT_METHODS = [
    { id: 'pos', name: 'POS' },
    { id: 'bank', name: 'Дансаар' },
    { id: 'qpay', name: 'Qpay' },
    { id: 'pocket', name: 'Pocket' },
    { id: 'cash', name: 'Бэлэн' },
    { id: 'employee', name: 'Ажилчин' },
    { id: 'director', name: 'Захирал' },
    { id: 'gift', name: 'Бэлэг' }
];

const DEFAULT_ITEMS = [
    { id: 'cups', name: 'Хос аяга', price: 120000 },
    { id: 'thermos', name: 'Халуун сав', price: 350000 },
    { id: 'meal-set', name: 'Хоолны сэт', price: 1555000 },
    { id: 'tea-set', name: 'Цайны сэт', price: 888000 },
    { id: 'yargui', name: 'Яргуй', price: 650000 },
    { id: 'candle', name: 'Лаа', price: 88000 },
    { id: 'book', name: 'Ном', price: 20000 }
];


let state = {
    items: JSON.parse(localStorage.getItem('inv_items')) || DEFAULT_ITEMS,
    inventory: JSON.parse(localStorage.getItem('inv_data')) || {},
    transactions: JSON.parse(localStorage.getItem('inv_tx')) || [],
    currentPage: 'dashboard'
};


let needsSave = false;
LOCATIONS.forEach(loc => {
    if (!state.inventory[loc.id]) {
        state.inventory[loc.id] = {};
        needsSave = true;
    }
    state.items.forEach(item => {
        if (state.inventory[loc.id][item.id] === undefined) {
            state.inventory[loc.id][item.id] = 0;
            needsSave = true;
        }
    });
});
if (needsSave) saveState();

function saveState() {
    localStorage.setItem('inv_items', JSON.stringify(state.items));
    localStorage.setItem('inv_data', JSON.stringify(state.inventory));
    localStorage.setItem('inv_tx', JSON.stringify(state.transactions));
}



function exportData() {
    const data = {
        items: state.items,
        inventory: state.inventory,
        transactions: state.transactions,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(inputEl) {
    const file = inputEl.files ? inputEl.files[0] : null;
    if (!file) return;

    const pwd = prompt('Мэдээлэл сэргээх нууц үгээ оруулна уу:');
    if (pwd !== 'iloveboljmor2004') {
        alert('Нууц үг буруу байна!');
        inputEl.value = ''; // Reset input to allow selecting the same file again
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.inventory && data.transactions) {
                state.items = data.items || DEFAULT_ITEMS;
                state.inventory = data.inventory;
                state.transactions = data.transactions;
                saveState();
                alert('Өгөгдлийг амжилттай сэргээлээ!');
                location.reload();
            } else {
                alert('Файлын формат буруу байна!');
                inputEl.value = '';
            }
        } catch (err) {
            alert('Файлыг уншихад алдаа гарлаа!');
            inputEl.value = '';
        }
    };
    reader.readAsText(file);
}


document.addEventListener('DOMContentLoaded', () => {

    if (sessionStorage.getItem('is_auth') !== 'true') {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('login-pw').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    } else {
        document.getElementById('login-overlay').style.display = 'none';
        initializePage();
    }
    lucide.createIcons();
});

function checkPassword() {
    const pw = document.getElementById('login-pw').value;
    if (pw === '1a1a1ahh') {
        sessionStorage.setItem('is_auth', 'true');
        document.getElementById('login-overlay').style.display = 'none';
        initializePage();
    } else {
        document.getElementById('login-error').style.display = 'block';
        document.getElementById('login-pw').value = '';
    }
}

function initializePage() {
    updateDate();
    setupNavigation();
    renderPage('dashboard');
}

function updateDate() {
    const now = new Date();
    document.getElementById('current-date').innerText = now.toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const page = link.getAttribute('data-page');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            renderPage(page);
        });
    });
}

function renderPage(page) {
    state.currentPage = page;
    const content = document.getElementById('page-content');
    const title = document.getElementById('page-title');

    content.innerHTML = '';
    content.className = 'animate-fade-in';

    switch (page) {
        case 'dashboard':
            title.innerText = 'Хяналтын самбар';
            renderDashboard(content);
            break;
        case 'daily-log':
            title.innerText = 'Өдөр тутмын бүртгэл';
            renderDailyLog(content);
            break;
        case 'inventory':
            title.innerText = 'Бараа материал';
            renderInventory(content);
            break;
        case 'transfer':
            title.innerText = 'Бараа зөөх';
            renderTransfer(content);
            break;
        case 'items':
            title.innerText = 'Барааны бүртгэл';
            renderItemsManagement(content);
            break;
        case 'history':
            title.innerText = 'Гүйлгээний түүх';
            renderHistory(content);
            break;
    }
    lucide.createIcons();
}



function renderDashboard(container) {
    let totalItems = 0;
    state.items.forEach(item => {
        LOCATIONS.forEach(loc => {
            totalItems += state.inventory[loc.id][item.id] || 0;
        });
    });

    const recentTx = state.transactions.slice(-5).reverse();

    container.innerHTML = `
        <div class="stats-grid">
                <div class="card">
                    <div class="card-title">Нийт бараа</div>
                    <div class="card-value">${totalItems}</div>
                </div>
                <div class="card">
                    <div class="card-title">Өнөөдрийн гүйлгээ</div>
                    <div class="card-value">${state.transactions.filter(t => t.date === new Date().toISOString().split('T')[0]).length}</div>
                </div>
                <div class="card">
                    <div class="card-title">Өнөөдрийн борлуулалт</div>
                    <div style="font-size: 0.9rem; margin-top: 8px;">
                        ${(() => {
            const today = new Date().toISOString().split('T')[0];
            const todaySales = state.transactions.filter(t => t.date === today && t.type === 'sale');
            return PAYMENT_METHODS.map(pm => {
                if (pm.id === 'director' || pm.id === 'gift') return '';
                const total = todaySales.filter(s => s.paymentMethod === pm.id).reduce((sum, s) => sum + (s.price * s.quantity), 0);
                if (total === 0) return '';
                return `<div style="display:flex; justify-content:space-between;"><span>${pm.name}:</span> <strong>${total.toLocaleString()}₮</strong></div>`;
            }).join('') || 'Борлуулалт байхгүй';
        })()}
                    </div>
                </div>

        </div>
        
        <h2 style="margin-bottom: 16px;">Сүүлийн гүйлгээнүүд</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Огноо</th>
                        <th>Бараа</th>
                        <th>Газар</th>
                        <th>Тоо</th>
                        <th>Төлөв</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentTx.map(tx => `
                        <tr>
                            <td>${tx.date}</td>
                            <td>${state.items.find(i => i.id === tx.itemId)?.name}</td>
                            <td>${LOCATIONS.find(l => l.id === tx.locationId)?.name}</td>
                            <td>${tx.quantity}</td>
                            <td style="color: ${tx.type === 'sale' ? 'var(--danger)' : 'var(--success)'}">
                                ${tx.type === 'sale' ? 'Борлуулалт' : 'Бараа нэмэлт'}
                            </td>
                        </tr>
                    `).join('')}
                    ${recentTx.length === 0 ? '<tr><td colspan="5" style="text-align: center;">Мэдээлэл байхгүй</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
}

function renderDailyLog(container) {
    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = `
        <div class="card animate-fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div class="form-group" style="margin-bottom: 0; width: 250px;">
                    <label>Гүйлгээний огноо</label>
                    <input type="date" id="bulk-date" class="form-control" value="${today}">
                </div>
                <div class="hotkey-hint" style="margin-bottom: 0; border: none; padding: 0;">
                    ${state.items.map((it, idx) => `
                        <div class="hotkey-badge"><b>${idx + 1}</b> ${it.name}</div>
                    `).join('')}
                </div>
            </div>

            <div class="table-container entry-table">
                <table id="bulk-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th style="width: 150px;">Байршил</th>
                            <th>Бараа (Товч: 1-7)</th>
                            <th style="width: 120px;">Төрөл</th>
                            <th style="width: 120px;">Төлбөр</th>
                            <th style="width: 120px;">Тоо / Багц</th>
                            <th style="width: 100px;">Үнэ</th>
                            <th style="width: 100px;">Нийт</th>
                            <th style="width: 40px;"></th>
                        </tr>
                    </thead>
                    <tbody id="bulk-tbody">
                        <!-- Rows will be added here -->
                    </tbody>
                    <tfoot>
                        <tr id="gift-row" style="border-top: 2px solid var(--border-color);">
                            <td colspan="2" style="padding-top: 10px; padding-bottom: 10px;">
                                <span style="display:flex; align-items:center; gap: 6px; color: var(--accent-color); font-weight: 600; white-space: nowrap;">
                                    <i data-lucide="gift" style="width:16px;"></i> Бэлэг
                                </span>
                            </td>
                            <td>
                                <select id="gift-location" class="entry-select">${LOCATIONS.map(l=>`<option value="${l.id}">${l.name}</option>`).join('')}</select>
                            </td>
                            <td colspan="2"></td>
                            <td>
                                <div style="display:flex; flex-direction:column; gap:4px; font-size:0.85rem;">
                                    <label style="display:flex; align-items:center; gap:4px;">Лаа: <input type="number" id="gift-qty-candle" class="entry-qty" style="width:52px;" value="0" min="0"></label>
                                    <label style="display:flex; align-items:center; gap:4px;">Хал.сав: <input type="number" id="gift-qty-thermos" class="entry-qty" style="width:52px;" value="0" min="0"></label>
                                    <label style="display:flex; align-items:center; gap:4px;">Ном: <input type="number" id="gift-qty-book" class="entry-qty" style="width:52px;" value="0" min="0"></label>
                                </div>
                            </td>
                            <td colspan="3"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="actions-row">
                <button id="add-row-btn" class="btn btn-secondary" style="width: auto;">
                    <i data-lucide="plus"></i> Мөр нэмэх
                </button>
                <button id="save-bulk-btn" class="btn" style="width: 200px;">
                    <i data-lucide="save"></i> Бүгдийг хадгалах
                </button>
            </div>
        </div>
    `;

    const tbody = document.getElementById('bulk-tbody');

    function createRow() {

        let lastLoc = "";
        if (tbody.children.length > 0) {
            lastLoc = tbody.lastElementChild.querySelector('.entry-loc').value;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="row-num">${tbody.children.length + 1}</td>
            <td>
                <select class="entry-loc entry-select">
                    ${LOCATIONS.map(loc => `<option value="${loc.id}" ${loc.id === lastLoc ? 'selected' : ''}>${loc.name}</option>`).join('')}
                </select>
            </td>
            <td>
                <div class="custom-dropdown-container">
                    <input type="text" class="entry-item-input" placeholder="Сонгоно уу..." readonly>
                    <input type="hidden" class="entry-item-val">
                    <div class="custom-dropdown-list">
                        ${state.items.map((it, idx) => `
                            <div class="dropdown-item" data-id="${it.id}" data-idx="${idx + 1}">
                                <span>${it.name}</span>
                                <span class="hotkey-num">${idx + 1}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </td>
            <td>
                <select class="entry-type entry-select" style="font-weight: 600;">
                    <option value="sale" style="color: var(--danger);">Борлуулалт (-)</option>
                    <option value="restock" style="color: var(--success);">Бараа нэмэх (+)</option>
                </select>
            </td>
            <td>
                <select class="entry-payment entry-select" style="margin-bottom: 4px;">
                    ${PAYMENT_METHODS.map(pm => `<option value="${pm.id}">${pm.name}</option>`).join('')}
                </select>
                <select class="entry-employee entry-select" style="display:none; padding:4px; font-size:0.8rem;">
                    <option value="Номио">Номио</option>
                    <option value="Мягаа">Мягаа</option>
                    <option value="Лхагва">Лхагва</option>
                </select>
            </td>
            <td>
                <div style="display:flex; flex-direction:column; gap:4px;">
                     <div style="display:flex; align-items:center; gap:4px;">
                         <span style="font-size:0.8rem; width:45px;">Ширхэг:</span>
                         <input type="number" class="entry-qty" value="1" min="0" style="width: 60px; padding:2px;">
                     </div>
                     <div class="pkg-row" style="display:none; align-items:center; gap:4px; color:var(--accent-color);">
                         <span class="pkg-label" style="font-size:0.8rem; font-weight:bold; width:45px;">Багц:</span>
                         <input type="number" class="entry-pkg-qty" value="0" min="0" style="width: 60px; padding:2px;">
                     </div>
                </div>
            </td>
            <td>
                <input type="text" class="entry-price" readonly value="0₮">
                <select class="entry-price-select form-control" style="display:none; padding: 4px; height: 32px;">
                    <option value="15000">15,000₮</option>
                    <option value="20000" selected>20,000₮</option>
                    <option value="25000">25,000₮</option>
                </select>
            </td>
            <td><input type="text" class="entry-total" readonly value="0₮"></td>
            <td><button class="remove-row" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i data-lucide="trash-2"></i></button></td>
        `;

        const itemInput = tr.querySelector('.entry-item-input');
        const itemHidden = tr.querySelector('.entry-item-val');
        const dropdownList = tr.querySelector('.custom-dropdown-list');
        const qtyInput = tr.querySelector('.entry-qty');
        const priceInput = tr.querySelector('.entry-price');
        const totalInput = tr.querySelector('.entry-total');
        const removeBtn = tr.querySelector('.remove-row');

        function updateRowCalculations() {
            const item = state.items.find(i => i.id === itemHidden.value);
            const paymentSelect = tr.querySelector('.entry-payment');
            const typeSelect = tr.querySelector('.entry-type');
            const priceSelect = tr.querySelector('.entry-price-select');

            const pkgRow = tr.querySelector('.pkg-row');
            const pkgLabel = tr.querySelector('.pkg-label');
            const pkgInput = tr.querySelector('.entry-pkg-qty');

            if (item) {
                if (item.id === 'yargui') {
                    pkgRow.style.display = 'flex';
                    pkgLabel.innerText = 'Багц(2ш):';
                } else if (item.id === 'meal-set' || item.id === 'tea-set') {
                    pkgRow.style.display = 'flex';
                    pkgLabel.innerText = 'Хос(2+2):';
                } else {
                    pkgRow.style.display = 'none';
                    pkgInput.value = 0;
                }

                const qty = parseInt(qtyInput.value) || 0;
                const pkgQty = parseInt(pkgInput.value) || 0;
                itemInput.value = item.name;

                let currentItemPrice = item.price;
                if (item.id === 'book') {
                    priceInput.style.display = 'none';
                    priceSelect.style.display = 'block';
                    currentItemPrice = parseInt(priceSelect.value) || 20000;
                } else {
                    priceInput.style.display = 'block';
                    priceSelect.style.display = 'none';
                    priceInput.value = item.price.toLocaleString() + '₮';
                }

                let baseTotal = 0;
                let isFree = typeSelect.value === 'sale' && (paymentSelect && (paymentSelect.value === 'director' || paymentSelect.value === 'gift'));

                if (isFree) {
                    baseTotal = 0;
                } else {
                    if (item.id === 'yargui') {
                        const pkgPrice = (item.price * 2) - (item.price * 0.2);
                        baseTotal = (currentItemPrice * qty) + (pkgPrice * pkgQty);
                    } else if (item.id === 'meal-set') {
                        const teaPrice = state.items.find(i => i.id === 'tea-set')?.price || 0;
                        const pkgPrice = (item.price * 2) + (teaPrice * 2) - (teaPrice * 0.5);
                        baseTotal = (currentItemPrice * qty) + (pkgPrice * pkgQty);
                    } else if (item.id === 'tea-set') {
                        const mealPrice = state.items.find(i => i.id === 'meal-set')?.price || 0;
                        const pkgPrice = (mealPrice * 2) + (item.price * 2) - (item.price * 0.5);
                        baseTotal = (currentItemPrice * qty) + (pkgPrice * pkgQty);
                    } else {
                        baseTotal = currentItemPrice * qty;
                    }
                }

                totalInput.value = baseTotal.toLocaleString() + '₮';
                tr.setAttribute('data-base-total', baseTotal.toString());
            } else {
                if (pkgRow) pkgRow.style.display = 'none';
                if (pkgInput) pkgInput.value = 0;

                priceInput.style.display = 'block';
                priceSelect.style.display = 'none';
                priceInput.value = '0₮';
                totalInput.value = '0₮';
                tr.setAttribute('data-base-total', '0');
            }
            if (window.updatePromotions) window.updatePromotions();
        }

        function openDropdown() {
            dropdownList.classList.add('show');
        }

        function closeDropdown() {
            dropdownList.classList.remove('show');
        }

        function selectItem(itemId) {
            itemHidden.value = itemId;
            updateRowCalculations();
            closeDropdown();
            qtyInput.focus();
            qtyInput.select();
        }

        itemInput.addEventListener('focus', openDropdown);


        itemInput.addEventListener('blur', () => {
            setTimeout(closeDropdown, 200);
        });

        qtyInput.addEventListener('input', updateRowCalculations);
        tr.querySelector('.entry-pkg-qty').addEventListener('input', updateRowCalculations);
        tr.querySelector('.entry-price-select').addEventListener('change', updateRowCalculations);


        tr.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                selectItem(item.getAttribute('data-id'));
            });
        });


        itemInput.addEventListener('keydown', (e) => {
            const key = e.key;
            if (key >= '1' && key <= state.items.length.toString()) {
                e.preventDefault();
                const index = parseInt(key) - 1;
                selectItem(state.items[index].id);
            } else if (key === 'ArrowDown' || key === 'ArrowUp') {
                e.preventDefault();
                openDropdown();
            }
        });

        qtyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                createRow();
                const lastRow = tbody.lastElementChild;
                lastRow.querySelector('.entry-item-input').focus();
            }
        });

        removeBtn.addEventListener('click', () => {
            tr.remove();
            updateRowNumbers();
            if (window.updatePromotions) window.updatePromotions();
        });

        const typeSelect = tr.querySelector('.entry-type');
        const paymentSelect = tr.querySelector('.entry-payment');

        typeSelect.addEventListener('change', () => {
            paymentSelect.disabled = typeSelect.value !== 'sale';
            if (paymentSelect.disabled) {
                paymentSelect.value = "";
                tr.querySelector('.entry-employee').style.display = 'none';
            } else {
                tr.querySelector('.entry-employee').style.display = paymentSelect.value === 'employee' ? 'block' : 'none';
            }
            updateRowCalculations();
        });

        paymentSelect.addEventListener('change', () => {
            tr.querySelector('.entry-employee').style.display = paymentSelect.value === 'employee' ? 'block' : 'none';
            updateRowCalculations();
        });

        tbody.appendChild(tr);
        lucide.createIcons();
        return tr;
    }

    function updateRowNumbers() {
        Array.from(tbody.children).forEach((tr, idx) => {
            tr.querySelector('.row-num').innerText = idx + 1;
        });
    }

    // Only refreshes row totals; gift section is independent
    window.updatePromotions = () => {
        Array.from(tbody.children).forEach(tr => {
            const baseTotal = parseInt(tr.getAttribute('data-base-total')) || 0;
            tr.querySelector('.entry-total').value = baseTotal.toLocaleString() + '₮';
            tr.setAttribute('data-final-total', baseTotal);
        });
    };

    document.getElementById('add-row-btn').addEventListener('click', createRow);

    document.getElementById('save-bulk-btn').addEventListener('click', () => {
        const date = document.getElementById('bulk-date').value;
        const txsToSave = [];
        let error = null;

        Array.from(tbody.children).forEach(tr => {
            const locationId = tr.querySelector('.entry-loc').value;
            const itemId = tr.querySelector('.entry-item-val').value;
            const type = tr.querySelector('.entry-type').value;
            const paymentMethod = tr.querySelector('.entry-payment').value;
            const employeeName = tr.querySelector('.entry-employee')?.value;
            const qty = parseInt(tr.querySelector('.entry-qty').value) || 0;
            const pkgQty = parseInt(tr.querySelector('.entry-pkg-qty')?.value) || 0;

            if (locationId && itemId && (qty > 0 || pkgQty > 0)) {
                const item = state.items.find(i => i.id === itemId);
                let isFree = type === 'sale' && (paymentMethod === 'director' || paymentMethod === 'gift');

                if (qty > 0) {
                    let price = isFree ? 0 : item.price;
                    if (!isFree && item.id === 'book') {
                        price = parseInt(tr.querySelector('.entry-price-select').value) || price;
                    }

                    if (type === 'sale') {
                        const currentStock = state.inventory[locationId][itemId] || 0;
                        if (currentStock < qty) {
                            error = `${LOCATIONS.find(l => l.id === locationId).name} дээрх ${item.name} хүрэлцэхгүй! (Үлд: ${currentStock})`;
                        }
                    }
                    txsToSave.push({
                        id: Date.now() + Math.random(),
                        date, locationId, itemId, type,
                        paymentMethod: type === 'sale' ? paymentMethod : null,
                        employeeName: (type === 'sale' && paymentMethod === 'employee') ? employeeName : null,
                        quantity: qty,
                        price: price
                    });
                }

                if (pkgQty > 0) {
                    if (itemId === 'yargui') {
                        const requiredQty = pkgQty * 2;
                        if (type === 'sale') {
                            const currentStock = state.inventory[locationId]['yargui'] || 0;
                            const alreadyPushed = (qty > 0) ? qty : 0;
                            if (currentStock < requiredQty + alreadyPushed) {
                                error = `Үлдэгдэл хүрэлцэхгүй (Яргуй)!`;
                            }
                        }
                        const pkgPrice = isFree ? 0 : Math.floor(((item.price * 2) - (item.price * 0.2)) / 2);
                        txsToSave.push({
                            id: Date.now() + Math.random(),
                            date, locationId, itemId: 'yargui', type,
                            paymentMethod: type === 'sale' ? paymentMethod : null,
                            employeeName: (type === 'sale' && paymentMethod === 'employee') ? employeeName : null,
                            quantity: requiredQty,
                            price: pkgPrice
                        });
                    } else if (itemId === 'meal-set' || itemId === 'tea-set') {
                        const requiredQty = pkgQty * 2;
                        const mealPriceFull = isFree ? 0 : state.items.find(i => i.id === 'meal-set').price;
                        const teaPriceFull = isFree ? 0 : state.items.find(i => i.id === 'tea-set').price;

                        if (type === 'sale') {
                            const mStock = state.inventory[locationId]['meal-set'] || 0;
                            const tStock = state.inventory[locationId]['tea-set'] || 0;
                            const mAlready = (itemId === 'meal-set' && qty > 0) ? qty : 0;
                            const tAlready = (itemId === 'tea-set' && qty > 0) ? qty : 0;
                            if (mStock < requiredQty + mAlready) error = `Үлдэгдэл хүрэлцэхгүй (Хоолны сэт)!`;
                            if (tStock < requiredQty + tAlready) error = `Үлдэгдэл хүрэлцэхгүй (Цайны сэт)!`;
                        }

                        txsToSave.push({
                            id: Date.now() + Math.random(),
                            date, locationId, itemId: 'meal-set', type,
                            paymentMethod: type === 'sale' ? paymentMethod : null,
                            employeeName: (type === 'sale' && paymentMethod === 'employee') ? employeeName : null,
                            quantity: requiredQty,
                            price: mealPriceFull
                        });
                        txsToSave.push({
                            id: Date.now() + Math.random(),
                            date, locationId, itemId: 'tea-set', type,
                            paymentMethod: type === 'sale' ? paymentMethod : null,
                            employeeName: (type === 'sale' && paymentMethod === 'employee') ? employeeName : null,
                            quantity: requiredQty,
                            price: isFree ? 0 : Math.floor(teaPriceFull * 0.75)
                        });
                    }
                }
            }
        });

        const giftCandle = parseInt(document.getElementById('gift-qty-candle')?.value) || 0;
        const giftThermos = parseInt(document.getElementById('gift-qty-thermos')?.value) || 0;
        const giftBook = parseInt(document.getElementById('gift-qty-book')?.value) || 0;
        // Gift location is chosen independently in the standalone gift section
        const giftLocationId = document.getElementById('gift-location')?.value || (txsToSave[0]?.locationId) || LOCATIONS[0].id;

        if (giftCandle + giftThermos + giftBook > 0) {
            const gifts = [];
            if (giftCandle > 0) gifts.push({ id: 'candle', qty: giftCandle });
            if (giftThermos > 0) gifts.push({ id: 'thermos', qty: giftThermos });
            if (giftBook > 0) gifts.push({ id: 'book', qty: giftBook });

            const locationId = giftLocationId;

            for (let g of gifts) {
                const currentStock = state.inventory[locationId][g.id] || 0;
                if (currentStock < g.qty) {
                    const locName = LOCATIONS.find(l => l.id === locationId).name;
                    error = `${locName} дээрх бэлэгний (${state.items.find(i => i.id === g.id).name}) үлдэгдэл хүрэлцэхгүй байна! (Үлдэгдэл: ${currentStock})`;
                    break;
                } else {
                    txsToSave.push({
                        id: Date.now() + txsToSave.length + Math.random(),
                        date,
                        locationId,
                        itemId: g.id,
                        type: 'sale',
                        paymentMethod: 'gift',
                        quantity: g.qty,
                        price: 0
                    });
                }
            }
        }

        if (error) {
            alert(error);
            return;
        }

        if (txsToSave.length > 0) {
            txsToSave.forEach(tx => {
                if (tx.type === 'sale') {
                    state.inventory[tx.locationId][tx.itemId] -= tx.quantity;
                } else {
                    state.inventory[tx.locationId][tx.itemId] += tx.quantity;
                }
                state.transactions.push(tx);
            });
            saveState();
            alert(`${txsToSave.length} гүйлгээ амжилттай хадгалагдлаа!`);
            renderPage('dashboard');
        } else {
            alert('Хадгалах мэдээлэл олдсонгүй.');
        }
    });


    const firstRow = createRow();
    firstRow.querySelector('.entry-item').focus();
}

function renderInventory(container) {
    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Барааны нэр</th>
                        ${LOCATIONS.map(loc => `<th>${loc.name}</th>`).join('')}
                        <th>Нийт</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.items.map(item => {
        let rowTotal = 0;
        const cells = LOCATIONS.map(loc => {
            const val = state.inventory[loc.id][item.id] || 0;
            rowTotal += val;
            return `<td style="color: ${val <= 0 ? 'var(--danger)' : 'var(--text-primary)'}">${val}</td>`;
        }).join('');
        return `
                            <tr>
                                <td><strong>${item.name}</strong></td>
                                ${cells}
                                <td><strong>${rowTotal}</strong></td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderTransfer(container) {
    const today = new Date().toISOString().split('T')[0];
    container.innerHTML = `
        <div class="form-container animate-fade-in">
            <h3 style="margin-bottom:20px;">Бараа зөөх</h3>
            <form id="transfer-form">
                <div class="form-group">
                    <label>Огноо</label>
                    <input type="date" id="tr-date" class="form-control" value="${today}" required>
                </div>
                <div class="form-group">
                    <label>Бараа</label>
                    <select id="tr-item" class="form-control" required>
                        <option value="">Сонгоно уу...</option>
                        ${state.items.map(it => `<option value="${it.id}">${it.name}</option>`).join('')}
                    </select>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                    <div class="form-group">
                        <label>Ханаас (Гарах)</label>
                        <select id="tr-from" class="form-control" required>
                            <option value="">Сонгоно уу...</option>
                            ${LOCATIONS.map(loc => `<option value="${loc.id}">${loc.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Хаашаа (Орох)</label>
                        <select id="tr-to" class="form-control" required>
                            <option value="">Сонгоно уу...</option>
                            ${LOCATIONS.map(loc => `<option value="${loc.id}">${loc.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Тоо ширхэг</label>
                    <input type="number" id="tr-qty" class="form-control" min="1" value="1" required>
                </div>
                <button type="submit" class="btn">Зөөвөрлөх</button>
            </form>
        </div>
    `;

    document.getElementById('transfer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('tr-date').value;
        const itemId = document.getElementById('tr-item').value;
        const fromId = document.getElementById('tr-from').value;
        const toId = document.getElementById('tr-to').value;
        const qty = parseInt(document.getElementById('tr-qty').value);

        if (fromId === toId) {
            alert('Ижил байршил хооронд зөөх боломжгүй.');
            return;
        }

        const currentStock = state.inventory[fromId][itemId] || 0;
        if (currentStock < qty) {
            alert(`Барааны үлдэгдэл хүрэлцэхгүй байна! (Үлдэгдэл: ${currentStock})`);
            return;
        }


        state.inventory[fromId][itemId] -= qty;
        state.inventory[toId][itemId] += qty;

        const item = state.items.find(i => i.id === itemId);
        state.transactions.push({
            id: Date.now(),
            date,
            locationId: fromId,
            toLocationId: toId,
            itemId,
            type: 'transfer',
            quantity: qty,
            price: item.price
        });

        saveState();
        alert('Бараа амжилттай зөөвөрлөгдлөө!');
        renderPage('dashboard');
    });
}

function renderHistory(container) {

    const groups = state.transactions.reduce((acc, tx) => {
        if (!acc[tx.date]) acc[tx.date] = [];
        acc[tx.date].push(tx);
        return acc;
    }, {});


    const sortedDates = Object.keys(groups).sort().reverse();

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h2 style="margin: 0;">Гүйлгээний түүх</h2>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" onclick="exportData()" style="width: auto;">
                    <i data-lucide="download"></i> Файл болгож авах (Backup)
                </button>
                <label class="btn btn-secondary" style="width: auto; cursor: pointer; margin: 0;">
                    <i data-lucide="upload"></i> Файлаас сэргээх
                    <input type="file" style="display: none;" onchange="importData(this)">
                </label>

            </div>
        </div>
        
        <div class="animate-fade-in">
            ${sortedDates.map(date => {
        const txs = groups[date];
        const daySales = txs.filter(t => t.type === 'sale' && t.paymentMethod !== 'director').reduce((sum, t) => sum + (t.price * t.quantity), 0);
        const dayRestock = txs.filter(t => t.type === 'restock').reduce((sum, t) => sum + (t.price * t.quantity), 0);

        return `
                    <div class="history-date-group">
                        <div class="history-date-header">
                            <div>
                                <h3><i data-lucide="calendar" style="width: 16px; margin-right: 8px;"></i> ${date}</h3>
                                <div class="daily-summaries" style="margin-top: 8px; font-size: 0.85rem;">
                                    ${PAYMENT_METHODS.map(pm => {
            if (pm.id === 'director' || pm.id === 'gift') return '';
            const pmTotal = txs.filter(t => t.type === 'sale' && t.paymentMethod === pm.id).reduce((sum, t) => sum + (t.price * t.quantity), 0);
            if (pmTotal === 0) return '';
            return `<span style="margin-right: 12px; color: var(--text-secondary);">${pm.name}: <strong>${pmTotal.toLocaleString()}₮</strong></span>`;
        }).join('')}
                                </div>
                            </div>
                            <div class="daily-summaries">
                                <div class="summary-inline" style="color: var(--danger);">
                                    <span>Нийт Борлуулалт:</span> <strong>${daySales.toLocaleString()}₮</strong>
                                </div>
                                <div class="summary-inline" style="color: var(--success);">
                                    <span>Нийт Нэмэлт:</span> <strong>${dayRestock.toLocaleString()}₮</strong>
                                </div>
                            </div>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 150px;">Бараа</th>
                                        <th>Ханаас</th>
                                        <th>Хаашаа</th>
                                        <th style="width: 80px;">Төлбөр</th>
                                        <th style="width: 80px;">Тоо</th>
                                        <th style="width: 120px;">Үнэ</th>
                                        <th style="width: 120px;">Нийт</th>
                                        <th style="width: 100px;">Төрөл</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${txs.slice().reverse().map(tx => {
            const item = state.items.find(i => i.id === tx.itemId);
            const locName = LOCATIONS.find(l => l.id === tx.locationId)?.name;

            let fromText = "-";
            let toText = "-";
            let typeText = "";
            let typeColor = "";

            if (tx.type === 'sale') {
                fromText = locName;
                toText = '<span style="color:var(--text-secondary)">Гадагшаа</span>';
                typeText = 'Борлуулалт';
                typeColor = 'var(--danger)';
            } else if (tx.type === 'restock') {
                fromText = '<span style="color:var(--text-secondary)">Гаднаас</span>';
                toText = locName;
                typeText = 'Бараа нэмэх';
                typeColor = 'var(--success)';
            } else if (tx.type === 'transfer') {
                const toLocName = LOCATIONS.find(l => l.id === tx.toLocationId)?.name;
                fromText = locName;
                toText = toLocName;
                typeText = 'Зөөлт';
                typeColor = 'var(--accent-color)';
            }

            const paymentName = tx.paymentMethod ? (tx.paymentMethod === 'employee' ? 'Ажилчин - ' + (tx.employeeName || '') : PAYMENT_METHODS.find(pm => pm.id === tx.paymentMethod)?.name) : '-';

            return `
                                            <tr>
                                                <td><strong>${item?.name}</strong></td>
                                                <td>${fromText}</td>
                                                <td>${toText}</td>
                                                <td>${paymentName}</td>
                                                <td>${tx.quantity}</td>
                                                <td>${(tx.paymentMethod === 'director' || tx.paymentMethod === 'gift') ? '0₮' : tx.price.toLocaleString() + '₮'}</td>
                                                <td>${(tx.paymentMethod === 'director' || tx.paymentMethod === 'gift') ? '0₮' : (tx.price * tx.quantity).toLocaleString() + '₮'}</td>
                                                <td style="color: ${typeColor}; font-weight: 500;">
                                                    <div style="display:flex; align-items:center; justify-content:space-between;">
                                                        <span>${typeText}</span>
                                                        <div style="display:flex; gap: 4px;">
                                                            <button class="btn-secondary" onclick="window.editTransaction(${tx.id})" style="border:none; padding: 4px; color: var(--text-primary); background:transparent; cursor:pointer;" title="Засах">
                                                                <i data-lucide="edit-2" style="width: 16px;"></i>
                                                            </button>
                                                            <button class="btn-secondary" onclick="window.deleteTransaction(${tx.id})" style="border:none; padding: 4px; color: var(--danger); background:transparent; cursor:pointer;" title="Устгах">
                                                                <i data-lucide="trash-2" style="width: 16px;"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
        }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
    }).join('')}
            ${state.transactions.length === 0 ? '<div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary);">Мэдээлэл байхгүй байна</div>' : ''}
        </div>
    `;
    lucide.createIcons();
}
function renderItemsManagement(container) {
    container.innerHTML = `
        <div class="card animate-fade-in" style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 16px;">Шинэ бараа нэмэх</h3>
            <form id="add-item-form" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 16px; align-items: end;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Барааны нэр</label>
                    <input type="text" id="new-item-name" class="form-control" placeholder="Жишээ: Аяга" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Нэгж үнэ (₮)</label>
                    <input type="number" id="new-item-price" class="form-control" placeholder="0" required>
                </div>
                <button type="submit" class="btn" style="height: 42px;">Нэмэх</button>
            </form>
        </div>

        <div class="table-container animate-fade-in">
            <table>
                <thead>
                    <tr>
                        <th>Барааны нэр</th>
                        <th>Нэгж үнэ</th>
                        <th style="width: 100px;">Үйлдэл</th>
                    </tr>
                </thead>
                <tbody id="items-list-tbody">
                    ${state.items.map(item => `
                        <tr>
                            <td><strong>${item.name}</strong></td>
                            <td>${item.price.toLocaleString()}₮</td>
                            <td>
                                <button class="delete-item btn-secondary" data-id="${item.id}" style="color: var(--danger); border-color: var(--danger); padding: 4px 8px;">
                                    <i data-lucide="trash-2" style="width: 16px;"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('add-item-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-item-name').value.trim();
        const price = parseInt(document.getElementById('new-item-price').value);

        if (name && price >= 0) {
            const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
            const newItem = { id, name, price };

            state.items.push(newItem);


            LOCATIONS.forEach(loc => {
                if (!state.inventory[loc.id]) state.inventory[loc.id] = {};
                state.inventory[loc.id][id] = 0;
            });

            saveState();
            renderItemsManagement(container);
            lucide.createIcons();
        }
    });

    container.querySelectorAll('.delete-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const item = state.items.find(i => i.id === id);


            let hasStock = false;
            LOCATIONS.forEach(loc => {
                if (state.inventory[loc.id][id] > 0) hasStock = true;
            });

            const hasTx = state.transactions.some(tx => tx.itemId === id);

            if (hasStock || hasTx) {
                if (!confirm(`АНХААРУУЛГА: "${item.name}" бараа гүйлгээнд орсон эсвэл үлдэгдэлтэй байна. Устгахдаа итгэлтэй байна уу?`)) {
                    return;
                }
            } else {
                if (!confirm(`"${item.name}" барааг устгах уу?`)) {
                    return;
                }
            }

            state.items = state.items.filter(i => i.id !== id);

            saveState();
            renderItemsManagement(container);
            lucide.createIcons();
        });
    });

    lucide.createIcons();
}

window.deleteTransaction = (id) => {
    if (!confirm('Энэ гүйлгээг устгах уу? Барааны үлдэгдэл буцаж өөрчлөгдөнө.')) return;
    const txIndex = state.transactions.findIndex(t => t.id === id);
    if (txIndex === -1) return;
    const tx = state.transactions[txIndex];

    if (tx.type === 'sale') {
        state.inventory[tx.locationId][tx.itemId] += tx.quantity;
    } else if (tx.type === 'restock') {
        state.inventory[tx.locationId][tx.itemId] -= tx.quantity;
    } else if (tx.type === 'transfer') {
        state.inventory[tx.locationId][tx.itemId] += tx.quantity;
        state.inventory[tx.toLocationId][tx.itemId] -= tx.quantity;
    }

    state.transactions.splice(txIndex, 1);
    saveState();
    renderPage('history');
};

window.editTransaction = (id) => {
    const txIndex = state.transactions.findIndex(t => t.id === id);
    if (txIndex === -1) return;
    const tx = state.transactions[txIndex];

    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="modal-content animate-fade-in" style="background:var(--bg-color); padding: 24px; border-radius: 8px; max-width: 400px; width:100%; box-shadow: 0 4px 12px rgba(0,0,0,0.5); margin: auto;">
            <h3 style="margin-top:0; margin-bottom:16px;">Гүйлгээ засварлах</h3>
            <div class="form-group">
                <label>Огноо</label>
                <input type="date" id="edit-tx-date" class="form-control" value="${tx.date}">
            </div>
            <div class="form-group">
                <label>Тоо ширхэг</label>
                <input type="number" id="edit-tx-qty" class="form-control" value="${tx.quantity}" min="1">
            </div>
            ${tx.type !== 'transfer' ? `
            <div class="form-group">
                <label>Нэгж үнэ</label>
                <input type="number" id="edit-tx-price" class="form-control" value="${tx.price}" min="0">
            </div>
            ` : ''}
            ${tx.type === 'sale' ? `
            <div class="form-group">
                <label>Төлбөр</label>
                <select id="edit-tx-payment" class="form-control" onchange="document.getElementById('edit-tx-employee').style.display = this.value === 'employee' ? 'block' : 'none'">
                    ${PAYMENT_METHODS.map(pm => `<option value="${pm.id}" ${tx.paymentMethod === pm.id ? 'selected' : ''}>${pm.name}</option>`).join('')}
                </select>
                <select id="edit-tx-employee" class="form-control" style="display:${tx.paymentMethod === 'employee' ? 'block' : 'none'}; margin-top:8px;">
                    ${['Номио', 'Мягаа', 'Лхагва'].map(emp => `<option value="${emp}" ${tx.employeeName === emp ? 'selected' : ''}>${emp}</option>`).join('')}
                </select>
            </div>
            ` : ''}
            <div style="display:flex; justify-content:flex-end; gap: 8px; margin-top:20px;">
                <button class="btn btn-secondary" onclick="document.getElementById('modal-container').classList.add('modal-hidden'); document.getElementById('modal-container').style.display='none';" style="width:auto;">Цуцлах</button>
                <button class="btn" onclick="saveEditedTx(${id})" style="width:auto;">Хадгалах</button>
            </div>
        </div>
    `;
    container.classList.remove('modal-hidden');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.background = 'rgba(0,0,0,0.5)';
    container.style.zIndex = '9999';
};

window.saveEditedTx = (id) => {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return;

    const newDate = document.getElementById('edit-tx-date').value;
    const newQty = parseInt(document.getElementById('edit-tx-qty').value);
    const newPriceEl = document.getElementById('edit-tx-price');
    const newPaymentEl = document.getElementById('edit-tx-payment');

    if (isNaN(newQty) || newQty <= 0) {
        alert('Буруу тоо байна!');
        return;
    }

    const qtyDiff = newQty - tx.quantity;
    if (qtyDiff > 0) {
        if (tx.type === 'sale' && state.inventory[tx.locationId][tx.itemId] < qtyDiff) {
            alert('Үлдэгдэл хүрэлцэхгүй!');
            return;
        } else if (tx.type === 'transfer' && state.inventory[tx.locationId][tx.itemId] < qtyDiff) {
            alert('Үлдэгдэл хүрэлцэхгүй!');
            return;
        }
    }

    if (tx.type === 'sale') {
        state.inventory[tx.locationId][tx.itemId] -= qtyDiff;
    } else if (tx.type === 'restock') {
        state.inventory[tx.locationId][tx.itemId] += qtyDiff;
    } else if (tx.type === 'transfer') {
        state.inventory[tx.locationId][tx.itemId] -= qtyDiff;
        state.inventory[tx.toLocationId][tx.itemId] += qtyDiff;
    }

    tx.date = newDate;
    tx.quantity = newQty;
    if (newPriceEl) tx.price = parseInt(newPriceEl.value) || 0;
    if (newPaymentEl) tx.paymentMethod = newPaymentEl.value;

    saveState();
    const container = document.getElementById('modal-container');
    container.classList.add('modal-hidden');
    container.style.display = 'none';
    renderPage('history');
};
