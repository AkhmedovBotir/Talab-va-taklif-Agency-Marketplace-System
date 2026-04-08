import React, { useCallback, useMemo, useState } from 'react';
import AppSnackbar, { SnackbarType } from '../components/AppSnackbar';

interface ShowSnackbarOptions {
  type?: SnackbarType;
  duration?: number;
}

export function useAppSnackbar(defaultDuration = 3000) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('error');
  const [duration, setDuration] = useState(defaultDuration);

  const hideSnackbar = useCallback(() => {
    setVisible(false);
  }, []);

  const showSnackbar = useCallback(
    (nextMessage: string, options?: SnackbarType | ShowSnackbarOptions) => {
      let nextType: SnackbarType = 'error';
      let nextDuration = defaultDuration;

      if (typeof options === 'string') {
        nextType = options;
      } else if (options) {
        nextType = options.type ?? 'error';
        nextDuration = options.duration ?? defaultDuration;
      }

      setMessage(nextMessage);
      setType(nextType);
      setDuration(nextDuration);
      setVisible(true);
    },
    [defaultDuration]
  );

  const snackbarProps = useMemo(
    () => ({
      visible,
      message,
      type,
      duration,
      onHide: hideSnackbar,
    }),
    [duration, hideSnackbar, message, type, visible]
  );

  const SnackbarComponent = useCallback(
    () => <AppSnackbar {...snackbarProps} />,
    [snackbarProps]
  );

  return {
    visible,
    message,
    type,
    showSnackbar,
    hideSnackbar,
    snackbarProps,
    SnackbarComponent,
  };
}

export type { SnackbarType };
