import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { AppPage } from "./pages/AppPage";

function LearnPagePlaceholder() {
  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Learn HTTP Caching</h1>
      <p>Coming soon...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<AppPage />} />
        <Route path="/learn" element={<LearnPagePlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
