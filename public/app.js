/****************************************************
 * STORAGE KEYS & DEFAULT DATA
 ****************************************************/
const STORAGE_KEYS = {
  MENU: 'nk_menu',
  ORDERS: 'nk_orders',
  FEEDBACK: 'nk_feedback',
  SETTINGS: 'nk_settings',
  CART: 'nk_cart'
};

const DEFAULT_MENU = [
  {
    id: 'thali-1',
    name: 'North Indian Thali',
    category: 'Thali',
    price: 220,
    available: true,
    image: 'https://images.pexels.com/photos/724216/pexels-photo-724216.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '2 sabzi, dal, rice, roti, salad, papad & sweet.'
  },
  {
    id: 'thali-2',
    name: 'Mini Home Thali',
    category: 'Thali',
    price: 160,
    available: true,
    image: 'https://images.pexels.com/photos/4194626/pexels-photo-4194626.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '1 sabzi, dal, rice, 2 roti, salad.'
  },
  {
    id: 'snack-1',
    name: 'Veg Paneer Sandwich',
    category: 'Snacks',
    price: 90,
    available: true,
    image: 'https://images.pexels.com/photos/2631164/pexels-photo-2631164.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Grilled sandwich with paneer & veggies.'
  },
  {
    id: 'snack-2',
    name: 'Aloo Paratha (2 pc)',
    category: 'Breads',
    price: 80,
    available: true,
    image: 'https://images.pexels.com/photos/1618912/pexels-photo-1618912.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Stuffed paratha served with curd & pickle.'
  },
  {
    id: 'rice-1',
    name: 'Jeera Rice',
    category: 'Rice',
    price: 110,
    available: true,
    image: 'https://images.pexels.com/photos/4109999/pexels-photo-4109999.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Flavoured basmati rice with jeera tadka.'
  },
  {
    id: 'rice-2',
    name: 'Veg Pulao',
    category: 'Rice',
    price: 140,
    available: true,
    image: 'https://images.pexels.com/photos/209540/pexels-photo-209540.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Mixed veg pulao cooked in light spices.'
  }
];

const DEFAULT_SETTINGS = {
  upiId: 'neelams-kitchen@upi',
  upiQrDataUrl: '',
  logoUrl: document.getElementById('logoImage').src,
  heroUrl: document.getElementById('heroImage').src,
  adminEmail: 'malavrishi204@gmail.com'
};

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    console.warn('loadData error', key, e);
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('saveData error', key, e);
  }
}

// Helper to read file as base64
function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

let menuItems = loadData(STORAGE_KEYS.MENU, DEFAULT_MENU);
let orders = loadData(STORAGE_KEYS.ORDERS, []);
let feedbackList = loadData(STORAGE_KEYS.FEEDBACK, []);
let settings = loadData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
let cart = loadData(STORAGE_KEYS.CART, []);

/****************************************************
 * NAVIGATION
 ****************************************************/
const navButtons = document.querySelectorAll('[data-nav]');
const sections = {
  home: document.getElementById('homeSection'),
  order: document.getElementById('orderSection'),
  feedback: document.getElementById('feedbackSection'),
  admin: document.getElementById('adminSection')
};

function setActiveSection(key) {
  Object.values(sections).forEach(sec => sec.classList.remove('active'));
  sections[key].classList.add('active');
  navButtons.forEach(btn => {
    if (btn.dataset.nav === key) btn.classList.add('active');
    else if (['home','order','feedback','admin'].includes(btn.dataset.nav)) btn.classList.remove('active');
  });

  if (key === 'order') renderCart();
  if (key === 'feedback') renderFeedbackPublic();
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.nav;
    if (key) setActiveSection(key);
  });
});

/****************************************************
 * SETTINGS APPLY TO UI
 ****************************************************/
const upiIdDisplay = document.getElementById('upiIdDisplay');
const upiQrImage = document.getElementById('upiQrImage');

