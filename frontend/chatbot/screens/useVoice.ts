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
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);

    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      setResults(e.value ?? []);
    };

    Voice.onSpeechError = (e: SpeechErrorEvent) => {
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
