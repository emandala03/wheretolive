import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar      from "./components/Navbar.jsx";
import Home        from "./pages/Home.jsx";
import Calculator  from "./pages/Calculator.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";
import About       from "./pages/About.jsx";
import Contact     from "./pages/Contact.jsx";

function Layout() {
  const { pathname } = useLocation();
  const showNav = pathname !== "/";
  return (
    <>
      {showNav && <Navbar />}
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/calculator"   element={<Calculator />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about"        element={<About />} />
        <Route path="/contact"      element={<Contact />} />
        <Route path="*"             element={<Home />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
