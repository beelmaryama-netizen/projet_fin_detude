import { Card } from '../../../components/Card';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { StatusChip } from '../../../components/StatusChip';
import type { EmployeeMission } from '../types/employee';
import { missionDate, missionTime, missionLabels } from '../services/employeeFormatters';
export function MissionCard({ mission, onPress, actionLabel = "Voir la mission" }: { mission: EmployeeMission; onPress: () => void; actionLabel?: string }) {
  return <Card><StatusChip label={missionLabels[mission.status]} tone={mission.status === 'COMPLETED' ? 'success' : 'info'} />
    <AppText variant="heading">{mission.title}</AppText><AppText>{missionDate(mission.startAt)} · {missionTime(mission.startAt)} – {missionTime(mission.endAt)}</AppText>
    <AppText>{mission.address}</AppText><Button title={actionLabel} variant="secondary" onPress={onPress} />
  </Card>;
}
