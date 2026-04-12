import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileEntry } from '../types';
import './Sidebar.css';

interface Props {
  projectDir: string;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onNewFile: (collection: string, filename: string) => void;
  onImportMd: () => void;
  onNewProject: () => void;
}

interface TreeNode {
  entry: FileEntry;
  children: FileEntry[] | null;
  expanded: boolean;
  loading: boolean;
}

function Sidebar({ projectDir, selectedFile, onSelectFile, onNewFile, onImportMd, onNewProject }: Props) {
  const [tree, setTree] = useState<Map<string, TreeNode>>(new Map());
  const [showNewFile, setShowNewFile] = useState(false);
  const [newCollection, setNewCollection] = useState('notes');
  const [newFilename, setNewFilename] = useState('');

  const loadDir = useCallback(async (dir: string) => {
    try {
      const entries = await invoke<FileEntry[]>('list_dir', { dir });
      setTree(prev => {
        const next = new Map(prev);
        entries.forEach(e => {
          next.set(e.path, {
            entry: e,
            children: null,
            expanded: false,
            loading: false,
          });
        });
        const parent = next.get(dir);
        if (parent) {
          parent.children = entries;
          parent.loading = false;
        }
        return next;
      });
    } catch {}
  }, []);

  useEffect(() => {
    setTree(new Map());
    loadDir(projectDir);
  }, [projectDir, loadDir]);

  const toggleDir = useCallback(async (path: string) => {
    setTree(prev => {
      const next = new Map(prev);
      const node = next.get(path);
      if (!node) return prev;

      if (node.expanded) {
        node.expanded = false;
      } else {
        node.expanded = true;
        if (node.children === null) {
          node.loading = true;
          invoke<FileEntry[]>('list_dir', { dir: path }).then(entries => {
            setTree(p => {
              const n = new Map(p);
              entries.forEach(e => {
                if (!n.has(e.path)) {
                  n.set(e.path, { entry: e, children: null, expanded: false, loading: false });
                }
              });
              const nd = n.get(path);
              if (nd) { nd.children = entries; nd.loading = false; }
              return n;
            });
          }).catch(() => {
            setTree(p => {
              const n = new Map(p);
              const nd = n.get(path);
              if (nd) nd.loading = false;
              return n;
            });
          });
        }
      }
      return next;
    });
  }, []);

  const handleCreateFile = useCallback(() => {
    if (!newFilename.trim()) return;
    onNewFile(newCollection, newFilename.trim());
    setShowNewFile(false);
    setNewFilename('');
  }, [newCollection, newFilename, onNewFile]);

  const isEditable = (name: string) =>
    /\.(mdx?|astro|css|json|ts|js|mjs|yaml|yml)$/.test(name);

  const renderNode = (entry: FileEntry, depth: number) => {
    const node = tree.get(entry.path);
    if (!node) return null;

    if (entry.is_dir) {
      return (
        <div key={entry.path}>
          <div
            className="tree-item dir"
            style={{ paddingLeft: 10 + depth * 14 }}
            onClick={() => toggleDir(entry.path)}
          >
            <span className="tree-arrow">
              {node.loading ? '⋯' : node.expanded ? '▾' : '▸'}
            </span>
            <span className="tree-name dir-name">{entry.name}</span>
          </div>
          {node.expanded && node.children && node.children.map(child => renderNode(child, depth + 1))}
        </div>
      );
    }

    const editable = isEditable(entry.name);
    const selected = entry.path === selectedFile;

    return (
      <div
        key={entry.path}
        className={`tree-item file ${selected ? 'selected' : ''} ${editable ? 'editable' : ''}`}
        style={{ paddingLeft: 10 + depth * 14 + 14 }}
        onClick={() => editable && onSelectFile(entry.path)}
      >
        <span className="tree-name">{entry.name}</span>
      </div>
    );
  };

  const rootNode = tree.get(projectDir);
  const topEntries = rootNode?.children || [];

  const projectName = projectDir.split('/').pop() || '';

  return (
    <div className="sidebar">
      <div className="sidebar-head">
        <span className="sidebar-title">{projectName}</span>
        <div className="sidebar-actions">
          <button className="sbtn" onClick={() => setShowNewFile(!showNewFile)} title="新建文件">＋</button>
          <button className="sbtn" onClick={onImportMd} title="导入 Markdown">↓</button>
          <button className="sbtn" onClick={onNewProject} title="切换项目">⌂</button>
        </div>
      </div>

      {showNewFile && (
        <div className="new-file-box">
          <select value={newCollection} onChange={e => setNewCollection(e.target.value)} className="new-file-select">
            <option value="notes">notes (ML)</option>
            <option value="embedded">embedded</option>
          </select>
          <input
            className="new-file-input"
            type="text"
            placeholder="文件名 (如 my-note)"
            value={newFilename}
            onChange={e => setNewFilename(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFile()}
            autoFocus
          />
          <div className="new-file-btns">
            <button className="nbtn primary" onClick={handleCreateFile}>创建</button>
            <button className="nbtn" onClick={() => { setShowNewFile(false); setNewFilename(''); }}>取消</button>
          </div>
        </div>
      )}

      <div className="tree-scroll">
        {topEntries.map(e => renderNode(e, 0))}
      </div>
    </div>
  );
}

export default Sidebar;
