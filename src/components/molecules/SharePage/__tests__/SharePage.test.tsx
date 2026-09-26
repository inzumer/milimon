import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTranslations } from '@i18n';
import { setAnalyticsSink } from '@utils';
import { SharePage } from '../SharePage';

const labels = getTranslations('en', 'common').share;
const URL_ = 'https://inzumer.github.io/milimon/en/blog/milicitos';

const renderShare = () =>
  render(<SharePage url={URL_} title="Milicitos · Milimon" labels={labels} />);

describe('SharePage', () => {
  afterEach(() => {
    setAnalyticsSink(null);
    vi.unstubAllGlobals();
  });

  it('should link to every network in a new tab and track the choice', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    renderShare();
    const whatsapp = screen.getByRole('link', { name: /WhatsApp/ });
    expect(whatsapp).toHaveAttribute('target', '_blank');
    expect(whatsapp.getAttribute('href')).toContain(encodeURIComponent(URL_));
    expect(screen.getByRole('link', { name: 'Email' })).not.toHaveAttribute('target');
    whatsapp.addEventListener('click', (event) => event.preventDefault());
    await userEvent.setup().click(whatsapp);
    expect(sink).toHaveBeenCalledWith('page_shared', {
      method: 'whatsapp',
      path: '/milimon/en/blog/milicitos',
    });
  });

  it('should use the device share sheet when available', async () => {
    const share = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { ...navigator, share });
    renderShare();
    await userEvent.setup().click(screen.getByRole('button', { name: labels.native }));
    expect(share).toHaveBeenCalledWith({ title: 'Milicitos · Milimon', url: URL_ });
  });

  it('should ignore a dismissed share sheet', async () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    vi.stubGlobal('navigator', {
      ...navigator,
      share: vi.fn(async () => Promise.reject(new Error('abort'))),
    });
    renderShare();
    await userEvent.setup().click(screen.getByRole('button', { name: labels.native }));
    expect(sink).not.toHaveBeenCalled();
  });

  it('should copy the link and say so for a while', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderShare();
    await user.click(screen.getByRole('button', { name: labels.copy }));
    expect(writeText).toHaveBeenCalledWith(URL_);
    expect(screen.getByRole('status')).toHaveTextContent(labels.copied);
    await vi.advanceTimersByTimeAsync(3_000);
    await vi.waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement());
    vi.useRealTimers();
  });

  it('should stay quiet when the clipboard refuses', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn(async () => Promise.reject(new Error('denied'))) },
    });
    renderShare();
    await user.click(screen.getByRole('button', { name: labels.copy }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
