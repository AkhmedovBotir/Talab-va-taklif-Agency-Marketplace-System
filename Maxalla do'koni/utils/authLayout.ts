import { Platform, StyleSheet } from 'react-native';

export const AUTH_CONTENT_MAX_WIDTH = Platform.OS === 'web' ? 480 : 400;

export const authScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    ...(Platform.OS === 'web'
      ? ({
          minHeight: '100vh',
        } as object)
      : null),
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
    ...(Platform.OS === 'web'
      ? ({
          minHeight: '100%',
          paddingHorizontal: 20,
          paddingVertical: 32,
        } as object)
      : null),
  },
  content: {
    width: '100%',
    maxWidth: AUTH_CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  headerWithBack: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    position: 'relative',
    paddingTop: Platform.OS === 'web' ? 8 : 0,
  },
  backButton: {
    position: 'absolute',
    left: Platform.OS === 'web' ? 0 : 0,
    top: Platform.OS === 'web' ? 8 : 0,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    width: Platform.OS === 'web' ? 100 : 120,
    height: Platform.OS === 'web' ? 100 : 120,
    borderRadius: Platform.OS === 'web' ? 50 : 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: Platform.OS === 'web' ? 32 : 40,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainerCompact: {
    marginTop: Platform.OS === 'web' ? 24 : 40,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 28 : 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  titleCompact: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 8 : 0,
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: Platform.OS === 'web' ? 28 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    width: '100%',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0px 4px 24px rgba(0,0,0,0.08)',
        } as object)
      : null),
  },
  form: {
    width: '100%',
    maxWidth: '100%',
    ...(Platform.OS === 'web'
      ? ({
          overflow: 'hidden',
        } as object)
      : null),
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    minHeight: 56,
    width: '100%',
    maxWidth: '100%',
    ...(Platform.OS === 'web'
      ? ({
          overflow: 'hidden',
          boxSizing: 'border-box',
        } as object)
      : null),
  },
  inputIcon: {
    marginRight: 12,
    flexShrink: 0,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flexShrink: 0,
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: Platform.OS === 'web' ? 12 : 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          width: 0,
        } as object)
      : null),
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
    ...(Platform.OS === 'web' ? ({ flexShrink: 0 } as object) : null),
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexDirection: 'row',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
        } as object)
      : null),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
        } as object)
      : null),
  },
  secondaryButtonIcon: {
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: Platform.OS === 'web' ? 15 : 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
    flexShrink: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 8,
    lineHeight: 18,
  },
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  phoneDisplayAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: Platform.OS === 'web' ? 28 : 32,
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phoneTextAccent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  codeContainer: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'nowrap',
    width: '100%',
    maxWidth: '100%',
    ...(Platform.OS === 'web'
      ? ({
          overflow: 'hidden',
          boxSizing: 'border-box',
        } as object)
      : null),
  },
  codeInput: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 56,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    fontSize: Platform.OS === 'web' ? 22 : 24,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#fafafa',
    color: '#333',
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
        } as object)
      : null),
  },
  codeInputLarge: {
    height: Platform.OS === 'web' ? 64 : 64,
    fontSize: Platform.OS === 'web' ? 24 : 28,
    fontWeight: '700',
  },
  codeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  hintTextLeft: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    marginLeft: 4,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    gap: 6,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
        } as object)
      : null),
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
        } as object)
      : null),
  },
  resendButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  footerInfoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

export function isAuthRouteSegment(segments: string[]): boolean {
  const root = segments[0];
  if (!root || root === '(tabs)') return false;
  return (
    root === 'login' ||
    root === 'device-verification' ||
    root === 'password-setup' ||
    root === 'index'
  );
}