function applySettingsToUi() {
  // UPI ID
  upiIdDisplay.textContent = settings.upiId || DEFAULT_SETTINGS.upiId;

  // UPI QR
  if (settings.upiQrDataUrl && settings.upiQrDataUrl.trim() !== '') {
    upiQrImage.src = settings.upiQrDataUrl;
  }

  // Images
  if (settings.logoUrl) document.getElementById('logoImage').src = settings.logoUrl;
  if (settings.heroUrl) document.getElementById('heroImage').src = settings.heroUrl;

  // Fill admin settings form when visible
  const upiIdInput = document.getElementById('settingsUpiId');
  if (upiIdInput) {
    upiIdInput.value = settings.upiId || '';
    document.getElementById('settingsLogoUrl').value = settings.logoUrl || '';
    document.getElementById('settingsHeroUrl').value = settings.heroUrl || '';
  }
}

/****************************************************
 * MENU & CART
 ****************************************************/
const menuGrid = document.getElementById('menuGrid');
let currentFilter = 'all';

function getCartQty(itemId) {
  const item = cart.find(c => c.id === itemId);
  return item ? item.qty : 0;
}

function updateCartItem(itemId, delta) {
  const menuItem = menuItems.find(m => m.id === itemId);
  if (!menuItem || !menuItem.available) return;

  const existing = cart.find(c => c.id === itemId);
  if (!existing && delta > 0) {
    cart.push({ id: itemId, name: menuItem.name, price: menuItem.price, qty: delta });
  } else if (existing) {
    existing.qty += delta;
    if (existing.qty <= 0) {
      cart = cart.filter(c => c.id !== itemId);
    }
  }
  saveData(STORAGE_KEYS.CART, cart);
  renderMenu();
  renderCartBar();
  if (sections.order.classList.contains('active')) renderCart();
}

function renderMenu() {
  menuGrid.innerHTML = '';

  let filtered = menuItems;
  if (currentFilter !== 'all') {
    filtered = menuItems.filter(m => (m.category || '').toLowerCase() === currentFilter.toLowerCase());
  }

  if (filtered.length === 0) {
    menuGrid.innerHTML = '<p class="muted">No items in this category.</p>';
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    if (!item.available) {
      card.style.opacity = 0.6;
    }

    const qty = getCartQty(item.id);

    card.innerHTML = `
      <div class="card-header">
        <div class="card-img">
          <img src="${item.image || 'https://via.placeholder.com/150x150?text=Veg'}" alt="${item.name}" />
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <h3>${item.name}</h3>
            <span class="price">₹${item.price}</span>
          </div>
          <span class="chip">${item.category || 'Veg Dish'}</span>
          <p class="muted">${item.description || ''}</p>
        </div>
      </div>
      <div class="card-footer">
        <div class="qty-controls">
          <button class="icon-btn" data-action="dec">-</button>
          <span>${qty} in cart</span>
          <button class="icon-btn" data-action="inc" ${!item.available ? 'disabled' : ''}>+</button>
        </div>
        <span class="muted">${item.available ? 'Available' : 'Not available'}</span>
      </div>
    `;

    const decBtn = card.querySelector('[data-action="dec"]');
    const incBtn = card.querySelector('[data-action="inc"]');

    decBtn.addEventListener('click', () => updateCartItem(item.id, -1));
    incBtn.addEventListener('click', () => updateCartItem(item.id, 1));

    menuGrid.appendChild(card);
  });
}

document.querySelectorAll('.menu-filters .btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('.menu-filters .btn').forEach(b => b.classList.remove('btn-primary'));
    btn.classList.add('btn-primary');
    renderMenu();
  });
});

/****************************************************
 * CART BAR & CHECKOUT
 ****************************************************/
const cartBar = document.getElementById('cartBar');
const cartBarSummary = document.getElementById('cartBarSummary');
const cartBarTotal = document.getElementById('cartBarTotal');

function computeCartTotals() {
  let items = 0;
  let subtotal = 0;
  cart.forEach(c => {
    items += c.qty;
    subtotal += c.qty * c.price;
  });
  return { items, subtotal, total: subtotal };
}

function renderCartBar() {
  const { items, total } = computeCartTotals();
  if (items === 0) {
    cartBar.style.display = 'none';
  } else {
    cartBar.style.display = 'flex';
    cartBarSummary.textContent = `${items} item${items > 1 ? 's' : ''}`;
    cartBarTotal.textContent = `₹${total}`;
  }
}

const cartList = document.getElementById('cartList');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartTotalEl = document.getElementById('cartTotal');

