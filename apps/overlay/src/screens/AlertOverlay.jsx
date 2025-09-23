import { useEffect, useMemo, useState } from 'react';

const alerts = [
  {
    id: 'alert-1',
    user: 'Rina',
    gift: 'Super Gift Pack',
    amount: 3,
    value: 150,
    message: 'Terima kasih sudah bikin malamku seru! ?',
  },
  {
    id: 'alert-2',
    user: 'Andi',
    gift: 'Golden Mic',
    amount: 1,
    value: 75,
    message: 'Sukses terus live-nya!',
  },
  {
    id: 'alert-3',
    user: 'Sasha',
    gift: 'Diamond Shower',
    amount: 5,
    value: 300,
    message: 'Wohooo gift time! ??',
  },
];

export default function AlertOverlay() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % alerts.length);
        setVisible(true);
      }, 400);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const currentAlert = useMemo(() => alerts[index], [index]);

  return (
    <div className="overlay-root alert-overlay">
      <div className={`alert-card ${visible ? 'alert-card--visible' : 'alert-card--hidden'}`}>
        <div className="alert-card__header">
          <span className="alert-card__user">{currentAlert.user}</span>
          <span className="alert-card__gift">{currentAlert.gift}</span>
        </div>
        <div className="alert-card__body">
          <span className="alert-card__amount">x{currentAlert.amount}</span>
          <span className="alert-card__value">{currentAlert.value} pts</span>
        </div>
        <p className="alert-card__message">{currentAlert.message}</p>
      </div>
    </div>
  );
}