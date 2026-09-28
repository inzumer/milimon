import { render, screen } from '@testing-library/react';
import { Notice } from '../Notice';

describe('Notice', () => {
  it('should render a message box keeping its role and extra classes', () => {
    render(
      <Notice role="alert" className="mt-2">
        Try again
      </Notice>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Try again');
    expect(screen.getByRole('alert')).toHaveClass('rounded-lg', 'p-4', 'mt-2');
  });
});
