import type { PropsWithChildren } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { MessageBanner } from './MessageBanner';
import { spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/ThemeProvider';
import { errorMessage } from '../features/client/hooks/useClientData';
export function EmptyState({ title, description, action, onAction }: { title: string; description?: string; action?: string; onAction?: () => void }) {
  return <View style={{ gap: spacing.md, paddingVertical: spacing.lg }}><AppText variant="heading">{title}</AppText>{description && <AppText>{description}</AppText>}{action && onAction && <Button title={action} onPress={onAction} />}</View>;
}
export function LoadingState() {
  const { colors } = useAppTheme();
 return <View accessibilityLiveRegion="polite" style={{ gap: spacing.sm, padding: spacing.lg }}><ActivityIndicator color={colors.primary} /><AppText>Chargement…</AppText></View>; }
export function ErrorState({ error, retry }: { error: unknown; retry: () => void }) { return <View style={{ gap: spacing.md }}><MessageBanner message={errorMessage(error)} /><Button title="Réessayer" variant="secondary" onPress={retry} /></View>; }
export function AsyncState({ query, children }: PropsWithChildren<{ query: { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown } }>) {
  return query.isPending ? <LoadingState /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : <>{children}</>;
}
