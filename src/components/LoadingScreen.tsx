// LoadingScreen.tsx — v1.0 (Expo)
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props { visible: boolean; }

export default function LoadingScreen({ visible }: Props) {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity, zIndex: 999 }]}>
      <LinearGradient colors={['#0d0d0d', '#141414']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.center}>
        <View style={styles.iconBox}>
          {/* Gradient "E" monogram */}
          <View style={styles.eLetter}>
            {/* Simulated gradient text via nested views */}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: '#1a1040',
    alignItems: 'center', justifyContent: 'center',
  },
  eLetter: { width: 40, height: 40 },
});
