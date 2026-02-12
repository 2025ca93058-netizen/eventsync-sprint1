// Sample Events Data
const sampleEvents = [
    {
        id: 1,
        title: "Web Development Bootcamp",
        date: "2026-03-15",
        time: "10:00 AM",
        location: "Tech Hub, Mumbai",
        organizer: "Code Academy",
        description: "Learn modern web development with HTML, CSS, and JavaScript. Perfect for beginners!",
        capacity: 50,
        category: "Technology"
    },
    {
        id: 2,
        title: "Digital Marketing Workshop",
        date: "2026-03-20",
        time: "2:00 PM",
        location: "Business Center, Pune",
        organizer: "Marketing Pro",
        description: "Master digital marketing strategies, SEO, and social media marketing.",
        capacity: 30,
        category: "Business"
    },
    {
        id: 3,
        title: "AI & Machine Learning Seminar",
        date: "2026-03-25",
        time: "11:00 AM",
        location: "Innovation Lab, Bangalore",
        organizer: "Tech Institute",
        description: "Explore the fundamentals of AI and machine learning with industry experts.",
        capacity: 40,
        category: "Technology"
    },
    {
        id: 4,
        title: "Startup Networking Event",
        date: "2026-04-01",
        time: "6:00 PM",
        location: "Co-working Space, Delhi",
        organizer: "Startup India",
        description: "Connect with entrepreneurs, investors, and fellow startup enthusiasts.",
        capacity: 60,
        category: "Networking"
    },
    {
        id: 5,
        title: "Photography Masterclass",
        date: "2026-04-05",
        time: "9:00 AM",
        location: "Art Studio, Chennai",
        organizer: "Creative Arts",
        description: "Learn professional photography techniques from award-winning photographers.",
        capacity: 25,
        category: "Arts"
    },
    {
        id: 6,
        title: "Data Science Conference",
        date: "2026-04-10",
        time: "10:00 AM",
        location: "Convention Center, Hyderabad",
        organizer: "Data Society",
        description: "Annual conference featuring talks on data science, analytics, and big data.",
        capacity: 100,
        category: "Technology"
    }
];

// Initialize localStorage with sample events and registrations
function initializeStorage() {
    if (!localStorage.getItem('events')) {
        localStorage.setItem('events', JSON.stringify(sampleEvents));
    }
    
    if (!localStorage.getItem('registrations')) {
        localStorage.setItem('registrations', JSON.stringify([]));
    }
}

// Get all events
function getEvents() {
    const events = localStorage.getItem('events');
    return events ? JSON.parse(events) : sampleEvents;
}

// Get event by ID
function getEventById(id) {
    const events = getEvents();
    return events.find(event => event.id === parseInt(id));
}

// Get available seats for an event
function getAvailableSeats(eventId) {
    const event = getEventById(eventId);
    if (!event) return 0;
    
    const registrations = getRegistrations();
    const eventRegistrations = registrations.filter(reg => reg.eventId === parseInt(eventId));
    
    return event.capacity - eventRegistrations.length;
}

// Get all registrations
function getRegistrations() {
    const registrations = localStorage.getItem('registrations');
    return registrations ? JSON.parse(registrations) : [];
}

// Add new registration
function addRegistration(registration) {
    const registrations = getRegistrations();
    registrations.push(registration);
    localStorage.setItem('registrations', JSON.stringify(registrations));
    return true;
}

// Check if user already registered for event
function isAlreadyRegistered(email, eventId) {
    const registrations = getRegistrations();
    return registrations.some(reg => 
        reg.email.toLowerCase() === email.toLowerCase() && 
        reg.eventId === parseInt(eventId)
    );
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Initialize storage when page loads
initializeStorage();
