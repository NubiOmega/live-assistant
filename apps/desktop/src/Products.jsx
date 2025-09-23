import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = 'http://localhost:8000';
const GATEWAY_BASE_URL = 'http://localhost:3000';

const emptyForm = {
  title: '',
  price: '',
  url: '',
  image: '',
  tags: '',
  stock_info: ''
};

const parseTags = (value) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatPrice = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return 'Rp -';
  }
  return `Rp ${numeric.toLocaleString('id-ID')}`;
};

export default function ProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/products/`);
      if (!response.ok) {
        throw new Error(`Gagal memuat produk (${response.status})`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat produk');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormData(emptyForm);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title ?? '',
      price: product.price?.toString() ?? '',
      url: product.url ?? '',
      image: product.image ?? '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      stock_info: product.stock_info ?? ''
    });
    setModalOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const buildPayload = () => {
    const parsedPrice = Number(formData.price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      throw new Error('Harga harus berupa angka positif.');
    }

    return {
      title: formData.title.trim(),
      price: Math.round(parsedPrice),
      url: formData.url.trim(),
      image: formData.image.trim() || null,
      tags: parseTags(formData.tags),
      stock_info: formData.stock_info.trim() || null
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    let payload;
    try {
      payload = buildPayload();
    } catch (validationError) {
      setError(validationError.message);
      setSubmitting(false);
      return;
    }

    if (!payload.title || !payload.url) {
      setError('Judul dan URL wajib diisi.');
      setSubmitting(false);
      return;
    }

    try {
      const requestUrl = editingProduct
        ? `${API_BASE_URL}/products/${editingProduct.id}`
        : `${API_BASE_URL}/products/`;
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(requestUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const message = editingProduct
          ? `Gagal memperbarui produk (${response.status})`
          : `Gagal menambahkan produk (${response.status})`;
        throw new Error(message);
      }

      await fetchProducts();
      closeModal();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmation = window.confirm(`Hapus produk "${product.title}"?`);
    if (!confirmation) return;

    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`Gagal menghapus produk (${response.status})`);
      }
      await fetchProducts();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menghapus produk');
    }
  };

  const handlePin = async (product) => {
    try {
      const response = await fetch(`${GATEWAY_BASE_URL}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'chat.events',
          message: {
            type: 'pin_product',
            product
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gagal mem-pin produk (${response.status})`);
      }

      window.alert('Produk dipin ke gateway.');
    } catch (err) {
      window.alert(err.message || 'Gagal mengirim pesan ke gateway');
    }
  };

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td colSpan={4} className="products-table__state">
            Memuat produk...
          </td>
        </tr>
      );
    }

    if (products.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="products-table__state">
            Belum ada produk. Tambahkan produk pertama Anda.
          </td>
        </tr>
      );
    }

    return products.map((product) => (
      <tr key={product.id}>
        <td>{product.title}</td>
        <td>{formatPrice(product.price)}</td>
        <td>
          <a href={product.url} target="_blank" rel="noreferrer">
            {product.url}
          </a>
        </td>
        <td>
          <div className="products-table__actions">
            <button type="button" onClick={() => openEditModal(product)}>
              Edit
            </button>
            <button type="button" onClick={() => handleDelete(product)}>
              Hapus
            </button>
            <button type="button" onClick={() => handlePin(product)}>
              Pin Produk
            </button>
          </div>
        </td>
      </tr>
    ));
  }, [loading, products]);

  return (
    <div className="products-panel">
      <div className="products-panel__header">
        <div>
          <h3>Katalog Produk</h3>
          <p>Kelola item yang ingin ditampilkan ke penonton.</p>
        </div>
        <button type="button" className="primary" onClick={openCreateModal}>
          Tambah Produk
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="products-table__wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Nama Produk</th>
              <th>Harga</th>
              <th>URL</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal">
          <div className="modal__backdrop" onClick={closeModal} />
          <div className="modal__content" role="dialog" aria-modal="true">
            <header className="modal__header">
              <h4>{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h4>
              <button type="button" onClick={closeModal}>
                ×
              </button>
            </header>

            <form className="modal__form" onSubmit={handleSubmit}>
              <label>
                Nama Produk
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Contoh: Lip Cream Limited Edition"
                  required
                />
              </label>

              <label>
                Harga (Rp)
                <input
                  name="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Contoh: 125000"
                  required
                />
              </label>

              <label>
                URL Produk
                <input
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://contoh-toko.com/produk"
                  required
                />
              </label>

              <label>
                URL Gambar
                <input
                  name="image"
                  type="url"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://contoh-toko.com/gambar.jpg"
                />
              </label>

              <label>
                Tags (pisahkan dengan koma)
                <input
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="promo, favorit, best seller"
                />
              </label>

              <label>
                Info Stok
                <textarea
                  name="stock_info"
                  value={formData.stock_info}
                  onChange={handleChange}
                  placeholder="Stok tersisa 25 pcs"
                  rows={3}
                />
              </label>

              <footer className="modal__actions">
                <button type="button" onClick={closeModal} disabled={submitting}>
                  Batal
                </button>
                <button type="submit" className="primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
