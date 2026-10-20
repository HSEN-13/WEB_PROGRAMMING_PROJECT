import express from "express";

const app = express();
const PORT = 3001;

app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

const products = [
  {
    id: 1,
    title: "NVIDIA RTX 3070 Ti Founders Edition",
    price: 380,
    condition: "Used",
    category: "GPU",
  },
  {
    id: 2,
    title: "Corsair Vengeance 32GB DDR5 6000MHz",
    price: 120,
    condition: "Like New",
    category: "RAM",
  },
  {
    id: 3,
    title: "AMD Ryzen 5 7600X Processor",
    price: 190,
    condition: "Brand New",
    category: "CPU",
  },
  {
    id: 4,
    title: "Samsung 980 PRO 2TB NVMe SSD",
    price: 130,
    condition: "Like New",
    category: "SSD",
  },
];

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`Running on port : ${PORT}`);
});
