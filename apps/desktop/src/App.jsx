import { useMemo, useState } from 'react';

import ProductsPanel from './Products.jsx';

const menuItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Pantau performa live commerce secara menyeluruh.'
  },
  {
    key: 'chat',
    label: 'Chat',
    description: 'Pantau percakapan penonton secara real-time.'
  },
  {
    key: 'produk',
    label: 'Produk',
    description: 'Kelola katalog produk dan stok untuk ditampilkan.'
  },
  {
    key: 'overlay',
    label: 'Overlay',
    description: 'Atur overlay interaktif untuk live streaming.'
  },
  {
    key: 'analitik',
    label: 'Analitik',
    description: 'Analisis performa live dan interaksi penonton.'
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Pengaturan akun, koneksi, dan preferensi aplikasi.'
  }
];

const summaryCards = [
  { title: 'Live Sekarang', value: '2', hint: 'TikTok & YouTube' },
  { title: 'Penonton Aktif', value: '1.2K', hint: 'Dalam 15 menit terakhir' },
  { title: 'Gift Hari Ini', value: '325', hint: 'Total poin gift' },
  { title: 'Produk Terjual', value: '48', hint: 'Hari ini' }
];

export default function App() {
  const [activeKey, setActiveKey] = useState(menuItems[0].key);

  const activeItem = useMemo(
    () => menuItems.find((item) => item.key === activeKey) ?? menuItems[0],
    [activeKey]
  );

  const renderPanelContent = () => {
    switch (activeKey) {
      case 'produk':
        return <ProductsPanel />;
      default:
        return (
          <div className="panel__placeholder">
            <p>Konten {activeItem.label} akan tampil di sini.</p>
          </div>
        );
    }
  };

  const showSummaryCards = activeKey === 'dashboard';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__title">Live Assistant</span>
          <span className="brand__subtitle">Streamer Companion</span>
        </div>
        <nav className="menu">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`menu__item ${activeKey === item.key ? 'menu__item--active' : ''}`}
              onClick={() => setActiveKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="dashboard">
        <header className="dashboard__header">
          <h1>{activeItem.label}</h1>
          <p>{activeItem.description}</p>
        </header>

        {showSummaryCards && (
          <section className="dashboard__cards">
            {summaryCards.map((card) => (
              <article key={card.title} className="card">
                <h3>{card.title}</h3>
                <p className="card__value">{card.value}</p>
                <span className="card__hint">{card.hint}</span>
              </article>
            ))}
          </section>
        )}

        <section className="dashboard__panel">
          {activeKey !== 'produk' && <h2>{activeItem.label}</h2>}
          {activeKey !== 'produk' && <p>{activeItem.description}</p>}
          {renderPanelContent()}
        </section>
      </main>
    </div>
  );
}

