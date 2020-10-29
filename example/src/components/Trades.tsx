import * as React from 'react';

import { Side, TTrade } from '../../../dist';
import { Loading } from './Loading';
import { num } from '../utils';

export const Trades = ({ trades }: { trades: TTrade[] | null }) => {
  const lastRelativeTime = React.useRef<string>('');
  return (
    <div className="h-full py-2 text-xs font-mono">
      {trades == null && <Loading />}
      {trades != null &&
        trades.map(t => {
          const newRT = getRelativeTime(t.timestamp / 1000);
          const hideTime = lastRelativeTime.current === newRT;
          lastRelativeTime.current = newRT;
          return <Trade key={t.id} trade={t} hideTime={hideTime} />;
        })}
    </div>
  );
};

const Trade = ({
  trade,
  hideTime = false,
}: {
  trade: TTrade;
  hideTime?: boolean;
}) => {
  const { size, side, price, timestamp } = trade;

  const [relativeTime, setRelativeTime] = React.useState<string>('');
  React.useEffect(() => {
    if (!hideTime) {
      const interval = setInterval(() => {
        setRelativeTime(() => getRelativeTime(timestamp / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timestamp, hideTime]);

  return (
    <div className="flex">
      <div className={`ml-4`}>
        <Price price={price} side={side} />
      </div>
      <div
        className="w-6 mx-3 text-black-500 font-light text-right"
        style={{ fontSize: '0.65rem' }}
      >
        {hideTime ? '' : relativeTime}
      </div>
      <div className="pl-1 flex-1 text-black-300">
        <Background
          color={side === Side.SELL ? 'sell-dark' : 'buy-dark'}
          opacity={50}
          size={size}
          maxSize={50000}
        >
          <div className="pr-4">
            <Size size={size} />
          </div>
        </Background>
      </div>
    </div>
  );
};

function getRelativeTime(timestamp: number): string {
  const now = Math.ceil(Date.now() / 1000);
  const rt = Math.floor(now - timestamp);
  if (rt < 5) return '';

  const minrt = Math.floor(rt / 60);
  if (minrt > 0) return `${minrt}m`;

  return `${rt}s`;
}

export const Size = ({ size }: { size: number }) => {
  return <div className="w-full text-right">{num.pretty(size)}</div>;
};

export const Price = ({ price, side }: { price: number; side?: Side }) => {
  const color = (() => {
    if (side == null) return 'black-300';
    return side === Side.BUY ? 'buy' : 'sell';
  })();
  const [decPrice, remPrice] = num.pretty(price, 1).split(',');

  return (
    <div className={`w-full text-right font-semibold text-${color}`}>
      <span>{decPrice}</span>
      <span className={`${remPrice === '0' ? `text-${color}-dark` : ''}`}>
        .{remPrice}
      </span>
    </div>
  );
};

export const Background = ({
  color,
  opacity,
  maxSize,
  size,
  children,
}: {
  color: string;
  opacity: number;
  maxSize: number;
  size: number;
  children: React.ReactChild;
}) => {
  const bgWidth = Math.round((size / maxSize) * 95); // 95 instead of 100 to make it pretty
  return (
    <div className="h-full flex-1 relative">
      <div className="z-10 absolute w-full" style={{ top: 0, right: 0 }}>
        {children}
      </div>
      <div
        className={`bg-${color} opacity-${opacity} h-full border-b border-t border-black-800`}
        style={{ width: `${bgWidth}%`, float: 'right' }} // transform: `scaleX(${0.2})`
      ></div>
    </div>
  );
};
