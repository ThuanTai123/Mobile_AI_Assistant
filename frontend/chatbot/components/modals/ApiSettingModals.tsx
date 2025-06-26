// components/modals/ApiSettingModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, Button, StyleSheet, Alert
} from 'react-native';
import { getApiUrl, setApiUrl } from '../../services/apiConfig';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const ApiSettingModal = ({ visible, onClose }: Props) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    getApiUrl().then(setUrl);
  }, [visible]);

  const handleSave = async () => {
    if (!url.startsWith('http')) {
      Alert.alert('Sai định dạng', 'Vui lòng nhập URL bắt đầu bằng http');
      return;
    }
    await setApiUrl(url);
    Alert.alert('Lưu thành công', 'Bạn có thể thử lại sau khi đổi địa chỉ');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Đổi địa chỉ server (API_URL)</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.x.x:5000"
          />
          <Button title="Lưu" onPress={handleSave} />
          <View style={{ height: 10 }} />
          <Button title="Huỷ" color="gray" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modal: {
    backgroundColor: 'white', padding: 20,
    borderRadius: 10, width: '80%',
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginBottom: 12,
  },
});
