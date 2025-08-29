import { MemoryRouter, Routes, Route } from 'react-router';

import { Home } from './pages/Home.js';
import { Login } from './pages/Login.js';

export function App() {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </MemoryRouter>
  );
}
