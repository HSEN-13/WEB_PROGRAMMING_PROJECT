import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/marketplace.css";

function MyListings() {
  const [products, setProducts] = useState([]);
  const [pageState, setPageState] = useState("loading");
  const [savingId, setSavingId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    async function loadListings() {
      try {
        const response = await fetch("/api/me/products");

        if (response.status === 401) {
          setPageState("logged-out");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load listings");
        }

        const data = await response.json();
        setProducts(data);
        setPageState("ready");
      } catch (err) {
        console.error(err);
        setPageState("error");
      }
    }

    loadListings();
  }, []);

  async function markAsSold(productId) {
    setSavingId(productId);
    setActionError("");

    try {
      const response = await fetch("/api/products/" + productId + "/sold", {
        method: "PATCH",
      });

      if (response.status === 401) {
        setPageState("logged-out");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update the listing.");
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === productId
            ? { ...product, status: data.status }
            : product,
        ),
      );
    } catch (err) {
      setActionError(err.message || "Could not update the listing.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <Navbar />

      <main className="marketplace-page">
        <div className="container">
          <div className="marketplace-heading">
            <h1>My Listings</h1>
          </div>

          {pageState === "loading" && <p>Loading your listings...</p>}

          {pageState === "logged-out" && (
            <p>
              <a href="/login">Log in</a> to view your listings.
            </p>
          )}

          {pageState === "error" && (
            <p role="alert">Could not load your listings. Please try again.</p>
          )}

          {pageState === "ready" && products.length === 0 && (
            <p>
              You haven’t published any listings yet.{" "}
              <a href="/sell">Sell your first product</a>.
            </p>
          )}

          {actionError && <p role="alert">{actionError}</p>}

          {pageState === "ready" && products.length > 0 && (
            <div className="marketplace-grid">
              {products.map((product) => (
                <article key={product.id} className="marketplace-card">
                  <a
                    href={"/product/" + product.id}
                    className="marketplace-card-link"
                  >
                    <div className="marketplace-image">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" loading="lazy" />
                      ) : (
                        <span>No image available</span>
                      )}
                    </div>

                    <div className="marketplace-card-body">
                      <h3>{product.title}</h3>

                      <div className="marketplace-card-bottom">
                        <strong>${Number(product.price).toFixed(2)}</strong>
                        <span className="marketplace-condition">
                          {product.status}
                        </span>
                      </div>
                    </div>
                  </a>

                  {product.status === "available" && (
                    <div className="marketplace-card-body">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={savingId !== null}
                        onClick={() => markAsSold(product.id)}
                      >
                        {savingId === product.id ? "Saving..." : "Mark as sold"}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default MyListings;
