import './PageStyles.css'

/**
 * Interests Page
 * 
 * This page humanizes your portfolio. Recruiters and collaborators 
 * want to know who you are BEYOND code. It makes you memorable —
 * "Oh, that's the engineer who's into 3D game dev AND frogs!"
 * 
 * Layout uses a masonry-style grid where cards can span different 
 * heights naturally, creating visual rhythm and avoiding the 
 * "spreadsheet" feeling of uniform grids.
 */
function Interests() {
  const interests = [
    {
      title: 'Vehicular Technology',
      icon: '🚗',
      description:
        'I\'m fascinated by the ingenuity of transportation design. This interest spans from the outer design to the genius engineering that makes cars, trucks, and motorcycles run. When I was younger, I used to obsess with the idea of becoming a race car driver.',
      tags: ['Muscle Cars', 'Imports', 'Trucks', 'Motorcycles'],
    },
    {
      title: 'Weightlifting & Fitness',
      icon: '🏋️',
      description:
        'Strength training has been a staple in my life for over 10 years now. I hold a focus on functional strength as well as aesthetics and dieting. I go against the grain of the popular opinion when I say that leg days are my favorite.',
      tags: ['Squats', 'Bench Press', 'Pull Ups', 'Long-Distance Running'],
    },
    {
      title: 'Game Development/Gaming',
      icon: '🎮',
      description:
        'Games blend art and engineering in a way that has always fascinated me. My addiction started in the late 90s with my Dad\'s Nintendo 64 and the rest was history. You\'ll find me playing adventure and RPG games in my free time.',
      tags: ['Unity', 'Story-Telling', 'Game Design', 'Engineering Technologies'],
    },
    {
      title: 'Space Technology',
      icon: '🛰️',
      description:
        'The software powering rockets, satellites, and spacecraft represents some of the most demanding engineering on (and off) Earth. From flight control systems to orbital mechanics simulations to the embedded firmware keeping satellites online, space tech pushes software to its limits and I find that incredibly inspiring.',
      tags: ['Rocket Software', 'Satellites', 'Flight Systems', 'Embedded Software'],
    },
    {
      title: 'Tech Innovation',
      icon: '🚀',
      description:
        'I\'m always keeping an eye on emerging technologies. I am fascinated by cellular technologies that connect the world, website designs that push beyond what I think is possible, and I always keep up with the integration of AI and human interaction such as web tools and autonomous machines. ',
      tags: ['Emerging Tech', 'Web Standards', 'Performance'],
    },
    {
      title: 'Nature & Animals',
      icon: '🌿',
      description:
        'I have always had a deep appreciation for the natural world. Growing up, I spent a considerable amount of time watching Animal Planet, specifically The Crocodile Hunter, and National Geographic. If I\'m not inside coding or gaming, then you will certainly find me running or biking outside on a sunny day.',
      tags: ['Wildlife', 'Hiking', 'Biodiversity', 'Outdoors'],
    },
  ]

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Page Header */}
        <header className="page-header animate-fade-in-up">
          <span className="page-badge">🎮 Interests</span>
          <h1 className="section-title">
            Beyond the <span className="accent">Code</span>
          </h1>
          <p className="page-subtitle">
            What fuels my curiosity and keeps me building
          </p>
        </header>

        {/* Interests Grid */}
        <div className="interests-grid">
          {interests.map((interest, index) => (
            <div
              key={interest.title}
              className={`content-card interest-card animate-fade-in-up delay-${Math.min(index + 1, 5)}`}
            >
              <span className="interest-icon">{interest.icon}</span>
              <h3 className="interest-title">{interest.title}</h3>
              <p className="interest-description">{interest.description}</p>
              <div className="skill-tags">
                {interest.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Interests
