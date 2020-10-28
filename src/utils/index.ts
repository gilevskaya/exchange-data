import { Exchange, TSubscription } from '../types';

export const getSubs = (e: Exchange) => (
  ss: TSubscription[]
): Map<string, TSubscription> =>
  new Map(
    ss
      .filter(s => s.exchange === e)
      .map(s => [`${s.instrument}-${s.channel}`, s])
  );

export {
  applyExchangeOrderBookEdits,
  TOrderBook,
  TOrderBookSide,
} from './orderbook';
