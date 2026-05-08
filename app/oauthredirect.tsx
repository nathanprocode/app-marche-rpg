import { Redirect, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirectRoute() {
  const params = useLocalSearchParams();

  return (
    <Redirect
      href={{
        pathname: "/login",
        params,
      }}
    />
  );
}
