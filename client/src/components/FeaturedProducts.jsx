import { useState, useEffect } from "react";
import "./FeaturedProducts.css";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Could not load listings.");
        }

        const data = await response.json();
        setProducts(data.slice(0, 4));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <section className="featured container">
      <h2 className="section-header">Recently Listed Hardware</h2>

      {loading && <p className="status-msg">Loading listings...</p>}
      {error && (
        <p className="status-msg" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && products.length === 0 && (
        <p className="status-msg">No listings yet.</p>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <a
            className="product-card"
            key={product.id}
            href={"/product/" + product.id}
          >
            <div className="product-img">
              {product.image_url ? (
                <img src={product.image_url} alt="" loading="lazy" />
              ) : (
                <span>No image available</span>
              )}
            </div>

            <div className="product-body">
              <span className="chip">{product.condition}</span>
              <h3 className="product-title">{product.title}</h3>
              <div className="product-price">
                ${Number(product.price).toFixed(2)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
