import { StyleSheet, View } from 'react-native';
import { AuthLayout } from '../../auth/components/AuthLayout';
import { SelectionCard } from '../../../components/SelectionCard';
import { Button } from '../../../components/Button';
import type { ClientScreenProps } from '../../../navigation/types';
import { spacing } from '../../../theme/tokens';
import { requestCategories } from '../data/requestCategories';
import { useRequestType } from '../hooks/useRequestType';

export function RequestTypeScreen({ navigation }: ClientScreenProps<'RequestTypeScreen'>) {
  const request = useRequestType(navigation);
  return <AuthLayout title="Quel type de service souhaitez-vous ?" subtitle="Choisissez le service qui correspond à votre besoin." step="NOUVELLE DEMANDE · 1 SUR 4" onBack={() => navigation.goBack()}>
    <View accessibilityRole="radiogroup" accessibilityLabel="Type de service" style={styles.options}>
      {requestCategories.map(category => <SelectionCard key={category.value} {...category} selected={request.category === category.value} onPress={() => request.selectCategory(category.value)} />)}
    </View>
    <Button title="Continuer" icon="arrow-forward" disabled={!request.category} onPress={request.continueRequest} />
  </AuthLayout>;
}
const styles = StyleSheet.create({ options: { gap: spacing.md } });
