import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { handleDeviceCommand } from './DeviceCommandHandler';
import { Ionicons } from '@expo/vector-icons';
import { checkAndOpenApp } from './AppLauncher';
import * as Speech from 'expo-speech';
import { sendMessageToBot } from '../api/chat';
import * as Notifications from 'expo-notifications';
import { PermissionsAndroid, Alert } from 'react-native';
import useVoice from './useVoice';

const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Yêu cầu quyền Microphone',
          message: 'Ứng dụng cần quyền truy cập micro để nhận dạng giọng nói.',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Từ chối',
          buttonPositive: 'Đồng ý',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Quyền bị từ chối', 'Không thể sử dụng chức năng ghi âm.');
      }
    } catch (err) {
      console.warn(err);
    }
  }
};

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { isListening, results, startListening, stopListening } = useVoice();


  useEffect(() => {
    requestPermissions();
    requestMicrophonePermission();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: true,  
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Bạn cần cấp quyền thông báo để nhận nhắc nhở');
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  

  const handleSend = async (overrideText?: string) => {
    Vibration.vibrate(50);
    const textToSend = overrideText || inputText.trim();
    if (!textToSend) return;
    
       const userMessage: Message = {
      id: generateId(),
      text: textToSend,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    scrollToBottom();
    
    const { opened, appName } = await checkAndOpenApp(textToSend);
    if (opened) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          text: `Đã mở ứng dụng ${appName} cho bạn.`,
          sender: 'bot',
        },
      ]);
      return;
    }
    const deviceResponse = await handleDeviceCommand(textToSend);
    if (deviceResponse) {
      const botMessage: Message = {
        id: generateId(),
        text: deviceResponse,
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botMessage]);
      return;
    }
    const botResponse = await sendMessageToBot(textToSend);

    // Kiểm tra nếu là lệnh nhắc, thì trích số giây và lên lịch
    const isReminder = /đã tạo nhắc/i.test(botResponse.reply);
    if (isReminder) {
      const match = textToSend.match(/(\d+)\s*(giây|giay|seconds?)/i);
      if (match) {
        const delaySeconds = parseInt(match[1]);
        if (!isNaN(delaySeconds)) {
          await scheduleReminderNotification(delaySeconds, '⏰ Đã tạo nhắc nhở ' + textToSend);
        }
      }
    }
    
    const botMessage: Message = {
      id: generateId(),
      text: botResponse.reply,
      sender: 'bot',
    };

    setMessages((prev) => [...prev, botMessage]);
    scrollToBottom();

    // Đọc phản hồi bằng giọng nói
    if (!isReminder) {
      Speech.speak(botResponse.reply, {
        language: 'vi-VN',
        pitch: 1,
        rate: 1,
      });
    }

    // Nếu phản hồi có dạng nhắc việc, tìm số giây để đặt thông báo
    if (botResponse.reply.toLowerCase().includes('đã tạo nhắc')) {
      const match = textToSend.match(/(\d+)\s*(giây|giay|seconds?)/i);
      if (match) {
        const delaySeconds = parseInt(match[1]);
        if (!isNaN(delaySeconds)) {
          scheduleReminderNotification(delaySeconds, '⏰ Nhắc bạn: ' + textToSend);
        }
      }
    }
      
  };

  const scheduleReminderNotification = async (delaySeconds: number, message: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nhắc nhở',
        body: message,
        sound: true,
      },
      trigger: {
        seconds: delaySeconds,
        repeats: false,
      } as Notifications.TimeIntervalTriggerInput
    });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessage : styles.botMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4ECDC4" barStyle="dark-content" />
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>RUBY ASSISTANT</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập..."
              placeholderTextColor="#999"
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
              multiline
            />
            <TouchableOpacity 
              onPress={() => handleSend()} 
              style={styles.sendButton}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Bottom Icons */}
          <View style={styles.bottomIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="time-outline" size={28} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={isListening ? stopListening : startListening}>
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={28}
                color={isListening ? 'red' : '#000'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="help-circle-outline" size={28} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 5,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#45B7B8',
  },
  botBubble: {
    backgroundColor: '#4ECDC4',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingTop: 5,
    paddingBottom: Platform.OS === 'android' ? 12 : 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#F8F8F8',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4ECDC4',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  iconButton: {
    padding: 8,
  },
});