import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SpeakingMicIcon from './SpeakingMicIcon';
import styles from '../styles/ChatStyles';

interface BottomActionsProps {
  onHistoryPress: () => void;
  onNotesPress: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export const BottomActions: React.FC<BottomActionsProps> = ({
  onHistoryPress,
  onNotesPress,
  isListening,
  isSpeaking,
  startListening,
  stopListening,
}) => {
  return (
    <View style={styles.bottomIcons}>
      <TouchableOpacity style={styles.iconButton} onPress={onHistoryPress}>
        <Ionicons name="time-outline" size={28} color="#000" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={isListening ? stopListening : startListening}
      >
        {isSpeaking ? (
          <SpeakingMicIcon isSpeaking={true} />
        ) : (
          <Ionicons 
            name={isListening ? "mic" : "mic-outline"} 
            size={28} 
            color={isListening ? "red" : "#000"} 
          />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.iconButton} onPress={onNotesPress}>
        <Ionicons name="calendar-outline" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
};