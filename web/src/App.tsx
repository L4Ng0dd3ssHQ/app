import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import History from "./pages/History";
import About from "./pages/About";
import ResultDetail from "./pages/ResultDetail";
import Pro from "./pages/Pro";
import ProSuccess from "./pages/ProSuccess";
import Resumes from "./pages/Resumes";

export default function App() {
  return React.createElement(
    Routes,
    null,
    React.createElement(
      Route,
      { element: React.createElement(Layout, null) },
      React.createElement(Route, { path: "/", element: React.createElement(Home, null) }),
      React.createElement(Route, { path: "/analyze", element: React.createElement(Analyze, null) }),
      React.createElement(Route, { path: "/history", element: React.createElement(History, null) }),
      React.createElement(Route, { path: "/about", element: React.createElement(About, null) }),
      React.createElement(Route, { path: "/pro", element: React.createElement(Pro, null) }),
      React.createElement(Route, { path: "/pro/success", element: React.createElement(ProSuccess, null) }),
      React.createElement(Route, { path: "/result/:id", element: React.createElement(ResultDetail, null) }),
      React.createElement(Route, { path: "/resumes", element: React.createElement(Resumes, null) }),
      React.createElement(Route, { path: "*", element: React.createElement(Navigate, { to: "/", replace: true }) })
    )
  );
}
