import { useState } from "react";
import "../styles/Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = "/";
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <header className="auth-header">
        <div className="auth-header-inner">
          <a href="/" className="auth-brand">
            MarketPlace
          </a>

          <a href="/" className="auth-back">
            ← Back to home
          </a>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Log in to your MarketPlace account.</p>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {message && (
              <p role="alert" style={{ color: "red" }}>
                {message}
              </p>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="auth-switch">
            Don’t have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
