import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MainAppNavigator } from './src/screens/MainAppNavigator';

export default function App() {
  return (
    <View style={styles.root}>
      <MainAppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090B',
  },
});
