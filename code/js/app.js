// Main Application JavaScript

// Get DOM elements
const eventsList = document.getElementById('events-list');
const eventModal = document.getElementById('event-modal');
const registerModal = document.getElementById('register-modal');
const modalDetails = document.getElementById('modal-details');
const registerForm = document.getElementById('register-form');
const successMsg = document.getElementById('success-msg');

// Close buttons
const closeBtn = document.querySelector('.close');
const closeRegisterBtn = document.querySelector('.close-register');

// Display all events
function displayEvents() {
    const events = getEvents();
    eventsList.innerHTML = '';
    
    events.forEach(event => {
        const availableSeats = getAvailableSeats(event.id);
        const seatClass = availableSeats === 0 ? 'full' : 
                         availableSeats <= 5 ? 'limited' : '';
        
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.innerHTML = `
            <h3>${event.title}</h3>
            <div class="event-info">
                <strong>Date:</strong> ${formatDate(event.date)}<br>
                <strong>Time:</strong> ${event.time}<br>
                <strong>Location:</strong> ${event.location}<br>
                <strong>Organizer:</strong> ${event.organizer}
            </div>
            <span class="seats ${seatClass}">
                ${availableSeats} seats available
            </span>
        `;
        
        eventCard.addEventListener('click', () => showEventDetails(event.id));
        eventsList.appendChild(eventCard);
    });
}

// Show event details in modal
function showEventDetails(eventId) {
    const event = getEventById(eventId);
    if (!event) return;
    
    const availableSeats = getAvailableSeats(eventId);
    const isFull = availableSeats === 0;
    
    modalDetails.innerHTML = `
        <h2>${event.title}</h2>
        <p><strong>Date:</strong> ${formatDate(event.date)}</p>
        <p><strong>Time:</strong> ${event.time}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Organizer:</strong> ${event.organizer}</p>
        <p><strong>Category:</strong> ${event.category}</p>
        <p><strong>Description:</strong> ${event.description}</p>
        <p><strong>Capacity:</strong> ${event.capacity}</p>
        <p><strong>Available Seats:</strong> ${availableSeats}</p>
        <br>
        <button class="btn-primary" id="register-btn" 
                onclick="openRegistrationForm(${eventId})"
                ${isFull ? 'disabled' : ''}>
            ${isFull ? 'Event Full' : 'Register Now'}
        </button>
    `;
    
    eventModal.style.display = 'block';
}

// Open registration form
function openRegistrationForm(eventId) {
    eventModal.style.display = 'none';
    registerModal.style.display = 'block';
    document.getElementById('event-id').value = eventId;
    registerForm.reset();
}

// Handle registration form submission
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const eventId = parseInt(document.getElementById('event-id').value);
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }
    
    // Check if already registered
    if (isAlreadyRegistered(email, eventId)) {
        alert('You are already registered for this event!');
        return;
    }
    
    // Check if seats available
    if (getAvailableSeats(eventId) === 0) {
        alert('Sorry, this event is full!');
        return;
    }
    
    // Create registration
    const registration = {
        id: Date.now(),
        eventId: eventId,
        name: name,
        email: email,
        phone: phone,
        registrationDate: new Date().toISOString()
    };
    
    // Save registration
    addRegistration(registration);
    
    // Close modal and show success message
    registerModal.style.display = 'none';
    showSuccessMessage();
    
    // Refresh event list to update seat counts
    displayEvents();
});

// Show success message
function showSuccessMessage() {
    successMsg.style.display = 'block';
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);
}

// Close modals when clicking X
closeBtn.addEventListener('click', () => {
    eventModal.style.display = 'none';
});

closeRegisterBtn.addEventListener('click', () => {
    registerModal.style.display = 'none';
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === eventModal) {
        eventModal.style.display = 'none';
    }
    if (e.target === registerModal) {
        registerModal.style.display = 'none';
    }
});

// Initialize: Display events on page load
displayEvents();
