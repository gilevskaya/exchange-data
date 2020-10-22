import { TSubscription } from '../types';
import { useDeribit } from './deribit';
import { useBitmex } from './bitmex';

export const useExchange = (subscriptions: TSubscription[]) => {
  const deribit = useDeribit(subscriptions);
  const bitmex = useBitmex(subscriptions);
  return { deribit, bitmex };
};

// const getExchangesMap = (subscriptions: TSubscription[]): Map<Exchange, TSubscription[] => {
//   return subscriptions.reduce((acc, s) => {
//     const curr = acc.get(s.exchange) || [];
//     acc.set(s.exchange, [...curr, s]);
//     return acc;
//   }, new Map())
// }
