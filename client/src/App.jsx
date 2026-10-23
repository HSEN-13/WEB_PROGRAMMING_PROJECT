import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Marketplace from "./pages/marketplace";

function App() {
  const page = window.location.pathname;

  if (page === "/login") return <Login />;
  if (page === "/signup") return <Signup />;
  if (page === "/marketplace") return <Marketplace />;

  return <Home />;
}

export default App;
