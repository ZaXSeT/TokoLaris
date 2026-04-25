// Initialize Lucide Icons
lucide.createIcons();

// --- State Management ---
const defaultProducts = [
    { id: 1, name: 'Beras Premium 5kg', price: 65000, stock: 50 },
    { id: 2, name: 'Minyak Goreng 2L', price: 34000, stock: 30 },
    { id: 3, name: 'Gula Pasir 1kg', price: 15000, stock: 45 },
    { id: 4, name: 'Telor Ayam 1kg', price: 28000, stock: 20 },
    { id: 5, name: 'Indomie Goreng (Dus)', price: 110000, stock: 15 },
    { id: 6, name: 'Susu Kental Manis', price: 12500, stock: 60 }
];

const defaultUsers = [
    { id: 1, username: 'pemilik', password: '123', role: 'pemilik' },
    { id: 2, username: 'kasir', password: '123', role: 'kasir' }
];

const AppState = {
    user: null,
    products: JSON.parse(localStorage.getItem('toko_laris_products')) || defaultProducts,
    cart: [],
    transactions: JSON.parse(localStorage.getItem('toko_laris_transactions')) || [],
    users: JSON.parse(localStorage.getItem('toko_laris_users')) || defaultUsers
};

const saveState = () => {
    localStorage.setItem('toko_laris_products', JSON.stringify(AppState.products));
    localStorage.setItem('toko_laris_transactions', JSON.stringify(AppState.transactions));
    localStorage.setItem('toko_laris_users', JSON.stringify(AppState.users));
};

// Formatting Helper
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

// DOM Elements
const views = {
    login: document.getElementById('login-view'),
    kasir: document.getElementById('kasir-view'),
    pemilik: document.getElementById('pemilik-view')
};

