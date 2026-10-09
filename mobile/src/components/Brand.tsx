import { Image, StyleSheet, View } from 'react-native';

export function Brand({ large = false }: { large?: boolean }) {
  return <View style={styles.brand}>
    <Image source={require('../../assets/magicpro-logo.png')} resizeMode="contain"
      style={large ? styles.largeLogo : styles.logo} accessibilityLabel="Logo Magiquepro" />
  </View>;
}
const styles = StyleSheet.create({
  brand: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 192, height: 128, maxWidth: '100%' },
  largeLogo: { width: 288, height: 192, maxWidth: '100%' },
});
