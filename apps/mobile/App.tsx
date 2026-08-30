import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CanvasScreen } from './src/screens/CanvasScreen';

export default function App() {
  return (
    <View style={styles.root}>
      <CanvasScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090B',
  },
});
