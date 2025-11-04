import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest'; // Import vi from vitest
import KeywordInput from '../src/components/KeywordInput';

describe('KeywordInput', () => {
  it('renders input and button', () => {
    render(<KeywordInput onGenerate={() => {}} />);
    expect(screen.getByPlaceholderText(/Enter keyword/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate To-Do List/i })).toBeInTheDocument();
  });

  it('calls onGenerate with keyword when form is submitted', () => {
    const mockOnGenerate = vi.fn(); // Use vi.fn()
    render(<KeywordInput onGenerate={mockOnGenerate} />);
    const input = screen.getByPlaceholderText(/Enter keyword/i);
    const button = screen.getByRole('button', { name: /Generate To-Do List/i });

    fireEvent.change(input, { target: { value: 'test keyword' } });
    fireEvent.click(button);

    expect(mockOnGenerate).toHaveBeenCalledTimes(1);
    expect(mockOnGenerate).toHaveBeenCalledWith('test keyword');
    expect(input.value).toBe(''); // Input should be cleared
  });

  it('does not call onGenerate if keyword is empty', () => {
    const mockOnGenerate = vi.fn(); // Use vi.fn()
    render(<KeywordInput onGenerate={mockOnGenerate} />);
    const button = screen.getByRole('button', { name: /Generate To-Do List/i });

    fireEvent.click(button);

    expect(mockOnGenerate).not.toHaveBeenCalled();
  });
});
