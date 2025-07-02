import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import Voice, { 
  SpeechRecognizedEvent, 
  SpeechResultsEvent, 
  SpeechErrorEvent,
  SpeechStartEvent,
  SpeechEndEvent 
} from '@react-native-voice/voice';

interface VoiceError {
  code?: string;
  message?: string;
}

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

  useEffect(() => {
    // Thiết lập các event listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

    return () => {
      // Cleanup khi component unmount
      Voice.destroy().then(Voice.removeAllListeners);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onSpeechStart = (e: SpeechStartEvent) => {
    console.log('🎤 Speech recognition started', e);
    setIsListening(true);
    setError(null);
  };

  const onSpeechRecognized = (e: SpeechRecognizedEvent) => {
    console.log('🎯 Speech recognized', e);
  };

  const onSpeechEnd = (e: SpeechEndEvent) => {
    console.log('🛑 Speech recognition ended', e);
    setIsListening(false);
    setPartialTranscript('');
    
    // Clear timeout nếu có
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('❌ Speech recognition error', e);
    
    // ✅ SỬA: Xử lý error object một cách an toàn
    const errorCode = e.error?.code?.toString() || '';
    const errorMessage = e.error?.message || 'Lỗi nhận dạng giọng nói';
    
    setError(errorMessage);
    setIsListening(false);
    setPartialTranscript('');
    
    // Hiển thị lỗi cho user (trừ code 7 - No match)
    if (errorCode !== '7') {
      Alert.alert(
        'Lỗi nhận dạng giọng nói', 
        getErrorMessage(errorCode),
        [{ text: 'OK' }]
      );
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    console.log('📝 Speech results', e);
    if (e.value && e.value.length > 0) {
      setResults(e.value);
      setPartialTranscript('');
    }
  };

  const onSpeechPartialResults = (e: SpeechResultsEvent) => {
    console.log('📝 Partial results', e);
    if (e.value && e.value.length > 0) {
      setPartialTranscript(e.value[0]);
    }
  };

  const onSpeechVolumeChanged = (e: any) => {
    // console.log('🔊 Volume changed', e);
    // Có thể sử dụng để hiển thị volume indicator
  };

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: { [key: string]: string } = {
      '1': 'Lỗi mạng. Vui lòng kiểm tra kết nối internet.',
      '2': 'Lỗi âm thanh. Vui lòng kiểm tra microphone.',
      '3': 'Lỗi máy chủ. Vui lòng thử lại sau.',
      '4': 'Không có quyền truy cập microphone.',
      '5': 'Dịch vụ nhận dạng giọng nói không khả dụng.',
      '6': 'Không đủ bộ nhớ.',
      '7': 'Không nhận dạng được giọng nói. Vui lòng nói rõ hơn.',
      '8': 'Dịch vụ bận. Vui lòng thử lại.',
      '9': 'Dữ liệu không đủ để nhận dạng.',
    };
    
    return errorMessages[errorCode] || 'Đã xảy ra lỗi không xác định.';
  };

  const startListening = async (): Promise<void> => {
    try {
      setError(null);
      setResults([]);
      setPartialTranscript('');
      
      console.log('🚀 Starting voice recognition...');
      
      await Voice.start('vi-VN');
      
      // Tự động dừng sau 10 giây để tránh lãng phí tài nguyên
      timeoutRef.current = setTimeout(async () => {
        if (isListening) {
          console.log('⏰ Auto stopping voice recognition after timeout');
          await stopListening();
        }
      }, 10000);
      
    } catch (err) {
      console.error('❌ Error starting voice recognition:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể bắt đầu nhận dạng giọng nói';
      setError(errorMessage);
      Alert.alert(
        'Lỗi', 
        'Không thể bắt đầu nhận dạng giọng nói. Vui lòng kiểm tra quyền microphone.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopListening = async (): Promise<void> => {
    try {
      console.log('🛑 Stopping voice recognition');
      await Voice.stop();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (err) {
      console.error('❌ Error stopping voice recognition:', err);
    }
  };

  const cancelListening = async (): Promise<void> => {
    try {
      console.log('❌ Canceling voice recognition');
      await Voice.cancel();
      setIsListening(false);
      setPartialTranscript('');
      setResults([]);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (err) {
      console.error('❌ Error canceling voice recognition:', err);
    }
  };

  const destroyRecognizer = async (): Promise<void> => {
    try {
      console.log('🗑️ Destroying voice recognizer');
      await Voice.destroy();
      setIsListening(false);
      setPartialTranscript('');
      setResults([]);
      setError(null);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (err) {
      console.error('❌ Error destroying voice recognizer:', err);
    }
  };

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