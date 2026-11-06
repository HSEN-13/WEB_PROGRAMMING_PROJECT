import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Offers.css";

function money(value) {
  return "$" + Number(value).toFixed(2);
}

export default function Offers({ view }) {
  const received = view === "received";
  const [offers, setOffers] = useState([]);
  const [pageState, setPageState] = useState("loading");
  const [savingId, setSavingId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    async function loadOffers() {
      try {
        const response = await fetch("/api/me/offers/" + view);

        if (response.status === 401) {
          setPageState("logged-out");
          return;
        }

        if (!response.ok) throw new Error("Could not load offers.");

        setOffers(await response.json());
        setPageState("ready");
      } catch {
        setPageState("error");
      }
    }

    loadOffers();
  }, [view]);

  async function decideOffer(offerId, decision) {
    setSavingId(offerId);
    setActionError("");

    try {
      const response = await fetch("/api/offers/" + offerId + "/decision", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      if (response.status === 401) {
        setPageState("logged-out");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update the offer.");
      }

      // Acceptance can change several offers, so reload their saved statuses.
      window.location.reload();
    } catch (err) {
      setActionError(err.message);
      setSavingId(null);
    }
  }

  return (
    <>
      <Navbar />

      <main className="offers-page">
        <h1>{received ? "Received Offers" : "My Offers"}</h1>

        <nav className="offers-tabs" aria-label="Offer pages">
          <a
            href="/offers/received"
            aria-current={received ? "page" : undefined}
          >
            Received Offers
          </a>
          <a href="/offers/sent" aria-current={!received ? "page" : undefined}>
            My Offers
          </a>
        </nav>

        {pageState === "loading" && <p>Loading offers...</p>}
        {pageState === "logged-out" && (
          <p>
            <a href="/login">Log in</a> to view your offers.
          </p>
        )}
        {pageState === "error" && (
          <p role="alert">Could not load offers. Refresh to try again.</p>
        )}
        {actionError && <p role="alert">{actionError}</p>}

        {pageState === "ready" && offers.length === 0 && (
          <section className="account-empty">
            <h2>
              {received
                ? "Waiting for your first offer"
                : "Your offers will appear here"}
            </h2>

            <p>
              {received
                ? "Offers on your negotiable listings will appear here for you to accept or reject."
                : "Make an offer on a negotiable product and follow the seller’s response here."}
            </p>

            <a
              className="btn-primary"
              href={received ? "/my-listings" : "/marketplace"}
            >
              {received ? "View my listings" : "Browse marketplace"}
            </a>
          </section>
        )}

        {pageState === "ready" &&
          offers.map((offer) => (
            <article key={offer.id} className="offer-card">
              <h2>
                <a href={"/product/" + offer.product_id}>
                  {offer.product_title}
                </a>
              </h2>

              <p>
                {received
                  ? "Buyer: " + offer.buyer_name
                  : "Seller: " + offer.seller_name}
              </p>
              <p>Asking price: {money(offer.asking_price)}</p>
              <p>
                <strong>Offer: {money(offer.amount)}</strong>
              </p>
              <p>Offer status: {offer.status}</p>

              {!received &&
                offer.status === "accepted" &&
                offer.product_status === "available" && (
                  <a
                    className="btn-primary"
                    href={"/checkout/" + offer.product_id}
                  >
                    Buy at agreed price
                  </a>
                )}

              {received && offer.status === "pending" && (
                <div className="offer-actions">
                  {offer.product_status === "available" && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={savingId !== null}
                      onClick={() => decideOffer(offer.id, "accepted")}
                    >
                      Accept offer
                    </button>
                  )}

                  <button
                    type="button"
                    className="offer-reject"
                    disabled={savingId !== null}
                    onClick={() => decideOffer(offer.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
      </main>

      <Footer />
    </>
  );
}
