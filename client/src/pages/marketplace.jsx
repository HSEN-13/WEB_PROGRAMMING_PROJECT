import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Marketplace.css";

function Marketplace() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Load products and categories from Express
  useEffect(() => {
    async function loadProducts() {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);
        if (!productsResponse.ok || !categoriesResponse.ok) {
          throw new Error("Failed to load marketplace");
        }
        const productsData = await productsResponse.json();
        const categoriesData = await categoriesResponse.json();
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error(err);
        setError("Could not load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);
  // Filter the products
  let filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesCategory = category === "all" || product.category === category;
    const matchesCondition =
      condition === "all" || product.condition === condition;
    return matchesSearch && matchesCategory && matchesCondition;
  });
  // Sort products
  if (sort === "price-low") {
    filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === "price-high") {
    filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
  }
  return (
    <>
      <Navbar />
      <main className="marketplace-page">
        <div className="container">
          <div className="marketplace-heading">
            <h1>Explore Products</h1>
            <p>Discover great deals on computer hardware and tech devices.</p>
          </div>
          {/* Search and filters */}
          <div className="marketplace-filters">
            <input
              type="search"
              placeholder="Search for products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              aria-label="Filter by condition"
            >
              <option value="all">All Conditions</option>
              <option value="Brand New">Brand New</option>
              <option value="Like New">Like New</option>
              <option value="Used">Used</option>
              <option value="For Parts">For Parts</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort products"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
          {/* Products */}
          {loading ? (
            <p className="marketplace-message">Loading products...</p>
          ) : error ? (
            <p className="marketplace-message">{error}</p>
          ) : (
            <>
              <p className="marketplace-count">
                {filteredProducts.length} products found
              </p>
              {filteredProducts.length === 0 ? (
                <p className="marketplace-message">No products found.</p>
              ) : (
                <div className="marketplace-grid">
                  {filteredProducts.map((product) => (
                    <article className="marketplace-card" key={product.id}>
                      <div className="marketplace-image">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.title}
                            loading="lazy"
                          />
                        ) : (
                          <span>No image available</span>
                        )}
                      </div>
                      <div className="marketplace-card-body">
                        <span className="marketplace-category">
                          {product.category}
                        </span>
                        <h3>{product.title}</h3>
                        <p className="marketplace-seller">
                          Sold by {product.seller_name}
                        </p>
                        <div className="marketplace-card-bottom">
                          <strong>${Number(product.price).toFixed(2)}</strong>
                          <span className="marketplace-condition">
                            {product.condition}
                          </span>
                        </div>
                        {Boolean(product.is_negotiable) && (
                          <span className="marketplace-negotiable">
                            Negotiable
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
export default Marketplace;
