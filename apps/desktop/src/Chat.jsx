import { useEffect, useMemo, useRef, useState } from 'react';

const GATEWAY_WS_URL = 'ws://localhost:3000';
const MAX_MESSAGES = 200;

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'questions', label: 'Questions' },
  { key: 'keywords', label: 'Keywords' }
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const extractText = (payload) => {
  if (!payload) {
    return '';
  }
  if (typeof payload.text === 'string') {
    return payload.text;
  }
  if (typeof payload.message === 'string') {
    return payload.message;
  }
  if (payload.type === 'pin_product' && payload.product?.title) {
    return `\u{1F4CD} Pin produk: ${payload.product.title}`;
  }
  return '';
};

const normalizeEvent = (rawEvent) => {
  const { data = {}, ts } = rawEvent || {};
  const payload = typeof data === 'object' && data !== null ? data : {};

  const username = payload.user || payload.username || payload.author || 'Penonton';
  const type = payload.type || 'chat';
  const text = extractText(payload);

  return {
    id: createMessageId(),
    username,
    type,
    text,
    timestamp: ts || new Date().toISOString(),
    payload,
  };
};

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function ChatPanel({ keywords = [] }) {
  const listRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [connectionState, setConnectionState] = useState('connecting');
  const [lastError, setLastError] = useState('');
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [connectionAttempt, setConnectionAttempt] = useState(0);

  useEffect(() => {
    setConnectionState('connecting');
    setLastError('');

    const socket = new WebSocket(GATEWAY_WS_URL);

    const handleOpen = () => {
      setConnectionState('connected');
    };

    const handleError = (event) => {
      console.error('WebSocket error', event);
      setConnectionState('error');
      setLastError('Tidak dapat terhubung ke gateway.');
    };

    const handleClose = () => {
      setConnectionState((prev) => (prev === 'error' ? prev : 'disconnected'));
    };

    const handleMessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.channel !== 'chat.events') {
          return;
        }
        const message = normalizeEvent(payload);
        if (!message.text && message.type === 'chat') {
          return;
        }
        setMessages((prev) => {
          const next = [...prev, message];
          if (next.length > MAX_MESSAGES) {
            next.splice(0, next.length - MAX_MESSAGES);
          }
          return next;
        });
      } catch (err) {
        console.error('Failed to parse gateway payload', err);
      }
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('error', handleError);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('error', handleError);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('message', handleMessage);
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [connectionAttempt]);

  const normalizedKeywords = useMemo(
    () => keywords.map((keyword) => keyword.toLowerCase()).filter(Boolean),
    [keywords]
  );

  const filteredMessages = useMemo(() => {
    if (activeTab === 'questions') {
      return messages.filter((item) => item.text.includes('?'));
    }
    if (activeTab === 'keywords') {
      if (normalizedKeywords.length === 0) {
        return [];
      }
      return messages.filter((item) => {
        const lowerText = item.text.toLowerCase();
        return normalizedKeywords.some((keyword) => lowerText.includes(keyword));
      });
    }
    return messages;
  }, [activeTab, messages, normalizedKeywords]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    list.scrollTop = list.scrollHeight;
  }, [filteredMessages]);

  const highlightKeywords = (text) => {
    if (!text) {
      return text;
    }
    if (activeTab !== 'keywords' || normalizedKeywords.length === 0) {
      return text;
    }
    const pattern = normalizedKeywords.map(escapeRegExp).join('|');
    if (!pattern) {
      return text;
    }
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (!part) {
        return null;
      }
      if (index % 2 === 1) {
        return (
          <mark key={`${part}-${index}`} className="chat-panel__highlight">
            {part}
          </mark>
        );
      }
      return (
        <span key={`${part}-${index}`}>{part}</span>
      );
    });
  };

  const handleRetry = () => {
    setConnectionAttempt((prev) => prev + 1);
  };

  const statusMessage = (() => {
    switch (connectionState) {
      case 'connecting':
        return 'Menghubungkan ke gateway...';
      case 'connected':
        return 'Terhubung ke gateway.';
      case 'disconnected':
        return 'Koneksi terputus. Coba ulang untuk menyambung kembali.';
      case 'error':
        return lastError || 'Terjadi kesalahan koneksi ke gateway.';
      default:
        return '';
    }
  })();

  const showRetry = connectionState === 'error' || connectionState === 'disconnected';

  return (
    <div className="chat-panel">
      <div className={`chat-panel__status chat-panel__status--${connectionState}`}>
        <span>{statusMessage}</span>
        {showRetry && (
          <button type="button" className="chat-panel__retry" onClick={handleRetry}>
            Coba ulang
          </button>
        )}
      </div>

      <div className="chat-panel__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`chat-panel__tab ${activeTab === tab.key ? 'chat-panel__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="chat-panel__list" ref={listRef}>
        {filteredMessages.length === 0 ? (
          <div className="chat-panel__empty">Belum ada pesan untuk filter ini.</div>
        ) : (
          filteredMessages.map((message) => (
            <div key={message.id} className="chat-panel__item">
              <div className="chat-panel__meta">
                <span className="chat-panel__user">{message.username}</span>
                <span className="chat-panel__time">{formatTime(message.timestamp)}</span>
              </div>
              <div className="chat-panel__text">{highlightKeywords(message.text)}</div>
              {message.type !== 'chat' && (
                <span className="chat-panel__tag">{message.type}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
