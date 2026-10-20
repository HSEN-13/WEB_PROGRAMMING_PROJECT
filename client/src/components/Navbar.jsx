import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container nav-content">
        <a href="/" className="logo">
          MarketPlace
        </a>
        <div className="nav-links">
          <a href="/marketplace">Marketplace</a>
          <a href="#how-it-works">How it Works</a>
          <a href="/safety">Safety</a>
          <a href="/signup" className="btn-nav">
            Sign Up
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
