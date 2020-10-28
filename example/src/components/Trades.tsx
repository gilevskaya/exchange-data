import * as React from 'react';
import humanize from 'humanize';

import { Side, TTrade } from '../../../dist';
import { Loading } from './Loading';
import { num } from '../utils';

export const Trades = ({ trades }: { trades: TTrade[] | null }) => {
  const lastRelativeTime = React.useRef<string>('');
  return (
    <div className="h-full p-3">
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
  const color = side === Side.BUY ? 'buy' : 'sell';
  const [decPrice, remPrice] = num.pretty(price, 1).split(',');

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
    <div className="flex text-sm items-end">
      <div className={`pl-2 pr-1 flex-1 text-right`}>{num.pretty(size)}</div>
      <div className={`pl-2 pr-1 w-2/5 text-right font-semibold text-${color}`}>
        <span>{decPrice}</span>
        <span className={`${remPrice === '0' ? `text-${color}-dark` : ''}`}>
          .{remPrice}
        </span>
      </div>
      <div className="w-6 pl-2 pr-1 text-black-500 font-light text-xs text-right">
        {hideTime ? '' : relativeTime}
      </div>
    </div>
  );
};

// TODO: redo this function without humanize
function getRelativeTime(timestamp: number): string {
  const rt = humanize.relativeTime(timestamp);
  if (rt === 'just now' || rt === 'now') return '';
  else if (rt === 'about a minute ago') return '1m';
  const [num, descr] = rt.split(' ');
  if (!descr || !descr[0]) {
    console.log('weird time:', rt);
    return '';
  }
  return `${num}${descr[0]}`;
}
