import './PageStyles.css'

/**
 * Projects Page
 * 
 * A showcase grid of portfolio projects. Each card includes:
 * - Project name and description
 * - Tech stack tags
 * - Links to GitHub/live demo
 * - A visual status indicator
 * 
 * DATA-DRIVEN RENDERING:
 * Instead of hardcoding JSX for each project card, we define 
 * projects as data (an array of objects) and use .map() to 
 * generate the JSX. This is a fundamental React pattern.
 * 
 * Why? Same reason you'd use a database instead of hardcoding 
 * HTML pages: it separates CONTENT from PRESENTATION. Add a 
 * new project? Just add an object to the array. No template changes.
 */
function Projects() {
  const projects = [
    {
      title: 'Frog Portfolio (This Site!)',
      description:
        'A creative portfolio website featuring a 3D frog exploration game built with React Three Fiber. Navigate a rainforest world as a detailed frog to discover resume, education, projects, and interests — with full mobile/tablet fallback via a responsive navbar.',
      tech: ['React', 'Three.js', 'React Three Fiber', 'Vite', 'Howler.js'],
      github: '#', // TODO: add repo link when pushed
      live: '#',
      status: 'in-progress',
      featured: true,
    },
    {
      title: 'Clinical Notes ML Model',
      description:
        'Fine-tuned the Qwen3-0.6B language model on clinical notes using HuggingFace Transformers. Handled tokenization, training optimization, and pushed the final model to HuggingFace Hub.',
      tech: ['Python', 'HuggingFace', 'PyTorch', 'NLP'],
      github: '#',
      live: 'https://huggingface.co/RLakenHarville/qwen3-clinical-cs6810hw3',
      status: 'complete',
      featured: true,
    },
    {
      title: 'CONSCIOUS/mess',
      description:
        'A full-stack anonymous message board application built with Ruby on Rails. Features session-based pagination, "ripples" threading, and a clean responsive interface. Built from UML design docs to full working implementation.',
      tech: ['Ruby on Rails', 'PostgreSQL', 'HTML/CSS', 'MVC'],
      github: '#',
      live: null,
      status: 'complete',
      featured: true,
    },
    {
      title: 'TechSupport Desktop App',
      description:
        'A Windows Forms desktop application following MVC + DAL architecture with SQL Server LocalDB. Features incident tracking, customer management, and technician assignment — with a cleanly separated data access layer split by concern.',
      tech: ['C#', '.NET 8', 'SQL Server', 'Windows Forms'],
      github: '#',
      live: null,
      status: 'complete',
      featured: false,
    },
    {
      title: 'Hater Fitness',
      description:
        'A multi-page fitness website ("Fit You with Fit Cost") that helps users compare gym costs vs home workouts, track healthy habits, and calculate potential savings. Built with Bootstrap 5 for a fully responsive experience across devices.',
      tech: ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap 5'],
      github: '#',
      live: null,
      status: 'complete',
      featured: false,
    },
    {
      title: 'Picture Viewer',
      description:
        'A Windows Forms desktop application for browsing image files with a clean tabbed interface. Built in C# with .NET, featuring a TableLayoutPanel for structured UI and native file dialog integration.',
      tech: ['C#', '.NET', 'Windows Forms', 'Visual Studio'],
      github: '#',
      live: null,
      status: 'complete',
      featured: false,
    },
    {
      title: 'Weather App',
      description:
        'A Java/Maven application that aggregates weather data with a Meteorologist class handling 7-day forecasts, rainfall totals, and global high-temperature lookups. Includes a WeatherDatabase layer and full integration + unit test suite. Built collaboratively with a partner for CS 6241.',
      tech: ['Java', 'Maven', 'JUnit', 'JavaFX'],
      github: '#',
      live: null,
      status: 'complete',
      featured: false,
      collaborative: true,
    },
  ]

  const statusLabels = {
    'complete': '✅ Complete',
    'in-progress': '🚧 In Progress',
    'planned': '📋 Planned',
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Page Header */}
        <header className="page-header animate-fade-in-up">
          <span className="page-badge">💻 Projects</span>
          <h1 className="section-title">
            Things I've <span className="accent">Built</span>
          </h1>
          <p className="page-subtitle">
            Experience from web applications to AI models
          </p>
        </header>

        {/* Projects Grid */}
        <div className="projects-grid">
          {projects.map((project, index) => (
            <div
              key={project.title}
              className={`content-card project-card animate-fade-in-up delay-${Math.min(index + 1, 5)} ${
                project.featured ? 'featured' : ''
              }`}
            >
              {/* Status badge */}
              <div className="project-top-row">
                <span className={`project-status status-${project.status}`}>
                  {statusLabels[project.status]}
                </span>
                {project.featured && (
                  <span className="featured-badge">★ Featured</span>
                )}
                {project.collaborative && (
                  <span className="collab-badge">🤝 Team Project</span>
                )}
              </div>

              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>

              {/* Tech stack tags */}
              <div className="skill-tags">
                {project.tech.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>

              {/* Links */}
              <div className="project-links">
                {project.github && project.github !== '#' && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                )}
                {project.live && (
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link live-link"
                  >
                    ↗ Live Demo
                  </a>
                )}
                {(!project.github || project.github === '#') &&
                  !project.live && (
                    <span className="project-link-placeholder">
                      Links coming soon
                    </span>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Projects
