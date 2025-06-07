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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { sendMessageToBot } from '../api/chat';
import * as Notifications from 'expo-notifications';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

let messageId = 0;

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    requestPermissions();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
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
    const textToSend = overrideText || inputText.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: messageId++,
      text: textToSend,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    scrollToBottom();

    const botResponse = await sendMessageToBot(textToSend);
    const botMessage: Message = {
      id: messageId++,
      text: botResponse.reply,
      sender: 'bot',
    };

    setMessages((prev) => [...prev, botMessage]);
    scrollToBottom();

    // Đọc phản hồi bằng giọng nói
    Speech.speak(botResponse.reply, {
      language: 'vi-VN',
      pitch: 1,
      rate: 1,
    });

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

  // Nút test thủ công


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={item.sender === 'user' ? styles.userMsg : styles.botMsg}>
              <Text style={styles.msgText}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
        />



        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập tin nhắn..."
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity onPress={() => handleSend()} style={styles.iconButton}>
            <Ionicons name="send" size={28} color="blue" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="mic-outline" size={36} color="gray" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageList: {
    padding: 10,
    paddingBottom: 80,
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    maxWidth: '80%',
  },
  botMsg: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f0f0',
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    maxWidth: '80%',
  },
  msgText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  iconButton: {
    marginHorizontal: 4,
  },
});
