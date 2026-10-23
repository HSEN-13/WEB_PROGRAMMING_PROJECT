import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Marketplace from "./pages/marketplace";
import ProductDetails from "./pages/ProductDetails";
import SellProduct from "./pages/SellProduct";

function App() {
  const page = window.location.pathname;

  if (page === "/login") return <Login />;
  if (page === "/signup") return <Signup />;
  if (page === "/marketplace") return <Marketplace />;
  if (page.startsWith("/product/")) {
    const productId = page.split("/")[2];
    return <ProductDetails productId={productId} />;
  }
  if (page === "/sell") return <SellProduct />;

  return <Home />;
}

export default App;
