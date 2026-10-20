import "./Footer.css";

const usefulLinks = [
  { label: "About Us", href: "/about" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const categories = [
  { label: "Graphics Cards", href: "/marketplace?category=gpu" },
  { label: "Processors", href: "/marketplace?category=cpu" },
  { label: "Memory (RAM)", href: "/marketplace?category=ram" },
  { label: "Storage", href: "/marketplace?category=storage" },
  { label: "Motherboards", href: "/marketplace?category=motherboard" },
  { label: "Power Supplies", href: "/marketplace?category=psu" },
  { label: "Cooling", href: "/marketplace?category=cooling" },
  { label: "Cases", href: "/marketplace?category=case" },
];

const accountLinks = [
  { label: "Sign Up", href: "/signup" },
  { label: "Log In", href: "/login" },
  { label: "Sell an Item", href: "/sell" },
  { label: "My Listings", href: "/my-listings" },
  { label: "Messages", href: "/messages" },
  { label: "Safety Guidelines", href: "/safety" },
];

function FooterColumn({ title, links }) {
  return (
    <div className="footer-col">
      <h3>{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand + contact */}
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              SiliconExchange
            </a>
            <p className="footer-about">
              The peer-to-peer hardware marketplace built exclusively for
              engineering students.
            </p>

            <div className="footer-info">
              <span className="footer-label">Address:</span>
              <p>Beirut, Lebanon</p>
            </div>

            <div className="footer-info">
              <span className="footer-label">Contact:</span>
              <p>+961 00 000 000</p>
              <p>
                <a href="mailto:support@siliconexchange.com">
                  support@siliconexchange.com
                </a>
              </p>
            </div>

            <div className="footer-social">
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="20"
                  height="20"
                >
                  <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="20"
                  height="20"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>
            </div>
          </div>

          <FooterColumn title="Useful Links" links={usefulLinks} />
          <FooterColumn title="Popular Categories" links={categories} />
          <FooterColumn title="Account" links={accountLinks} />
        </div>
      </div>
    </footer>
  );
}

export default Footer;
