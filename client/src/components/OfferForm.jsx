import { useState } from "react";

export default function OfferForm({ productId }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [error, setError] = useState("");

  async function sendOffer(event) {
    event.preventDefault();
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/products/" + productId + "/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (response.status === 401) {
        setLoginRequired(true);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not send your offer.");
      }

      setSent(true);
    } catch (err) {
      setError(err.message || "Could not send your offer.");
    } finally {
      setSending(false);
    }
  }

  if (loginRequired) {
    return <a href="/login">Log in again to send your offer</a>;
  }

  if (sent) {
    return <p role="status">Offer sent. Waiting for the seller’s response.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        className="details-offer"
        onClick={() => setOpen(true)}
      >
        Make an Offer
      </button>
    );
  }

  return (
    <form className="details-offer-form" onSubmit={sendOffer}>
      <label htmlFor="offer-amount">Your offer (USD)</label>
      <input
        id="offer-amount"
        type="number"
        min="0.01"
        max="99999999.99"
        step="0.01"
        required
        autoFocus
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />

      <button type="submit" className="details-offer" disabled={sending}>
        {sending ? "Sending..." : "Send offer"}
      </button>

      {error && <p role="alert">{error}</p>}
    </form>
  );
}
