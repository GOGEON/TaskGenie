import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickAddModal from '../src/components/QuickAddModal';

const projects = [{ id: 'p1', keyword: '업무', items: [] }];

const setup = (props = {}) => {
  const onSubmit = vi.fn();
  render(
    <QuickAddModal isOpen onClose={() => {}} onSubmit={onSubmit} projects={projects} activeProjectId="p1" {...props} />
  );
  return { onSubmit, input: screen.getByRole('textbox') };
};

describe('QuickAddModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<QuickAddModal isOpen={false} onClose={() => {}} onSubmit={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('selecting a priority writes the tag into the text', () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: '보고서 작성' } });
    fireEvent.click(screen.getByRole('button', { name: '우선순위' }));
    fireEvent.click(screen.getByRole('button', { name: '높음' }));
    expect(input).toHaveValue('보고서 작성 #높음');
  });

  it('submits trimmed text with project and AI flag, then resets', () => {
    const { onSubmit, input } = setup();
    fireEvent.change(input, { target: { value: '  운동하기  ' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(onSubmit).toHaveBeenCalledWith('운동하기', 'p1', null, true);
    expect(input).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