// --- App Initialization ---
const app = {
    init() {
        this.bindEvents();
        // Check for existing session (optional, for now start at login)
    },

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => app.handleLogin(e));
        document.getElementById('search-product').addEventListener('input', (e) => app.renderProducts(e.target.value));
        
        // Clear login errors on typing
        document.getElementById('username').addEventListener('input', function() {
            this.classList.remove('is-invalid');
            document.getElementById('login-error').style.display = 'none';
        });
        document.getElementById('password').addEventListener('input', function() {
            this.classList.remove('is-invalid');
            document.getElementById('login-error').style.display = 'none';
        });

        // Handle cash input visibility based on payment method
        document.getElementById('payment-type').addEventListener('change', (e) => {
            const cashGroup = document.getElementById('cash-input-group');
            if(e.target.value === 'cash') {
                cashGroup.style.display = 'block';
            } else {
                cashGroup.style.display = 'none';
            }
        });
    },

    // --- Authentication ---
    handleLogin(e) {
        e.preventDefault();
        const userEl = document.getElementById('username');
        const passEl = document.getElementById('password');
        const user = userEl.value;
        const pass = passEl.value;
        const errorEl = document.getElementById('login-error');

        // Reset borders
        userEl.classList.remove('is-invalid');
        passEl.classList.remove('is-invalid');

        if (!user || !pass) {
            if (!user) userEl.classList.add('is-invalid');
            if (!pass) passEl.classList.add('is-invalid');
            errorEl.innerText = 'Mohon isi Username dan Password Anda!';
            errorEl.style.display = 'block';
            return;
        }

        const foundUser = AppState.users.find(u => u.username === user && u.password === pass);

        if (foundUser) {
            errorEl.style.display = 'none';
            AppState.user = { role: foundUser.role, name: foundUser.username };
            
            if (foundUser.role === 'kasir') {
                this.switchView('kasir');
                this.renderProducts();
                this.showToast(`Berhasil login sebagai ${foundUser.username}`, 'success');
            } else {
                this.switchView('pemilik');
                this.updateDashboard();
                this.renderBarang();
                this.renderReport();
                this.renderAkun();
                this.showToast('Berhasil login sebagai Pemilik', 'success');
            }
        } else {
            errorEl.innerText = 'Username atau Password Salah!';
            errorEl.style.display = 'block';
            this.showToast('Password Salah', 'error');
        }
    },

    logout() {
        AppState.user = null;
        this.switchView('login');
        document.getElementById('login-form').reset();
        this.clearCart();
        this.showToast('Berhasil logout', 'success');
    },

    // --- View Navigation ---
    switchView(viewName) {
        Object.values(views).forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        views[viewName].classList.remove('hidden');
        views[viewName].classList.add('active');
        lucide.createIcons();
    },

    switchTab(tabId) {
        document.querySelectorAll('#pemilik-view .tab-content').forEach(tab => {
            tab.classList.remove('active');
            tab.classList.add('hidden');
        });
        document.querySelectorAll('#pemilik-view .nav-menu li').forEach(li => li.classList.remove('active'));
        
        const target = document.getElementById(tabId);
        target.classList.remove('hidden');
        target.classList.add('active');
        
        document.querySelector(`#pemilik-view [data-target="${tabId}"]`).classList.add('active');

        // Re-render specifics based on tab
        if(tabId === 'dashboard-tab') this.updateDashboard();
        if(tabId === 'barang-tab') this.renderBarang();
        if(tabId === 'laporan-tab') this.renderReport();
    },

    switchKasirTab(tabId) {
        document.querySelectorAll('#kasir-view .tab-content').forEach(tab => {
            tab.classList.remove('active');
            tab.classList.add('hidden');
        });
        document.querySelectorAll('#kasir-view .nav-menu li').forEach(li => li.classList.remove('active'));
        
        const target = document.getElementById(tabId);
        target.classList.remove('hidden');
        target.classList.add('active');
        
        document.querySelector(`#kasir-view [data-target="${tabId}"]`).classList.add('active');
        
        if(tabId === 'kasir-barang-tab') this.renderBarang();
    },

    // --- KASIR MODULE ---
    renderProducts(searchQuery = '') {
        const grid = document.getElementById('product-grid');
        grid.innerHTML = '';

        const filtered = AppState.products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">Barang tidak ditemukan.</p>';
            return;
        }

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.onclick = () => this.addToCart(p.id);
            card.innerHTML = `
                <div class="product-icon"><i data-lucide="package"></i></div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p class="product-price">${formatRupiah(p.price)}</p>
                    <p class="product-stock">Stok: ${p.stock}</p>
                </div>
            `;
            grid.appendChild(card);
        });
        lucide.createIcons();
    },

    addToCart(productId) {
        const product = AppState.products.find(p => p.id === productId);
        if (!product) {
            this.showToast('Barang Tidak Ditemukan', 'error');
            return;
        }

        const cartItem = AppState.cart.find(item => item.id === productId);
        
        if (cartItem) {
            if (cartItem.qty < product.stock) {
                cartItem.qty++;
            } else {
                this.showToast('Stok Tidak Cukup', 'error');
                return;
            }
        } else {
            if (product.stock > 0) {
                AppState.cart.push({ ...product, qty: 1 });
            } else {
                this.showToast('Stok Tidak Cukup', 'error');
                return;
            }
        }
        
        this.renderCart();
    },

    updateCartQty(productId, delta) {
        const item = AppState.cart.find(i => i.id === productId);
        if (!item) return;

        const product = AppState.products.find(p => p.id === productId);

        item.qty += delta;

        if (item.qty <= 0) {
            AppState.cart = AppState.cart.filter(i => i.id !== productId);
        } else if (item.qty > product.stock) {
            item.qty = product.stock;
            this.showToast('Stok Tidak Cukup', 'error');
        }

        this.renderCart();
    },

    renderCart() {
        const container = document.getElementById('cart-items');
        container.innerHTML = '';

        if (AppState.cart.length === 0) {
            container.innerHTML = '<div class="empty-cart">Keranjang kosong</div>';
            document.getElementById('cart-total-item').innerText = '0';
            document.getElementById('cart-total-price').innerText = 'Rp 0';
            return;
        }

        let totalQty = 0;
        let totalPrice = 0;

        AppState.cart.forEach(item => {
            totalQty += item.qty;
            totalPrice += item.price * item.qty;

            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${formatRupiah(item.price)}</p>
                </div>
                <div class="cart-controls">
                    <button class="qty-btn" onclick="app.updateCartQty(${item.id}, -1)"><i data-lucide="minus" style="width:14px;height:14px"></i></button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="app.updateCartQty(${item.id}, 1)"><i data-lucide="plus" style="width:14px;height:14px"></i></button>
                </div>
            `;
            container.appendChild(el);
        });

        document.getElementById('cart-total-item').innerText = totalQty;
        document.getElementById('cart-total-price').innerText = formatRupiah(totalPrice);
        lucide.createIcons();
    },

    clearCart() {
        AppState.cart = [];
        document.getElementById('cash-amount').value = '';
        this.renderCart();
    },

    processCheckout() {
        if (AppState.cart.length === 0) {
            this.showToast('Keranjang masih kosong', 'error');
            return;
        }

        const totalPrice = AppState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const paymentType = document.getElementById('payment-type').value;
        const cashInput = document.getElementById('cash-amount').value;
        let bayar = totalPrice;
        let kembali = 0;

        if (paymentType === 'cash') {
            bayar = parseInt(cashInput) || 0;
            if (bayar < totalPrice) {
                this.showToast('Uang tunai tidak cukup', 'error');
                return;
            }
            kembali = bayar - totalPrice;
        }

        // Generate Transaction Record
        const transaction = {
            id: 'TRX-' + Math.floor(Math.random() * 1000000),
            date: new Date().toISOString(),
            items: [...AppState.cart],
            totalPrice,
            paymentType,
            bayar,
            kembali
        };

        if (paymentType === 'qris') {
            this.showToast('Memverifikasi pembayaran ke Bank...', 'success');
            setTimeout(() => {
                this._finalizeCheckout(transaction);
            }, 1500);
        } else {
            this._finalizeCheckout(transaction);
        }
    },

    _finalizeCheckout(transaction) {
        AppState.transactions.push(transaction);

        // Deduct Stock
        AppState.cart.forEach(cartItem => {
            const product = AppState.products.find(p => p.id === cartItem.id);
            if(product) product.stock -= cartItem.qty;
        });

        // Save State
        saveState();

        // Re-render
        this.renderProducts();
        
        // Show Receipt Modal
        this.showReceipt(transaction);
        this.showToast('Transaksi berhasil disimpan', 'success');
    },

    showReceipt(trx) {
        document.getElementById('struk-id').innerText = trx.id;
        document.getElementById('struk-time').innerText = new Date(trx.date).toLocaleString('id-ID');
        
        const itemsContainer = document.getElementById('struk-items');
        itemsContainer.innerHTML = '';
        trx.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'receipt-item';
            row.innerHTML = `
                <span>${item.name} (${item.qty}x)</span>
                <span>${formatRupiah(item.price * item.qty)}</span>
            `;
            itemsContainer.appendChild(row);
        });

        document.getElementById('struk-total').innerText = formatRupiah(trx.totalPrice);
        document.getElementById('struk-method').innerText = trx.paymentType.toUpperCase();
        document.getElementById('struk-bayar').innerText = formatRupiah(trx.bayar);
        document.getElementById('struk-kembali').innerText = formatRupiah(trx.kembali);

        this.openModal('modal-struk');
    },

    // --- PEMILIK MODULE ---
    updateDashboard() {
        const totalRevenue = AppState.transactions.reduce((sum, trx) => sum + trx.totalPrice, 0);
        document.getElementById('stat-revenue').innerText = formatRupiah(totalRevenue);
        document.getElementById('stat-transactions').innerText = AppState.transactions.length;
        document.getElementById('stat-items').innerText = AppState.products.length;
    },

    // --- Manajemen Barang ---
    renderBarang() {
        const tbodyPemilik = document.getElementById('table-barang-body');
        const tbodyKasir = document.getElementById('table-barang-kasir-body');
        
        if (tbodyPemilik) tbodyPemilik.innerHTML = '';
        if (tbodyKasir) tbodyKasir.innerHTML = '';
        
        AppState.products.forEach(p => {
            // Render for Pemilik
            if (tbodyPemilik) {
                const trPemilik = document.createElement('tr');
                trPemilik.innerHTML = `
                    <td>#${p.id}</td>
                    <td>${p.name}</td>
                    <td>${formatRupiah(p.price)}</td>
                    <td>${p.stock}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon edit" onclick="app.editBarang(${p.id})"><i data-lucide="edit-2" style="width:16px;height:16px"></i></button>
                            <button class="btn-icon delete" onclick="app.deleteBarang(${p.id})"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
                        </div>
                    </td>
                `;
                tbodyPemilik.appendChild(trPemilik);
            }

            // Render for Kasir (Read-only)
            if (tbodyKasir) {
                const trKasir = document.createElement('tr');
                trKasir.innerHTML = `
                    <td>#${p.id}</td>
                    <td>${p.name}</td>
                    <td>${formatRupiah(p.price)}</td>
                    <td>${p.stock}</td>
                `;
                tbodyKasir.appendChild(trKasir);
            }
        });
        lucide.createIcons();
    },

    // --- Manajemen Akun ---
    renderAkun() {
        const tbody = document.getElementById('table-akun-body');
        tbody.innerHTML = '';
        AppState.users.forEach(u => {
            const tr = document.createElement('tr');
            const action = u.role === 'kasir' 
                ? `<button class="btn-icon delete" onclick="app.deleteAkun('${u.username}')" title="Hapus"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>` 
                : `<span class="text-muted" style="font-size: 0.85rem">Akun Utama</span>`;
            
            tr.innerHTML = `
                <td>${u.username}</td>
                <td><span style="font-family: monospace;">${u.password}</span></td>
                <td><span class="user-badge" style="display:inline-flex; width:max-content; background: ${u.role==='pemilik'?'#eff6ff':'#f3f4f6'}; padding: 0.25rem 0.5rem; border-radius: 1rem; color: ${u.role==='pemilik'?'var(--primary)':'var(--text-main)'}; font-size: 0.75rem;">${u.role.toUpperCase()}</span></td>
                <td>${action}</td>
            `;
            tbody.appendChild(tr);
        });
        lucide.createIcons();
    },

    saveAkun(e) {
        e.preventDefault();
        const username = document.getElementById('akun-username').value.trim();
        const password = document.getElementById('akun-password').value.trim();
        
        if (AppState.users.find(u => u.username === username)) {
            this.showToast('User ID sudah digunakan!', 'error');
            return;
        }

        AppState.users.push({
            id: Date.now(),
            username,
            password,
            role: 'kasir'
        });

        saveState();
        this.closeModal('modal-akun');
        this.renderAkun();
        
        // Reset form
        document.getElementById('akun-username').value = '';
        document.getElementById('akun-password').value = '';
        this.showToast('Karyawan Baru Berhasil Ditambahkan', 'success');
    },

    deleteAkun(username) {
        if(confirm(`Apakah Anda yakin ingin menghapus akses untuk kasir '${username}'?`)) {
            AppState.users = AppState.users.filter(u => u.username !== username);
            saveState();
            this.renderAkun();
            this.showToast('Akun kasir berhasil dihapus', 'success');
        }
    },

    saveBarang(e) {
        e.preventDefault();
        const id = document.getElementById('barang-id').value;
        const nama = document.getElementById('barang-nama').value;
        const harga = parseInt(document.getElementById('barang-harga').value);
        const stok = parseInt(document.getElementById('barang-stok').value);

        if (id) { // Edit
            const index = AppState.products.findIndex(p => p.id == id);
            if(index !== -1) {
                AppState.products[index] = { ...AppState.products[index], name: nama, price: harga, stock: stok };
                this.showToast('Barang berhasil diupdate', 'success');
            }
        } else { // Add
            const newId = AppState.products.length > 0 ? Math.max(...AppState.products.map(p => p.id)) + 1 : 1;
            AppState.products.push({ id: newId, name: nama, price: harga, stock: stok });
            this.showToast('Barang berhasil ditambahkan', 'success');
        }

        saveState();
        this.closeModal('modal-barang');
        this.renderBarang();
        this.updateDashboard();
    },

    editBarang(id) {
        const product = AppState.products.find(p => p.id === id);
        if(!product) return;

        document.getElementById('modal-barang-title').innerText = 'Edit Barang';
        document.getElementById('barang-id').value = product.id;
        document.getElementById('barang-nama').value = product.name;
        document.getElementById('barang-harga').value = product.price;
        document.getElementById('barang-stok').value = product.stock;
        
        this.openModal('modal-barang');
    },

    deleteBarang(id) {
        if(confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
            AppState.products = AppState.products.filter(p => p.id !== id);
            saveState();
            this.renderBarang();
            this.updateDashboard();
            this.showToast('Barang berhasil dihapus', 'success');
        }
    },

    renderReport() {
        const tbody = document.getElementById('table-laporan-body');
        tbody.innerHTML = '';
        
        const filter = document.getElementById('report-filter').value;
        const now = new Date();
        let data = AppState.transactions.filter(trx => {
            if (filter === 'all') return true;
            const trxDate = new Date(trx.date);
            if (filter === 'harian') {
                return trxDate.toDateString() === now.toDateString();
            } else if (filter === 'bulanan') {
                return trxDate.getMonth() === now.getMonth() && trxDate.getFullYear() === now.getFullYear();
            } else if (filter === 'tahunan') {
                return trxDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
        
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">Belum ada transaksi</td></tr>';
            return;
        }

        data.reverse().forEach(trx => {
            const tr = document.createElement('tr');
            const totalItems = trx.items.reduce((sum, i) => sum + i.qty, 0);
            tr.innerHTML = `
                <td>${trx.id}</td>
                <td>${new Date(trx.date).toLocaleString('id-ID')}</td>
                <td>${totalItems}</td>
                <td>${formatRupiah(trx.totalPrice)}</td>
                <td>${trx.paymentType.toUpperCase()}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // --- UI Helpers ---
    openModal(id) {
        if(id === 'modal-barang' && !document.getElementById('barang-id').value) {
            document.getElementById('modal-barang-title').innerText = 'Tambah Barang';
            document.getElementById('form-barang').reset();
        }
        document.getElementById(id).classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
        if(id === 'modal-barang') {
            document.getElementById('form-barang').reset();
            document.getElementById('barang-id').value = '';
        }
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 'alert-circle';
        
        toast.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Start Application
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
