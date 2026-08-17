import { NavLink, Outlet } from "react-router-dom"

export default function Layout() {
  return (
    <>
      <nav className="flex gap-4 p-4">
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
