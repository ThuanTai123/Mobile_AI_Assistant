// screens/STTWebView.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const STTWebView = () => {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://speech-to-text-demo.vercel.app/?lang=vi-VN' }}
        javaScriptEnabled
        style={styles.webview}
      />
    </View>
  );
};

export default STTWebView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
