import React from 'react';
import { nanoid } from 'nanoid';

export enum ReadyState {
  CONNECTING = WebSocket.CONNECTING,
  OPEN = WebSocket.OPEN,
  CLOSING = WebSocket.CLOSING,
  CLOSED = WebSocket.CLOSED,
  UNINITIATED = -1,
}

export type WebSocketMessage =
  | object
  | string
  | ArrayBuffer
  | SharedArrayBuffer
  | Blob
  | ArrayBufferView;

export function useWebSocket<Res, Req = WebSocketMessage>(
  url: string,
  options?: {
    onOpen?: Function;
    onClose?: Function;
    onError?: Function;
    manualConnect?: boolean;
    shouldReconnect?: boolean;
  }
) {
  const ws = React.useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = React.useState<Res | null>(null);
  // because WebSocket readyState sucks
  const [readyState, setReadyState] = React.useState<ReadyState>(
    ReadyState.UNINITIATED
  );
  const pendingMap = React.useRef<Map<string, any>>(new Map());

  const sendMessage = React.useCallback(
    (req: Req | string): Promise<Res> => {
      return new Promise((resolve, reject) => {
        if (!ws.current || ws.current.readyState !== ReadyState.OPEN) {
          console.log(
            'trying to send message to a discounnected ws',
            req,
            ws.current
          );
          return reject('disconnected');
        }
        const reqId = nanoid();
        const reqObj: Req = typeof req === 'string' ? JSON.parse(req) : req;
        const reqWithId = { ...reqObj, id: reqId };
        pendingMap.current.set(reqId, { resolve, reject });
        ws.current.send(JSON.stringify(reqWithId));
      });
    },
    [ws]
  );

  const processMessage = React.useCallback((res: string): Res | null => {
    const msg = JSON.parse(res);
    if (!msg.id) return msg; // pass through
    const pending = pendingMap.current.get(msg.id);
    if (!pending) {
      console.warn(`Unexpected msg id (${msg.id}) from WS:`, msg);
      return msg; // pass through
    }
    pending.resolve({ ...msg });
    return null;
  }, []);

  const connect = React.useCallback((): Promise<boolean> => {
    return new Promise(resolve => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        return resolve(false);
      }

      const newws = new WebSocket(url);

      setReadyState(WebSocket.CONNECTING);
      newws.onopen = e => {
        setReadyState(WebSocket.OPEN);
        if (options?.onOpen) options.onOpen(e);
        resolve(true);
      };
      newws.onclose = e => {
        setReadyState(WebSocket.CLOSED);
        ws.current = null;
        if (options?.onClose) options.onClose(e);
        if (options?.shouldReconnect) connect();
      };
      newws.onerror = e => {
        setReadyState(WebSocket.CLOSED);
        if (options?.onError) options.onError(e);
      };
      newws.onmessage = e => {
        const msg: Res | null = processMessage(e.data);
        if (msg != null) setLastMessage(msg);
      };
      ws.current = newws;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = React.useCallback((): Promise<boolean> => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }, []);

  // connect & re-connect:
  React.useEffect(() => {
    if (ws.current == null || ws.current.readyState === WebSocket.CLOSED) {
      if (!options?.manualConnect) connect();
      else if (ws.current && options?.shouldReconnect) connect();
    }
  }, [ws, connect, sendMessage, options]);

  return { readyState, lastMessage, sendMessage, connect, disconnect };
}
