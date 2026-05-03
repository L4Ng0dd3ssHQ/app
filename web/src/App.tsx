import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import History from "./pages/History";
import About from "./pages/About";
import ResultDetail from "./pages/ResultDetail";
import Pro from "./pages/Pro";
import ProSuccess from "./pages/ProSuccess";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/history" element={<History />} />
        <Route path="/about" element={<About />} />
        <Route path="/pro" element={<Pro />} />
        <Route path="/pro/success" element={<ProSuccess />} />
        <Route path="/result/:id" element={<ResultDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
