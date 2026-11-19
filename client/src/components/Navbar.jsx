import "./Navbar.css";
import { useState, useEffect } from "react";

function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch("/api/me");

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.log("Could not check login status");
      } finally {
        setLoading(false);
      }
    }

    checkLogin();
  }, []);

  async function handleLogout() {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (response.ok) {
        setUser(null);
        window.location.href = "/";
      }
    } catch (error) {
      console.log("Logout failed");
    }
  }

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <a href="/" className="logo">
          MarketPlace
        </a>
        <div className="nav-links">
          <a href="/marketplace">Marketplace</a>

          {user?.role === "user" && <a href="/sell">Sell Product</a>}
          {user?.role === "user" && <a href="/my-listings">My Listings</a>}

          <a href="/reviews">Reviews</a>

          {user?.role === "user" && <a href="/orders/purchases">Orders</a>}
          {user?.role === "user" && <a href="/offers/received">Offers</a>}

          {user?.role === "admin" && <a href="/admin">Admin Dashboard</a>}

          <div className="nav-auth">
            {!loading &&
              (user ? (
                <>
                  <span className="nav-username">{user.full_name}</span>

                  <button className="nav-logout" onClick={handleLogout}>
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <a href="/login">Log In</a>
                  <a href="/signup">Sign Up</a>
                </>
              ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
