import { useEffect, useState } from 'react';
import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from '@react-native-voice/voice';

export default function useVoice() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     Voice.onSpeechStart = () => {
      console.log('🎙️ Bắt đầu nghe');
      setIsListening(true);
    };
    Voice.onSpeechEnd = () => {
      console.log('🛑 Dừng nghe');
      setIsListening(false);
    };

    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      console.log('📄 Kết quả:', e.value);
      setResults(e.value ?? []);
    };

    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.log('❌ Lỗi nhận diện:', e.error?.message);
      setError(e.error?.message ?? 'Unknown error');
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      await Voice.start('vi-VN');
    } catch (e: any) {
      setError(e?.message || 'Không thể bắt đầu lắng nghe');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e: any) {
      setError(e?.message || 'Không thể dừng lắng nghe');
    }
  };

  return { isListening, results, error, startListening, stopListening };
}
