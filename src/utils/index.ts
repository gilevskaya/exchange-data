import {
  Channel,
  Exchange,
  TSubscription,
  TWSCurrentSubscriptions,
} from '../types';

import { TWSMessageDeribit_Res_Subscription } from '../useExchange/useDeribit';

export const getSubKey = (channel: Channel, instrument: string): string =>
  `${channel}:${instrument}`;

export type TSyncSubscriptionsArgs_Exchange = {
  exchange: Exchange;
  getName: Function;
  subcribe: (channels: string[]) => Promise<TWSMessageDeribit_Res_Subscription>;
  unsubscribe: (
    channels: string[]
  ) => Promise<TWSMessageDeribit_Res_Subscription>;
};

export function syncSubscriptions({
  exchange,
  getName,
  subcribe,
  unsubscribe,
  currentSubscriptions,
  newSubscriptions,
}: TSyncSubscriptionsArgs_Exchange & {
  currentSubscriptions: TWSCurrentSubscriptions;
  newSubscriptions: TSubscription[];
}): Promise<TWSCurrentSubscriptions> {
  const updCurrent = new Map(currentSubscriptions);
  const channelsToSub: Set<string> = new Set();
  const channelsToUnsub: Set<string> = new Set();
  updCurrent.forEach((_, k) => channelsToUnsub.add(k));

  newSubscriptions
    .filter(s => s.exchange === exchange)
    .forEach(s => {
      const { channel, instrument } = s;
      const subName = getName(channel, instrument);
      const subInfo = updCurrent.get(subName);
      if (subInfo) {
        channelsToUnsub.delete(subName);
      } else {
        channelsToSub.add(subName);
        updCurrent.set(subName, { info: s, status: 'subscribing' });
      }
    });

  if (channelsToSub.size === 0 && channelsToUnsub.size === 0)
    return Promise.resolve(currentSubscriptions);

  const promises: Array<null | Promise<TWSMessageDeribit_Res_Subscription>> = [
    null,
    null,
  ];
  if (channelsToSub.size > 0) {
    promises[0] = subcribe(Array.from(channelsToSub));
  }
  if (channelsToUnsub.size > 0) {
    promises[1] = unsubscribe(Array.from(channelsToUnsub));
  }
  return Promise.all(promises).then(([subRes, unsubRes]) => {
    if (subRes) {
      const { result } = subRes as TWSMessageDeribit_Res_Subscription;
      result.forEach(subName => {
        const sub = updCurrent.get(subName);
        if (sub) updCurrent.set(subName, { ...sub, status: 'subscribed' });
      });
    }
    if (unsubRes) {
      const { result } = unsubRes as TWSMessageDeribit_Res_Subscription;
      result.forEach(subName => updCurrent.delete(subName));
    }
    return updCurrent;
  });
}

export {
  applyExchangeOrderBookEdits,
  TOrderBook,
  TOrderBookSide,
} from './orderbook';
