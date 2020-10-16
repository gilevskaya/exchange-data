import { Exchange, TSubscription } from '../types';
import { useExchangeDeribit } from './useExchangeDeribit';

export const useExchange = (
  exchange: Exchange,
  subscriptions: TSubscription[]
) => {
  if (exchange === Exchange.DERIBIT) return useExchangeDeribit(subscriptions);
  throw new Error('Unsupported exchange'); // TODO: ...
};
