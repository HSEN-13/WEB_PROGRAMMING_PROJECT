import { useEffect, useState } from "react";
import "./CategoriesSection.css";
import gpuPic from "../assets/GPU.svg";
import cpuPic from "../assets/cpu.svg";
import ramPic from "../assets/ram.svg";
import storagePic from "../assets/storage.svg";
import keyboardPic from "../assets/keyboard.svg";

const categoryImages = {
  gpu: gpuPic,
  cpu: cpuPic,
  ram: ramPic,
  storage: storagePic,
  peripherals: keyboardPic,
};

export default function CategorySection() {
  const [categories, setCategories] = useState([]);
  const [pageState, setPageState] = useState("loading");

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error("Could not load categories.");
        }

        setCategories(await response.json());
        setPageState("ready");
      } catch {
        setPageState("error");
      }
    }

    loadCategories();
  }, []);

  return (
    <section className="category-section container">
      <div className="category-header">
        <h2>Shop by Category</h2>
        <a href="/marketplace" className="view-all-link">
          View All
        </a>
      </div>

      {pageState === "loading" && <p>Loading categories...</p>}
      {pageState === "error" && <p role="alert">Could not load categories.</p>}
      {pageState === "ready" && categories.length === 0 && (
        <p>No categories available yet.</p>
      )}

      <div className="category-grid">
        {categories.map((category) => (
          <a
            key={category.id}
            className="category-card"
            href={"/marketplace?category=" + encodeURIComponent(category.slug)}
          >
            {categoryImages[category.slug] && (
              <img
                src={categoryImages[category.slug]}
                alt=""
                className="category-image"
              />
            )}
            <span>{category.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
