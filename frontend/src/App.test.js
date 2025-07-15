import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock fetch and localStorage
beforeEach(() => {
  jest.spyOn(window, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ token: 'test-token', account: { accountNumber: '123456', balance: 1000 }, transactions: [], history: [], email: 'test@user.com', accountNumber: '123456' })
    })
  );
  Storage.prototype.getItem = jest.fn(() => null);
  Storage.prototype.setItem = jest.fn();
  Storage.prototype.removeItem = jest.fn();
});
afterEach(() => {
  window.fetch.mockRestore();
});

test('renders login form', () => {
  render(<App />);
  expect(screen.getByTestId('login-page')).toBeInTheDocument();
  expect(screen.getByTestId('login-form')).toBeInTheDocument();
});

test('can navigate to registration page', () => {
  render(<App />);
  fireEvent.click(screen.getByTestId('to-register'));
  expect(screen.getByTestId('register-page')).toBeInTheDocument();
});

test('shows dashboard after login', async () => {
  render(<App />);
  fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'test@user.com' } });
  fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'password' } });
  fireEvent.click(screen.getByTestId('login-submit'));
  await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
  expect(screen.getByTestId('account-info')).toBeInTheDocument();
});

test('shows nav bar when logged in', async () => {
  Storage.prototype.getItem = jest.fn(() => 'test-token');
  render(<App />);
  await waitFor(() => expect(screen.getByTestId('nav-bar')).toBeInTheDocument());
});

test('shows profile page', async () => {
  Storage.prototype.getItem = jest.fn(() => 'test-token');
  render(<App />);
  fireEvent.click(screen.getByTestId('nav-profile'));
  await waitFor(() => expect(screen.getByTestId('profile-page')).toBeInTheDocument());
  expect(screen.getByTestId('profile-email')).toHaveTextContent('test@user.com');
});
