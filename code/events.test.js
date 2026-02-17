/**
 * @jest-environment jsdom
 */

import '../events.js';

beforeEach(() => {
  localStorage.clear();
  initializeStorage();
});

describe("Event Logic Tests", () => {

  test("should load sample events", () => {
    const events = getEvents();
    expect(events.length).toBe(6);
  });

  test("should return correct event by ID", () => {
    const event = getEventById(1);
    expect(event.title).toBe("Web Development Bootcamp");
  });

  test("should return undefined for invalid event ID", () => {
    const event = getEventById(999);
    expect(event).toBeUndefined();
  });

  test("should calculate available seats correctly", () => {
    const event = getEventById(1);
    const seats = getAvailableSeats(1);

    expect(seats).toBe(event.capacity);
  });

  test("formatDate should return formatted string", () => {
    const formatted = formatDate("2026-03-15");
    expect(formatted).toContain("2026");
  });

});
