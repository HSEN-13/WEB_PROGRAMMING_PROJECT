import { useState } from "react";
import "../styles/Auth.css";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(event) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    // Check that passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage(data.message);

        // Clear the form
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
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
          <h1>Create an account</h1>
          <p className="auth-subtitle">
            Join MarketPlace to buy and sell PC hardware.
          </p>

          <form className="auth-form" onSubmit={handleSignup}>
            <div className="auth-field">
              <label htmlFor="signup-name">Full name</label>
              <input
                id="signup-name"
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm-password">Confirm password</label>
              <input
                id="signup-confirm-password"
                type="password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            {message && (
              <p role="alert" style={{ color: success ? "green" : "red" }}>
                {message}
              </p>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Signup;
