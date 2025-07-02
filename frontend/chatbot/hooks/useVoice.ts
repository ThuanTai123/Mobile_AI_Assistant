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
  const isListeningRef = useRef(false);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

    return () => {
      Voice.removeAllListeners();
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
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const onSpeechPartialResults = (e: SpeechResultsEvent) => {
    console.log('📝 Partial results', e);
    if (e.value && e.value.length > 0) {
      setPartialTranscript(e.value[0]);
    }
  };

  const onSpeechVolumeChanged = (_: any) => {
    // Volume indicator placeholder
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
    if (isListeningRef.current) {
      console.log('🎧 Đã đang nghe, không gọi lại');
      return;
    }

    try {
      setError(null);
      setResults([]);
      setPartialTranscript('');
      setIsListening(true);
      isListeningRef.current = true;
      // ⚠️ Hủy trước để đảm bảo không chồng lệnh
      try {
        await Voice.cancel();
        await new Promise(resolve => setTimeout(resolve, 300)); // delay ngắn
      } catch (cancelErr) {
        console.warn('⚠️ Voice.cancel() error (không nghiêm trọng)', cancelErr);
      }

      console.log('🎙️ Bắt đầu nhận dạng giọng nói...');
      await Voice.start('vi-VN'); // ❗ Không gọi setIsListening(true) ở đây

      // Đặt timeout auto stop sau 10s
      timeoutRef.current = setTimeout(async () => {
        if (isListening) {
          console.log('⏰ Auto stopping voice recognition after timeout');
          await stopListening();
        }
      }, 10000);
    } catch (err) {
      console.error('❌ Lỗi khi bắt đầu nhận dạng giọng nói:', err);
      setIsListening(false);
      setError('Không thể bắt đầu nhận dạng giọng nói. Vui lòng kiểm tra microphone.');
      Alert.alert('Lỗi', 'Không thể bắt đầu nhận dạng giọng nói. Vui lòng kiểm tra quyền microphone.', [{ text: 'OK' }]);
    }
  };

  const stopListening = async (): Promise<void> => {
    try {
      console.log('🛑 Dừng nhận dạng');
      setIsListening(false);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      await new Promise(resolve => setTimeout(resolve, 300)); // Delay tránh lỗi
      await Voice.cancel(); // Dừng tất cả mọi thứ
    } catch (err) {
      console.error('❌ Lỗi khi dừng nhận dạng:', err);
    }
  };

  const cancelListening = async (): Promise<void> => {
    try {
      console.log('❌ Hủy nhận dạng');
      setIsListening(false);
      setPartialTranscript('');
      setResults([]);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      await Voice.cancel();
    } catch (err) {
      console.error('❌ Lỗi khi hủy nhận dạng:', err);
    }
  };

  const destroyRecognizer = async (): Promise<void> => {
    try {
      console.log('🗑️ Hủy hoàn toàn voice recognizer');
      setIsListening(false);
      setPartialTranscript('');
      setResults([]);
      setError(null);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      await Voice.destroy();
    } catch (err) {
      console.error('❌ Lỗi khi hủy Voice.destroy()', err);
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