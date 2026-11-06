import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Reviews.css";

export default function NewReview() {
  const [pageState, setPageState] = useState("loading");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch("/api/me");

        if (response.status === 401) {
          setPageState("logged-out");
          return;
        }

        if (!response.ok) throw new Error("Could not check login.");
        setPageState("ready");
      } catch {
        setPageState("error");
      }
    }

    checkLogin();
  }, []);

  async function publishReview(event) {
    event.preventDefault();
    setError("");

    if (!comment.trim()) {
      setError("Write a comment before publishing.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: Number(rating), comment }),
      });

      if (response.status === 401) {
        setPageState("logged-out");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Could not publish your review.");
      }

      window.location.href = "/reviews";
    } catch (err) {
      setError(err.message || "Could not publish your review.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="reviews-page">
        <a href="/reviews">← All reviews</a>
        <h1>Write a review</h1>

        {pageState === "loading" && <p>Checking login...</p>}
        {pageState === "error" && (
          <p role="alert">Could not check your login. Refresh to try again.</p>
        )}
        {pageState === "logged-out" && (
          <p>
            <a href="/login">Log in</a> to post a review.
          </p>
        )}

        {pageState === "ready" && (
          <form className="review-card review-form" onSubmit={publishReview}>
            <label htmlFor="review-rating">Marketplace rating</label>
            <select
              id="review-rating"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              required
            >
              <option value="">Choose a rating</option>
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Good</option>
              <option value="3">3 — Average</option>
              <option value="2">2 — Poor</option>
              <option value="1">1 — Very poor</option>
            </select>

            <label htmlFor="review-comment">Your review</label>
            <textarea
              id="review-comment"
              rows={5}
              maxLength={1000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              required
            />

            {error && <p role="alert">{error}</p>}

            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? "Publishing..." : "Publish review"}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </>
  );
}
