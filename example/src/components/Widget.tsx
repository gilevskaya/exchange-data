import * as React from 'react';

import { Exchange, ReadyState } from '../../../dist';

export const ExchangeHeader = React.memo(
  ({
    exchange,
    readyState,
    connect,
    disconnect,
  }: {
    exchange: Exchange;
    readyState: ReadyState;
    connect: Function;
    disconnect: Function;
  }) => {
    const textColor = {
      [ReadyState.UNINITIATED]: 'black-600',
      [ReadyState.OPEN]: 'buy',
      [ReadyState.CLOSED]: 'sell',
      [ReadyState.CONNECTING]: 'buy-dark',
      [ReadyState.CLOSING]: 'sell-dark',
    }[readyState];
    const availableAction: 'connect' | 'disconnect' | null = (() => {
      if (
        readyState === ReadyState.UNINITIATED ||
        readyState === ReadyState.CLOSED
      ) {
        return 'connect';
      } else if (readyState === ReadyState.OPEN) {
        return 'disconnect';
      }
      return null;
    })();

    return (
      <div className={`px-1 text-${textColor} text-lg flex items-center`}>
        {/* <button className={`mr-2 rounded-full h-3 w-3 bg-${textColor}`} /> */}
        <button
          className={`font-semibold focus:outline-none cursor-${
            availableAction ? 'pointer' : 'not-allowed'
          } ${availableAction === 'connect' ? 'hover:text-buy' : ''} ${
            availableAction === 'disconnect' ? 'hover:text-sell' : ''
          }`}
          disabled={[ReadyState.CONNECTING, ReadyState.CLOSING].includes(
            readyState
          )}
          onClick={() => {
            if (availableAction === 'connect') connect();
            else if (availableAction === 'disconnect') disconnect();
          }}
        >
          {exchange}
        </button>
      </div>
    );
  }
);

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
