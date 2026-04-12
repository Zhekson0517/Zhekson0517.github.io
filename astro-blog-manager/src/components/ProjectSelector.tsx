import { useState } from 'react';

interface Props {
  onSelect: () => void;
  error: string | null;
}

function ProjectSelector({ onSelect, error }: Props) {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="project-selector">
      <div className="project-selector-inner">
        <div className="project-icon">⌘</div>
        <h1 className="project-title">Astro Blog Manager</h1>
        <p className="project-subtitle">Select an Astro project directory to begin</p>
        <button
          className={`select-btn ${hovering ? 'hovering' : ''}`}
          onClick={onSelect}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          Select Project
        </button>
        {error && <p className="project-error">{error}</p>}
      </div>
    </div>
  );
}

export default ProjectSelector;
