import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiInbox } from 'react-icons/fi';
import EmptyState from './EmptyState.jsx';

describe('EmptyState', () => {
  it('renders the message', () => {
    render(<EmptyState message="No alerts for this ward." />);
    expect(screen.getByText('No alerts for this ward.')).toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    const { container } = render(<EmptyState icon={FiInbox} message="Nothing here." />);
    expect(container.querySelector('.empty-state__icon')).toBeInTheDocument();
  });

  it('does not render an action button when no action is given', () => {
    render(<EmptyState message="Nothing here." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders and fires the action button when actionLabel and onAction are given', async () => {
    const onAction = vi.fn();
    render(<EmptyState message="Nothing here." actionLabel="Retry" onAction={onAction} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
