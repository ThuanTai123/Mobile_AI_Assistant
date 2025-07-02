import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
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

const useVoice = (): UseVoiceReturn => {
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('❌ Speech recognition error', e);
    const errorCode = e.error?.code?.toString() || '';
    const errorMessage = e.error?.message || 'Lỗi nhận dạng giọng nói';
    setError(errorMessage);
    setIsListening(false);
    setPartialTranscript('');
    if (errorCode !== '7') {
      Alert.alert('Lỗi nhận dạng giọng nói', getErrorMessage(errorCode), [{ text: 'OK' }]);
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    console.log('📝 Speech results', e);
    if (e.value?.length) {
      setResults(e.value);
      setPartialTranscript('');
    }
  };

  const onSpeechPartialResults = (e: SpeechResultsEvent) => {
    if (e.value?.length) {
      setPartialTranscript(e.value[0]);
    }
  };

  const onSpeechVolumeChanged = (e: any) => {
    // Có thể hiển thị UI volume nếu cần
  };

  const startListening = async () => {
    if (isListening) {
      console.warn('🔁 Đang lắng nghe. Không thể bắt đầu lại.');
      return;
    }

    try {
      setError(null);
      setResults([]);
      setPartialTranscript('');

      const available = await Voice.isAvailable();
      if (!available) {
        throw new Error('Thiết bị không hỗ trợ nhận dạng giọng nói');
      }

      console.log('🚀 Bắt đầu nhận dạng...');
      await Voice.start('vi-VN');

      timeoutRef.current = setTimeout(async () => {
        if (isListening) {
          console.log('⏰ Tự động dừng sau 10 giây');
          await stopListening();
        }
      }, 10000);

    } catch (err) {
      console.error('❌ Không thể bắt đầu:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định khi bắt đầu';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage, [{ text: 'OK' }]);
    }
  };

  const stopListening = async () => {
    try {
      console.log('🛑 Dừng nhận dạng');
      await Voice.stop();
    } catch (err) {
      console.error('❌ Lỗi khi dừng:', err);
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  const cancelListening = async () => {
    try {
      console.log('❌ Huỷ nhận dạng');
      await Voice.cancel();
      setIsListening(false);
      setPartialTranscript('');
      setResults([]);
    } catch (err) {
      console.error('❌ Lỗi khi huỷ:', err);
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  const destroyRecognizer = async () => {
    try {
      console.log('🗑️ Huỷ bộ nhận dạng');
      await Voice.destroy();
    } catch (err) {
      console.error('❌ Lỗi khi xoá:', err);
    } finally {
      setIsListening(false);
      setPartialTranscript('');
      setResults([]);
      setError(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
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
