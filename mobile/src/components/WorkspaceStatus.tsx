import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { useLocalStatus } from '../store/localStatusStore';
import { saveWorkspace } from '../services/localWorkspace';
import { MessageBanner } from './MessageBanner';
import { Button } from './Button';
export function WorkspaceStatus() {
 const state = useLocalStatus();
 useEffect(() => {
  const update = (network: Network.NetworkState) => useLocalStatus.setState({ offline: network.isConnected === false || network.isInternetReachable === false });
  void Network.getNetworkStateAsync().then(update).catch(() => undefined);
  const subscription = Network.addNetworkStateListener(update); return () => subscription.remove();
 }, []);
 if (!state.offline && !state.error) return null;
 return <SafeAreaView edges={['top']} style={{ paddingHorizontal: 16, paddingTop: 8 }}>
 <MessageBanner tone={state.error ? 'error' : 'info'} message={state.error ?? ('Connexion perdue. Vous pouvez continuer en mode local sur cet appareil.' + (state.lastSaved ? ' Dernière sauvegarde : ' + new Date(state.lastSaved).toLocaleTimeString('fr-CA') + '.' : ''))} />
 <Button title="Réessayer" variant="link" onPress={() => { void Network.getNetworkStateAsync().then(n => useLocalStatus.setState({ offline: n.isConnected === false || n.isInternetReachable === false })).catch(() => undefined); void saveWorkspace(); }} />
 </SafeAreaView>;
}
