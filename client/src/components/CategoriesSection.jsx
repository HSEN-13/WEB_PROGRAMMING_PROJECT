import "./CategoriesSection.css";
import gpuPic from "../assets/GPU.svg";
import cpuPic from "../assets/cpu.svg";
import ramPic from "../assets/ram.svg";
import storagePic from "../assets/storage.svg";
import keyboardPic from "../assets/keyboard.svg";

const CATEGORIES = [
  { id: 1, name: "GPU", image: gpuPic },
  { id: 2, name: "Processors", image: cpuPic },
  { id: 3, name: "RAM & Memory", image: ramPic },
  { id: 4, name: "Storage (SSD)", image: storagePic },
  { id: 5, name: "Motherboards" },
  { id: 6, name: "Peripherals", image: keyboardPic },
];

function CategorySection() {
  return (
    <section className="category-section container">
      <div className="category-header">
        <h2>Shop By Categories</h2>
        <a href="/categories" className="view-all-link">
          View All
        </a>
      </div>

      <div className="category-grid">
        {CATEGORIES.map((category) => (
          <button key={category.id} className="category-card">
            <img
              src={category.image}
              alt={category.name}
              className="category-image"
            />
          </button>
        ))}
      </div>
    </section>
  );
}

export default CategorySection;
