import { useState } from 'react';
import './StatusBar.css';

interface Props {
  devServerRunning: boolean;
  logs: string[];
  onStartDev: () => void;
  onStopDev: () => void;
  onBuild: () => void;
  onGitPush: () => void;
  error: string | null;
  onClearError: () => void;
}

function StatusBar({ devServerRunning, logs, onStartDev, onStopDev, onBuild, onGitPush, error, onClearError }: Props) {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <>
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={onClearError}>✕</button>
        </div>
      )}
      <div className="statusbar">
        <div className="statusbar-left">
          <span className={`status-indicator ${devServerRunning ? 'running' : 'stopped'}`} />
          <span className="status-text">
            {devServerRunning ? 'Dev Server Running' : 'Dev Server Stopped'}
          </span>
        </div>
        <div className="statusbar-center">
          <button className="status-btn" onClick={devServerRunning ? onStopDev : onStartDev}>
            {devServerRunning ? 'Stop' : 'Start Dev'}
          </button>
          <button className="status-btn" onClick={onBuild}>Build</button>
          <button className="status-btn" onClick={onGitPush}>Push</button>
          <button className="status-btn" onClick={() => setShowLogs(!showLogs)}>
            Logs {logs.length > 0 && `(${logs.length})`}
          </button>
        </div>
        <div className="statusbar-right">
          <span className="status-version">Astro Blog Manager v0.1</span>
        </div>
      </div>
      {showLogs && (
        <div className="log-panel">
          <div className="log-header">
            <span>Console Output</span>
            <button className="log-close" onClick={() => setShowLogs(false)}>✕</button>
          </div>
          <div className="log-content">
            {logs.length === 0 ? (
              <div className="log-empty">No output yet</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="log-line">{log}</div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default StatusBar;