function renderCart() {
  cartList.innerHTML = '';

  const { items, subtotal, total } = computeCartTotals();
  cartSubtotalEl.textContent = `₹${subtotal}`;
  cartTotalEl.textContent = `₹${total}`;

  if (items === 0) {
    emptyCartMessage.style.display = 'block';
    return;
  } else {
    emptyCartMessage.style.display = 'none';
  }

  cart.forEach(cItem => {
    const row = document.createElement('div');
    row.className = 'row-between small-text';
    row.style.gap = '0.5rem';

    row.innerHTML = `
      <div>
        <strong>${cItem.name}</strong>
        <div class="muted">₹${cItem.price} × ${cItem.qty}</div>
      </div>
      <div style="text-align:right;">
        <div class="muted">₹${cItem.price * cItem.qty}</div>
        <div class="qty-controls" style="justify-content:flex-end;margin-top:0.1rem;">
          <button class="icon-btn" data-action="dec">-</button>
          <button class="icon-btn" data-action="inc">+</button>
        </div>
      </div>
    `;

    row.querySelector('[data-action="dec"]').addEventListener('click', () => updateCartItem(cItem.id, -1));
    row.querySelector('[data-action="inc"]').addEventListener('click', () => updateCartItem(cItem.id, 1));

    cartList.appendChild(row);
  });
}

/****************************************************
 * PAYMENT METHOD & ORDER SUBMISSION
 ****************************************************/
const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
const upiDetailsBox = document.getElementById('upiDetailsBox');
const upiFormFields = document.getElementById('upiFormFields');
const codInfo = document.getElementById('codInfo');
const orderForm = document.getElementById('orderForm');
const orderMessageEl = document.getElementById('orderMessage');

function updatePaymentUi() {
  const method = [...paymentRadios].find(r => r.checked)?.value || 'upi';
  if (method === 'upi') {
    upiDetailsBox.style.display = 'grid';
    upiFormFields.style.display = 'block';
    codInfo.style.display = 'none';
  } else {
    upiDetailsBox.style.display = 'none';
    upiFormFields.style.display = 'none';
    codInfo.style.display = 'block';
  }
}

paymentRadios.forEach(r => r.addEventListener('change', updatePaymentUi));

orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  orderMessageEl.textContent = '';

  const { items, total } = computeCartTotals();
  if (items === 0) {
    orderMessageEl.textContent = 'Your cart is empty. Please add at least one item.';
    orderMessageEl.style.color = '#d9534f';
    return;
  }

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const notes = document.getElementById('custNotes').value.trim();
  const paymentMethod = [...paymentRadios].find(r => r.checked)?.value || 'upi';

  if (!name || !phone || !address) {
    orderMessageEl.textContent = 'Please fill in name, phone and address.';
    orderMessageEl.style.color = '#d9534f';
    return;
  }

  let upiName = '';
  let upiTxnId = '';
  let upiScreenshotDataUrl = '';

  if (paymentMethod === 'upi') {
    upiName = document.getElementById('upiName').value.trim();
    upiTxnId = document.getElementById('upiTxnId').value.trim();
    const file = document.getElementById('upiScreenshot').files[0];

    if (!upiName || !upiTxnId) {
      orderMessageEl.textContent = 'For UPI payment, please enter UPI name and transaction ID.';
      orderMessageEl.style.color = '#d9534f';
      return;
    }

    if (file) {
      upiScreenshotDataUrl = await readFileAsDataURL(file);
    }
  }



  const order = {
  id: 'ord-' + Date.now(),
  createdAt: new Date().toISOString(),
  customer: { name, phone, address, notes },
  items: cart.map(c => ({
    id: c.id,
    name: c.name,
    price: c.price,
    qty: c.qty
  })),
  total,
  paymentMethod,
  status: 'new', // 👈 add this
  upi: paymentMethod === 'upi' ? {
    upiIdUsed: settings.upiId || DEFAULT_SETTINGS.upiId,
    upiName,
    upiTxnId,
    screenshot: !!upiScreenshotDataUrl,
    screenshotDataUrl: upiScreenshotDataUrl
  } : null
};


  orders.unshift(order);
  saveData(STORAGE_KEYS.ORDERS, orders);

  // 🔔 Notify backend to send email to admin
  try {
    await fetch('/api/new-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: order.id,
        createdAt: order.createdAt,
        total: order.total,
        paymentMethod: order.paymentMethod,
        upiName,
        upiTxnId,
        customer: order.customer,
        items: order.items
      })
    });
  } catch (err) {
    console.error('Failed to notify backend about new order', err);
  }

  // Clear cart & UPI fields
  cart = [];
  saveData(STORAGE_KEYS.CART, cart);
  renderCart();
  renderCartBar();
  renderAdminOrders();

  orderForm.reset();
  updatePaymentUi();
  orderMessageEl.textContent = 'Order placed successfully! We will confirm your order shortly.';
  orderMessageEl.style.color = '#2d8f4e';
});

