import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Reviews.css";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [pageState, setPageState] = useState("loading");

  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch("/api/reviews");
        if (!response.ok) throw new Error("Could not load reviews.");

        const data = await response.json();
        setReviews(data);
        setPageState("ready");
      } catch {
        setPageState("error");
      }
    }

    loadReviews();
  }, []);

  return (
    <>
      <Navbar />

      <main className="reviews-page">
        <header className="reviews-header">
          <h1>Marketplace Reviews</h1>
          <a className="btn-primary" href="/reviews/new">
            Write a review
          </a>
        </header>

        {pageState === "loading" && <p>Loading reviews...</p>}
        {pageState === "error" && <p role="alert">Could not load reviews.</p>}
        {pageState === "ready" && reviews.length === 0 && (
          <p>No reviews yet. Be the first to share your experience.</p>
        )}

        {reviews.map((review) => (
          <article key={review.id} className="review-card">
            <h2>{review.author_name}</h2>
            <p className="review-meta">
              {review.rating}/5 ·{" "}
              {new Date(review.created_at).toLocaleDateString()}
            </p>
            <p className="review-comment">{review.comment}</p>
          </article>
        ))}
      </main>

      <Footer />
    </>
  );
}
