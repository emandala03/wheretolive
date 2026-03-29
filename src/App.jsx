import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar      from "./components/Navbar.jsx";
import Home        from "./pages/Home.jsx";
import Calculator  from "./pages/Calculator.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";
import About       from "./pages/About.jsx";
import Contact     from "./pages/Contact.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/calculator"   element={<Calculator />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about"        element={<About />} />
        <Route path="/contact"      element={<Contact />} />
        <Route path="*"             element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
