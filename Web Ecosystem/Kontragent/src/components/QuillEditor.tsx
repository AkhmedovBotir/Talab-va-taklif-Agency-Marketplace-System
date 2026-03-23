import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { Delta } from 'quill';

export interface DeltaFormat {
  ops?: Array<{ insert: string; attributes?: Record<string, unknown> }>;
}

export interface QuillEditorRef {
  getContents: () => DeltaFormat | null;
  setContents: (delta: DeltaFormat | null) => void;
  clear: () => void;
}

interface QuillEditorProps {
  initialDelta?: DeltaFormat | null;
  placeholder?: string;
  onChange?: (delta: DeltaFormat | null) => void;
  className?: string;
  readOnly?: boolean;
}

export const QuillEditor = forwardRef<QuillEditorRef, QuillEditorProps>(
  ({ initialDelta, placeholder = 'Maxsulot tavsifini kiriting...', onChange, className, readOnly = false }, ref) => {
    const quillRef = useRef<ReactQuill>(null);

    useImperativeHandle(ref, () => ({
      getContents: () => {
        const editor = quillRef.current?.getEditor?.();
        if (!editor) return null;
        const d = editor.getContents();
        return d && d.ops && d.ops.length > 0 ? (d as unknown as DeltaFormat) : null;
      },
      setContents: (delta: DeltaFormat | null) => {
        const editor = quillRef.current?.getEditor?.();
        if (editor && delta) editor.setContents(delta as Delta);
        else if (editor) editor.setContents([]);
      },
      clear: () => {
        const editor = quillRef.current?.getEditor?.();
        if (editor) editor.setContents([]);
      },
    }));

    useEffect(() => {
      if (!initialDelta || !initialDelta.ops?.length) return;
      const editor = quillRef.current?.getEditor?.();
      if (editor) editor.setContents(initialDelta as Delta);
    }, []);

    const modules = readOnly
      ? { toolbar: false }
      : {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        ['link'],
        ['clean'],
      ],
    };

    return (
      <div className={className}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          placeholder={placeholder}
          defaultValue=""
          modules={modules}
          readOnly={readOnly}
          onChange={(_content, _delta, _source, editor) => {
            const d = editor.getContents();
            const fmt = d?.ops?.length ? (d as unknown as DeltaFormat) : null;
            onChange?.(fmt);
          }}
        />
      </div>
    );
  }
);
