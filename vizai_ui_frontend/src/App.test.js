import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login title', () => {
  render(<App />);
  const title = screen.getByText(/Sign in/i);
  expect(title).toBeInTheDocument();
});
