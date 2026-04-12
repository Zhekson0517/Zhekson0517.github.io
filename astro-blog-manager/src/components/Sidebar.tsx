import { useState } from 'react';
import { FileEntry } from '../types';
import './ProjectSelector.css';

interface Props {
  files: FileEntry[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  projectDir: string;
  onCreateFile: (path: string, content: string) => void;
  onNewProject: () => void;
}

function Sidebar({ files, selectedFile, onSelectFile, projectDir, onCreateFile, onNewProject }: Props) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    initial.add(projectDir);
    const srcDir = files.find(f => f.name === 'src');
    if (srcDir) {
      initial.add(srcDir.path);
      const contentDir = srcDir.children.find(f => f.name === 'content');
      if (contentDir) initial.add(contentDir.path);
    }
    return initial;
  });
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleCreateFile = () => {
    if (!newFilePath.trim()) return;
    const fullPath = newFilePath.startsWith('/')
      ? newFilePath
      : `${projectDir}/src/content/${newFilePath}`;
    const path = fullPath.endsWith('.mdx') ? fullPath : fullPath + '.mdx';
    const today = new Date().toISOString().split('T')[0];
    const content = `---\ntitle: ""\nchapter: 1\nslug: ""\npublishedAt: "${today}"\nupdatedAt: "${today}"\ncategory: ""\ntags: []\nabstract: ""\nkeywords: []\n---\n\n## \n`;
    onCreateFile(path, content);
    setShowNewFile(false);
    setNewFilePath('');
  };

  const getFileIcon = (name: string): string => {
    if (name.endsWith('.mdx') || name.endsWith('.md')) return '¶';
    if (name.endsWith('.astro')) return '★';
    if (name.endsWith('.css')) return '◈';
    if (name.endsWith('.json')) return '{}';
    if (name.endsWith('.ts') || name.endsWith('.js') || name.endsWith('.mjs')) return 'λ';
    if (name.endsWith('.pdf')) return '⊞';
    return '–';
  };

  const renderEntry = (entry: FileEntry, depth: number): React.ReactNode => {
    if (entry.is_dir) {
      const isExpanded = expandedDirs.has(entry.path);
      const isContentDir = entry.name === 'content' || entry.name === 'notes' || entry.name === 'embedded' || entry.name === 'data';
      return (
        <div key={entry.path}>
          <div
            className={`sidebar-item dir-item ${isContentDir ? 'content-dir' : ''}`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => toggleDir(entry.path)}
          >
            <span className="dir-arrow">{isExpanded ? '▾' : '▸'}</span>
            <span className="dir-name">{entry.name}</span>
          </div>
          {isExpanded && entry.children.map(child => renderEntry(child, depth + 1))}
        </div>
      );
    }

    const isSelected = entry.path === selectedFile;
    const isEditable = entry.name.endsWith('.mdx') || entry.name.endsWith('.md') || entry.name.endsWith('.astro') || entry.name.endsWith('.css') || entry.name.endsWith('.json') || entry.name.endsWith('.ts') || entry.name.endsWith('.js');

    return (
      <div
        key={entry.path}
        className={`sidebar-item file-item ${isSelected ? 'selected' : ''} ${isEditable ? 'editable' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16 + 16}px` }}
        onClick={() => isEditable && onSelectFile(entry.path)}
      >
        <span className="file-icon">{getFileIcon(entry.name)}</span>
        <span className="file-name">{entry.name}</span>
      </div>
    );
  };

  const projectName = projectDir.split('/').pop() || projectDir;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-project-name">{projectName}</span>
        <div className="sidebar-header-actions">
          <button className="sidebar-icon-btn" onClick={() => setShowNewFile(!showNewFile)} title="New File">+</button>
          <button className="sidebar-icon-btn" onClick={onNewProject} title="Switch Project">↩</button>
        </div>
      </div>

      {showNewFile && (
        <div className="new-file-form">
          <input
            className="new-file-input"
            type="text"
            placeholder="filename (e.g. notes/my-note)"
            value={newFilePath}
            onChange={(e) => setNewFilePath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            autoFocus
          />
          <div className="new-file-actions">
            <button className="new-file-btn" onClick={handleCreateFile}>Create</button>
            <button className="new-file-btn cancel" onClick={() => { setShowNewFile(false); setNewFilePath(''); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="sidebar-tree">
        {files.map(entry => renderEntry(entry, 0))}
      </div>
    </div>
  );
}

export default Sidebar;
