import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/ProductDetails.css";

function ProductDetails({ productId }) {
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Product not found.");
          }

          throw new Error("Failed to load product.");
        }

        const data = await response.json();

        setProduct(data);
        setSelectedImage(0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    getProduct();
  }, [productId]);

  return (
    <>
      <Navbar />

      <main className="details-page">
        <div className="container details-container">
          <a href="/marketplace" className="details-back">
            ← Back to Marketplace
          </a>

          {loading ? (
            <p className="details-message">Loading product...</p>
          ) : error ? (
            <p className="details-message">{error}</p>
          ) : product ? (
            <div className="details-grid">
              {/* PRODUCT IMAGES */}
              <div className="details-gallery">
                <div className="details-main-image">
                  {product.images?.length > 0 ? (
                    <img
                      src={product.images[selectedImage]}
                      alt={product.title}
                    />
                  ) : (
                    <p>No image available</p>
                  )}
                </div>

                {product.images?.length > 1 && (
                  <div className="details-thumbnails">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        className={
                          selectedImage === index
                            ? "details-thumb active"
                            : "details-thumb"
                        }
                        onClick={() => setSelectedImage(index)}
                      >
                        <img src={image} alt={`Product image ${index + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PRODUCT INFORMATION */}
              <div className="details-info">
                <span className="details-category">{product.category}</span>

                <h1>{product.title}</h1>

                <p className="details-price">
                  ${Number(product.price).toFixed(2)}
                </p>

                <div className="details-badges">
                  <span className="details-badge">{product.condition}</span>

                  <span className="details-badge">{product.status}</span>

                  {Boolean(product.is_negotiable) && (
                    <span className="details-badge negotiable">Negotiable</span>
                  )}
                </div>

                {/* DESCRIPTION */}
                <div className="details-section">
                  <h2>Description</h2>
                  <p>{product.description || "No description provided."}</p>
                </div>

                {/* SELLER */}
                <div className="details-section">
                  <h2>Seller Information</h2>
                  <p>
                    Sold by: <strong>{product.seller_name}</strong>
                  </p>
                </div>

                {/* LISTING DATE */}
                <div className="details-section">
                  <h2>Listing Information</h2>
                  <p>
                    Posted on:{" "}
                    {new Date(product.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* BUY AND OFFER BUTTONS */}
                {product.status === "available" ? (
                  <div className="details-actions">
                    <button className="details-buy" disabled>
                      Buy Now
                    </button>

                    {Boolean(product.is_negotiable) && (
                      <button className="details-offer" disabled>
                        Make an Offer
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="details-unavailable">
                    This product is currently {product.status}.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default ProductDetails;
