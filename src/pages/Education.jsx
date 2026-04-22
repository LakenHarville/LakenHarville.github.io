import './PageStyles.css'

/**
 * Education Page
 * 
 * Showcases academic background with a card-based layout.
 * Each institution gets its own card with degree info, 
 * coursework highlights, and achievements.
 * 
 * DESIGN PATTERN — Card Components:
 * Cards are the Swiss Army knife of UI design. They create 
 * visual grouping (Gestalt principle of proximity), provide 
 * a consistent container for varied content, and naturally 
 * stack in a responsive layout. Think of them like filing 
 * cabinet drawers — each one holds related documents.
 * 
 * TODO: Replace all placeholder content with your real education info.
 */
function Education() {
  // TODO: Replace with your actual education data
  const educationData = [
    {
      institution: 'University of West Georgia',
      degree: 'Master of Science in Applied Computer Science',
      period: '2024 - 2026',
      gpa: '3.55',
      icon: '🎓',
      highlights: [
        'Gathered and analyzed requirements for multiple projects, translating complex needs into clear technical specifications',
        'Honed skills in database management, data analysis, and machine learning through hands-on projects and coursework',
        'Fine-tuned Qwen3-0.6B on clinical notes using HuggingFace',
        'Built full-stack applications with Ruby on Rails and C# .NET',
      ],
      coursework: [
        'Program Construction I & II', 'Web Development I, II, & III', 'System and Network Administration', 'Software Development I & II',
        'Database Systems I & II', 'Foundations of Machine Learning', 'Intelligence & Analytics Tools'
      ],
    },
    {
      institution: 'Kennesaw State University',
      degree: 'Bachelor of Science in Psychology',
      period: '2016 – 2021',
      gpa: '3.33',
      icon: '📚',
      highlights: [
        'President\'s List and Dean\'s List multiple semesters',
        'Extensive writing experience with APA style research papers'
      ],
      coursework: [
        'Cognitive Psychology', 'Perception',
        'Biological Psychology', 'Social Psychology', 'Criminal Psychology'
      ],
    },
  ]

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Page Header */}
        <header className="page-header animate-fade-in-up">
          <span className="page-badge">🎓 Education</span>
          <h1 className="section-title">
            Academic <span className="accent">Journey</span>
          </h1>
          <p className="page-subtitle">
            Where curiosity meets structured learning
          </p>
        </header>

        {/* Education Cards */}
        <div className="education-cards">
          {educationData.map((edu, index) => (
            <div
              key={edu.institution}
              className={`content-card education-card animate-fade-in-up delay-${index + 1}`}
            >
              {/* Card Header */}
              <div className="edu-card-header">
                <span className="edu-icon">{edu.icon}</span>
                <div>
                  <h2 className="edu-institution">{edu.institution}</h2>
                  <p className="edu-degree">{edu.degree}</p>
                  <div className="edu-meta">
                    <span className="edu-period">{edu.period}</span>
                    {edu.gpa && (
                      <>
                        <span className="edu-separator">·</span>
                        <span className="edu-gpa">GPA: {edu.gpa}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="edu-section">
                <h3 className="edu-section-title">Highlights</h3>
                <ul className="edu-highlights">
                  {edu.highlights.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Relevant Coursework */}
              <div className="edu-section">
                <h3 className="edu-section-title">Relevant Coursework</h3>
                <div className="skill-tags">
                  {edu.coursework.map((course) => (
                    <span key={course} className="tag">{course}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Education
