import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import MovieDetails from "./pages/MovieDetails"
import NotFound from "./pages/NotFound"

// Lazy pages — their code is fetched the first time someone navigates there.
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Quiz = lazy(() => import("./pages/Quiz"))

export default function App() {
  return (
    <Suspense fallback={<p className="p-4">Laddar…</p>}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="movies/:id" element={<MovieDetails />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
