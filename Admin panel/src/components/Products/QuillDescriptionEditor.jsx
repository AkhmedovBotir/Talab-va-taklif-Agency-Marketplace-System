import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { parseDescriptionDelta } from './productFormUtils';

const TOOLBAR = [
  [{ header: [1, 2, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link'],
  ['clean'],
];

const QuillDescriptionEditor = ({ active, value, onChange, resetKey }) => {
  const hostRef = useRef(null);
  const quillRef = useRef(null);
  const lastResetKeyRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    if (!quillRef.current && hostRef.current) {
      const editor = new Quill(hostRef.current, {
        theme: 'snow',
        modules: { toolbar: TOOLBAR },
      });
      editor.on('text-change', () => {
        onChange?.(JSON.stringify(editor.getContents()));
      });
      quillRef.current = editor;
    }
    if (quillRef.current && resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey;
      quillRef.current.setContents(parseDescriptionDelta(value), 'silent');
    }
  }, [active, resetKey, value, onChange]);

  useEffect(() => {
    if (!active) {
      quillRef.current = null;
      lastResetKeyRef.current = null;
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
      <div ref={hostRef} className="min-h-[180px]" />
    </div>
  );
};

export default QuillDescriptionEditor;
