import { Link } from 'react-router-dom'
import './Home.css'

/**
 * Home Page — The First Impression
 * 
 * Layout strategy: A two-column hero (photo + text) that collapses 
 * to a single column on mobile. Below that, the game CTA section.
 * 
 * The staggered animation delays (delay-1, delay-2, etc.) create a 
 * "waterfall" entrance effect. Each element fades in slightly after 
 * the previous one. This guides the visitor's eye in a deliberate 
 * reading order — like a movie director controlling where the 
 * audience looks with lighting.
 * 
 * PLACEHOLDER NOTE: Replace the photo src with your actual image.
 * Drop your photo in /public/your-photo.jpg and update the src below.
 */
function Home() {
  return (
    <div className="home">
      {/* ========== HERO SECTION ========== */}
      <section className="hero">
        <div className="hero-container container">
          {/* Photo Column */}
          <div className="hero-photo-wrapper animate-fade-in-up delay-1">
            <div className="photo-frame">
              {/* 
                REPLACE THIS: Put your photo in the /public folder 
                and change the src to "/your-photo.jpg"
              */}
              
              { 
              <img 
                src="/LakenPortfolioPicture.jpg" 
                alt="Laken Harville — Software Engineer" 
                className="hero-photo"
              />
              }
            </div>
            {/* Decorative frame accent */}
            <div className="photo-glow"></div>
          </div>

          {/* Bio Column */}
          <div className="hero-text">
            <p className="hero-greeting animate-fade-in-up delay-1">Hi, I'm</p>
            <h1 className="hero-name animate-fade-in-up delay-2">
              Laken <span className="gradient-text">Harville</span>
            </h1>
            <h2 className="hero-role animate-fade-in-up delay-3">
              Software Engineer & Tech Enthusiast
            </h2>
            
            
            {/* Quick links / social icons area */}
            <div className="hero-links animate-fade-in-up delay-5">
              {/* 
                TODO: Add your real links here.
                Replace the # with your actual URLs.
              */}
              <a href="https://github.com/LakenHarville" target="_blank" className="social-link" aria-label="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/laken-harville-635783226/" target="_blank" className="social-link" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="mailto:rlakenharville@gmail.com" className="social-link" aria-label="Email">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========== GAME CTA SECTION ========== */}
      <section className="game-cta-section">
        <div className="container">
          <div className="game-cta animate-fade-in-up">
            <div className="game-cta-content">
              <span className="game-cta-badge">Interactive Experience</span>
              <h2 className="game-cta-title">
                Explore My Portfolio <span className="gradient-text">as a Frog</span> 🐸
              </h2>
              <p className="game-cta-description">
                Jump into a 3D world and hop around to discover my resume, 
                education, projects, and interests. Use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to 
                move and <kbd>Space</kbd> to hop and interact!
              </p>
              <Link to="/game" className="game-cta-button">
                <span className="button-text">Launch Frog Explorer</span>
                <span className="button-icon">→</span>
              </Link>
              <p className="game-cta-note">
                🖥️ This game is designed for desktop users with a keyboard.
                <br />
                Mobile and tablet users can use the navigation bar above to browse all sections.
              </p>
            </div>

            {/* Decorative floating elements */}
            <div className="game-cta-decor">
              <span className="floating-emoji" style={{ animationDelay: '0s' }}>🐸</span>
              <span className="floating-emoji" style={{ animationDelay: '1.5s' }}>📄</span>
              <span className="floating-emoji" style={{ animationDelay: '3s' }}>🎓</span>
              <span className="floating-emoji" style={{ animationDelay: '4.5s' }}>💻</span>
              <span className="floating-emoji" style={{ animationDelay: '6s' }}>🎮</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
