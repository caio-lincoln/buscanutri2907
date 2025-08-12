// Jest setup file
import { loadEnvConfig } from '@next/env'

// Load environment variables
loadEnvConfig(process.cwd())

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock window.sessionStorage
const mockStorage = {
  store: {},
  getItem: jest.fn((key) => mockStorage.store[key] || null),
  setItem: jest.fn((key, value) => {
    mockStorage.store[key] = value
  }),
  removeItem: jest.fn((key) => {
    delete mockStorage.store[key]
  }),
  clear: jest.fn(() => {
    mockStorage.store = {}
  }),
  get length() {
    return Object.keys(mockStorage.store).length
  },
  key: jest.fn((index) => Object.keys(mockStorage.store)[index] || null)
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage,
  writable: true
})

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
  writable: true
})

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
}

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
})

// Reset mocks before each test
beforeEach(() => {
  mockStorage.store = {}
  jest.clearAllMocks()
})
