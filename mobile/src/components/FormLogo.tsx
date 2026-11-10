import { Image, StyleSheet, View } from 'react-native';
export function FormLogo() {
 return <View pointerEvents="none" style={styles.container}><Image source={require('../../assets/magicpro-form-logo.png')} resizeMode="contain" accessibilityLabel="Logo MagicPro" style={styles.image} /></View>;
}
const styles = StyleSheet.create({ container: { alignItems: 'center', justifyContent: 'center', width: '100%' }, image: { width: 128, height: 108, maxWidth: '100%' } });
