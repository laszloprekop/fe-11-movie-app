import { NavLink, Outlet } from "react-router-dom"

export default function Layout() {
  return (
    <>
      <nav className="flex gap-2 px-6">
        <NavLink to="/" end>
          Hem
        </NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/quiz">Gissa filmen</NavLink>
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
    </>
  )
}
