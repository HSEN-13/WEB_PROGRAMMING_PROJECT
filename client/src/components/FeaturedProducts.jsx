import { useState, useEffect } from "react";
import "./FeaturedProducts.css";

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch(() => setError("Could not load listings. Is the server running?"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="featured container">
      <h2 className="section-header">Recently Listed Hardware</h2>

      {loading && <p className="status-msg">Loading listings...</p>}
      {error && <p className="status-msg">{error}</p>}

      <div className="product-grid">
        {products.map((p) => (
          <div className="product-card" key={p.id}>
            <div className="product-img">[ {p.category} Image ]</div>
            <div className="product-body">
              <span className="chip">{p.condition}</span>
              <h3 className="product-title">{p.title}</h3>
              <div className="product-price">${p.price}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturedProducts;
