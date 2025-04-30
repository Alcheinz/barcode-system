import React from 'react';
import { HashRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { Navbar, Container, Nav, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import SatisEkrani from './pages/SatisEkrani';
import UrunYonetimi from './pages/UrunYonetimi';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Tema değiştirme butonu bileşeni
const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();
  
  return (
    <Form.Check 
      type="switch"
      id="theme-switch"
      label={<i className={`bi ${darkMode ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>}
      checked={darkMode}
      onChange={toggleTheme}
      className="ms-3 d-flex align-items-center"
    />
  );
};

// Ana uygulama bileşeni
function AppContent() {
  const { darkMode } = useTheme();
  
  return (
    <CartProvider>
      <Router>
        <div className="min-vh-100 d-flex flex-column">
          <Navbar 
            bg={darkMode ? "dark" : "primary"} 
            variant="dark" 
            expand="lg" 
            className="shadow-sm"
          >
            <Container>
              <Navbar.Brand as={Link} to="/" className="fw-bold">
                <i className="bi bi-upc-scan me-2"></i>
                Barkod Sistemi
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="main-navbar" />
              <Navbar.Collapse id="main-navbar">
                <Nav className="ms-auto">
                  <Nav.Link as={NavLink} to="/" className="mx-2 d-flex align-items-center">
                    <i className="bi bi-cart-fill me-2"></i>
                    Satış Ekranı
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/urunler" className="mx-2 d-flex align-items-center">
                    <i className="bi bi-box-seam me-2"></i>
                    Ürün Yönetimi
                  </Nav.Link>
                  <ThemeToggle />
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
          
          <div className={`flex-grow-1 ${darkMode ? 'bg-dark' : 'bg-light'}`}>
            <Routes>
              <Route path="/" element={<SatisEkrani />} />
              <Route path="/urunler" element={<UrunYonetimi />} />
            </Routes>
          </div>
          
          <footer className={`${darkMode ? 'bg-dark text-light border-top border-secondary' : 'bg-dark text-light'} py-3 text-center`}>
            <Container>
              <small>© {new Date().getFullYear()} Barkod Sistemi - Tüm Hakları Saklıdır</small>
            </Container>
          </footer>
        </div>
      </Router>
    </CartProvider>
  );
}

// Ana uygulama
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;