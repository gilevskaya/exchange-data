import * as React from 'react';

import { Exchange, ReadyState } from '../../../dist';

export const ExchangeHeader = ({
  exchange,
  readyState,
}: {
  exchange: Exchange;
  readyState: ReadyState;
}) => {
  const textColor = {
    [ReadyState.UNINITIATED]: 'black-600',
    [ReadyState.OPEN]: 'buy',
    [ReadyState.CLOSED]: 'sell',
    [ReadyState.CONNECTING]: 'buy-dark',
    [ReadyState.CLOSING]: 'sell-dark',
  }[readyState];
  return (
    <div className={`px-1 text-${textColor} text-lg font-semibold`}>
      {exchange}
    </div>
  );
};

export const Widget = ({
  children,
  isScrollable,
  isFull = true,
}: {
  children: React.ReactElement;
  isScrollable?: boolean;
  isFull?: boolean;
}) => (
  <div
    className={`${
      isFull ? 'h-full w-full' : ''
    } bg-black-700 rounded-sm noscroll ${
      isScrollable ? 'overflow-y-auto' : ''
    }`}
  >
    {children}
  </div>
);
