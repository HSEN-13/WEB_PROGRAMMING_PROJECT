import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/SellProduct.css";

function SellProduct() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    price: "",
    condition: "Used",
    is_negotiable: true,
  });
  const [images, setImages] = useState([]);
  // Check login and load categories
  useEffect(() => {
    async function loadPage() {
      try {
        const [userResponse, categoryResponse] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/categories"),
        ]);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        }
        if (!categoryResponse.ok) {
          throw new Error("Could not load categories");
        }
        const categoryData = await categoryResponse.json();
        setCategories(categoryData);
      } catch (err) {
        setError(err.message);
      } finally {
        setPageLoading(false);
      }
    }
    loadPage();
  }, []);
  // Update text fields and dropdowns
  function handleChange(event) {
    const { name, value } = event.target;
    setForm({
      ...form,
      [name]: value,
    });
  }
  // Update selected images
  function handleImages(event) {
    const selectedFiles = Array.from(event.target.files);
    setImages(selectedFiles);
  }
  // Submit product to Express
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (images.length === 0) {
      setError("Please select at least one product image");
      return;
    }
    if (images.length > 4) {
      setError("You can upload a maximum of 4 images");
      return;
    }
    if (images.some((file) => file.size > 5 * 1024 * 1024)) {
      setError("Each image must be 5 MB or smaller");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      // Add product information
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category_id", form.category_id);
      formData.append("price", form.price);
      formData.append("condition", form.condition);
      formData.append("is_negotiable", String(form.is_negotiable));
      // Add uploaded images
      images.forEach((image) => {
        formData.append("images", image);
      });
      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not publish product");
      }
      // Product created successfully
      window.location.href = "/marketplace";
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <>
      <Navbar />
      <main className="sell-page">
        <div className="sell-container">
          <a href="/marketplace" className="sell-back">
            ← Back to Marketplace
          </a>
          <div className="sell-heading">
            <h1>Sell Your Product</h1>
            <p>Fill in the details below to publish your listing.</p>
          </div>
          {pageLoading ? (
            <p>Loading...</p>
          ) : !user ? (
            <div className="sell-card sell-login">
              <h2>Login Required</h2>
              <p>You must be logged in to sell a product.</p>
              <a href="/login" className="btn-primary">
                Log In
              </a>
            </div>
          ) : (
            <form className="sell-card" onSubmit={handleSubmit}>
              {/* PRODUCT TITLE */}
              <div className="sell-field">
                <label htmlFor="title">Product Title *</label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  placeholder="e.g. NVIDIA RTX 3060 12GB"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={150}
                  required
                />
              </div>
              {/* CATEGORY */}
              <div className="sell-field">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* PRICE AND CONDITION */}
              <div className="sell-row">
                <div className="sell-field">
                  <label htmlFor="price">Price (USD) *</label>
                  <input
                    id="price"
                    type="number"
                    name="price"
                    placeholder="250.00"
                    min="0.01"
                    max="99999999.99"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="sell-field">
                  <label htmlFor="condition">Condition *</label>
                  <select
                    id="condition"
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                    required
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used">Used</option>
                    <option value="For Parts">For Parts</option>
                  </select>
                </div>
              </div>
              {/* DESCRIPTION */}
              <div className="sell-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  placeholder="Describe your product, specifications, and any defects..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
              {/* NEGOTIATION */}
              <div className="sell-checkbox">
                <input
                  id="negotiable"
                  type="checkbox"
                  checked={form.is_negotiable}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_negotiable: e.target.checked,
                    })
                  }
                />
                <label htmlFor="negotiable">
                  Allow buyers to negotiate the price
                </label>
              </div>
              {/* IMAGES */}
              <div className="sell-field">
                <label htmlFor="images">Product Photos *</label>
                <input
                  id="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImages}
                  required
                />
                <p className="sell-hint">
                  Upload 1–4 JPG, PNG, or WebP images. Maximum 5 MB each.
                </p>
                {images.length > 0 && (
                  <div className="sell-selected">
                    <strong>{images.length} image(s) selected</strong>
                    {images.map((image, index) => (
                      <p key={index}>{image.name}</p>
                    ))}
                  </div>
                )}
              </div>
              {/* ERROR MESSAGE */}
              {error && (
                <p className="sell-error" role="alert">
                  {error}
                </p>
              )}
              {/* SUBMIT */}
              <button
                type="submit"
                className="btn-primary sell-submit"
                disabled={submitting}
              >
                {submitting ? "Publishing..." : "Publish Listing"}
              </button>
            </form>
          )}
          {!pageLoading && !user && error && (
            <p className="sell-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
export default SellProduct;
