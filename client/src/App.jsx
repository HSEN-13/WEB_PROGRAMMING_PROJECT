import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Marketplace from "./pages/marketplace";
import ProductDetails from "./pages/ProductDetails";
import SellProduct from "./pages/SellProduct";
import MyListings from "./pages/MyListings";
import Reviews from "./pages/Reviews";
import NewReview from "./pages/NewReview";
import Offers from "./pages/Offers";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";

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
  if (page === "/my-listings") return <MyListings />;
  if (page === "/reviews") return <Reviews />;
  if (page === "/reviews/new") return <NewReview />;
  if (page === "/offers/received") return <Offers view="received" />;
  if (page === "/offers/sent") return <Offers view="sent" />;
  if (page.startsWith("/checkout/")) {
    const productId = page.split("/")[2];
    return <Checkout key={productId} productId={productId} />;
  }

  if (page === "/orders/purchases") {
    return <Orders key="purchases" view="purchases" />;
  }

  if (page === "/orders/sales") {
    return <Orders key="sales" view="sales" />;
  }

  return <Home />;
}

export default App;
