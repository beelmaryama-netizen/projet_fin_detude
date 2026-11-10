import { useState } from 'react';
import { Card } from '../../../components/Card';
import { ToggleRow } from '../../../components/ToggleRow';
import { FormField } from '../../../components/FormField';
import { Button } from '../../../components/Button';
export function ChecklistTask({ item, disabled, onSave }: { item: { id: string; label: string; isDone: boolean; note?: string }; disabled: boolean; onSave: (isDone: boolean, note: string) => void }) {
 const [note, setNote] = useState(item.note ?? '');
 return <Card><ToggleRow label={item.label} value={item.isDone} disabled={disabled} onChange={isDone => onSave(isDone, note)} /><FormField label={'Note : ' + item.label} value={note} onChangeText={setNote} editable={!disabled} multiline maxLength={500} /><Button title="Enregistrer la note" variant="secondary" disabled={disabled || note === (item.note ?? '')} onPress={() => onSave(item.isDone, note)} /></Card>;
}
