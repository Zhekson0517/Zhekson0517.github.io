import './Toolbar.css';

interface Props {
  selectedFile: string | null;
  projectDir: string;
  isDirty: boolean;
  saving: boolean;
  showPreview: boolean;
  devRunning: boolean;
  onTogglePreview: () => void;
  onSave: () => void;
  onStartDev: () => void;
  onStopDev: () => void;
  onBuild: () => void;
  onPush: () => void;
  onToggleLogs: () => void;
}

function Toolbar({
  selectedFile, projectDir, isDirty, saving, showPreview, devRunning,
  onTogglePreview, onSave, onStartDev, onStopDev, onBuild, onPush, onToggleLogs,
}: Props) {
  const shortPath = selectedFile ? selectedFile.replace(projectDir, '~') : '';

  return (
    <div className="toolbar">
      <div className="tb-left">
        {selectedFile && <span className="tb-path">{shortPath}</span>}
        {isDirty && <span className="tb-dot" title="未保存" />}
      </div>
      <div className="tb-right">
        <button className="tbtn" onClick={onTogglePreview}>
          {showPreview ? '隐藏预览' : '显示预览'}
        </button>
        <button className="tbtn accent" onClick={onSave} disabled={!isDirty || saving}>
          {saving ? '保存中…' : '保存 ⌘S'}
        </button>
        <span className="tb-sep" />
        <button className={`tbtn ${devRunning ? 'running' : ''}`} onClick={devRunning ? onStopDev : onStartDev}>
          {devRunning ? '■ 停止 Dev' : '▶ 启动 Dev'}
        </button>
        <button className="tbtn" onClick={onBuild}>构建</button>
        <button className="tbtn" onClick={onPush}>推送</button>
        <span className="tb-sep" />
        <button className="tbtn" onClick={onToggleLogs}>日志</button>
      </div>
    </div>
  );
}

export default Toolbar;
