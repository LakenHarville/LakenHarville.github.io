import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

/**
 * Navbar Component — Responsive Navigation
 * 
 * This navbar serves a dual purpose:
 * 1. On DESKTOP: It's a secondary navigation (the game is primary)
 * 2. On MOBILE/TABLET: It's the PRIMARY way users navigate your portfolio
 * 
 * The "hamburger menu" pattern is an industry standard for mobile nav.
 * Think of it like a Swiss Army knife — compact when closed, fully 
 * functional when opened. We toggle a CSS class to animate it open/closed.
 * 
 * The `useLocation` hook from React Router tells us which page we're on,
 * so we can highlight the active link. It's like a "You Are Here" marker
 * on a mall directory.
 * 
 * The scroll effect adds a backdrop blur when you scroll down. This is a 
 * UX pattern called "progressive disclosure" — the navbar starts transparent
 * so it doesn't compete with your hero section, then becomes solid as you 
 * scroll into content-heavy areas.
 */
function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setIsOpen(false)
  }, [location])

  // Add scrolled state for backdrop blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    // Cleanup: Always remove event listeners to prevent memory leaks!
    // Without this, every re-render would add ANOTHER listener.
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/resume', label: 'Resume' },
    { path: '/education', label: 'Education' },
    { path: '/projects', label: 'Projects' },
    { path: '/interests', label: 'Interests' },
  ]

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo / Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🐸</span>
          <span className="brand-text">Laken<span className="accent">.</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
              {/* Active indicator dot */}
              {location.pathname === link.path && (
                <span className="active-dot"></span>
              )}
            </Link>
          ))}
        </div>

        {/* 
          Hamburger Button — Mobile Only
          
          The three spans become the hamburger lines.
          When `isOpen` is true, CSS transforms rotate two lines
          into an X and hides the middle one. This is a classic 
          CSS-only animation pattern — no JavaScript animation needed!
        */}
        <button
          className={`hamburger ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar
