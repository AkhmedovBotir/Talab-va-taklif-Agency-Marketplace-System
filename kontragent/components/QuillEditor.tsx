import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { DeltaFormat } from '../services/api';

const isWeb = Platform.OS === 'web';

interface QuillEditorProps {
  initialDelta?: DeltaFormat | null;
  placeholder?: string;
  style?: any;
  onContentChange?: (delta: DeltaFormat) => void;
}

export interface QuillEditorRef {
  getContents: () => Promise<DeltaFormat | null>;
  setContents: (delta: DeltaFormat) => void;
  clear: () => void;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('document not available'));
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('document not available'));
      return;
    }
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load ${href}`));
    document.head.appendChild(link);
  });
}

const QuillEditor = forwardRef<QuillEditorRef, QuillEditorProps>(
  ({ initialDelta, placeholder = 'Matn kiriting...', style, onContentChange }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const isReadyRef = useRef(false);
    const pendingDeltaRef = useRef<DeltaFormat | null>(initialDelta || null);
    const getContentsResolveRef = useRef<((value: DeltaFormat | null) => void) | null>(null);
    const quillInstanceRef = useRef<any>(null);
    const containerIdRef = useRef<string>('quill-editor-' + Math.random().toString(36).slice(2));
    const toolbarIdRef = useRef<string>('quill-toolbar-' + Math.random().toString(36).slice(2));
    const webContainerRef = useRef<any>(null);
    const [webQuillReady, setWebQuillReady] = React.useState(false);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            #editor-container {
              height: 200px;
            }
            .ql-editor {
              min-height: 200px;
              font-size: 16px;
              line-height: 1.5;
              color: #333;
            }
            .ql-editor.ql-blank::before {
              color: #999;
              font-style: normal;
            }
            .ql-toolbar {
              border-top: 1px solid #e0e0e0;
              border-left: none;
              border-right: none;
              border-bottom: none;
              background-color: #f9f9f9;
            }
            .ql-container {
              border: none;
              border-top: 1px solid #e0e0e0;
            }
          </style>
        </head>
        <body>
          <div id="toolbar">
            <span class="ql-formats">
              <button class="ql-bold"></button>
              <button class="ql-italic"></button>
              <button class="ql-underline"></button>
              <button class="ql-strike"></button>
            </span>
            <span class="ql-formats">
              <button class="ql-blockquote"></button>
              <button class="ql-code-block"></button>
            </span>
            <span class="ql-formats">
              <select class="ql-header">
                <option value="1"></option>
                <option value="2"></option>
                <option value="3"></option>
                <option selected></option>
              </select>
            </span>
            <span class="ql-formats">
              <button class="ql-list" value="ordered"></button>
              <button class="ql-list" value="bullet"></button>
            </span>
            <span class="ql-formats">
              <button class="ql-script" value="sub"></button>
              <button class="ql-script" value="super"></button>
            </span>
            <span class="ql-formats">
              <button class="ql-indent" value="-1"></button>
              <button class="ql-indent" value="+1"></button>
            </span>
            <span class="ql-formats">
              <select class="ql-color"></select>
              <select class="ql-background"></select>
            </span>
            <span class="ql-formats">
              <button class="ql-link"></button>
              <button class="ql-image"></button>
            </span>
            <span class="ql-formats">
              <button class="ql-clean"></button>
            </span>
          </div>
          <div id="editor-container"></div>
          <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
          <script>
            var quill = new Quill('#editor-container', {
              theme: 'snow',
              placeholder: '${placeholder}',
              modules: {
                toolbar: '#toolbar'
              }
            });

            var isReady = false;

            // Notify React Native that Quill is ready
            function notifyReady() {
              if (!isReady) {
                isReady = true;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ready'
                }));
              }
            }

            // Listen for content changes
            quill.on('text-change', function() {
              if (isReady) {
                var delta = quill.getContents();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'change',
                  delta: delta
                }));
              }
            });

            // Expose quill globally for injectJavaScript
            window.quill = quill;

            // Notify ready after a short delay
            setTimeout(notifyReady, 100);
          </script>
        </body>
      </html>
    `;

    useImperativeHandle(ref, () => ({
      getContents: async (): Promise<DeltaFormat | null> => {
        if (isWeb && quillInstanceRef.current) {
          const q = quillInstanceRef.current;
          return q.getContents ? q.getContents() : null;
        }
        return new Promise((resolve) => {
          if (!isReadyRef.current || !webViewRef.current) {
            resolve(null);
            return;
          }

          getContentsResolveRef.current = resolve;

          const timeout = setTimeout(() => {
            if (getContentsResolveRef.current) {
              getContentsResolveRef.current(null);
              getContentsResolveRef.current = null;
            }
          }, 5000);

          (webViewRef.current as any)._getContentsTimeout = timeout;

          webViewRef.current.injectJavaScript(`
            (function() {
              var delta = quill.getContents();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'contents',
                delta: delta
              }));
            })();
            true;
          `);
        });
      },
      setContents: (delta: DeltaFormat) => {
        if (isWeb && quillInstanceRef.current) {
          quillInstanceRef.current.setContents(delta);
          return;
        }
        if (isReadyRef.current && webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            (function() {
              quill.setContents(${JSON.stringify(delta)});
            })();
            true;
          `);
        } else {
          pendingDeltaRef.current = delta;
        }
      },
      clear: () => {
        if (isWeb && quillInstanceRef.current) {
          quillInstanceRef.current.setContents({ ops: [] });
          return;
        }
        if (isReadyRef.current && webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            (function() {
              quill.setContents({ ops: [] });
            })();
            true;
          `);
        } else {
          pendingDeltaRef.current = null;
        }
      }
    }));

    const handleMessage = useCallback((event: any) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.type === 'ready') {
          isReadyRef.current = true;
          if (pendingDeltaRef.current && webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              (function() {
                quill.setContents(${JSON.stringify(pendingDeltaRef.current)});
              })();
              true;
            `);
            pendingDeltaRef.current = null;
          }
        } else if (message.type === 'change' && message.delta && onContentChange) {
          onContentChange(message.delta);
        } else if (message.type === 'contents') {
          // Handle getContents response
          if (getContentsResolveRef.current) {
            const timeout = (webViewRef.current as any)?._getContentsTimeout;
            if (timeout) {
              clearTimeout(timeout);
              delete (webViewRef.current as any)?._getContentsTimeout;
            }
            getContentsResolveRef.current(message.delta || null);
            getContentsResolveRef.current = null;
          }
        }
      } catch (e) {
        console.error('Error handling message:', e);
        if (getContentsResolveRef.current) {
          getContentsResolveRef.current(null);
          getContentsResolveRef.current = null;
        }
      }
    }, [onContentChange]);

    useEffect(() => {
      if (!isWeb && initialDelta && isReadyRef.current && webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setContents',
          delta: initialDelta
        }));
      }
    }, [initialDelta]);

    useEffect(() => {
      if (!isWeb || typeof document === 'undefined') return;
      const containerId = containerIdRef.current;
      const toolbarId = toolbarIdRef.current;
      const wrapEl = webContainerRef.current as unknown as HTMLElement | null;
      if (!wrapEl) return;

      const toolbarHtml = `
        <span class="ql-formats">
          <button class="ql-bold"></button>
          <button class="ql-italic"></button>
          <button class="ql-underline"></button>
          <button class="ql-strike"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-blockquote"></button>
          <button class="ql-code-block"></button>
        </span>
        <span class="ql-formats">
          <select class="ql-header"><option value="1"></option><option value="2"></option><option value="3"></option><option selected></option></select>
        </span>
        <span class="ql-formats">
          <button class="ql-list" value="ordered"></button>
          <button class="ql-list" value="bullet"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-indent" value="-1"></button>
          <button class="ql-indent" value="+1"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-link"></button>
          <button class="ql-clean"></button>
        </span>
      `;
      const toolbar = document.createElement('div');
      toolbar.id = toolbarId;
      toolbar.className = 'ql-toolbar ql-snow';
      toolbar.innerHTML = toolbarHtml;
      const editor = document.createElement('div');
      editor.id = containerId;
      wrapEl.appendChild(toolbar);
      wrapEl.appendChild(editor);

      let mounted = true;
      const init = async () => {
        try {
          await loadStylesheet('https://cdn.quilljs.com/1.3.6/quill.snow.css');
          await loadScript('https://cdn.quilljs.com/1.3.6/quill.min.js');
          const Quill = (window as any).Quill;
          if (!mounted || !Quill) return;
          const quill = new Quill('#' + containerId, {
            theme: 'snow',
            placeholder,
            modules: { toolbar: '#' + toolbarId }
          });
          quillInstanceRef.current = quill;
          if (pendingDeltaRef.current) {
            quill.setContents(pendingDeltaRef.current);
            pendingDeltaRef.current = null;
          } else if (initialDelta) {
            quill.setContents(initialDelta);
          }
          quill.on('text-change', () => {
            if (onContentChange && quill.getContents) {
              onContentChange(quill.getContents());
            }
          });
          isReadyRef.current = true;
          setWebQuillReady(true);
        } catch (e) {
          console.error('Quill init error:', e);
        }
      };
      init();
      return () => {
        mounted = false;
        quillInstanceRef.current = null;
      };
    }, []);

    if (isWeb) {
      return (
        <View style={[styles.container, style]}>
          {!webQuillReady && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
          <View
            ref={webContainerRef}
            style={[styles.webQuillWrapper, !webQuillReady && styles.webQuillHidden]}
            collapsable={false}
          />
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
        />
      </View>
    );
  }
);

QuillEditor.displayName = 'QuillEditor';

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    minHeight: 300,
  },
  webview: {
    backgroundColor: 'transparent',
    minHeight: 300,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  webQuillWrapper: {
    minHeight: 300,
    backgroundColor: '#ffffff',
  },
  webQuillHidden: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
});

export default QuillEditor;

