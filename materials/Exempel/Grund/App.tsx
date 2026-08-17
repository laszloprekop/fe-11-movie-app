
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h2>Hem-sidan</h2>
      <p>Välkommen till startsidan för vårt enkla router-exempel!</p>
    </div>
  );
}

function About() {
  return (
    <div>
      <h2>Om oss</h2>
      <p>Detta är en enkel sida som visar hur React Router fungerar.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div>
        <h1>React Router Demo</h1>
        
        <nav>
          <Link to="/">Hem</Link> | <Link to="/about">Om oss</Link>
        </nav>

        <hr />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}