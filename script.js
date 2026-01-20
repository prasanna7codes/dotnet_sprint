/**
 * SCRIPTS.JS - Hotel Management System Logic
 * Implements: US001-US016 (Registration, Login, Reservation, Billing, Payment, Complaints)
 */

// --- 1. INITIALIZATION ---
if (!localStorage.getItem('users')) {
    // Default Admin (US003)
    localStorage.setItem('users', JSON.stringify([
        { userId: 'admin123', password: 'Password@123', role: 'admin', name: 'Administrator' }
    ]));
}
if (!localStorage.getItem('bookings')) {
    localStorage.setItem('bookings', JSON.stringify([]));
}

let currentUser = null;
let currentPayBookingId = null; // To track which bill is being paid

// --- 2. NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    
    const target = document.getElementById(pageId);
    if(target) target.classList.remove('hidden');

    const nav = document.getElementById('main-nav');
    if (currentUser) {
        nav.classList.remove('hidden');
        document.getElementById('display-user').innerText = currentUser.name || currentUser.userId;
        
        // US004 vs US005 Logic
        if (currentUser.role === 'admin') {
            document.getElementById('admin-nav').classList.remove('hidden');
            document.getElementById('cust-nav').classList.add('hidden');
        } else {
            document.getElementById('cust-nav').classList.remove('hidden');
            document.getElementById('admin-nav').classList.add('hidden');
        }

        // US013: Auto-fill ID if visiting Complaint Page
        if (pageId === 'complaint-page') {
            document.getElementById('comp-cust-id').value = currentUser.userId;
        }
    } else {
        nav.classList.add('hidden');
    }
}

// --- 3. REGISTRATION (US001) ---
document.getElementById('reg-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const pass = document.getElementById('reg-pass').value;
    const confirm = document.getElementById('reg-confirm').value;

    // Password Validation
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
    if (!passRegex.test(pass)) {
        alert("Password must be 8-30 chars, with 1 Upper, 1 Lower, 1 Special.");
        return;
    }
    if (pass !== confirm) {
        alert("Passwords do not match.");
        return;
    }

    // Generate Random ID (US001)
    const randomId = "CUST" + Math.floor(10000 + Math.random() * 90000);

    const newUser = {
        userId: randomId,
        password: pass,
        role: 'customer',
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        mobile: document.getElementById('reg-mobile').value,
        address: document.getElementById('reg-address').value
    };

    let users = JSON.parse(localStorage.getItem('users'));
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Show Success & ID
    document.getElementById('ack-id').innerText = randomId;
    showPage('ack-page');
    this.reset();
});

// --- 4. LOGIN (US002, US003) ---
function handleLogin() {
    const id = document.getElementById('login-id').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const err = document.getElementById('login-error');

    let users = JSON.parse(localStorage.getItem('users'));
    let user = users.find(u => u.userId === id && u.password === pass);

    if (user) {
        currentUser = user;
        err.innerText = "";
        showPage('home-page');
    } else {
        err.innerText = "Invalid User ID or Password.";
    }
}

function logout() {
    currentUser = null;
    showPage('login-page');
}

// --- 5. RESERVATION (US006) ---
// Date Constraints
const today = new Date().toISOString().split('T')[0];
document.getElementById('check-in').setAttribute('min', today);
document.getElementById('check-out').setAttribute('min', today);

document.getElementById('check-in').addEventListener('change', function() {
    document.getElementById('check-out').setAttribute('min', this.value);
});

document.getElementById('res-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const cin = document.getElementById('check-in').value;
    const cout = document.getElementById('check-out').value;
    
    if (new Date(cout) <= new Date(cin)) {
        alert("Check-out date must be after Check-in date.");
        return;
    }

    const roomType = document.getElementById('room-pref').value;
    let amount = roomType === 'Suite' ? 250 : (roomType === 'Deluxe' ? 150 : 100);

    const booking = {
        bookingId: "BK" + Math.floor(1000 + Math.random() * 9000),
        userId: currentUser.userId,
        name: document.getElementById('res-name').value,
        checkIn: cin,
        checkOut: cout,
        roomType: roomType,
        amount: amount,
        status: 'Confirmed',
        isPaid: false, // For Billing US008
        bookingDate: new Date().toLocaleDateString()
    };

    let bookings = JSON.parse(localStorage.getItem('bookings'));
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    alert("Reservation Successful! ID: " + booking.bookingId);
    showPage('home-page');
    this.reset();
});

