// Dashboard JavaScript

// Get DOM elements
const totalEventsEl = document.getElementById('total-events');
const registeredList = document.getElementById('registered-list');
const emptyState = document.getElementById('empty-state');

// Display registered events
function displayRegisteredEvents() {
    const registrations = getRegistrations();
    
    // Update statistics
    totalEventsEl.textContent = registrations.length;
    
    // Check if empty
    if (registrations.length === 0) {
        registeredList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    // Display registrations
    registeredList.style.display = 'block';
    emptyState.style.display = 'none';
    registeredList.innerHTML = '';
    
    registrations.forEach(registration => {
        const event = getEventById(registration.eventId);
        if (!event) return;
        
        const card = document.createElement('div');
        card.className = 'registration-card';
        card.innerHTML = `
            <h3>${event.title}</h3>
            <div class="registration-info">
                <strong>Date:</strong> ${formatDate(event.date)}<br>
                <strong>Time:</strong> ${event.time}<br>
                <strong>Location:</strong> ${event.location}<br>
                <strong>Your Name:</strong> ${registration.name}<br>
                <strong>Email:</strong> ${registration.email}<br>
                <strong>Phone:</strong> ${registration.phone}
            </div>
            <span class="status-badge">Confirmed</span>
        `;
        
        registeredList.appendChild(card);
    });
}

// Initialize dashboard
displayRegisteredEvents();
