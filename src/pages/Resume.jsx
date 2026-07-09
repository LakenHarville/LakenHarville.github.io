import './PageStyles.css'

/**
 * Resume Page
 *
 * Layout: A clean, professional page with sections for experience,
 * skills, and a download button. Uses CSS Grid for the skills section
 * to create a responsive multi-column layout.
 *
 * DESIGN DECISION — Why not just embed a PDF?
 * An HTML resume is searchable, accessible (screen readers can read it),
 * responsive (adapts to screen size), and styleable (matches your brand).
 * A PDF is none of those things. You can still offer a PDF download link
 * for recruiters who want to print it — best of both worlds.
 */

// Replaces the space between a month name and a 4-digit year with a
// non-breaking space ( ). Effect: "August 2023" stays glued together
// on one line, but the string as a whole can still wrap at commas or
// dashes. So a long date like "September 2021 – August 2023, December 2024
// – May 2026" wraps at nice logical breakpoints instead of orphaning "2023"
// on its own line.
function fmtDate(str) {
  return str.replace(/ (\d{4})/g, ' $1')
}

function Resume() {
  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Page Header */}
        <header className="page-header animate-fade-in-up">
          <span className="page-badge">📄 Resume</span>
          <h1 className="section-title">
            Laken <span className="accent">Harville</span>
          </h1>
          <p className="page-subtitle">
            Result-driven and inspired by technology
          </p>
          {/* TODO: Replace # with your actual resume PDF link */}
          <a href="Laken_Harville_Resume.pdf" className="download-btn" download>
            ⬇ Download PDF Resume
          </a>
        </header>

        {/* ---- Summary ---- */}
        <section className="resume-section animate-fade-in-up delay-1">
          <h2 className="resume-section-title">Summary</h2>
          <div className="content-card">
            <p className="resume-text">
              {/* TODO: Write your professional summary */} 
              Software Engineer with a strong foundation in backend development, API integration, and scalable application design. Known for clear, effective communication across technical and non‑technical teams, adaptability in fast‑changing project environments, and disciplined task management that keeps complex workstreams moving. Skilled in debugging, testing, and improving system performance, with a growing focus on architecture and mentoring.
            </p>
          </div>
        </section>

        {/* ---- Experience ---- */}
        <section className="resume-section animate-fade-in-up delay-2">
          <h2 className="resume-section-title">Experience</h2>
          
          {/* TODO: Add your real experience entries */}
          <div className="timeline">
            

            <div className="timeline-item content-card">
              <div className="timeline-dot"></div>
              <div className="timeline-header">
                <div>
                  <h3 className="timeline-title">Microsoft TEALS Volunteer Instructor (Technology Education And Literacy in Schools)</h3>
                  <p className="timeline-company">Paul Bryant High School</p>
                </div>
                <span className="timeline-date">{fmtDate('August 2023 – May 2024')}</span>
              </div>
              <ul className="timeline-details">
                <li>Mentored students in Python and Java, guiding them through debugging, testing, and systematic problem-solving.</li>
                <li>Adapted explanations to a wide range of skill levels, practicing the clear communication needed on cross-functional engineering teams.</li>
                <li>Assisted lead teacher in explaning rudimentary programming concepts to beginners.</li>
              </ul>
            </div>
            <div className="timeline-item content-card">
              <div className="timeline-dot"></div>
              <div className="timeline-header">
                <div>
                  <h3 className="timeline-title">Account Merchandiser</h3>
                  <p className="timeline-company">Buffalo Rock</p>
                </div>
                <span className="timeline-date">{fmtDate('August 2023 – November 2024')}</span>
              </div>
              <ul className="timeline-details">
                <li>Responsible for the stock management and merchandising of products accross multiple bulk stores.</li>
                <li>Trained new employees on product knowledge and merchandising techniques.</li> 
              </ul>
            </div>
            <div className="timeline-item content-card">
              <div className="timeline-dot"></div>
              <div className="timeline-header">
                <div>
                  <h3 className="timeline-title">Deli Clerk</h3>
                  <p className="timeline-company">Publix Supermarkets</p>
                </div>
                <span className="timeline-date">{fmtDate('September 2021 – August 2023, December 2024 – May 2026')}</span>
              </div>
              <ul className="timeline-details">
                <li>Provided excellent customer service while driving sales.</li>
                <li>Maintained sales floor and was responsible for both product ordering and inventory management.</li>
                <li>Trained new employees on product knowledge, customer relations, and departmental procedures.</li> 
              </ul>
            </div>
            <div className="timeline-item content-card">
              <div className="timeline-dot"></div>
              <div className="timeline-header">
                <div>
                  <h3 className="timeline-title">Department Supervisor / Warehouse Associate</h3>
                  <p className="timeline-company">The Home Depot</p>
                </div>
                <span className="timeline-date">{fmtDate('March 2017 – July 2021')}</span>
              </div>
              <ul className="timeline-details">
                <li>Exceeded sales targets every quarter and managed a team of employees.</li>
                <li>Trained associates in customer service, product knowledge, and business operations.</li>
                <li>Handled inventory placement and organization in preparation for shipping.</li> 
              </ul>
            </div>
          </div>
        </section>

        {/* ---- Technical Skills ---- */}
        <section className="resume-section animate-fade-in-up delay-3">
          <h2 className="resume-section-title">Technical Skills</h2>
          <div className="skills-grid">
            {/* TODO: Customize these categories and skills */}
            {[
              {
                category: 'Languages',
                skills: ['Java','JavaScript', 'Python', 'C#', 'Ruby', 'SQL', 'HTML/CSS'],
              },
              {
                category: 'Frameworks & Libraries',
                skills: ['React', 'Three.js', 'Ruby on Rails', '.NET', 'Node.js'],
              },
              {
                category: 'Tools & Platforms',
                skills: ['Git', 'VS Code', 'Visual Studio', 'SQL Server', 'HuggingFace', 'Anaconda'],
              },
              {
                category: 'Concepts',
                skills: ['Full-Stack Dev', 'Machine Learning', 'MVC Architecture', 'REST APIs', 'Agile'],
              },
            ].map((group) => (
              <div key={group.category} className="content-card skill-card">
                <h3 className="skill-category">{group.category}</h3>
                <div className="skill-tags">
                  {group.skills.map((skill) => (
                    <span key={skill} className="tag">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Resume
