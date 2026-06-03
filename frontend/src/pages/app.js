import { BrowserRouter, Routes, Route } from "react-router-dom";
import Brands from "./pages/Brands";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Brands />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;