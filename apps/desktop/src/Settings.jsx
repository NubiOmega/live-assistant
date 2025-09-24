import { useEffect, useMemo, useState } from 'react';

const parseKeywords = (value) =>
  value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);

export default function SettingsPanel({ chatKeywords = [], onChangeChatKeywords }) {
  const [draft, setDraft] = useState(chatKeywords.join(', '));
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setDraft(chatKeywords.join(', '));
  }, [chatKeywords]);

  const parsedDraft = useMemo(() => parseKeywords(draft), [draft]);

  const isDirty = useMemo(() => {
    const current = chatKeywords.join('\u0001');
    const next = parsedDraft.join('\u0001');
    return current !== next;
  }, [chatKeywords, parsedDraft]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = setTimeout(() => setFeedback(''), 2500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isDirty) {
      return;
    }
    onChangeChatKeywords?.(parsedDraft);
    setFeedback('Keyword chat berhasil diperbarui.');
  };

  const handleReset = () => {
    setDraft(chatKeywords.join(', '));
    setFeedback('');
  };

  const handleChange = (event) => {
    setDraft(event.target.value);
  };

  return (
    <div className="settings-panel">
      <section className="settings-panel__section">
        <h3>Filter Chat Keywords</h3>
        <p>Atur kata kunci yang digunakan oleh tab <strong>Keywords</strong> pada panel chat.</p>

        <form className="settings-panel__form" onSubmit={handleSubmit}>
          <label className="settings-panel__label">
            Kata kunci (pisahkan dengan koma)
            <input
              type="text"
              value={draft}
              onChange={handleChange}
              placeholder="contoh: harga, link, stok"
            />
          </label>
          <div className="settings-panel__actions">
            <button type="button" onClick={handleReset} disabled={!isDirty}>
              Batalkan
            </button>
            <button type="submit" className="settings-panel__primary" disabled={!isDirty}>
              Simpan
            </button>
          </div>
        </form>

        {feedback && <div className="settings-panel__feedback">{feedback}</div>}

        <div className="settings-panel__preview">
          <span>Kata kunci aktif:</span>
          <div className="settings-panel__keywords">
            {chatKeywords.length === 0 ? (
              <span className="settings-panel__keyword settings-panel__keyword--empty">(default)</span>
            ) : (
              chatKeywords.map((keyword) => (
                <span key={keyword} className="settings-panel__keyword">
                  {keyword}
                </span>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
