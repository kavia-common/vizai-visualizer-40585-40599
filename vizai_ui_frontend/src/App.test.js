import { render, screen } from '@testing-library/react';
import App from './App';

test('renders VizAI login title', () => {
  render(<App />);
  const title = screen.getByText(/Sign in to VizAI/i);
  expect(title).toBeInTheDocument();
});
