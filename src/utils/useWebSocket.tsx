import React from 'react';

export enum ReadyState {
  CONNECTING = WebSocket.CONNECTING,
  OPEN = WebSocket.OPEN,
  CLOSING = WebSocket.CLOSING,
  CLOSED = WebSocket.CLOSED,
  UNINITIATED = -1,
}

export type WebSocketMessage =
  | string
  | ArrayBuffer
  | SharedArrayBuffer
  | Blob
  | ArrayBufferView;

export function useWebSocket<R, T = WebSocketMessage>(
  url: string,
  options?: {
    onOpen?: Function;
    onClose?: Function;
    onError?: Function;
    shouldReconnect?: boolean;
  }
) {
  const ws = React.useRef<WebSocket | null>(null);
  const messageQueue = React.useRef<T[]>([]);
  const [lastMessage, setLastMessage] = React.useState<R | null>(null);
  // WebSocket ready state fails to show clised
  const [readyState, setReadyState] = React.useState<ReadyState>(
    ReadyState.UNINITIATED
  );
  const sendMessage = React.useCallback((message: T) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      if (typeof message !== 'string') {
        ws.current.send(JSON.stringify(message));
      } else ws.current.send(message);
    } else messageQueue.current.push(message);
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
      messageQueue.current = [];
      if (options?.onClose) options.onClose(e);
      if (options?.shouldReconnect) ws.current = connect();
    };
    newws.onerror = e => {
      setReadyState(WebSocket.CLOSED);
      if (options?.onError) options.onError(e);
    };
    newws.onmessage = e => {
      const msg = JSON.parse(e.data);
      setLastMessage(msg);
    };
    return newws;
  }, [url, options]);

  React.useEffect(() => {
    if (ws.current == null || ws.current.readyState === WebSocket.CLOSED) {
      ws.current = connect();
    } else if (ws.current.readyState === WebSocket.OPEN) {
      messageQueue.current.splice(0).forEach(sendMessage);
    }
  }, [ws, connect, sendMessage]);

  return { readyState, lastMessage, sendMessage };
}
