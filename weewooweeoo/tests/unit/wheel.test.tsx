import { render, screen, fireEvent } from '@testing-library/react';
import { Wheel, type WheelSkinConfig } from '../../entrypoints/content/Wheel';

const TEST_CONFIG: WheelSkinConfig = {
  icons: {
    explain: { type: 'image', value: 'icon-explain.svg' },
    summary: { type: 'image', value: 'icon-summary.svg' },
    search:  { type: 'image', value: 'icon-search.svg' },
  },
  colors: {
    explain: { bg: '#2d4a1a', glow: 'rgba(100,200,80,0.6)',  text: '#c8f0b0' },
    summary: { bg: '#1a3a5c', glow: 'rgba(64,150,255,0.6)',  text: '#b8d9ff' },
    search:  { bg: '#4a1a5c', glow: 'rgba(180,80,240,0.6)',  text: '#e0c0ff' },
  },
  fallbackColor: { bg: '#2a2a2a', glow: 'rgba(180,180,180,0.4)', text: '#e0e0e0' },
  wheelGlow:    'rgba(100,140,255,0.25)',
  centerBg:     'radial-gradient(circle at 35% 35%, #4a4a5a, #1a1a24)',
  centerBorder: '2px solid rgba(255,255,255,0.15)',
  ringBorder:   '1px solid rgba(255,255,255,0.08)',
  centerIcon:   { type: 'image', value: 'icon-wheel.svg' },
};

test('renders slots and fires onPick', () => {
  const onPick = jest.fn();
  render(
    <Wheel slots={['explain', 'summary', 'search']} onPick={onPick} config={TEST_CONFIG} />,
  );
  fireEvent.click(screen.getByText('Summary'));
  expect(onPick).toHaveBeenCalledWith('summary');
});
