import Voice from '@react-native-voice/voice';
import { useEffect, useState } from 'react';

const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [partialTranscript, setPartialTranscript] = useState<string>(''); // 👈 thêm

  useEffect(() => {
    Voice.onSpeechResults = (event) => {
      setResults(event.value || []);
    };
    Voice.onSpeechPartialResults = (event) => {
      setPartialTranscript(event.value?.[0] || ''); // 👈 bắt kết quả từng từ
    };
    Voice.onSpeechEnd = () => {
    setIsListening(false);
    setPartialTranscript('');
  };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    setResults([]);
    setPartialTranscript(''); // reset
    setIsListening(true);
    try {
      await Voice.start('vi-VN');
    } catch (e) {
      console.error('Voice start error:', e);
    }
  };

  const stopListening = async () => {
    setIsListening(false);
    try {
      await Voice.stop();
    } catch (e) {
      console.error('Voice stop error:', e);
    }
  };

  return {
    isListening,
    results,
    partialTranscript, // 👈 export biến mới
    startListening,
    stopListening,
  };
};

export default useVoice;
