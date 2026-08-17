import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, type JSX } from "react";
import Layout from "./components/Layout";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const loggedIn = true; // exempel
  return loggedIn ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<div>Laddar...</div>}>
      <Routes>

        <Route path="/" element={<Layout />}>

          <Route index element={<Home />} />
          <Route path="about" element={<About />} />

          <Route path="profile/:id" element={<Profile />} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="dashboard/settings" element={<Settings />} />

          <Route path="*" element={<NotFound />} />

        </Route>

      </Routes>
    </Suspense>
  );
}
