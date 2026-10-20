import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { AdminWorkspace } from './AdminWorkspace';
import { AdminBadge, AdminButton, AdminCard, AdminSectionTitle, AdminTextField, adminStyles, formatAdminDateTime, formatCad } from '../components/AdminUI';
import { employerTheme as theme } from '../theme';
import { useAdminStore } from '../store/adminStore';
import type { AdminEmployeeStatus, AdminStackParamList } from '../types/admin';

export function EmployeesScreen({ navigation }: NativeStackScreenProps<AdminStackParamList, 'Employees'>) {
  const employees = useAdminStore(state => state.employees);
  const missions = useAdminStore(state => state.missions);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<AdminEmployeeStatus | 'ALL'>('ALL');

  const visible = employees.filter(employee => {
    const haystack = [employee.firstName, employee.lastName, employee.email, employee.city].join(' ').toLowerCase();
    return (status === 'ALL' || employee.status === status) && haystack.includes(query.toLowerCase());
  });

  return <AdminWorkspace title="Employés" subtitle="Recherchez, créez et suivez les membres de l’équipe." onBack={() => navigation.goBack()}>
    <AdminBadge label="ÉCRAN 56" />
    <AdminTextField label="Rechercher" placeholder="Nom, courriel ou ville" value={query} onChangeText={setQuery} />
    <View style={styles.filters}>
      {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map(item => <Pressable key={item} onPress={() => setStatus(item)} style={[styles.filter, status === item && styles.filterActive]}>
        <AppText style={[styles.filterText, status === item && styles.filterTextActive]}>{item === 'ALL' ? 'Tous' : item === 'ACTIVE' ? 'Actifs' : 'Suspendus'}</AppText>
      </Pressable>)}
    </View>
    <AdminButton title="Créer un compte employé" icon="person-add-outline" onPress={() => navigation.navigate('CreateEmployee')} />
    {visible.map(employee => {
      const count = missions.filter(mission => mission.employeeIds.includes(employee.id)).length;
      return <Pressable key={employee.id} onPress={() => navigation.navigate('EmployeeDetail', { employeeId: employee.id })}>
        <AdminCard>
          <View style={styles.cardHead}>
            <View style={styles.avatar}><AppText style={styles.avatarText}>{employee.firstName[0]}{employee.lastName[0]}</AppText></View>
            <View style={styles.copy}>
              <AppText style={styles.title}>{employee.firstName} {employee.lastName}</AppText>
              <AppText style={adminStyles.muted}>{employee.email} · {employee.city}</AppText>
            </View>
            <AdminBadge label={employee.status === 'ACTIVE' ? 'Actif' : 'Suspendu'} tone={employee.status === 'ACTIVE' ? 'green' : 'red'} />
          </View>
          <AppText style={adminStyles.muted}>{employee.specialties.join(' · ')}</AppText>
          <AppText style={adminStyles.muted}>{count} mission(s) associée(s)</AppText>
        </AdminCard>
      </Pressable>;
    })}
    {!visible.length && <AdminCard><AppText style={adminStyles.text}>Aucun employé ne correspond à ces critères.</AppText></AdminCard>}
  </AdminWorkspace>;
}

