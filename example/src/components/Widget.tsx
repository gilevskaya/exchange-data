import * as React from 'react';

import { Exchange, ReadyState, Channel } from '../../../dist';

const SUBSCRIPTION_BUTTONS: Array<[Channel, string]> = [
  [Channel.ORDERBOOK, 'ob'],
  [Channel.TICKER, 'tk'],
  [Channel.TRADES, 'tr'],
];

export const ExchangeHeader = React.memo(
  ({
    exchange,
    readyState,
    connect,
    disconnect,
    toggleSubscription,
    subcriptions,
  }: {
    exchange: Exchange;
    readyState: ReadyState;
    connect: Function;
    disconnect: Function;
    subcriptions: Set<Channel>;
    toggleSubscription: (channel: Channel) => void;
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

    const subscriptionButtons = React.useMemo(() => {
      return SUBSCRIPTION_BUTTONS.map(([channel, name]) => (
        <button
          key={channel}
          className={`mx-1 focus:outline-none text-${
            subcriptions.has(channel) ? 'black-500' : 'black-600'
          }`}
          onClick={() => toggleSubscription(channel)}
        >
          {name}
        </button>
      ));
    }, [subcriptions, toggleSubscription]);

    return (
      <div
        className={`select-none px-1 text-${textColor} text-lg flex items-center justify-between`}
      >
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
        <div className="text-sm">{subscriptionButtons}</div>
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
