import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConflictDialog } from './ConflictDialog';

describe('ConflictDialog', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        onReload: vi.fn(),
        onForceSave: vi.fn(),
    };

    it('renders conflict dialog when open', () => {
        render(<ConflictDialog {...defaultProps} />);
        expect(screen.getByText('Conflict Detected')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<ConflictDialog {...defaultProps} open={false} />);
        expect(screen.queryByText('Conflict Detected')).not.toBeInTheDocument();
    });

    it('displays conflict explanation text', () => {
        render(<ConflictDialog {...defaultProps} />);
        expect(
            screen.getByText(/modified by another user or session/)
        ).toBeInTheDocument();
    });

    it('shows Reload and Force Save buttons', () => {
        render(<ConflictDialog {...defaultProps} />);
        expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /force save/i })).toBeInTheDocument();
    });

    it('calls onReload when Reload button is clicked', async () => {
        const user = userEvent.setup();
        const onReload = vi.fn();
        render(<ConflictDialog {...defaultProps} onReload={onReload} />);

        await user.click(screen.getByRole('button', { name: /reload/i }));

        expect(onReload).toHaveBeenCalledTimes(1);
    });

    it('calls onForceSave when Force Save button is clicked', async () => {
        const user = userEvent.setup();
        const onForceSave = vi.fn();
        render(<ConflictDialog {...defaultProps} onForceSave={onForceSave} />);

        await user.click(screen.getByRole('button', { name: /force save/i }));

        expect(onForceSave).toHaveBeenCalledTimes(1);
    });

    it('disables buttons when isLoading is true', () => {
        render(<ConflictDialog {...defaultProps} isLoading={true} />);

        expect(screen.getByRole('button', { name: /reload/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /force save/i })).toBeDisabled();
    });

    it('shows resolution options explanation', () => {
        render(<ConflictDialog {...defaultProps} />);
        expect(screen.getByText(/Discard your local changes/)).toBeInTheDocument();
        expect(screen.getByText(/Override the server version/)).toBeInTheDocument();
    });

    it('has accessible alert icon', () => {
        render(<ConflictDialog {...defaultProps} />);
        // The AlertTriangle icon is hidden from screen readers
        const icon = document.querySelector('[aria-hidden="true"]');
        expect(icon).toBeInTheDocument();
    });
});
