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

const HOST_CLASS = 'min-h-[180px]';

const QuillDescriptionEditor = ({ active, value, onChange, resetKey }) => {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const lastResetKeyRef = useRef(null);

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!active || !wrapperRef.current) return undefined;

    const wrapper = wrapperRef.current;
    wrapper.innerHTML = '';

    const host = document.createElement('div');
    host.className = HOST_CLASS;
    wrapper.appendChild(host);

    const editor = new Quill(host, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR },
    });

    const handleChange = () => {
      onChangeRef.current?.(JSON.stringify(editor.getContents()));
    };

    editor.on('text-change', handleChange);
    quillRef.current = editor;

    return () => {
      editor.off('text-change', handleChange);
      wrapper.innerHTML = '';
      quillRef.current = null;
      lastResetKeyRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (!active || !quillRef.current) return;
    if (resetKey === lastResetKeyRef.current) return;
    lastResetKeyRef.current = resetKey;
    quillRef.current.setContents(parseDescriptionDelta(value), 'silent');
  }, [active, resetKey, value]);

  if (!active) return null;

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
      <div ref={wrapperRef} />
    </div>
  );
};

export default QuillDescriptionEditor;
