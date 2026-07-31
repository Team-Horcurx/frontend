import { render, screen } from '@testing-library/react';
import AppSplash from './AppSplash.jsx';

describe('AppSplash', () => {
  it('renders the wordmark and loading hint', () => {
    render(<AppSplash />);
    expect(screen.getByText('GVMC Detection')).toBeInTheDocument();
    expect(screen.getByText('Preparing satellite intelligence…')).toBeInTheDocument();
  });
});
