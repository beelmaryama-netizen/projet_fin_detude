import { Linking } from 'react-native';
import { useState } from 'react';
import { ClientLayout } from '../components/ClientLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { MessageBanner } from '../../../components/MessageBanner';
import { supportContact, supportFaq } from '../data/supportContent';
import type { ClientScreenProps } from '../../../navigation/types';
export function SupportScreen({ navigation }: ClientScreenProps<'Support'>) {
  const [error, setError] = useState<string>();
  const contact = (url: string) => { void Linking.openURL(url).catch(() => setError('Impossible d’ouvrir cette application. Utilisez le formulaire de contact.')); };
  return <ClientLayout title="Aide / support" subtitle="Comment pouvons-nous vous aider ?" onBack={() => navigation.goBack()}>
    <AppText variant="heading">Questions fréquentes</AppText>{supportFaq.map(item => <Card key={item.question}><AppText variant="label">{item.question}</AppText><AppText>{item.answer}</AppText></Card>)}
    <Card><AppText variant="heading">Contacter MagicPro</AppText><AppText>Téléphone : {supportContact.phone ?? 'coordonnées à venir'}</AppText><AppText>Email : {supportContact.email ?? 'coordonnées à venir'}</AppText>
      {supportContact.phone && <Button title="Appeler MagicPro" variant="secondary" onPress={() => contact(`tel:${supportContact.phone}`)} />}{supportContact.email && <Button title="Écrire un email" variant="secondary" onPress={() => contact(`mailto:${supportContact.email}`)} />}
      <MessageBanner message={error} /><Button title="Envoyer un message" onPress={() => navigation.navigate('ContactSupport')} />
    </Card>
  </ClientLayout>;
}
