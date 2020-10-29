import {
  Side,
  Channel,
  Exchange,
  TSubscription,
  TOrderBook,
  TOrderBookEdit,
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

export function applyExchangeOrderBookEdits(
  orderbook: TOrderBook | null,
  edits: Array<{
    side: Side;
    edit: TOrderBookEdit;
  }>
  // step: number = 0.5 // TODO: ...
): TOrderBook | null {
  let { entries, asks, bids }: TOrderBook =
    orderbook != null ? orderbook : { entries: new Map(), asks: [], bids: [] };

  for (const { side, edit } of edits) {
    const { price, size, id } = edit;

    if (size === 0) {
      // deletion
      entries.delete(price);
      if (side === Side.SELL) {
        const i = asks.indexOf(price);
        if (i !== -1) delete asks[i];
      } else {
        const i = bids.indexOf(price);
        if (i !== -1) delete bids[i];
      }
    } else {
      // insert
      entries.set(price, { side, price, size, total: 0, id });
      if (side === Side.SELL) {
        if (asks.indexOf(price) === -1) {
          // asks = sortedInsert(price, asks, true);
          asks = [...asks, price];
        }
      } else {
        if (bids.indexOf(price) === -1) {
          // bids = sortedInsert(price, bids, false);
          bids = [...bids, price];
        }
      }
    }
  }
  return {
    entries,
    asks: asks.filter(e => e),
    bids: bids.filter(e => e),
  };
}
