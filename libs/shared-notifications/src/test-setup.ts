import { vi } from 'vitest';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn(),
    verify: vi.fn(),
  })),
}));

// Mock twilio
vi.mock('twilio', () => vi.fn(() => ({
  messages: {
    create: vi.fn(),
  },
})));

// Mock firebase-admin
vi.mock('firebase-admin', () => ({
  messaging: vi.fn(() => ({
    send: vi.fn(),
    sendMulticast: vi.fn(),
  })),
  initializeApp: vi.fn(),
}));

// Mock socket.io
vi.mock('socket.io', () => ({
  Server: vi.fn(() => ({
    emit: vi.fn(),
    to: vi.fn(() => ({
      emit: vi.fn(),
    })),
  })),
}));

// Mock ws
vi.mock('ws', () => ({
  WebSocketServer: vi.fn(() => ({
    on: vi.fn(),
    clients: new Set(),
  })),
}));

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
