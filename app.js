const LOCATIONS = [
    { id: 'shop', name: 'Дэлгүүр' },
    { id: 'warehouse', name: 'Агуулах' }
];

const PAYMENT_METHODS = [
    { id: 'pos', name: 'POS' },
    { id: 'bank', name: 'Дансаар' },
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


if (Object.keys(state.inventory).length === 0) {
    LOCATIONS.forEach(loc => {
        if (!state.inventory[loc.id]) state.inventory[loc.id] = {};
        state.items.forEach(item => {
            if (state.inventory[loc.id][item.id] === undefined) {
                state.inventory[loc.id][item.id] = 0;
            }
        });
    });
    saveState();
}

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
                            <th style="width: 80px;">Тоо</th>
                            <th style="width: 100px;">Үнэ</th>
                            <th style="width: 100px;">Нийт</th>
                            <th style="width: 40px;"></th>
                        </tr>
                    </thead>
                    <tbody id="bulk-tbody">
                        <!-- Rows will be added here -->
                    </tbody>
                </table>
            </div>

            <div id="promotions-container" class="animate-fade-in" style="display:none; background: var(--bg-hover); padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border-color);">
                <h4 style="margin-top: 0; margin-bottom: 12px; color: var(--accent-color); display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="gift" style="width: 20px;"></i> Урамшуулал
                </h4>
                <div id="promo-messages" style="margin-bottom: 12px; font-size: 0.95rem; font-weight: 500; color: var(--success); line-height: 1.5;"></div>
                <div id="gift-selection" style="display:none; flex-direction: column; gap: 8px; margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                    <span style="font-weight:600; color:var(--accent-color)" id="promo-gift-title">Сонгох боломжтой бэлэг: 0 ширхэг</span>
                    <div style="display:flex; align-items:center; gap: 16px;">
                        <label style="display:flex; align-items:center; gap: 8px; font-weight: 500;">
                            Лаа: <input type="number" id="gift-qty-candle" class="form-control" style="width:70px; margin:0; padding: 4px;" value="0" min="0">
                        </label>
                        <label style="display:flex; align-items:center; gap: 8px; font-weight: 500;">
                            Халуун сав: <input type="number" id="gift-qty-thermos" class="form-control" style="width:70px; margin:0; padding: 4px;" value="0" min="0">
                        </label>
                    </div>
                </div>
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
                <select class="entry-payment entry-select">
                    ${PAYMENT_METHODS.map(pm => `<option value="${pm.id}">${pm.name}</option>`).join('')}
                </select>
            </td>
            <td><input type="number" class="entry-qty" value="1" min="1"></td>
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
            if (item) {
                const qty = parseInt(qtyInput.value) || 0;
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

                if (typeSelect.value === 'sale' && (paymentSelect && (paymentSelect.value === 'director' || paymentSelect.value === 'gift'))) {
                    totalInput.value = '0₮';
                    tr.setAttribute('data-base-total', '0');
                    tr.setAttribute('data-eff-price', '0');
                } else {
                    totalInput.value = (currentItemPrice * qty).toLocaleString() + '₮';
                    tr.setAttribute('data-base-total', (currentItemPrice * qty).toString());
                    tr.setAttribute('data-eff-price', currentItemPrice.toString());
                }
            } else {
                priceInput.style.display = 'block';
                priceSelect.style.display = 'none';
                priceInput.value = '0₮';
                totalInput.value = '0₮';
                tr.setAttribute('data-base-total', '0');
                tr.setAttribute('data-eff-price', '0');
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
            if (paymentSelect.disabled) paymentSelect.value = "";
            updateRowCalculations();
        });

        paymentSelect.addEventListener('change', updateRowCalculations);

        tbody.appendChild(tr);
        lucide.createIcons();
        return tr;
    }

    function updateRowNumbers() {
        Array.from(tbody.children).forEach((tr, idx) => {
            tr.querySelector('.row-num').innerText = idx + 1;
        });
    }

    window.updatePromotions = () => {
        let yarguiQty = 0;
        let mealSetQty = 0;
        let teaSetQty = 0;
        const saleRows = [];
        
        Array.from(tbody.children).forEach(tr => {
            const itemId = tr.querySelector('.entry-item-val').value;
            const type = tr.querySelector('.entry-type').value;
            const pm = tr.querySelector('.entry-payment').value;
            const qty = parseInt(tr.querySelector('.entry-qty').value) || 0;
            if (type === 'sale' && pm !== 'director' && pm !== 'gift' && itemId) {
                saleRows.push(tr);
                if (itemId === 'yargui') yarguiQty += qty;
                if (itemId === 'meal-set') mealSetQty += qty;
                if (itemId === 'tea-set') teaSetQty += qty;
            }
        });

        const messages = [];
        
        Array.from(tbody.children).forEach(tr => {
            const base = parseInt(tr.getAttribute('data-base-total')) || 0;
            const effPrice = parseInt(tr.getAttribute('data-eff-price')) || 0;
            tr.querySelector('.entry-total').value = base.toLocaleString() + '₮';
            tr.setAttribute('data-final-total', base);
            tr.setAttribute('data-final-price', effPrice);
        });

        if (yarguiQty >= 2) {
            const discountedCount = Math.floor(yarguiQty / 2);
            const yarguiItem = state.items.find(i => i.id === 'yargui');
            if (yarguiItem) {
                const discountValue = discountedCount * (yarguiItem.price * 0.2);
                messages.push(`- Яргуй 20% хямдрал: -${discountValue.toLocaleString()}₮`);
                
                let remainingDiscount = discountValue;
                for (let tr of saleRows) {
                    if (tr.querySelector('.entry-item-val').value === 'yargui' && remainingDiscount > 0) {
                        let base = parseInt(tr.getAttribute('data-final-total')) || 0;
                        if (base >= remainingDiscount) {
                            base -= remainingDiscount;
                            remainingDiscount = 0;
                        } else {
                            remainingDiscount -= base;
                            base = 0;
                        }
                        tr.querySelector('.entry-total').value = base.toLocaleString() + '₮';
                        tr.setAttribute('data-final-total', base);
                        const qty = parseInt(tr.querySelector('.entry-qty').value) || 1;
                        tr.setAttribute('data-final-price', Math.floor(base / qty));
                    }
                }
            }
        }

        if (mealSetQty >= 2 && teaSetQty >= 2) {
            const discountedCount = Math.min(Math.floor(mealSetQty / 2), Math.floor(teaSetQty / 2));
            const teaSetItem = state.items.find(i => i.id === 'tea-set');
            if (teaSetItem && discountedCount > 0) {
                const discountValue = discountedCount * (teaSetItem.price * 0.5);
                messages.push(`- ${discountedCount} Цайны сэт 50% хямдрал: -${discountValue.toLocaleString()}₮`);
                
                let remainingDiscount = discountValue;
                for (let tr of saleRows) {
                    if (tr.querySelector('.entry-item-val').value === 'tea-set' && remainingDiscount > 0) {
                        let base = parseInt(tr.getAttribute('data-final-total')) || 0;
                        if (base >= remainingDiscount) {
                            base -= remainingDiscount;
                            remainingDiscount = 0;
                        } else {
                            remainingDiscount -= base;
                            base = 0;
                        }
                        tr.querySelector('.entry-total').value = base.toLocaleString() + '₮';
                        tr.setAttribute('data-final-total', base);
                        const qty = parseInt(tr.querySelector('.entry-qty').value) || 1;
                        tr.setAttribute('data-final-price', Math.floor(base / qty));
                    }
                }
            }
        }

        const promoBox = document.getElementById('promotions-container');
        const promoMsg = document.getElementById('promo-messages');
        const giftSection = document.getElementById('gift-selection');
        const giftTitle = document.getElementById('promo-gift-title');
        const giftCandle = document.getElementById('gift-qty-candle');
        const giftThermos = document.getElementById('gift-qty-thermos');

        const totalGiftEligible = yarguiQty + mealSetQty + teaSetQty;
        const maxGifts = totalGiftEligible;
        
        promoMsg.innerHTML = messages.length > 0 ? messages.join('<br>') : '';
        let hasPromo = messages.length > 0 || maxGifts > 0;
        promoBox.style.display = hasPromo ? 'block' : 'none';

        if (maxGifts > 0) {
            giftSection.style.display = 'flex';
            giftTitle.innerText = `Сонгох боломжтой бэлэг: ${maxGifts} ширхэг`;
            
            const currentTotal = (parseInt(giftCandle.value) || 0) + (parseInt(giftThermos.value) || 0);
            if (currentTotal > maxGifts) {
                giftCandle.value = 0;
                giftThermos.value = 0;
            }
            
            [giftCandle, giftThermos].forEach(input => {
                input.max = maxGifts;
                input.oninput = () => {
                   let c = parseInt(giftCandle.value) || 0;
                   let t = parseInt(giftThermos.value) || 0;
                   if (c + t > maxGifts) {
                       input.value = input === giftCandle ? Math.max(0, maxGifts - t) : Math.max(0, maxGifts - c);
                   }
                };
            });
        } else {
            giftSection.style.display = 'none';
            if (giftCandle) giftCandle.value = 0;
            if (giftThermos) giftThermos.value = 0;
        }
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
                    const qty = parseInt(tr.querySelector('.entry-qty').value);

                    if (locationId && itemId && qty > 0) {
                        const item = state.items.find(i => i.id === itemId);
                        let finalPrice = parseInt(tr.getAttribute('data-final-price'));
                        if (isNaN(finalPrice)) finalPrice = item.price;

                        if (type === 'sale') {
                            const currentStock = state.inventory[locationId][itemId] || 0;
                            if (currentStock < qty) {
                                const locName = LOCATIONS.find(l => l.id === locationId).name;
                                error = `${locName} дээрх ${item.name} барааны үлдэгдэл хүрэлцэхгүй байна! (Үлдэгдэл: ${currentStock})`;
                            }
                        }

                        txsToSave.push({
                            id: Date.now() + txsToSave.length,
                            date,
                            locationId,
                            itemId,
                            type,
                            paymentMethod: type === 'sale' ? paymentMethod : null,
                            quantity: qty,
                            price: finalPrice
                        });
                    }
        });

        const giftCandle = parseInt(document.getElementById('gift-qty-candle').value) || 0;
        const giftThermos = parseInt(document.getElementById('gift-qty-thermos').value) || 0;
        
        if ((giftCandle + giftThermos) > 0 && txsToSave.length > 0) {
            const gifts = [];
            if (giftCandle > 0) gifts.push({id: 'candle', qty: giftCandle});
            if (giftThermos > 0) gifts.push({id: 'thermos', qty: giftThermos});
            
            const locationId = txsToSave[0].locationId;
            
            for (let g of gifts) {
                const currentStock = state.inventory[locationId][g.id] || 0;
                if (currentStock < g.qty) {
                    const locName = LOCATIONS.find(l => l.id === locationId).name;
                    error = `${locName} дээрх бэлэгний (${state.items.find(i=>i.id===g.id).name}) үлдэгдэл хүрэлцэхгүй байна! (Үлдэгдэл: ${currentStock})`;
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
                                        
                                        const paymentName = tx.paymentMethod ? PAYMENT_METHODS.find(pm => pm.id === tx.paymentMethod)?.name : '-';
                                        
                                        return `
                                            <tr>
                                                <td><strong>${item?.name}</strong></td>
                                                <td>${fromText}</td>
                                                <td>${toText}</td>
                                                <td>${paymentName}</td>
                                                <td>${tx.quantity}</td>
                                                <td>${(tx.paymentMethod === 'director' || tx.paymentMethod === 'gift') ? '0₮' : tx.price.toLocaleString() + '₮'}</td>
                                                <td>${(tx.paymentMethod === 'director' || tx.paymentMethod === 'gift') ? '0₮' : (tx.price * tx.quantity).toLocaleString() + '₮'}</td>
                                                <td style="color: ${typeColor}; font-weight: 500;">${typeText}</td>
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
