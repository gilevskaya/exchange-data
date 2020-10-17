import { Exchange, TSubscription } from '../types';
import { useExchangeDeribit } from './deribit';

export const useExchange = (
  exchange: Exchange,
  subscriptions: TSubscription[]
) => {
  if (exchange === Exchange.DERIBIT) return useExchangeDeribit(subscriptions);
  throw new Error('Unsupported exchange'); // TODO: ...
};

// const getExchangesMap = (subscriptions: TSubscription[]): Map<Exchange, TSubscription[] => {
//   return subscriptions.reduce((acc, s) => {
//     const curr = acc.get(s.exchange) || [];
//     acc.set(s.exchange, [...curr, s]);
//     return acc;
//   }, new Map())
// }
