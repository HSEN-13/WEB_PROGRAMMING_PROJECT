import { useEffect, useState } from "react";
import "./Footer.css";

const usefulLinks = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Reviews", href: "/reviews" },
  { label: "Write a Review", href: "/reviews/new" },
];

const accountLinks = [
  { label: "Sign Up", href: "/signup" },
  { label: "Log In", href: "/login" },
  { label: "Sell an Item", href: "/sell" },
  { label: "My Listings", href: "/my-listings" },
  { label: "My Purchases", href: "/orders/purchases" },
  { label: "My Sales", href: "/orders/sales" },
  { label: "My Offers", href: "/offers/sent" },
  { label: "Received Offers", href: "/offers/received" },
];

function FooterColumn({ title, links }) {
  return (
    <div className="footer-col">
      <h3>{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error("Could not load categories.");
        }

        setCategories(await response.json());
      } catch {
        setCategories([]);
      }
    }

    loadCategories();
  }, []);

  const categoryLinks = categories.map((category) => ({
    label: category.name,
    href: "/marketplace?category=" + encodeURIComponent(category.slug),
  }));

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              MarketPlace
            </a>
            <p className="footer-about">
              Buy and sell computer hardware and technology devices. Agree on a
              price and arrange pickup directly with the seller.
            </p>
          </div>

          <FooterColumn title="Explore" links={usefulLinks} />

          <FooterColumn
            title="Categories"
            links={
              categoryLinks.length > 0
                ? categoryLinks
                : [{ label: "Browse Marketplace", href: "/marketplace" }]
            }
          />

          <FooterColumn title="Account" links={accountLinks} />
        </div>
      </div>
    </footer>
  );
}
export default Footer;
