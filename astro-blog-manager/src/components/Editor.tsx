import './Editor.css';

interface Props {
  content: string;
  onChange: (content: string) => void;
  loading: boolean;
  hasFile: boolean;
}

function Editor({ content, onChange, loading, hasFile }: Props) {
  if (!hasFile) {
    return <div className="editor-empty">选择文件开始编辑</div>;
  }

  if (loading) {
    return <div className="editor-empty">加载中…</div>;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      onChange(newContent);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="editor">
      <textarea
        className="editor-ta"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}

export default Editor;