/****************************************************
 * FEEDBACK
 ****************************************************/
const ratingStars = document.getElementById('ratingStars');
const ratingValueInput = document.getElementById('ratingValue');
const feedbackForm = document.getElementById('feedbackForm');
const feedbackStatus = document.getElementById('feedbackStatus');

function setRating(value) {
  ratingValueInput.value = value;
  [...ratingStars.querySelectorAll('.star')].forEach(st => {
    const v = parseInt(st.dataset.value, 10);
    st.classList.toggle('filled', v <= value);
  });
}
setRating(5);

ratingStars.addEventListener('click', (e) => {
  if (e.target.classList.contains('star')) {
    const val = parseInt(e.target.dataset.value, 10);
    setRating(val);
  }
});

function renderFeedbackPublic() {
  const container = document.getElementById('feedbackList');
  container.innerHTML = '';

  if (feedbackList.length === 0) {
    container.innerHTML = '<p class="muted">No feedback yet. Be the first to rate us!</p>';
    return;
  }

  feedbackList.slice(0, 6).forEach(fb => {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.padding = '0.5rem 0.6rem';

    const stars = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);

    div.innerHTML = `
      <div class="row-between">
        <div><strong>${fb.name || 'Anonymous'}</strong></div>
        <div style="font-size:0.8rem;color:#ffb300;">${stars}</div>
      </div>
      <p style="font-size:0.85rem;margin-top:0.2rem;">${fb.message}</p>
      <p class="muted" style="margin-top:0.2rem;">${new Date(fb.createdAt).toLocaleString()}</p>
    `;

    container.appendChild(div);
  });
}

feedbackForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  feedbackStatus.textContent = '';

  const rating = parseInt(ratingValueInput.value, 10) || 5;
  const name = document.getElementById('feedbackName').value.trim();
  const message = document.getElementById('feedbackMessage').value.trim();

  if (!message) {
    feedbackStatus.textContent = 'Please write a short message.';
    feedbackStatus.style.color = '#d9534f';
    return;
  }

  const fb = {
    id: 'fb-' + Date.now(),
    rating,
    name,
    message,
    createdAt: new Date().toISOString()
  };

  feedbackList.unshift(fb);
  saveData(STORAGE_KEYS.FEEDBACK, feedbackList);
  feedbackForm.reset();
  setRating(5);
  feedbackStatus.textContent = 'Thank you for your feedback!';
  feedbackStatus.style.color = '#2d8f4e';

  renderFeedbackPublic();
  renderAdminFeedback();

  // 🔔 Notify backend to send email to admin
  try {
    await fetch('/api/new-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fb)
    });
  } catch (err) {
    console.error('Failed to notify backend about feedback', err);
  }
});

/****************************************************
 * ADMIN AUTH
 ****************************************************/
const ADMIN_PASSWORD = 'admin123'; // change if you want
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginStatus = document.getElementById('adminLoginStatus');
const adminLoginView = document.getElementById('adminLoginView');
const adminDashboardView = document.getElementById('adminDashboardView');
const adminEmailDisplay = document.getElementById('adminEmailDisplay');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

function isAdminLoggedIn() {
  return sessionStorage.getItem('nk_admin_logged_in') === 'true';
}

function setAdminLoggedIn(val) {
  sessionStorage.setItem('nk_admin_logged_in', val ? 'true' : 'false');
}

function setAdminView() {
  if (isAdminLoggedIn()) {
    adminLoginView.style.display = 'none';
    adminDashboardView.style.display = 'block';
    adminEmailDisplay.textContent = settings.adminEmail || DEFAULT_SETTINGS.adminEmail;
    renderAdminMenu();
    renderAdminOrders();
    renderAdminFeedback();
    applySettingsToUi();
  } else {
    adminDashboardView.style.display = 'none';
    adminLoginView.style.display = 'block';
  }
}

adminLoginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  adminLoginStatus.textContent = '';

  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;

  if (email !== (settings.adminEmail || DEFAULT_SETTINGS.adminEmail) || password !== ADMIN_PASSWORD) {
    adminLoginStatus.textContent = 'Invalid email or password.';
    adminLoginStatus.style.color = '#d9534f';
    return;
  }

  setAdminLoggedIn(true);
  adminLoginStatus.textContent = '';
  setAdminView();
});

adminLogoutBtn.addEventListener('click', () => {
  setAdminLoggedIn(false);
  setAdminView();
});

/****************************************************
 * ADMIN TABS
 ****************************************************/
const adminTabs = document.querySelectorAll('.admin-tab');
const adminMenuTab = document.getElementById('adminMenuTab');
const adminOrdersTab = document.getElementById('adminOrdersTab');
const adminFeedbackTab = document.getElementById('adminFeedbackTab');
const adminSettingsTab = document.getElementById('adminSettingsTab');

function setAdminTab(key) {
  const map = {
    menu: adminMenuTab,
    orders: adminOrdersTab,
    feedback: adminFeedbackTab,
    settings: adminSettingsTab
  };
  Object.values(map).forEach(el => el.style.display = 'none');
  map[key].style.display = 'block';

  adminTabs.forEach(t => {
    t.classList.toggle('active', t.dataset.adminTab === key);
  });
}

adminTabs.forEach(t => {
  t.addEventListener('click', () => setAdminTab(t.dataset.adminTab));
});

/****************************************************
 * ADMIN MENU
 ****************************************************/
const adminMenuTableBody = document.querySelector('#adminMenuTable tbody');
const adminAddItemForm = document.getElementById('adminAddItemForm');
const newItemImageFileInput = document.getElementById('newItemImageFile');
const newItemImagePreview = document.getElementById('newItemImagePreview');

let newItemImageDataUrl = '';

if (newItemImageFileInput) {
  newItemImageFileInput.addEventListener('change', () => {
    const file = newItemImageFileInput.files[0];
    if (!file) {
      newItemImageDataUrl = '';
      newItemImagePreview.style.display = 'none';
      return;
    }
    readFileAsDataURL(file).then((dataUrl) => {
      newItemImageDataUrl = dataUrl;
      newItemImagePreview.src = newItemImageDataUrl;
      newItemImagePreview.style.display = 'block';
    });
  });
}