export function CreateEmployeeScreen({ navigation }: NativeStackScreenProps<AdminStackParamList, 'CreateEmployee'>) {
  const createEmployee = useAdminStore(state => state.createEmployee);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Montréal');
  const [specialties, setSpecialties] = useState('Résidentiel, Commercial');
  const [availability, setAvailability] = useState('Lun–Ven · 8 h à 17 h');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit() {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = 'Le prénom est requis.';
    if (!lastName.trim()) next.lastName = 'Le nom est requis.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Entrez un courriel valide.';
    if (!phone.trim()) next.phone = 'Le téléphone est requis.';
    if (!city.trim()) next.city = 'La ville est requise.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const result = createEmployee({
      firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(),
      phone: phone.trim(), city: city.trim(),
      specialties: specialties.split(',').map(item => item.trim()).filter(Boolean),
      availability: availability.trim(),
    });
    if (!result.ok) {
      setErrors({ email: result.message ?? 'Création impossible.' });
      return;
    }
    if (result.id) navigation.replace('EmployeeDetail', { employeeId: result.id });
  }

  return <AdminWorkspace title="Créer un compte employé" subtitle="Création locale de démonstration — aucune invitation réelle n’est envoyée." onBack={() => navigation.goBack()}>
    <AdminBadge label="ÉCRAN 57" />
    <AdminCard>
      <AdminSectionTitle>Informations personnelles</AdminSectionTitle>
      <View style={styles.twoCols}>
        <View style={styles.field}><AdminTextField label="Prénom" value={firstName} onChangeText={setFirstName} error={errors.firstName} /></View>
        <View style={styles.field}><AdminTextField label="Nom" value={lastName} onChangeText={setLastName} error={errors.lastName} /></View>
      </View>
      <AdminTextField label="Courriel" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
      <AdminTextField label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
      <AdminTextField label="Ville" value={city} onChangeText={setCity} error={errors.city} />
      <AdminTextField label="Spécialités (séparées par des virgules)" value={specialties} onChangeText={setSpecialties} />
      <AdminTextField label="Disponibilités" value={availability} onChangeText={setAvailability} />
    </AdminCard>
    <AdminCard>
      <AdminSectionTitle>Limite de démonstration</AdminSectionTitle>
      <AppText style={adminStyles.muted}>Le compte est ajouté au store local seulement. L’invitation, l’activation et l’envoi d’un courriel devront être raccordés au backend.</AppText>
    </AdminCard>
    <AdminButton title="Créer l’employé" icon="person-add-outline" onPress={submit} />
  </AdminWorkspace>;
}

