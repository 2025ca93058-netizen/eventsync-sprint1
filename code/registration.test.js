/**
 * @jest-environment jsdom
 */

import '../events.js';

beforeEach(() => {
  // Reset localStorage before each test
  localStorage.clear();
  initializeStorage();
});

describe("Registration Logic Tests", () => {

  test("should add a new registration successfully", () => {
    const registration = {
      id: 1,
      eventId: 1,
      name: "Alex",
      email: "alex@mail.com",
      phone: "1234567890"
    };

    const result = addRegistration(registration);
    const registrations = getRegistrations();

    expect(result).toBe(true);
    expect(registrations.length).toBe(1);
    expect(registrations[0].email).toBe("alex@mail.com");
  });

  test("should detect already registered user", () => {
    const registration = {
      id: 1,
      eventId: 1,
      name: "Alex",
      email: "alex@mail.com",
      phone: "1234567890"
    };

    addRegistration(registration);

    const exists = isAlreadyRegistered("alex@mail.com", 1);

    expect(exists).toBe(true);
  });

  test("should not detect registration for different event", () => {
    const registration = {
      id: 1,
      eventId: 1,
      name: "Alex",
      email: "alex@mail.com",
      phone: "1234567890"
    };

    addRegistration(registration);

    const exists = isAlreadyRegistered("alex@mail.com", 2);

    expect(exists).toBe(false);
  });

  test("should reduce available seats after registration", () => {
    const initialSeats = getAvailableSeats(1);

    addRegistration({
      id: 1,
      eventId: 1,
      name: "Test User",
      email: "test@mail.com",
      phone: "1234567890"
    });

    const updatedSeats = getAvailableSeats(1);

    expect(updatedSeats).toBe(initialSeats - 1);
  });

});
