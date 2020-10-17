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
    shouldReconnect?: boolean;
  }
) {
  const ws = React.useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = React.useState<Res | null>(null);
  // WebSocket ready state fails to show clised
  const [readyState, setReadyState] = React.useState<ReadyState>(
    ReadyState.UNINITIATED
  );
  const pendingMap = React.useRef<Map<string, any>>(new Map());

  const sendMessage = React.useCallback((req: Res | string): Promise<Res> => {
    return new Promise((resolve, reject) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN)
        return reject('disconnected');
      const reqId = nanoid();
      const reqObj: Req = typeof req === 'string' ? JSON.parse(req) : req;
      const reqWithId = { ...reqObj, id: reqId };
      pendingMap.current.set(reqId, { resolve, reject });
      ws.current.send(JSON.stringify(reqWithId));
    });
  }, []);

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

  const connect = React.useCallback((): WebSocket => {
    const newws = new WebSocket(url);

    setReadyState(WebSocket.CONNECTING);
    newws.onopen = e => {
      setReadyState(WebSocket.OPEN);
      if (options?.onOpen) options.onOpen(e);
    };
    newws.onclose = e => {
      setReadyState(WebSocket.CLOSED);
      ws.current = null;
      if (options?.onClose) options.onClose(e);
      if (options?.shouldReconnect) ws.current = connect();
    };
    newws.onerror = e => {
      setReadyState(WebSocket.CLOSED);
      if (options?.onError) options.onError(e);
    };
    newws.onmessage = e => {
      const msg: Res | null = processMessage(e.data);
      if (msg != null) setLastMessage(msg);
    };
    return newws;
  }, [url, options, processMessage]);

  React.useEffect(() => {
    if (ws.current == null || ws.current.readyState === WebSocket.CLOSED) {
      if (options?.shouldReconnect) ws.current = connect();
    }
  }, [ws, connect, sendMessage, options]);

  return { readyState, lastMessage, sendMessage };
}
