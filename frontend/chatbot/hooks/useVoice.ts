import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import Voice, { 
  SpeechRecognizedEvent, 
  SpeechResultsEvent, 
  SpeechErrorEvent,
  SpeechStartEvent,
  SpeechEndEvent 
} from '@react-native-voice/voice';

interface UseVoiceReturn {
  isListening: boolean;
  results: string[];
  partialTranscript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  cancelListening: () => Promise<void>;
  destroyRecognizer: () => Promise<void>;
}

const useVoice = (): UseVoiceReturn => {
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOperatingRef = useRef(false);
  const mountedRef = useRef(true);
  const sessionActiveRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupVoice();
    };
  }, []);

  const safeSetState = useCallback((updater: () => void) => {
    if (mountedRef.current) {
      updater();
    }
  }, []);

  // Cleanup hoàn toàn Voice service
  const cleanupVoice = async () => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      Voice.removeAllListeners();
      await Voice.cancel();
      await Voice.stop();
      await Voice.destroy();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      sessionActiveRef.current = false;
      console.log('🧹 Voice cleanup completed');
    } catch (err) {
      // Không log cleanup errors
    }
  };

  // Setup Voice service từ đầu
  const setupVoice = async () => {
    try {
      // Cleanup trước
      await cleanupVoice();
      
      // Setup listeners mới
      Voice.onSpeechStart = (e: SpeechStartEvent) => {
        console.log('🎤 Speech recognition started', e);
        sessionActiveRef.current = true;
        safeSetState(() => {
          setIsListening(true);
          setError(null);
        });
      };

      Voice.onSpeechEnd = (e: SpeechEndEvent) => {
        console.log('🛑 Speech recognition ended', e);
        sessionActiveRef.current = false;
        safeSetState(() => {
          setIsListening(false);
          setPartialTranscript('');
        });
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        const errorCode = e.error?.code?.toString() || '';
        
        // Chỉ log các lỗi nghiêm trọng, bỏ qua error code 5, 7, 11
        if (!['5', '7', '11'].includes(errorCode)) {
          console.error('❌ Speech recognition error', e);
        }
        
        sessionActiveRef.current = false;
        safeSetState(() => {
          setIsListening(false);
          setPartialTranscript('');
        });
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // Ignore common errors
        if (['5', '7', '11'].includes(errorCode)) {
          return;
        }
        
        const errorMessage = getErrorMessage(errorCode);
        safeSetState(() => setError(errorMessage));
      };

      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        console.log('📝 Speech results', e);
        if (e.value && e.value.length > 0) {
          console.log('📤 Voice result received:', e.value[0]);
          sessionActiveRef.current = false;
          safeSetState(() => {
            setResults(e.value || []);
            setPartialTranscript('');
            setIsListening(false);
          });
          
          // Cleanup ngay sau khi có kết quả
          setTimeout(cleanupVoice, 500);
        }
      };

      Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) {
          safeSetState(() => setPartialTranscript(e.value?.[0] || ''));
        }
      };

      Voice.onSpeechRecognized = () => {
        console.log('🎯 Speech recognized');
      };

      Voice.onSpeechVolumeChanged = () => {};

      console.log('✅ Voice service setup completed');
    } catch (err) {
      console.error('❌ Voice setup error:', err);
      throw err;
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: { [key: string]: string } = {
      '1': 'Lỗi mạng. Vui lòng kiểm tra kết nối internet.',
      '2': 'Lỗi âm thanh. Vui lòng kiểm tra microphone.',
      '3': 'Lỗi máy chủ. Vui lòng thử lại sau.',
      '4': 'Không có quyền truy cập microphone.',
      '6': 'Không đủ bộ nhớ.',
      '8': 'Dịch vụ bận. Vui lòng thử lại.',
      '9': 'Dữ liệu không đủ để nhận dạng.',
    };
    return errorMessages[errorCode] || 'Đã xảy ra lỗi không xác định.';
  };

  const checkPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        
        if (!granted) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Quyền truy cập Microphone',
              message: 'Ứng dụng cần quyền truy cập microphone để nhận dạng giọng nói',
              buttonNeutral: 'Hỏi lại sau',
              buttonNegative: 'Hủy',
              buttonPositive: 'Đồng ý',
            }
          );
          return result === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } catch (err) {
        console.error('Permission check error:', err);
        return false;
      }
    }
    return true;
  };

  const startListening = useCallback(async (): Promise<void> => {
    if (isOperatingRef.current || sessionActiveRef.current) {
      console.log('🎧 Already operating, ignoring');
      return;
    }

    try {
      isOperatingRef.current = true;
      
      // Check permission
      const hasPermission = await checkPermission();
      if (!hasPermission) {
        Alert.alert('Lỗi', 'Cần quyền truy cập microphone');
        return;
      }

      // Setup Voice service từ đầu
      await setupVoice();

      // Reset states
      safeSetState(() => {
        setError(null);
        setResults([]);
        setPartialTranscript('');
      });

      console.log('🎙️ Bắt đầu nhận dạng giọng nói...');
      
      // Start recognition
      await Voice.start('vi-VN');

      // Set timeout
      timeoutRef.current = setTimeout(async () => {
        if (sessionActiveRef.current) {
          console.log('⏰ Auto stopping after timeout');
          await stopListening();
        }
      }, 8000);

    } catch (err) {
      console.error('❌ Start listening error:', err);
      safeSetState(() => {
        setError('Không thể bắt đầu nhận dạng giọng nói');
        setIsListening(false);
      });
      sessionActiveRef.current = false;
    } finally {
      isOperatingRef.current = false;
    }
  }, [safeSetState]);

  const stopListening = useCallback(async (): Promise<void> => {
    if (isOperatingRef.current) {
      return;
    }

    try {
      isOperatingRef.current = true;
      console.log('🛑 Dừng nhận dạng');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      await Voice.stop();
      
      // Cleanup sau khi stop
      setTimeout(async () => {
        await cleanupVoice();
        safeSetState(() => setIsListening(false));
      }, 500);
      
    } catch (err) {
      // Không log stop errors
    } finally {
      sessionActiveRef.current = false;
      isOperatingRef.current = false;
    }
  }, [safeSetState]);

  const cancelListening = useCallback(async (): Promise<void> => {
    try {
      console.log('❌ Hủy nhận dạng');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      await cleanupVoice();
      
      safeSetState(() => {
        setIsListening(false);
        setPartialTranscript('');
        setResults([]);
      });
      
    } catch (err) {
      // Không log cancel errors
    } finally {
      sessionActiveRef.current = false;
      isOperatingRef.current = false;
    }
  }, [safeSetState]);

  const destroyRecognizer = useCallback(async (): Promise<void> => {
    try {
      console.log('🗑️ Destroying voice recognizer');
      
      await cleanupVoice();
      
      safeSetState(() => {
        setIsListening(false);
        setPartialTranscript('');
        setResults([]);
        setError(null);
      });
      
    } catch (err) {
      // Không log destroy errors
    } finally {
      sessionActiveRef.current = false;
      isOperatingRef.current = false;
    }
  }, [safeSetState]);

  return {
    isListening,
    results,
    partialTranscript,
    error,
    startListening,
    stopListening,
    cancelListening,
    destroyRecognizer,
  };
};

export default useVoice;