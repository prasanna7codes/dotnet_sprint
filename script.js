/**
 * SCRIPTS.JS - Hotel Management System
 * Complete Logic for Customer (US001-016) and Admin (US003-012)
 */

// --- 1. INITIALIZATION & DATABASE SEEDING ---
document.addEventListener('DOMContentLoaded', () => {
    // Check/Create Users DB
    if (!localStorage.getItem('users')) {
        // Default Admin Account
        localStorage.setItem('users', JSON.stringify([
            { userId: 'admin123', password: 'Password@123', role: 'admin', name: 'System Admin' }
        ]));
    }
    // Check/Create Bookings DB
    if (!localStorage.getItem('bookings')) {
        localStorage.setItem('bookings', JSON.stringify([]));
    }
    
    // Start at Login
    showPage('login-page');
});

let currentUser = null;
let currentPayBookingId = null;

// --- 2. NAVIGATION & ROLE MANAGEMENT ---
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    
    // Show target page
    const target = document.getElementById(pageId);
    if(target) target.classList.remove('hidden');

    // Handle Navigation Bar
    const nav = document.getElementById('main-nav');
    if (currentUser) {
        nav.classList.remove('hidden');
        document.getElementById('display-user').innerText = currentUser.name || currentUser.userId;
        
        // Role-based Menu Toggling
        if (currentUser.role === 'admin') {
            document.getElementById('admin-nav').classList.remove('hidden');
            document.getElementById('cust-nav').classList.add('hidden');
            // Hide "Book Now" CTA on home for admins
            const cta = document.getElementById('cust-cta');
            if(cta) cta.classList.add('hidden'); 
        } else {
            document.getElementById('cust-nav').classList.remove('hidden');
            document.getElementById('admin-nav').classList.add('hidden');
            const cta = document.getElementById('cust-cta');
            if(cta) cta.classList.remove('hidden');
        }

        // Auto-fill Customer ID if navigating to Complaint Page
        if (pageId === 'complaint-page') {
            const idField = document.getElementById('comp-cust-id');
            if(idField) idField.value = currentUser.userId;
        }
    } else {
        nav.classList.add('hidden');
    }
}

// --- 3. REGISTRATION LOGIC (FIXED) ---
//
const regForm = document.getElementById('reg-form');
if (regForm) {
    regForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Safety Check: If dropdown exists use it, else default to 'customer'
        const roleDropdown = document.getElementById('reg-role');
        const role = roleDropdown ? roleDropdown.value : 'customer';

        const pass = document.getElementById('reg-pass').value;
        const confirm = document.getElementById('reg-confirm').value;

        // Password Validation (Min 8, 1 Upper, 1 Lower, 1 Special)
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
        
        if (!passRegex.test(pass)) {
            alert("Password Requirements:\n- 8 to 30 characters\n- 1 Uppercase letter\n- 1 Lowercase letter\n- 1 Special character (@$!%*?&)");
            return;
        }
        if (pass !== confirm) {
            alert("Passwords do not match.");
            return;
        }

        // Generate Random ID (ADM... or CUST...)
        const prefix = role === 'admin' ? "ADM" : "CUST";
        const randomId = prefix + Math.floor(10000 + Math.random() * 90000);

        const newUser = {
            userId: randomId,
            password: pass,
            role: role,
            name: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            mobile: document.getElementById('reg-mobile').value,
            address: document.getElementById('reg-address').value
        };

        // Save to LocalStorage
        let users = JSON.parse(localStorage.getItem('users'));
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Show Success
        const ackId = document.getElementById('ack-id');
        if(ackId) ackId.innerText = randomId;
        
        showPage('ack-page');
        this.reset();
    });
}

// --- 4. LOGIN LOGIC ---
//
function handleLogin() {
    const idInput = document.getElementById('login-id');
    const passInput = document.getElementById('login-pass');
    
    // Guard clause if elements missing
    if (!idInput || !passInput) return;

    const id = idInput.value.trim();
    const pass = passInput.value.trim();
    const errBox = document.getElementById('login-error');

    let users = JSON.parse(localStorage.getItem('users'));
    let user = users.find(u => u.userId === id && u.password === pass);

    if (user) {
        currentUser = user;
        if(errBox) errBox.innerText = "";
        showPage('home-page');
    } else {
        if(errBox) errBox.innerText = "Invalid User ID or Password.";
    }
}

function logout() {
    currentUser = null;
    showPage('login-page');
}

// --- 5. CUSTOMER: MAKE RESERVATION ---
//
// Date Validation Setup
const dateIn = document.getElementById('check-in');
const dateOut = document.getElementById('check-out');
if(dateIn && dateOut) {
    const today = new Date().toISOString().split('T')[0];
    dateIn.setAttribute('min', today);
    dateOut.setAttribute('min', today);

    dateIn.addEventListener('change', function() {
        dateOut.setAttribute('min', this.value);
    });
}

