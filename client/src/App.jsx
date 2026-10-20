import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";

function App() {
  const page = window.location.pathname;

  if (page === "/login") return <Login />;
  if (page === "/signup") return <Signup />;

  return <Home />;
}

export default App;
