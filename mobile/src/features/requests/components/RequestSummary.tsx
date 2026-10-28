import { Image, View } from 'react-native';
import { Card } from '../../../components/Card';
import { AppText } from '../../../components/AppText';
import { radii, spacing } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { categoryTitle } from '../data/requestCategories';
import { addressLabel, dateLabel, propertyLabels, slotLabels } from '../../client/services/clientFormatters';
import type { ClientAddress } from '../../client/types/client';
import type { RequestDetails, RequestPhoto, SchedulePreferences } from '../types/request';
export function RequestSummary({ details, photos, schedule, address }: { details: RequestDetails; photos: RequestPhoto[]; schedule: SchedulePreferences; address: ClientAddress | null }) {
  const { colors } = useAppTheme();

  const residential = details.category === 'RESIDENTIAL' ? details.residential : undefined;
  const business = details.category !== 'RESIDENTIAL' ? details.business : undefined;
  return <>
    {residential && <Card><AppText variant="heading">{categoryTitle(details.category)}</AppText><AppText>{propertyLabels[residential.propertyType]}</AppText>
      <AppText>{residential.bedrooms} chambre(s) · {residential.bathrooms} salle(s) de bain · {residential.floors} étage(s)</AppText>
      <AppText>Superficie : {residential.areaSqft} pi²</AppText><AppText>Animaux : {residential.hasPets ? 'Oui' : 'Non'}</AppText><AppText>{residential.description || 'Aucune description supplémentaire.'}</AppText>
    </Card>}
    {business && <Card><AppText variant="heading">{categoryTitle(details.category)} · {business.establishmentType}</AppText>
      <AppText>{business.companyName}</AppText><AppText>{business.siteAddress}</AppText><AppText>{business.areaSqft} pi² · {business.floors} étage(s)</AppText>
      <AppText variant="label">Zones concernées</AppText><AppText>{business.zones.join(", ")}</AppText>
      <AppText variant="label">Service et fréquence</AppText><AppText>{business.description}</AppText><AppText>{business.frequency}{business.frequency === "Personnalisé" ? ` : ${business.customFrequency}` : ""}</AppText><AppText>{business.preferredHours || "Horaires à préciser"}</AppText>
      <AppText variant="label">Contraintes et sécurité</AppText>
      <AppText>Équipements : {business.equipment || "Aucune exigence précisée"}</AppText><AppText>Zones restreintes : {business.restrictedAreas || "Aucune précision"}</AppText><AppText>Produits : {business.allowedProducts || "À préciser"}</AppText><AppText>{business.constraints || "Aucune autre contrainte précisée"}</AppText>
    </Card>}
    {details.category !== "RESIDENTIAL" && <Card><AppText variant="heading">Documents</AppText>{details.documents.length ? details.documents.map(document => <AppText key={document.id}>{document.name} · PDF · {(document.size / 1024 / 1024).toFixed(2)} Mo</AppText>) : <AppText>Aucun document ajouté.</AppText>}</Card>}
    <Card><AppText variant="heading">Photos avant</AppText>{photos.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{photos.map((photo, index) => <Image key={photo.id} source={{ uri: photo.uri }} accessibilityLabel={`Photo du site ${index + 1}`} style={{ width: 112, height: 112, borderRadius: radii.control, backgroundColor: colors.border }} />)}</View> : <AppText>Aucune photo ajoutée.</AppText>}</Card>
    <Card><AppText variant="heading">Disponibilités souhaitées</AppText>{schedule.availabilities.map((item, index) => <AppText key={index}>{dateLabel(item.date)} · {item.slot ? slotLabels[item.slot] : 'À préciser'}</AppText>)}<AppText variant="caption">Ces préférences ne confirment pas un rendez-vous.</AppText></Card>
    <Card><AppText variant="heading">Adresse et instructions</AppText><AppText>{business?.siteAddress ?? addressLabel(address)}</AppText><AppText>{schedule.instructions || 'Aucune instruction particulière.'}</AppText><AppText>{schedule.accessNotes || address?.accessNotes || 'Aucune note d’accès.'}</AppText></Card>
  </>;
}
