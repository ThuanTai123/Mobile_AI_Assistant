import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
<<<<<<< Updated upstream
} from "react-native"
import {
  setupNotificationChannel,
  requestNotificationPermission,
  setupNotificationHandler,
  scheduleReminderNotification,
} from "./Notifications"
import { handleDeviceCommand } from "./DeviceCommandHandler"
import { Ionicons } from "@expo/vector-icons"
import { checkAndOpenApp } from "./AppLauncher"
import * as Speech from "expo-speech"
import { sendMessageToBot } from "../api/chat"
import * as Notifications from "expo-notifications"
import { PermissionsAndroid } from "react-native"
import useVoice from "./useVoice"
import SpeakingMicIcon from "./SpeakingMicIcon"
import SQLite from "react-native-sqlite-storage"
import { createChatTable, fetchChatHistory, saveMessage } from "./ChatService"
import { createNoteTable, fetchNotes, saveNote, deleteNoteById, testDatabase } from "./NoteService"
import { deleteAllChatHistory, deleteAllNotes } from "./database"

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
=======
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import mime from "mime";

const { width, height } = Dimensions.get("window");

interface RouteParams {
  userId: string;
  userName: string;
>>>>>>> Stashed changes
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  image?: string;
  audio?: string;
  file?: {
    uri: string;
    name: string;
    type: string;
  };
}

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const ChatScreen = () => {
<<<<<<< Updated upstream
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [historyVisible, setHistoryVisible] = useState(false)
  const [notesVisible, setNotesVisible] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const { isListening, results, partialTranscript, startListening, stopListening } = useVoice()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const db = SQLite.openDatabase(
    {
      name: "ChatApp.db",
      location: "default",
    },
    () => console.log("Database opened"),
    (error: any) => console.error("DB error:", error),
  )
  const handleVoiceResult = (text: string) => {
    console.log("📤 Gửi voice:", text)
    setInputText(text)
  }

  // Hàm load lại dữ liệu từ database
  const loadChatHistory = () => {
    fetchChatHistory((history: any[]) => {
      setChatHistory(history)
      console.log("📚 Loaded chat history:", history.length, "messages")
    })
  }

  const loadNotes = () => {
    fetchNotes((notesList: any[]) => {
      setNotes(notesList)
      console.log("📝 Loaded notes:", notesList.length, "notes")
      // ✅ THÊM: Debug chi tiết từng ghi chú
      notesList.forEach((note, index) => {
        console.log(`📋 Note ${index + 1}:`, {
          id: note.id,
          title: note.title,
          content: note.content,
          created_at: note.created_at
        });
      });
    })
  }

  // Hàm xóa ghi chú theo ID
  const handleDeleteNote = (noteId: number, noteTitle: string) => {
    Alert.alert(
      "Xác nhận xoá",
      `Bạn có chắc chắn muốn xoá ghi chú "${noteTitle}" không?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () => {
            deleteNoteById(noteId, () => {
              loadNotes();
            });
          },
        },
      ]
    );
  };

  // ✅ FIXED: useEffect với database testing
  useEffect(() => {
    const init = async () => {
      await setupNotificationHandler()
      await requestNotificationPermission()
      await setupNotificationChannel()
      
      // Tạo bảng và test database
      try {
        await createChatTable()
        await createNoteTable()
        console.log("✅ Tables created successfully");
        
        // Test database
        testDatabase();
        
      } catch (error) {
        console.error("❌ Database initialization failed:", error);
      }

      // Load dữ liệu
      loadChatHistory()
      loadNotes()
    }
    requestPermissions()
    const requestMicrophonePermission = async () => {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
          title: "Microphone Permission",
          message: "App needs access to your microphone " + "so you can record voice messages.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        })
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("You can use the microphone")
        } else {
          console.log("Microphone permission denied")
        }
      } catch (err) {
        console.warn(err)
      }
    }
    requestMicrophonePermission()
    init()
  }, [])

  useEffect(() => {
    if (results.length > 0) {
      const latestText = results[0]
      handleVoiceResult(latestText)
    }
  }, [results])
=======
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [file, setFile] = useState<Message["file"] | null>(null);
  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emoji, setEmoji] = useState("");

  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName } = route.params as RouteParams;

  useEffect(() => {
    navigation.setOptions({ title: userName });
  }, [navigation, userName]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );
>>>>>>> Stashed changes

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    loadMessages();
    loadNotes();
  }, []);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
<<<<<<< Updated upstream
    flatListRef.current?.scrollToEnd({ animated: true })
  }

  // ✅ FIXED: handleSend với async/await cho note creation
  // ✅ FIXED: Sửa lỗi TypeScript cho error handling
const handleSend = async (overrideText?: string) => {
  Vibration.vibrate(50)
  const textToSend = overrideText || inputText.trim()
  if (!textToSend) return

  console.log("🔍 Processing message:", textToSend);

  const userMessage: Message = {
    id: generateId(),
    text: textToSend,
    sender: "user",
  }

  saveMessage("user", textToSend)
  setMessages((prev) => [...prev, userMessage])
  setInputText("")
  scrollToBottom()

  const { opened, appName } = await checkAndOpenApp(textToSend)
  if (opened) {
    const appResponse = `Đã mở ứng dụng ${appName} cho bạn.`
    const botMessage: Message = {
      id: generateId(),
      text: appResponse,
      sender: "bot",
    }
    setMessages((prev) => [...prev, botMessage])
    saveMessage("bot", appResponse)
    return
  }

  const deviceResponse = await handleDeviceCommand(textToSend)
  if (deviceResponse) {
    const botMessage: Message = {
      id: generateId(),
      text: deviceResponse,
      sender: "bot",
    }
    setMessages((prev) => [...prev, botMessage])
    saveMessage("bot", deviceResponse)

    setIsSpeaking(true)
    Speech.speak(deviceResponse, {
      language: "vi-VN",
      pitch: 1,
      rate: 1,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    })
    return
  }

  // ✅ FIXED: Sử dụng async/await cho note creation
  console.log("🔍 Checking if message is note creation...");

  const notePatterns = [
    /^tạo ghi chú\s+(.+)$/i,
    /^ghi chú\s+(.+)$/i,
  ];

  let noteContent = null;

  for (const pattern of notePatterns) {
    const match = textToSend.match(pattern);
    if (match && match[1] && match[1].trim()) {
      noteContent = match[1].trim();
      break;
    }
  }

  if (noteContent) {
    console.log("✅ Creating note with content:", noteContent);
    
    const noteTitle = noteContent.length > 25 
      ? noteContent.substring(0, 25) + "..." 
      : noteContent;
    
    try {
      // Sử dụng async/await
      console.log("💾 Calling saveNote...");
      await saveNote(noteTitle, noteContent);
      console.log("✅ Note saved successfully!");
      
      // Tạo phản hồi bot
      const noteResponse = `✅ Đã tạo ghi chú: "${noteContent}"`;
      const botMessage: Message = {
        id: generateId(),
        text: noteResponse,
        sender: "bot",
      }
      setMessages((prev) => [...prev, botMessage])
      saveMessage("bot", noteResponse)

      // Load lại notes
      setTimeout(() => {
        console.log("🔄 Reloading notes...");
        loadNotes()
      }, 1000)

      // Đọc phản hồi
      setIsSpeaking(true)
      Speech.speak(noteResponse, {
        language: "vi-VN",
        pitch: 1,
        rate: 1,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
      
    } catch (error: unknown) {
      // ✅ FIXED: Type assertion cho error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error("❌ Failed to save note:", error);
      
      // Hiển thị lỗi cho user
      const userErrorMessage = `❌ Không thể lưu ghi chú: ${errorMessage}`;
      const botMessage: Message = {
        id: generateId(),
        text: userErrorMessage,
        sender: "bot",
      }
      setMessages((prev) => [...prev, botMessage])
      
      // Đọc lỗi
      setIsSpeaking(true)
      Speech.speak("Không thể lưu ghi chú. Vui lòng thử lại.", {
        language: "vi-VN",
        pitch: 1,
        rate: 1,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
    }
    
    return
  }

  // ... rest of the function remains the same
  const botResponse = await sendMessageToBot(textToSend)
  const isReminder = /đã tạo nhắc/i.test(botResponse.reply)

  if (isReminder) {
    const match = textToSend.match(/(\d+)\s*(giây|giay|seconds?)/i)
    if (match) {
      const delaySeconds = Number.parseInt(match[1])
      if (!isNaN(delaySeconds)) {
        await scheduleReminderNotification(delaySeconds, textToSend)
      }
    }
  }

  const botMessage: Message = {
    id: generateId(),
    text: botResponse.reply,
    sender: "bot",
  }

  saveMessage("bot", botResponse.reply)
  setMessages((prev) => [...prev, botMessage])
  scrollToBottom()

  setTimeout(() => {
    loadChatHistory()
  }, 500)

  if (!isReminder) {
    setIsSpeaking(true)
    Speech.speak(botResponse.reply, {
      language: "vi-VN",
      pitch: 1,
      rate: 1,
      onDone: () => {
        setIsSpeaking(false)
        setIsRecording(false)
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    })
    return
  }
}

  const handleDeleteChatHistory = () => {
    Alert.alert(
      "Xác nhận xoá",
      "Bạn có chắc chắn muốn xoá toàn bộ lịch sử trò chuyện không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () => {
            deleteAllChatHistory();
            setChatHistory([]);
          },
        },
      ]
    );
  };  

  const handleDeleteNotes = () => {
    Alert.alert(
      "Xác nhận xoá",
      "Bạn có chắc chắn muốn xoá toàn bộ ghi chú không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () => {
            deleteAllNotes();
            setNotes([]);
          },
        },
      ]
    );
=======
    flatListRef.current?.scrollToEnd({ animated: false });
  };

  const loadMessages = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem("messages");
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
>>>>>>> Stashed changes
  };

  const saveMessages = async (currentMessages: Message[]) => {
    try {
      await AsyncStorage.setItem("messages", JSON.stringify(currentMessages));
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  };

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem("notes");
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  const saveNotes = async (currentNotes: Note[]) => {
    try {
      await AsyncStorage.setItem("notes", JSON.stringify(currentNotes));
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "" && !image && !file) {
      return;
    }

    setIsLoading(true);

    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImage(image);
    }

    let fileData = null;
    if (file) {
      fileData = await uploadFile(file);
    }

    const newMessageObject: Message = {
      id: uuid.v4().toString(),
      senderId: userId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      image: imageUrl || undefined,
      file: fileData || undefined,
    };

    const updatedMessages = [...messages, newMessageObject];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setNewMessage("");
    setImage(null);
    setFile(null);
    setIsLoading(false);
    setShowEmojiPicker(false);
    scrollToBottom();
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const response = await FileSystem.uploadAsync(
        "https://api.cloudinary.com/v1_1/dj3w8u7fj/image/upload",
        uri,
        {
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file",
          mimeType: "image/jpeg",
          parameters: {
            upload_preset: "chat_app",
          },
        }
      );

      if (response.status === 200) {
        return response.json.secure_url;
      } else {
        console.error("Upload failed:", response.body);
        return null;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const uploadFile = async (file: Message["file"]): Promise<any | null> => {
    try {
      const fileUri = file?.uri;
      const fileName = file?.name;
      const fileType = file?.type || mime.getType(fileName) || "application/octet-stream";

      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: fileType,
      } as any);
      formData.append("upload_preset", "chat_app");

      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dj3w8u7fj/raw/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        return {
          url: response.data.secure_url,
          name: fileName,
          type: fileType,
        };
      } else {
        console.error("Upload failed:", response.status, response.data);
        return null;
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const pickImage = async () => {
    try {
      let permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos to send images."
        );
        return;
      }

      let pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!pickerResult.canceled) {
        setImage(pickerResult.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking an image:", error);
      Alert.alert(
        "Error",
        "An error occurred while trying to pick an image. Please try again."
      );
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.type === "success") {
        setFile({
          uri: result.uri,
          name: result.name || "Unknown File Name",
          type: result.mimeType || "application/octet-stream",
        });
      } else {
        console.warn("Document picking cancelled or failed");
      }
    } catch (error) {
      console.error("Error picking a document:", error);
      Alert.alert(
        "Error",
        "An error occurred while trying to pick a document. Please try again."
      );
    }
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const newRecording = new Audio.Recording();
        await newRecording.prepareToRecordAsync(
          Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        );
        await newRecording.startAsync();
        setRecording(newRecording);
        setIsRecording(true);
      } else {
        Alert.alert("Permissions not granted");
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      await recording?.stopAndUnloadAsync();
      const uri = recording?.getURI();
      if (uri) {
        await uploadAudio(uri);
      }
      setRecording(null);
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  const uploadAudio = async (uri: string) => {
    setIsLoading(true);
    try {
      const response = await FileSystem.uploadAsync(
        "https://api.cloudinary.com/v1_1/dj3w8u7fj/video/upload",
        uri,
        {
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file",
          mimeType: "audio/m4a",
          parameters: {
            upload_preset: "chat_app",
            resource_type: "video",
          },
        }
      );

      if (response.status === 200) {
        const audioUrl = response.json.secure_url;
        const newMessageObject: Message = {
          id: uuid.v4().toString(),
          senderId: userId,
          text: "Sent an audio",
          timestamp: new Date().toISOString(),
          audio: audioUrl,
        };
        const updatedMessages = [...messages, newMessageObject];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
      } else {
        console.error("Audio upload failed:", response.body);
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playSound = async (audioUrl: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error("Failed to play sound:", error);
    }
  };

  const addNote = () => {
    if (newNoteTitle.trim() === "" || newNoteContent.trim() === "") {
      Alert.alert("Error", "Please fill in both title and content.");
      return;
    }

    const newNote: Note = {
      id: uuid.v4().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      created_at: new Date().toISOString(),
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setNewNoteTitle("");
    setNewNoteContent("");
    setModalVisible(false);
  };

  const openEditModal = (note: Note) => {
    setSelectedNote(note);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content);
    setIsEditModalVisible(true);
  };

  const updateNote = () => {
    if (!selectedNote) return;

    const updatedNotes = notes.map((note) =>
      note.id === selectedNote.id
        ? {
          ...note,
          title: editNoteTitle,
          content: editNoteContent,
        }
        : note
    );

    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setIsEditModalVisible(false);
    setSelectedNote(null);
  };

  const handleDeleteNote = (noteId: string | undefined, noteTitle: string) => {
    Alert.alert(
      "Delete Note",
      `Are you sure you want to delete the note "${noteTitle}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            const updatedNotes = notes.filter((note) => note.id !== noteId);
            setNotes(updatedNotes);
            saveNotes(updatedNotes);
          },
        },
      ]
    );
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === userId;
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.messageImage} />
        )}
        {item.file && (
          <TouchableOpacity
            style={styles.fileContainer}
            onPress={() => {
              // Implement file download or preview here
              console.log("Download or preview file:", item.file);
            }}
          >
            <Ionicons name="document-attach-outline" size={30} color="#2980b9" />
            <Text style={styles.fileText}>{item.file.name}</Text>
          </TouchableOpacity>
        )}
        {item.audio && (
          <TouchableOpacity onPress={() => playSound(item.audio)}>
            <Ionicons name="play-circle-outline" size={50} color="#2980b9" />
          </TouchableOpacity>
        )}
        {item.text ? (
          <Text style={styles.messageText}>{item.text}</Text>
        ) : null}
        <Text style={styles.timestampText}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
    );
  };

  const keyExtractor = (item: Message) => item.id;

  const renderNoteItem = useCallback(({ item, index }: { item: Note; index: number }) => (
    <View key={item.id || index} style={styles.noteItem}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>
          {item.title || "Không có tiêu đề"}
        </Text>
        <TouchableOpacity 
          onPress={() => handleDeleteNote(item.id, item.title || "Ghi chú")}
          style={styles.individualDeleteButton}
        >
          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>
      <Text style={styles.noteContent}>
        {item.content || "Không có nội dung"}
      </Text>
      <Text style={styles.timestampText}>
        {item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : "Không có thời gian"}
      </Text>
    </View>
  ), []);

  const renderInputArea = useMemo(() => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.inputArea}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      {image && (
        <View>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setImage(null)}
          >
            <Ionicons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </View>
      )}
      {file && (
        <View style={styles.filePreviewContainer}>
          <Text style={styles.filePreviewText}>File: {file.name}</Text>
          <TouchableOpacity onPress={() => setFile(null)}>
            <Ionicons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.emojiButton}
          onPress={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <Text style={styles.emojiButtonText}>Emoji</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={(text) => setNewMessage(text)}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.attachmentButtons}>
        <TouchableOpacity style={styles.attachmentButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={24} color="#2980b9" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.attachmentButton} onPress={pickDocument}>
          <Ionicons name="attach-outline" size={24} color="#2980b9" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons
            name={isRecording ? "mic-off-outline" : "mic-outline"}
            size={24}
            color={isRecording ? "red" : "#2980b9"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#2980b9" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={() => setIsNotesModalVisible(true)}
        >
          <Ionicons name="list-outline" size={24} color="#2980b9" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  ), [
    newMessage,
    image,
    file,
    isLoading,
    isRecording,
    showEmojiPicker,
    startRecording,
    stopRecording,
  ]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messagesContainer}
        />
        {renderInputArea}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Add New Note</Text>
              <TextInput
                style={styles.input}
                placeholder="Note Title"
                value={newNoteTitle}
                onChangeText={setNewNoteTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Note Content"
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                multiline
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setModalVisible(!modalVisible)}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSave]}
                  onPress={addNote}
                >
                  <Text style={styles.textStyle}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isNotesModalVisible}
          onRequestClose={() => {
            setIsNotesModalVisible(!isNotesModalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Your Notes</Text>
              <ScrollView style={styles.notesList}>
                {notes.map((item, index) => renderNoteItem({ item, index }))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setIsNotesModalVisible(!isNotesModalVisible)}
              >
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isEditModalVisible}
          onRequestClose={() => {
            setIsEditModalVisible(!isEditModalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Edit Note</Text>
              <TextInput
                style={styles.input}
                placeholder="Note Title"
                value={editNoteTitle}
                onChangeText={setEditNoteTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Note Content"
                value={editNoteContent}
                onChangeText={setEditNoteContent}
                multiline
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setIsEditModalVisible(!isEditModalVisible)}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSave]}
                  onPress={updateNote}
                >
                  <Text style={styles.textStyle}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  messagesContainer: {
    padding: 10,
    paddingBottom: 80,
  },
  messageContainer: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    maxWidth: "70%",
  },
  currentUserMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  otherUserMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  timestampText: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
    textAlign: "right",
  },
  inputArea: {
    backgroundColor: "#fff",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#2980b9",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 5,
  },
  attachmentButton: {
    padding: 10,
    borderRadius: 5,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 12,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginHorizontal: 5,
  },
  buttonClose: {
    backgroundColor: "#e74c3c",
  },
  buttonSave: {
    backgroundColor: "#2ecc71",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  fileText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#34495e",
  },
  filePreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 5,
    marginBottom: 10,
  },
  filePreviewText: {
    fontSize: 16,
  },
  emojiButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: "#3498db",
    marginRight: 8,
  },
  emojiButtonText: {
    color: "white",
    fontSize: 14,
  },
  noteItem: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 16,
    color: "#333",
  },
  notesList: {
    width: "100%",
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  individualDeleteButton: {
    padding: 5,
  },
});

export default ChatScreen;