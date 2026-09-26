import { render, screen } from '@testing-library/react';
import { MilicitosRating } from '../MilicitosRating';

describe('MilicitosRating', () => {
  it('should show five milicitos with the earned ones highlighted and a spoken rating', () => {
    render(<MilicitosRating rating={3} label="3 de 5 milicitos" imageSrc="/star.webp" />);
    const rating = screen.getByRole('img', { name: '3 de 5 milicitos' });
    const stars = rating.querySelectorAll('img');
    expect(stars).toHaveLength(5);
    expect([...stars].filter((star) => star.className.includes('grayscale'))).toHaveLength(2);
  });
});
