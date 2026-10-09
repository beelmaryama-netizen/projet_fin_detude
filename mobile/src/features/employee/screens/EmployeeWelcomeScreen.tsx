import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../../theme/tokens';
import { Action, Card, EmployeeLayout, Field, SectionTitle } from '../components/EmployeeUI';
import { useEmployeeStore } from '../hooks/useEmployeeStore';
import type { EmployeeScreenProps } from '../types/navigation';
import { screenStyles } from './screenHelpers';

export function EmployeeWelcomeScreen({ navigation }: EmployeeScreenProps<'Welcome'>) {
  const profile = useEmployeeStore((state) => state.profile);
  const completeOnboarding = useEmployeeStore((state) => state.completeOnboarding);
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const steps = [
    { icon: 'calendar-outline' as const, title: 'Consultez vos missions', text: 'Retrouvez les horaires, les adresses et les consignes.' },
    { icon: 'checkbox-outline' as const, title: 'Suivez votre checklist', text: 'Cochez les tâches et notez les difficultés sur place.' },
    { icon: 'document-text-outline' as const, title: 'Complétez votre rapport', text: 'Récapitulez votre intervention avant de la valider.' },
  ];
  function continueToMissions() {
    if (!profile) return;
    const nextErrors: Record<string, string> = {};
    if (!firstName.trim()) nextErrors.firstName = 'Indiquez votre prénom.';
    if (!lastName.trim()) nextErrors.lastName = 'Indiquez votre nom.';
    if (phone.trim() && (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) {
      nextErrors.phone = 'Indiquez un numéro de téléphone valide.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    completeOnboarding({ ...profile, firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });

  }
  return (
    <EmployeeLayout title={`Bienvenue${firstName.trim() ? `, ${firstName.trim()}` : ''}`} subtitle="Tout pour des interventions bien organisées.">
      <Card>
        <View style={styles.welcomeIcon}><Ionicons name="sparkles-outline" size={28} color={colors.primary} /></View>
        <SectionTitle eyebrow="VOTRE PREMIÈRE CONNEXION">Votre espace de travail</SectionTitle>
        <Text style={screenStyles.body}>Votre espace rassemble les missions qui vous sont attribuées, le suivi des tâches et vos rapports de fin d’intervention.</Text>
      </Card>
      <Card>
        <SectionTitle>Votre profil</SectionTitle>
        <Text style={screenStyles.caption}>Vérifiez vos informations avant de commencer. Le téléphone est facultatif.</Text>
        <Field label="Prénom" value={firstName} onChangeText={setFirstName} error={errors.firstName} placeholder="Votre prénom" />
        <Field label="Nom" value={lastName} onChangeText={setLastName} error={errors.lastName} placeholder="Votre nom" />
        <Field label="Adresse courriel" value={profile?.email ?? ''} onChangeText={() => {}} editable={false} keyboardType="email-address" />
        <Field label="Téléphone (facultatif)" value={phone} onChangeText={setPhone} error={errors.phone} placeholder="514 555-0123" keyboardType="phone-pad" />
      </Card>
      <Card>
        <SectionTitle>Votre parcours en 3 étapes</SectionTitle>
        {steps.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepIcon}><Ionicons name={step.icon} size={22} color={colors.primary} /></View>
            <View style={{ flex: 1, gap: 3 }}><Text style={styles.stepTitle}>{index + 1}. {step.title}</Text><Text style={screenStyles.caption}>{step.text}</Text></View>
          </View>
        ))}
      </Card>
      <Action title="Accéder à mes missions" onPress={continueToMissions} icon="arrow-forward" />
    </EmployeeLayout>
  );
}
const styles = StyleSheet.create({
  welcomeIcon: { alignSelf: 'flex-start', width: 52, height: 52, borderRadius: 16, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paleBlue },
  stepTitle: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: colors.ink },
});

