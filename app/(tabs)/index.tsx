import { Redirect } from 'expo-router';

export default function IndexRedirect() {
  // Redirect the hidden Quest tab (index) to Play
  return <Redirect href="/(tabs)/play" />;
}
