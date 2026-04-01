import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { AppPage } from "./pages/AppPage";
import { LearnPage } from "./pages/LearnPage";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<AppPage />} />
        <Route path="/learn" element={<LearnPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
