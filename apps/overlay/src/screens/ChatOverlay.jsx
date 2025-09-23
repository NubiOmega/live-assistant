import { useEffect, useMemo, useRef, useState } from 'react';

const sampleMessages = [
  { user: 'Alice', message: 'Hai semua! Selamat datang ??' },
  { user: 'Budi', message: 'Produk baru hadir malam ini!' },
  { user: 'Cici', message: 'Kapan diskon bundle lagi?' },
  { user: 'Deni', message: 'Mantap hostnya ??' },
  { user: 'Evi', message: 'Aku baru beli 2 item nih!' },
  { user: 'Fahri', message: 'Ada giveaway nggak malam ini?' },
];

const randomMessage = () => sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

export default function ChatOverlay() {
  const containerRef = useRef(null);
  const [messages, setMessages] = useState(() =>
    Array.from({ length: 6 }, () => {
      const item = randomMessage();
      return {
        id: crypto.randomUUID(),
        user: item.user,
        text: item.message,
        ts: new Date().toISOString(),
      };
    }),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const next = randomMessage();
      setMessages((prev) => {
        const updated = [
          ...prev,
          {
            id: crypto.randomUUID(),
            user: next.user,
            text: next.message,
            ts: new Date().toISOString(),
          },
        ];
        return updated.slice(-15);
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const renderedMessages = useMemo(() => messages, [messages]);

  return (
    <div className="overlay-root chat-overlay">
      <div className="chat-overlay__container" ref={containerRef}>
        {renderedMessages.map((item) => (
          <div key={item.id} className="chat-message">
            <span className="chat-message__user">{item.user}</span>
            <span className="chat-message__text">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}