import { render, screen } from '@testing-library/react';
import Loader from './Loader.jsx';

describe('Loader', () => {
  it('renders with an accessible status role and default label', () => {
    render(<Loader />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('uses a custom label when provided', () => {
    render(<Loader label="Loading ward data" />);
    expect(screen.getByRole('status', { name: 'Loading ward data' })).toBeInTheDocument();
  });

  it('applies the size modifier class', () => {
    render(<Loader size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('loader--lg');
  });
});
