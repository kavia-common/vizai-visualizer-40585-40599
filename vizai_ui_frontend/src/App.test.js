import { render, screen } from '@testing-library/react';
import App from './App';

test('renders VizAI auth screen', () => {
  render(<App />);
  // It should render either Login or Registration title depending on route/default
  const login = screen.queryByText(/Welcome to VizAI/i);
  const register = screen.queryByText(/Create Your VizAI Account/i);
  expect(Boolean(login || register)).toBe(true);
});