const resForm = document.getElementById('res-form');
if (resForm) {
    resForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const cin = dateIn.value;
        const cout = dateOut.value;
        
        if (new Date(cout) <= new Date(cin)) {
            alert("Check-out date must be after Check-in date.");
            return;
        }

        const roomSelect = document.getElementById('room-pref');
        const roomType = roomSelect.value;
        
        // Calculate Amount based on Room
        let amount = 100;
        if (roomType === 'Deluxe') amount = 150;
        if (roomType === 'Suite') amount = 250;

        const booking = {
            bookingId: "BK" + Math.floor(1000 + Math.random() * 9000),
            userId: currentUser.userId,
            name: document.getElementById('res-name').value,
            checkIn: cin,
            checkOut: cout,
            roomType: roomType,
            amount: amount,
            status: 'Pending', // Needs Admin Approval
            isPaid: false,
            bookingDate: new Date().toLocaleDateString()
        };

        let bookings = JSON.parse(localStorage.getItem('bookings'));
        bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(bookings));

        alert("Reservation Request Sent! Booking ID: " + booking.bookingId + "\nWait for Admin Approval.");
        showPage('home-page');
        this.reset();
    });
}

// --- 6. ADMIN: RESERVATION APPROVAL ---
//
function renderAdminApprovals() {
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    const container = document.getElementById('admin-res-table');
    
    if (!container) return;

    if (bookings.length === 0) {
        container.innerHTML = "<p>No reservations found.</p>";
    } else {
        let html = `<table>
            <tr><th>ID</th><th>User</th><th>Room</th><th>Status</th><th>Action</th></tr>`;
        
        bookings.forEach(b => {
            html += `<tr>
                <td>${b.bookingId}</td>
                <td>${b.userId}</td>
                <td>${b.roomType}</td>
                <td style="font-weight:bold; color:${getStatusColor(b.status)}">${b.status}</td>
                <td>
                    <select id="status-${b.bookingId}">
                        <option value="Pending" ${b.status==='Pending'?'selected':''}>Pending</option>
                        <option value="Approved" ${b.status==='Approved'?'selected':''}>Approve</option>
                        <option value="Rejected" ${b.status==='Rejected'?'selected':''}>Reject</option>
                    </select>
                    <button class="btn-blue" onclick="updateStatus('${b.bookingId}')">Save</button>
                </td>
            </tr>`;
        });
        html += `</table>`;
        container.innerHTML = html;
    }
    showPage('admin-res-page');
}

function updateStatus(bookingId) {
    const newStatus = document.getElementById('status-' + bookingId).value;
    let bookings = JSON.parse(localStorage.getItem('bookings'));
    const idx = bookings.findIndex(b => b.bookingId === bookingId);
    
    if(idx !== -1) {
        bookings[idx].status = newStatus;
        localStorage.setItem('bookings', JSON.stringify(bookings));
        alert(`Booking ${bookingId} updated to ${newStatus}`);
        renderAdminApprovals(); // Refresh UI
    }
}

// --- 7. ADMIN: GENERATE INVOICE ---
//
function generateAdminInvoice() {
    const input = document.getElementById('invoice-userid');
    if(!input) return;
    
    const userId = input.value.trim();
    if(!userId) { alert("Please enter a User ID"); return; }

    const bookings = JSON.parse(localStorage.getItem('bookings'));
    const userBookings = bookings.filter(b => b.userId === userId);
    
    const container = document.getElementById('admin-invoice-result');
    if(!container) return;

    if(userBookings.length === 0) {
        container.innerHTML = "<p class='error'>No records found for User ID: " + userId + "</p>";
    } else {
        let html = `<h3>Invoice for ${userId}</h3>`;
        userBookings.forEach(b => {
            html += `<div style="background:#f9f9f9; border:1px solid #ddd; padding:10px; margin-bottom:10px;">
                <p><strong>Ref:</strong> ${b.bookingId}</p>
                <p><strong>Room:</strong> ${b.roomType} ($${b.amount})</p>
                <p><strong>Status:</strong> ${b.status} | <strong>Paid:</strong> ${b.isPaid?'Yes':'No'}</p>
                <button onclick="alert('Invoice generated/printed for ${b.bookingId}')" class="btn-green">Finalize & Print</button>
            </div>`;
        });
        container.innerHTML = html;
    }
}

