import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';

interface Props {
  isSpeaking: boolean;
}

const BAR_COUNT = 6;

const SpeakingMicIcon: React.FC<Props> = ({ isSpeaking }) => {
  const animations = useRef(
    [...Array(BAR_COUNT)].map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    const createAnimation = (bar: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay), 
          Animated.timing(bar, {
            toValue: 2,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 1,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );

    const animatedLoops = animations.map((bar, i) =>
      createAnimation(bar, i * 100)
    );

    if (isSpeaking) {
      animatedLoops.forEach((anim) => anim.start());
    } else {
      animations.forEach((bar) => {
        bar.stopAnimation();
        bar.setValue(1);
      });
    }

    return () => {
      animatedLoops.forEach((anim) => anim.stop()); // cleanup
    };
  }, [isSpeaking]);

  return (
    <View style={styles.container}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  bar: {
    width: 4,
    height: 20,
    backgroundColor: 'black',
    borderRadius: 2,
  },
});

export default SpeakingMicIcon;
