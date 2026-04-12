import './ProjectSelector.css';

interface Props {
  onSelect: () => void;
  error: string | null;
}

function ProjectSelector({ onSelect, error }: Props) {
  return (
    <div className="selector">
      <div className="selector-inner">
        <div className="selector-icon">A</div>
        <h1 className="selector-title">Astro Blog Manager</h1>
        <p className="selector-sub">选择一个 Astro 项目目录</p>
        <button className="selector-btn" onClick={onSelect}>
          选择项目
        </button>
        {error && <p className="selector-err">{error}</p>}
      </div>
    </div>
  );
}

export default ProjectSelector;
