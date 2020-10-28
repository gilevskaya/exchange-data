import {
  Channel,
  Exchange,
  TSubscription,
  TWSCurrentSubscriptions,
} from '../types';

export const TRADES_STORE_LIMIT = 50;

export const getSubKey = (channel: Channel, instrument: string): string =>
  `${channel}:${instrument}`;

export function syncSubscriptions<ResSubscription>({
  exchange,
  getSubscriptionName,
  updateSubscriptions,
  processUpdateSubscriptionRes,
  currSubscriptions,
  newSubscriptions,
}: {
  exchange: Exchange;
  getSubscriptionName: (subs: Channel, instrument: string) => string;
  updateSubscriptions: (
    updChannels: string[],
    isSubcribe: boolean
  ) => Promise<ResSubscription | ResSubscription[]>;
  processUpdateSubscriptionRes: (
    currSub: TWSCurrentSubscriptions,
    subRes: ResSubscription | ResSubscription[] | null,
    unsubRes: ResSubscription | ResSubscription[] | null
  ) => TWSCurrentSubscriptions;
  currSubscriptions: TWSCurrentSubscriptions;
  newSubscriptions: TSubscription[];
}): Promise<TWSCurrentSubscriptions> {
  const updCurrent = new Map(currSubscriptions);
  const channelsToSub: Set<string> = new Set();
  const channelsToUnsub: Set<string> = new Set();
  updCurrent.forEach((_, k) => channelsToUnsub.add(k));

  newSubscriptions
    .filter(s => s.exchange === exchange)
    .forEach(s => {
      const { channel, instrument } = s;
      const subName = getSubscriptionName(channel, instrument);
      const subInfo = updCurrent.get(subName);
      if (subInfo) {
        channelsToUnsub.delete(subName);
      } else {
        channelsToSub.add(subName);
        updCurrent.set(subName, { info: s, status: 'subscribing' });
      }
    });

  if (channelsToSub.size === 0 && channelsToUnsub.size === 0)
    return Promise.resolve(currSubscriptions);

  const promises: Array<null | Promise<ResSubscription | ResSubscription[]>> = [
    null,
    null,
  ];
  if (channelsToSub.size > 0) {
    promises[0] = updateSubscriptions(Array.from(channelsToSub), true);
  }
  if (channelsToUnsub.size > 0) {
    promises[1] = updateSubscriptions(Array.from(channelsToUnsub), false);
  }
  return Promise.all(promises).then(([subRes, unsubRes]) =>
    processUpdateSubscriptionRes(updCurrent, subRes, unsubRes)
  );
}

export {
  applyExchangeOrderBookEdits,
  TOrderBook,
  TOrderBookSide,
} from './orderbook';