function renderAdminMenu() {
  adminMenuTableBody.innerHTML = '';

  if (menuItems.length === 0) {
    adminMenuTableBody.innerHTML = '<tr><td colspan="6" class="small-text">No menu items. Add some.</td></tr>';
    return;
  }

  menuItems.forEach(item => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>
        <input type="text" value="${item.name}" data-field="name" />
      </td>
      <td>
        <input type="text" value="${item.category || ''}" data-field="category" />
      </td>
      <td>
        <input type="text" value="${item.price}" data-field="price" />
      </td>
      <td>
        <select data-field="available">
          <option value="true" ${item.available ? 'selected' : ''}>Yes</option>
          <option value="false" ${!item.available ? 'selected' : ''}>No</option>
        </select>
      </td>
      <td>
        <img src="${item.image || 'https://via.placeholder.com/60x60?text=Veg'}" class="img-thumb" alt="img" />
        <input type="file" data-field="imageFile" accept="image/*" style="margin-top:0.25rem;" />
        <input type="text" value="${item.image || ''}" data-field="image" placeholder="Image URL (optional)" style="margin-top:0.25rem;" />
      </td>
      <td>
        <button class="btn btn-outline btn-sm" data-action="save">Save</button>
        <button class="btn btn-danger btn-sm" data-action="delete" style="margin-top:0.2rem;">Delete</button>
      </td>
    `;

    // Upload image for existing item
    const fileInput = tr.querySelector('input[data-field="imageFile"]');
    const imgEl = tr.querySelector('img.img-thumb');
    let tempItemImgDataUrl = '';

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) {
        tempItemImgDataUrl = '';
        return;
      }
      readFileAsDataURL(file).then((dataUrl) => {
        tempItemImgDataUrl = dataUrl;
        imgEl.src = tempItemImgDataUrl;
      });
    });

    tr.querySelector('[data-action="save"]').addEventListener('click', () => {
      const name = tr.querySelector('input[data-field="name"]').value.trim();
      const category = tr.querySelector('input[data-field="category"]').value.trim();
      const priceRaw = tr.querySelector('input[data-field="price"]').value.trim();
      const availableVal = tr.querySelector('select[data-field="available"]').value;
      const imageUrlInput = tr.querySelector('input[data-field="image"]').value.trim();

      const price = parseFloat(priceRaw);
      if (!name || isNaN(price)) {
        alert('Please enter valid name and price.');
        return;
      }

      item.name = name;
      item.category = category || 'Veg Dish';
      item.price = price;
      item.available = availableVal === 'true';

      if (tempItemImgDataUrl) {
        item.image = tempItemImgDataUrl;
      } else if (imageUrlInput) {
        item.image = imageUrlInput;
      }

      saveData(STORAGE_KEYS.MENU, menuItems);
      renderMenu();
      renderAdminMenu();
    });

    tr.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (!confirm('Delete this item from menu?')) return;
      menuItems = menuItems.filter(m => m.id !== item.id);
      saveData(STORAGE_KEYS.MENU, menuItems);
      renderMenu();
      renderAdminMenu();
    });

    adminMenuTableBody.appendChild(tr);
  });
}

adminAddItemForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('newItemName').value.trim();
  const category = document.getElementById('newItemCategory').value.trim() || 'Veg Dish';
  const priceRaw = document.getElementById('newItemPrice').value.trim();
  const imageUrl = document.getElementById('newItemImage').value.trim();
  const availableVal = document.getElementById('newItemAvailable').value;

  const price = parseFloat(priceRaw);
  if (!name || isNaN(price)) {
    alert('Please enter valid item name and price.');
    return;
  }

  let finalImage = '';
  if (newItemImageDataUrl) {
    finalImage = newItemImageDataUrl;
  } else if (imageUrl) {
    finalImage = imageUrl;
  }

  const item = {
    id: 'itm-' + Date.now(),
    name,
    category,
    price,
    available: availableVal === 'true',
    image: finalImage,
    description: ''
  };

  menuItems.push(item);
  saveData(STORAGE_KEYS.MENU, menuItems);
  adminAddItemForm.reset();
  newItemImageDataUrl = '';
  newItemImagePreview.style.display = 'none';
  renderMenu();
  renderAdminMenu();
});

/****************************************************
 * ADMIN ORDERS
 ****************************************************/
const adminOrdersTableBody = document.querySelector('#adminOrdersTable tbody');

function renderAdminOrders() {
  adminOrdersTableBody.innerHTML = '';

  if (orders.length === 0) {
    adminOrdersTableBody.innerHTML = '<tr><td colspan="8" class="small-text">No orders yet.</td></tr>';
    return;
  }

  orders.forEach(order => {
    const tr = document.createElement('tr');

    const paymentBadgeClass = order.paymentMethod === 'cod' ? 'cod' : 'upi';
    const statusLabel = order.status || 'new';

    const itemsHtml = order.items.map(it => {
      return `<div>${it.name} × ${it.qty} (₹${it.qty * it.price})</div>`;
    }).join('');

    const paymentInfo = order.paymentMethod === 'cod'
      ? 'Cash on Delivery'
      : `UPI to <strong>${order.upi?.upiIdUsed || ''}</strong><br/>Name: ${order.upi?.upiName || ''}<br/>Txn ID: ${order.upi?.upiTxnId || ''}`;

    const proofHtml = order.paymentMethod === 'upi'
      ? (order.upi?.screenshotDataUrl
        ? `<a href="${order.upi.screenshotDataUrl}" target="_blank">View Screenshot</a>`
        : '<span class="muted">No screenshot</span>')
      : '<span class="muted">Not applicable</span>';

    tr.innerHTML = `
      <td class="small-text">${new Date(order.createdAt).toLocaleString()}</td>
      <td class="small-text">
        <strong>${order.customer.name}</strong><br/>
        ${order.customer.phone}<br/>
        <span class="muted">${order.customer.address}</span>
      </td>
      <td class="small-text">${itemsHtml}</td>
      <td><strong>₹${order.total}</strong></td>
      <td class="small-text">
        <span class="status-badge ${paymentBadgeClass}">${order.paymentMethod.toUpperCase()}</span><br/>
        ${paymentInfo}
      </td>
      <td class="small-text">${proofHtml}</td>
      <td class="small-text">
        <span class="status-badge">${statusLabel.toUpperCase()}</span>
      </td>
      <td class="small-text">
        ${statusLabel !== 'completed' ? '<button class="btn btn-outline btn-sm" data-action="complete">Mark Done</button><br/>' : ''}
        <button class="btn btn-danger btn-sm" data-action="delete" style="margin-top:0.25rem;">Delete</button>
      </td>
    `;

    // Wire actions
    const completeBtn = tr.querySelector('[data-action="complete"]');
    const deleteBtn = tr.querySelector('[data-action="delete"]');

    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        order.status = 'completed';
        saveData(STORAGE_KEYS.ORDERS, orders);
        renderAdminOrders();
      });
    }

    deleteBtn.addEventListener('click', () => {
      if (!confirm('Remove this order from the list?')) return;
      orders = orders.filter(o => o.id !== order.id);
      saveData(STORAGE_KEYS.ORDERS, orders);
      renderAdminOrders();
    });

    adminOrdersTableBody.appendChild(tr);
  });
}


/****************************************************
 * ADMIN FEEDBACK
 ****************************************************/
const adminFeedbackListDiv = document.getElementById('adminFeedbackList');

function renderAdminFeedback() {
  adminFeedbackListDiv.innerHTML = '';

  if (feedbackList.length === 0) {
    adminFeedbackListDiv.innerHTML = '<p class="muted">No feedback yet.</p>';
    return;
  }

  feedbackList.forEach(fb => {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.padding = '0.5rem 0.6rem';

    const stars = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);

    div.innerHTML = `
      <div class="row-between">
        <div><strong>${fb.name || 'Anonymous'}</strong></div>
        <div style="color:#ffb300;font-size:0.85rem;">${stars}</div>
      </div>
      <p style="margin-top:0.3rem;">${fb.message}</p>
      <p class="muted" style="margin-top:0.2rem;">${new Date(fb.createdAt).toLocaleString()}</p>
    `;

    adminFeedbackListDiv.appendChild(div);
  });
}

/****************************************************
 * ADMIN SETTINGS (UPI & IMAGES + LOCAL UPLOAD)
 ****************************************************/
const settingsForm = document.getElementById('settingsForm');
const settingsStatus = document.getElementById('settingsStatus');

settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  settingsStatus.textContent = '';

  const upiId = document.getElementById('settingsUpiId').value.trim();
  const logoUrlInput = document.getElementById('settingsLogoUrl').value.trim();
  const heroUrlInput = document.getElementById('settingsHeroUrl').value.trim();

  const qrFile = document.getElementById('settingsUpiQrFile').files[0];
  const logoFile = document.getElementById('settingsLogoFile')?.files[0];
  const heroFile = document.getElementById('settingsHeroFile')?.files[0];

  // UPI ID
  if (upiId) {
    settings.upiId = upiId;
  }

  // Logo image: file has higher priority than URL
  if (logoFile) {
    settings.logoUrl = await readFileAsDataURL(logoFile);
  } else if (logoUrlInput) {
    settings.logoUrl = logoUrlInput;
  }

  // Hero image: file has higher priority than URL
  if (heroFile) {
    settings.heroUrl = await readFileAsDataURL(heroFile);
  } else if (heroUrlInput) {
    settings.heroUrl = heroUrlInput;
  }

  // UPI QR file
  if (qrFile) {
    settings.upiQrDataUrl = await readFileAsDataURL(qrFile);
  }

  saveData(STORAGE_KEYS.SETTINGS, settings);
  applySettingsToUi();

  settingsStatus.textContent = 'Settings updated successfully.';
  settingsStatus.style.color = '#2d8f4e';
  settingsForm.reset();
});

/****************************************************
 * INITIAL RENDER
 ****************************************************/
applySettingsToUi();
renderMenu();
renderCartBar();
renderFeedbackPublic();
setAdminView();
updatePaymentUi();
