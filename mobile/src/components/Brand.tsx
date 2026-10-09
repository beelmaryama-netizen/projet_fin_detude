import { Image, StyleSheet, View } from 'react-native';

export function Brand({ large = false }: { large?: boolean }) {
  return <View style={styles.brand}>
    <Image
      source={require('../../assets/magicpro-logo.png')}
      resizeMode="contain"
      style={large ? styles.largeLogo : styles.logo}
      accessibilityLabel="Logo MagiquePro"
    />
  </View>;
}

const styles = StyleSheet.create({
  brand: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 190, height: 82, maxWidth: '100%' },
  largeLogo: { width: 278, height: 150, maxWidth: '100%' },
});
