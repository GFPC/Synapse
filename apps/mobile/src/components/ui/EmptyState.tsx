import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../theme/tokens';

interface Props {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  icon = '📂',
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionText && onAction ? (
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.75}
          onPress={onAction}
        >
          <Text style={styles.buttonText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.surface2,
    borderWidth: 1,
    borderColor: THEME.border2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text1,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: THEME.text3,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 240,
  },
  button: {
    marginTop: 8,
    backgroundColor: THEME.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: THEME.radius.pill,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
});