// --- 8. CUSTOMER: BILLING & PAYMENT ---
//
function renderBilling() {
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    // Show bills that are NOT paid and NOT Rejected
    const myBills = bookings.filter(b => b.userId === currentUser.userId && !b.isPaid && b.status !== 'Rejected');
    
    const container = document.getElementById('billing-content');
    if(!container) return;

    if (myBills.length === 0) {
        container.innerHTML = "<p>No pending bills available.</p>";
    } else {
        let html = `<table><tr><th>Booking ID</th><th>Room</th><th>Amount</th><th>Status</th><th>Action</th></tr>`;
        myBills.forEach(b => {
            // Only allow payment if Approved (optional logic, but good practice)
            const canPay = b.status === 'Approved';
            html += `<tr>
                <td>${b.bookingId}</td>
                <td>${b.roomType}</td>
                <td>$${b.amount}</td>
                <td style="color:${getStatusColor(b.status)}">${b.status}</td>
                <td>
                    ${canPay 
                      ? `<button class="btn-blue" onclick="goToPayment('${b.bookingId}', ${b.amount})">Pay Bill</button>` 
                      : `<span style='color:gray'>Wait for Approval</span>`
                    }
                </td>
            </tr>`;
        });
        html += `</table>`;
        container.innerHTML = html;
    }
    showPage('billing-page');
}

function goToPayment(bookingId, amount) {
    currentPayBookingId = bookingId;
    document.getElementById('pay-user').innerText = currentUser.name;
    document.getElementById('pay-amount').innerText = "$" + amount;
    showPage('payment-page');
}

const payForm = document.getElementById('payment-form');
if (payForm) {
    payForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 1. Process Payment
        const txnId = "TXN" + Math.floor(Math.random() * 1000000000);
        alert("Payment Successful!\nTransaction ID: " + txnId);

        // 2. Update Booking Status
        let bookings = JSON.parse(localStorage.getItem('bookings'));
        const idx = bookings.findIndex(b => b.bookingId === currentPayBookingId);
        if(idx !== -1) {
            bookings[idx].isPaid = true;
            localStorage.setItem('bookings', JSON.stringify(bookings));
        }

        // 3. Notification Popup
        this.reset();
        showPage('home-page');
        const popup = document.getElementById('checkout-popup');
        if(popup) popup.classList.remove('hidden');
    });
}

function closePopup() {
    const popup = document.getElementById('checkout-popup');
    if(popup) popup.classList.add('hidden');
}

// --- 9. DATA DISPLAY (HISTORY/BOOKINGS) ---
//
function renderBookings() {
    // Customer Upcoming
    renderData('Upcoming Bookings', b => b.userId === currentUser.userId && new Date(b.checkIn) >= new Date());
}

function renderHistory() {
    // Customer History
    renderData('Booking History', b => b.userId === currentUser.userId);
}

function searchUserHistory() {
    // Admin View History
    const input = document.getElementById('history-userid');
    if(!input) return;
    const uid = input.value.trim();
    if(!uid) { alert("Enter User ID"); return; }
    
    renderData(`History for User: ${uid}`, b => b.userId === uid);
    // Ensure we are showing the data page (if called from admin search)
    showPage('data-display-page'); 
}

function renderData(title, filterFn) {
    const bookings = JSON.parse(localStorage.getItem('bookings'));
    const filtered = bookings.filter(filterFn);
    
    const container = document.getElementById('data-table-container');
    const titleEl = document.getElementById('data-title');
    if(titleEl) titleEl.innerText = title;

    if (filtered.length === 0) {
        container.innerHTML = "<p>No records found.</p>";
    } else {
        let html = `<table><tr><th>ID</th><th>Dates</th><th>Room</th><th>Status</th><th>Paid</th></tr>`;
        filtered.forEach(b => {
            html += `<tr>
                <td>${b.bookingId}</td>
                <td>${b.checkIn} to ${b.checkOut}</td>
                <td>${b.roomType}</td>
                <td style="color:${getStatusColor(b.status)}">${b.status}</td>
                <td>${b.isPaid?'<b style="color:green">Yes</b>':'<b style="color:red">No</b>'}</td>
            </tr>`;
        });
        html += `</table>`;
        container.innerHTML = html;
    }
    showPage('data-display-page');
}

// --- 10. ROOM STATUS (ADMIN) & COMPLAINTS (CUSTOMER) ---
//
function viewRoomStatus() {
    const input = document.getElementById('status-cust-id');
    const custId = input ? input.value : "N/A";
    
    const res = document.getElementById('status-results');
    if(res) {
        res.innerHTML = `
            <p><strong>Tracking for Customer ID: ${custId}</strong></p>
            <table>
                <tr><th>Room</th><th>Status</th><th>Price</th></tr>
                <tr><td>101 (Deluxe)</td><td class="booked">Booked</td><td>$150</td></tr>
                <tr><td>102 (Standard)</td><td class="vacant">Vacant</td><td>$100</td></tr>
                <tr><td>201 (Suite)</td><td class="vacant">Vacant</td><td>$250</td></tr>
            </table>
        `;
    }
}

//
function handleComplaint(e) {
    e.preventDefault();
    alert("Complaint Registered Successfully. Our team will contact you.");
    showPage('home-page');
}

// --- UTILS ---
function getStatusColor(status) {
    if(status === 'Approved') return 'green';
    if(status === 'Rejected') return 'red';
    return 'orange'; // Pending
}