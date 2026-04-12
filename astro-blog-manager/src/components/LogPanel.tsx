import './LogPanel.css';

interface Props {
  logs: string[];
  onClose: () => void;
}

function LogPanel({ logs, onClose }: Props) {
  return (
    <div className="log-panel">
      <div className="log-head">
        <span>控制台输出</span>
        <button className="log-close" onClick={onClose}>✕</button>
      </div>
      <div className="log-body">
        {logs.length === 0 ? (
          <div className="log-empty">暂无输出</div>
        ) : (
          logs.map((line, i) => <div key={i} className="log-line">{line}</div>)
        )}
      </div>
    </div>
  );
}

export default LogPanel;