export function EmployeeDetailScreen({ navigation, route }: NativeStackScreenProps<AdminStackParamList, 'EmployeeDetail'>) {
  const employee = useAdminStore(state => state.employees.find(item => item.id === route.params.employeeId));
  const missions = useAdminStore(state => state.missions.filter(mission => mission.employeeIds.includes(route.params.employeeId)));
  const updateEmployee = useAdminStore(state => state.updateEmployee);
  const toggleStatus = useAdminStore(state => state.toggleEmployeeStatus);
  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [city, setCity] = useState(employee?.city ?? '');
  const [availability, setAvailability] = useState(employee?.availability ?? '');
  if (!employee) return <AdminWorkspace title="Employé introuvable" onBack={() => navigation.goBack()}><AdminCard><AppText style={adminStyles.text}>Cet employé n’existe plus.</AppText></AdminCard></AdminWorkspace>;

  function confirmStatus() {
    Alert.alert(employee.status === 'ACTIVE' ? 'Suspendre cet employé ?' : 'Réactiver cet employé ?', 'Les missions et l’historique restent conservés.', [
      { text: 'Annuler', style: 'cancel' },
      { text: employee.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver', style: employee.status === 'ACTIVE' ? 'destructive' : 'default', onPress: () => toggleStatus(employee.id) },
    ]);
  }

  return <AdminWorkspace title="Détail employé" subtitle="Coordonnées, statut, disponibilités et historique." onBack={() => navigation.goBack()}>
    <AdminBadge label="ÉCRAN 58" />
    <AdminCard>
      <View style={styles.cardHead}>
        <View style={styles.avatarLarge}><AppText style={styles.avatarTextLarge}>{employee.firstName[0]}{employee.lastName[0]}</AppText></View>
        <View style={styles.copy}>
          <AppText style={styles.bigTitle}>{employee.firstName} {employee.lastName}</AppText>
          <AppText style={adminStyles.muted}>{employee.email}</AppText>
        </View>
        <AdminBadge label={employee.status === 'ACTIVE' ? 'Actif' : 'Suspendu'} tone={employee.status === 'ACTIVE' ? 'green' : 'red'} />
      </View>
      <AppText style={adminStyles.text}>Spécialités : {employee.specialties.join(', ') || 'Aucune'}</AppText>
    </AdminCard>
    <AdminCard>
      <AdminSectionTitle>Informations modifiables</AdminSectionTitle>
      <AdminTextField label="Téléphone" value={phone} onChangeText={setPhone} />
      <AdminTextField label="Ville" value={city} onChangeText={setCity} />
      <AdminTextField label="Disponibilités" value={availability} onChangeText={setAvailability} />
      <AdminButton title="Enregistrer les modifications" icon="save-outline" onPress={() => updateEmployee(employee.id, { phone: phone.trim(), city: city.trim(), availability: availability.trim() })} />
    </AdminCard>
    <AdminCard>
      <AdminSectionTitle>Missions affectées</AdminSectionTitle>
      {missions.map(mission => <Pressable key={mission.id} onPress={() => navigation.navigate('MissionDetail', { missionId: mission.id })} style={styles.missionRow}>
        <View style={styles.copy}><AppText style={adminStyles.text}>{mission.reference} · {mission.serviceName}</AppText><AppText style={adminStyles.muted}>{formatAdminDateTime(mission.startAt)}</AppText></View>
        <Ionicons name="chevron-forward" size={20} color={theme.blue} />
      </Pressable>)}
      {!missions.length && <AppText style={adminStyles.muted}>Aucune mission associée pour le moment.</AppText>}
    </AdminCard>
    <AdminButton title={employee.status === 'ACTIVE' ? 'Suspendre l’employé' : 'Réactiver l’employé'} variant={employee.status === 'ACTIVE' ? 'danger' : 'secondary'} onPress={confirmStatus} />
  </AdminWorkspace>;
}

export function ClientsScreen({ navigation }: NativeStackScreenProps<AdminStackParamList, 'Clients'>) {
  const clients = useAdminStore(state => state.clients);
  const offers = useAdminStore(state => state.offers);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'ALL' | 'RESIDENTIAL' | 'BUSINESS'>('ALL');

  const visible = useMemo(() => clients.filter(client => {
    const haystack = [client.name, client.email, client.phone, client.address].join(' ').toLowerCase();
    return (kind === 'ALL' || client.kind === kind) && haystack.includes(query.toLowerCase());
  }), [clients, kind, query]);

  return <AdminWorkspace title="Clients" subtitle="Retrouvez rapidement les particuliers et les entreprises." onBack={() => navigation.goBack()}>
    <AdminBadge label="ÉCRAN 59" />
    <AdminTextField label="Rechercher" placeholder="Nom, courriel, téléphone ou adresse" value={query} onChangeText={setQuery} />
    <View style={styles.filters}>
      {(['ALL', 'RESIDENTIAL', 'BUSINESS'] as const).map(item => <Pressable key={item} onPress={() => setKind(item)} style={[styles.filter, kind === item && styles.filterActive]}>
        <AppText style={[styles.filterText, kind === item && styles.filterTextActive]}>{item === 'ALL' ? 'Tous' : item === 'RESIDENTIAL' ? 'Résidentiels' : 'Entreprises'}</AppText>
      </Pressable>)}
    </View>
    {visible.map(client => {
      const count = offers.filter(offer => offer.clientId === client.id).length;
      return <Pressable key={client.id} onPress={() => navigation.navigate('ClientDetail', { clientId: client.id })}>
        <AdminCard>
          <View style={styles.cardHead}>
            <View style={styles.clientIcon}><Ionicons name={client.kind === 'BUSINESS' ? 'business-outline' : 'home-outline'} size={22} color={theme.blue} /></View>
            <View style={styles.copy}><AppText style={styles.title}>{client.name}</AppText><AppText style={adminStyles.muted}>{client.email}</AppText></View>
            <AdminBadge label={client.kind === 'BUSINESS' ? 'Entreprise' : 'Résidentiel'} />
          </View>
          <AppText style={adminStyles.muted}>{client.phone}</AppText>
          <AppText style={adminStyles.muted}>{client.address}</AppText>
          <AppText style={adminStyles.muted}>{count} offre(s) associée(s)</AppText>
        </AdminCard>
      </Pressable>;
    })}
  </AdminWorkspace>;
}

export function ClientDetailScreen({ navigation, route }: NativeStackScreenProps<AdminStackParamList, 'ClientDetail'>) {
  const client = useAdminStore(state => state.clients.find(item => item.id === route.params.clientId));
  const offers = useAdminStore(state => state.offers.filter(item => item.clientId === route.params.clientId));
  const missions = useAdminStore(state => state.missions.filter(item => item.clientId === route.params.clientId));
  if (!client) return <AdminWorkspace title="Client introuvable" onBack={() => navigation.goBack()}><AdminCard><AppText style={adminStyles.text}>Ce client n’existe plus.</AppText></AdminCard></AdminWorkspace>;

  return <AdminWorkspace title="Détail client" subtitle="Identité, dossiers, offres et missions." onBack={() => navigation.goBack()}>
    <AdminBadge label="ÉCRAN 60" />
    <AdminCard>
      <AppText style={styles.bigTitle}>{client.name}</AppText>
      <AppText style={adminStyles.text}>{client.email}</AppText>
      <AppText style={adminStyles.text}>{client.phone}</AppText>
      <AppText style={adminStyles.muted}>{client.address}</AppText>
      <View style={styles.actions}>
        <View style={styles.action}><AdminButton title="Appeler" icon="call-outline" variant="secondary" onPress={() => Alert.alert('Contact', 'Aucun appel automatique n’est lancé dans la démonstration.')} /></View>
        <View style={styles.action}><AdminButton title="Écrire" icon="mail-outline" variant="secondary" onPress={() => Alert.alert('Contact', 'Aucun message automatique n’est envoyé dans la démonstration.')} /></View>
      </View>
    </AdminCard>
    <AdminCard>
      <AdminSectionTitle>Offres associées</AdminSectionTitle>
      {offers.map(offer => <Pressable key={offer.id} onPress={() => navigation.navigate('OfferPreview', { offerId: offer.id })} style={styles.missionRow}>
        <View style={styles.copy}><AppText style={adminStyles.text}>{offer.reference} · {formatCad(offer.totalCents)}</AppText><AppText style={adminStyles.muted}>{offer.serviceName}</AppText></View>
        <Ionicons name="chevron-forward" size={20} color={theme.blue} />
      </Pressable>)}
      {!offers.length && <AppText style={adminStyles.muted}>Aucune offre associée.</AppText>}
    </AdminCard>
    <AdminCard>
      <AdminSectionTitle>Missions et historique</AdminSectionTitle>
      {missions.map(mission => <Pressable key={mission.id} onPress={() => navigation.navigate('MissionDetail', { missionId: mission.id })} style={styles.missionRow}>
        <View style={styles.copy}><AppText style={adminStyles.text}>{mission.reference} · {mission.serviceName}</AppText><AppText style={adminStyles.muted}>{formatAdminDateTime(mission.startAt)}</AppText></View>
        <Ionicons name="chevron-forward" size={20} color={theme.blue} />
      </Pressable>)}
      {!missions.length && <AppText style={adminStyles.muted}>Aucune mission associée.</AppText>}
    </AdminCard>
  </AdminWorkspace>;
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  filterActive: { backgroundColor: '#275A9D', borderColor: theme.blue },
  filterText: { color: theme.muted, fontSize: 12 },
  filterTextActive: { color: theme.text },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#275A9D', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.text, fontFamily: fonts.bold },
  avatarLarge: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#275A9D', alignItems: 'center', justifyContent: 'center' },
  avatarTextLarge: { color: theme.text, fontFamily: fonts.titleBold, fontSize: 18 },
  clientIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#173E72', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 150, gap: 3 },
  title: { color: theme.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 23 },
  bigTitle: { color: theme.text, fontFamily: fonts.titleBold, fontSize: 22, lineHeight: 30 },
  twoCols: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  field: { flexGrow: 1, flexBasis: '44%', minWidth: 130 },
  missionRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: theme.border, paddingVertical: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { flexGrow: 1, flexBasis: '44%', minWidth: 130 },
});