// --- 6. BILLING (US008) ---
function renderBilling() {
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    // Filter: Current User & Not Paid
    const myBills = bookings.filter(b => b.userId === currentUser.userId && !b.isPaid);
    
    const container = document.getElementById('billing-content');
    if (myBills.length === 0) {
        container.innerHTML = "<p>No pending bills.</p>";
    } else {
        let html = `<table><tr><th>Booking ID</th><th>Room</th><th>Amount</th><th>Action</th></tr>`;
        myBills.forEach(b => {
            html += `<tr>
                <td>${b.bookingId}</td>
                <td>${b.roomType}</td>
                <td>$${b.amount}</td>
                <td><button class="btn-blue" onclick="goToPayment('${b.bookingId}', ${b.amount})">Pay Bill</button></td>
            </tr>`;
        });
        html += `</table>`;
        container.innerHTML = html;
    }
    showPage('billing-page');
}

// --- 7. PAYMENT (US014) ---
function goToPayment(bookingId, amount) {
    currentPayBookingId = bookingId;
    document.getElementById('pay-user').innerText = currentUser.name;
    document.getElementById('pay-amount').innerText = "$" + amount;
    showPage('payment-page');
}

document.getElementById('payment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Simulate Payment
    const txnId = "TXN" + Math.floor(Math.random() * 1000000000);
    alert("Payment Successful!\nTransaction ID: " + txnId + "\nInvoice sent.");

    // Update Status
    let bookings = JSON.parse(localStorage.getItem('bookings'));
    let idx = bookings.findIndex(b => b.bookingId === currentPayBookingId);
    if(idx !== -1) {
        bookings[idx].isPaid = true;
        localStorage.setItem('bookings', JSON.stringify(bookings));
    }

    // US013: Redirect Home & Show Thank You Popup
    this.reset();
    showPage('home-page');
    document.getElementById('checkout-popup').classList.remove('hidden');
});

function closePopup() {
    document.getElementById('checkout-popup').classList.add('hidden');
}

// --- 8. COMPLAINT (US013) ---
function handleComplaint(e) {
    e.preventDefault();
    const room = document.getElementById('comp-room').value;
    alert("Complaint Registered for Room " + room + ". Support will contact you shortly.");
    showPage('home-page');
}

// --- 9. HISTORY & BOOKINGS (US010, US015) ---
function renderHistory() {
    renderData('Booking History', b => b.userId === currentUser.userId);
}
function renderBookings() {
    renderData('Upcoming Bookings', b => b.userId === currentUser.userId && new Date(b.checkIn) >= new Date());
}
function renderData(title, filterFn) {
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    const filtered = bookings.filter(filterFn);
    const container = document.getElementById('data-table-container');
    document.getElementById('data-title').innerText = title;
    
    if (filtered.length === 0) {
        container.innerHTML = "<p>No records found.</p>";
    } else {
        let html = `<table><tr><th>ID</th><th>Check-In</th><th>Room</th><th>Amount</th><th>Paid</th></tr>`;
        filtered.forEach(b => {
            html += `<tr>
                <td>${b.bookingId}</td>
                <td>${b.checkIn}</td>
                <td>${b.roomType}</td>
                <td>$${b.amount}</td>
                <td style="color:${b.isPaid?'green':'red'}">${b.isPaid?'Yes':'No'}</td>
            </tr>`;
        });
        html += `</table>`;
        container.innerHTML = html;
    }
    showPage('data-display-page');
}

// --- 10. ADMIN ROOM STATUS (US012) ---
function viewRoomStatus() {
    // Mock Data
    const res = document.getElementById('status-results');
    res.innerHTML = `<table>
        <tr><th>Room</th><th>Type</th><th>Status</th></tr>
        <tr><td>101</td><td>Deluxe</td><td class="booked">Booked</td></tr>
        <tr><td>102</td><td>Suite</td><td class="vacant">Vacant</td></tr>
    </table>`;
}

// Init
document.addEventListener('DOMContentLoaded', () => showPage('login-page'));