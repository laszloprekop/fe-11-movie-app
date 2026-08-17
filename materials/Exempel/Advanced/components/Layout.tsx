import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <nav style={{ display: "flex", gap: "1rem" }}>
        <NavLink to="/" end>Hem</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/profile/42">Profil 42</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </nav>

      <main>
        <Outlet />
      </main>
    </>
  );
}
