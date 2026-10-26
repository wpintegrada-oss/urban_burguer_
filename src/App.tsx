import { Navigate, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import OrderTracking from "@/pages/OrderTracking";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/pedido/:id" element={<OrderTracking />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
