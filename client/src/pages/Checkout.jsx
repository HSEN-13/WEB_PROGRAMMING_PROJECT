import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Orders.css";

export default function Checkout({ productId }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCheckout() {
      try {
        const response = await fetch("/api/checkout/" + productId);

        if (response.status === 401) {
          setLoginRequired(true);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load checkout.");
        }

        setDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCheckout();
  }, [productId]);

  async function confirmPurchase(event) {
    event.preventDefault();
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/checkout/" + productId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          email,
          expected_price: String(details.final_price),
        }),
      });

      if (response.status === 401) {
        setLoginRequired(true);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not confirm purchase.");
      }

      window.location.href = "/orders/purchases";
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="orders-page">
        <h1>Checkout</h1>

        {loading && <p>Loading checkout...</p>}
        {error && <p role="alert">{error}</p>}

        {loginRequired ? (
          <p>
            <a href="/login">Log in</a> to buy this product.
          </p>
        ) : (
          details && (
            <section className="order-card">
              <h2>{details.title}</h2>
              <p>Seller: {details.seller_name}</p>
              <p>
                {details.offer_id ? "Agreed price" : "Price"}:{" "}
                <strong>${Number(details.final_price).toFixed(2)}</strong>
              </p>
              <p>Pay the seller at pickup.</p>

              <form className="checkout-form" onSubmit={confirmPurchase}>
                <label htmlFor="buyer-phone">Phone number *</label>
                <input
                  id="buyer-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+961 ..."
                  required
                  maxLength={30}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />

                <label htmlFor="buyer-email">Email (optional)</label>
                <input
                  id="buyer-email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />

                <p>
                  Your phone number and any email you enter will be shared with
                  this seller to arrange pickup.
                </p>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sending}
                >
                  {sending ? "Confirming..." : "Confirm purchase"}
                </button>
              </form>
            </section>
          )
        )}
      </main>

      <Footer />
    </>
  );
}
