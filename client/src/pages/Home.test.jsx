import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

// Mock useSound
vi.mock('../contexts/SoundContext', () => ({
    useSound: () => ({
        playClick: vi.fn(),
    }),
}));

describe('Home Page', () => {
    it('renders the title', () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
        expect(screen.getByText('DECANTRY')).toBeInTheDocument();
    });

    it('renders game mode links', () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
        expect(screen.getByText('Casual Mode')).toBeInTheDocument();
        expect(screen.getByText('Expert Mode')).toBeInTheDocument();
        expect(screen.getByText('Timed Mode')).toBeInTheDocument();
        expect(screen.getByText('Country of the Day')).toBeInTheDocument();
    });
});
