import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { useFocusTrap } from '../useFocusTrap';

const Trap = ({ active, empty = false }: { active: boolean; empty?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(active, ref);
  return (
    <div ref={ref} tabIndex={-1} data-testid="trap">
      {!empty && (
        <>
          <button type="button">first</button>
          <button type="button">last</button>
        </>
      )}
    </div>
  );
};

const Harness = ({ active, empty }: { active: boolean; empty?: boolean }) => (
  <>
    <button type="button">outside</button>
    <Trap active={active} {...(empty === undefined ? {} : { empty })} />
  </>
);

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element when activated', () => {
    render(<Harness active />);
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('cycles Tab and Shift+Tab inside the container', async () => {
    const user = userEvent.setup();
    render(<Harness active />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
  });

  it('ignores other keys', async () => {
    const user = userEvent.setup();
    render(<Harness active />);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('focuses the container and blocks Tab when nothing inside is focusable', async () => {
    const user = userEvent.setup();
    render(<Harness active empty />);
    expect(screen.getByTestId('trap')).toHaveFocus();
    await user.tab();
    expect(screen.getByTestId('trap')).toHaveFocus();
  });

  it('restores focus to the previously focused element on deactivation', () => {
    const { rerender } = render(<Harness active={false} />);
    screen.getByRole('button', { name: 'outside' }).focus();

    rerender(<Harness active />);
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();

    rerender(<Harness active={false} />);
    expect(screen.getByRole('button', { name: 'outside' })).toHaveFocus();
  });
});
