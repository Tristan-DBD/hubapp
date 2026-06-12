import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { ANIM_SLIDE_DELAY, ANIM_SLIDE_DURATION, ANIM_SLIDE_OFFSET } from '../config'

export function useSlideOut(
  condition: boolean,
  onRemove?: () => void,
): Animated.Value {
  const slideAnim = useRef(new Animated.Value(0)).current
  const exitingRef = useRef(false)

  useEffect(() => {
    if (condition && !exitingRef.current) {
      exitingRef.current = true
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: ANIM_SLIDE_DURATION,
          useNativeDriver: true,
        }).start(() => {
          onRemove?.()
        })
      }, ANIM_SLIDE_DELAY)
      return () => clearTimeout(timer)
    }
  }, [condition, onRemove, slideAnim])

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ANIM_SLIDE_OFFSET],
  })

  return translateX
}
