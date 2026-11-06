import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Orders.css";

export default function Orders({ view }) {
  const sales = view === "sales";
  const [orders, setOrders] = useState([]);
  const [pageState, setPageState] = useState("loading");
  const [savingId, setSavingId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/me/orders/" + view);

        if (response.status === 401) {
          setPageState("logged-out");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load orders.");
        }

        setOrders(await response.json());
        setPageState("ready");
      } catch {
        setPageState("error");
      }
    }

    loadOrders();
  }, [view]);

  async function updateOrder(orderId, status) {
    setSavingId(orderId);
    setActionError("");

    try {
      const response = await fetch("/api/orders/" + orderId + "/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.status === 401) {
        setPageState("logged-out");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update the order.");
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? { ...order, status: data.status } : order,
        ),
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <Navbar />

      <main className="orders-page">
        <h1>{sales ? "My Sales" : "My Purchases"}</h1>

        <nav className="orders-tabs" aria-label="Order pages">
          <a
            href="/orders/purchases"
            aria-current={!sales ? "page" : undefined}
          >
            My Purchases
          </a>

          <a href="/orders/sales" aria-current={sales ? "page" : undefined}>
            My Sales
          </a>
        </nav>

        {pageState === "loading" && <p>Loading orders...</p>}

        {pageState === "logged-out" && (
          <p>
            <a href="/login">Log in</a> to view orders.
          </p>
        )}

        {pageState === "error" && (
          <p role="alert">Could not load orders. Refresh to try again.</p>
        )}

        {actionError && <p role="alert">{actionError}</p>}

        {pageState === "ready" && orders.length === 0 && (
          <section className="account-empty">
            <h2>
              {sales
                ? "Your sales will appear here"
                : "Your purchases will appear here"}
            </h2>

            <p>
              {sales
                ? "When someone buys your product, you’ll find the order and their contact details here."
                : "Find your next upgrade and arrange pickup directly with the seller."}
            </p>

            <a className="btn-primary" href={sales ? "/sell" : "/marketplace"}>
              {sales ? "Create a listing" : "Browse marketplace"}
            </a>
          </section>
        )}

        {pageState === "ready" &&
          orders.map((order) => (
            <article className="order-card" key={order.id}>
              <h2>
                <a href={"/product/" + order.product_id}>
                  {order.product_title}
                </a>
              </h2>

              <p>Order #{order.id}</p>
              <p>
                {sales
                  ? "Buyer: " + order.buyer_name
                  : "Seller: " + order.seller_name}
              </p>
              <p>Price: ${Number(order.final_price).toFixed(2)}</p>
              <p>Status: {order.status}</p>

              <h3>
                {sales
                  ? "Buyer contact details"
                  : "Your submitted contact details"}
              </h3>

              <p>
                Phone: {order.buyer_phone || "Unavailable for this older order"}
              </p>

              {order.buyer_email && <p>Email: {order.buyer_email}</p>}

              {order.status === "pending" && (
                <>
                  <p>
                    {sales
                      ? "Contact the buyer to arrange pickup. Complete the sale after receiving payment."
                      : "Your item is reserved. The seller can contact you to arrange pickup."}
                  </p>

                  <div className="order-actions">
                    {sales && (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={savingId !== null}
                        onClick={() => updateOrder(order.id, "completed")}
                      >
                        Confirm pickup and payment
                      </button>
                    )}

                    <button
                      type="button"
                      className="order-cancel"
                      disabled={savingId !== null}
                      onClick={() => updateOrder(order.id, "cancelled")}
                    >
                      Cancel order
                    </button>

                    {savingId === order.id && (
                      <span role="status">Updating...</span>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
      </main>

      <Footer />
    </>
  );
}
