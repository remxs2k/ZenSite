import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Rezervari from "./Rezervari.jsx"; // pasul următor vom crea acest fișier

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/rezervari" element={<Rezervari />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
