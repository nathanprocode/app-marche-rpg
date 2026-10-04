import { useState } from "react";
import { Share, StyleSheet, Text, TextInput, View } from "react-native";
import { formatDecimal } from "../../core/format";
import { theme } from "../../core/theme";
import { BERSERK_CHECKPOINTS } from "../../data/map/berserk-checkpoints";
import { formatGroupCode, freshnessLabel, rankMembers, type BandMember } from "../../features/social/band";
import { useAuthStore } from "../../store/useAuthStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useSocialStore, type BandError } from "../../store/useSocialStore";
import { Button } from "../components/Button";
import { InkCard } from "../components/InkCard";
import { Screen } from "../components/Screen";

const ERROR_TEXT: Record<BandError, string> = {
  "invalid-code": "Ce code n'est pas valide. Il ressemble à FAUCON-K7M2QX.",
  "unknown-band": "Aucune bande ne porte ce code. Vérifie-le avec ton ami.",
  network: "Impossible de joindre la Bande. Vérifie ta connexion et réessaie.",
};

/** Dernier point franchi à cette distance. */
function reachedTitle(km: number): string {
  const reached = BERSERK_CHECKPOINTS.filter((checkpoint) => checkpoint.kmThreshold <= km + 0.0001);
  return (reached[reached.length - 1] ?? BERSERK_CHECKPOINTS[0]).title;
}

export function BandScreen() {
  const code = useSocialStore((state) => state.code);
  const members = useSocialStore((state) => state.members);
  const isLoading = useSocialStore((state) => state.isLoading);
  const isBusy = useSocialStore((state) => state.isBusy);
  const error = useSocialStore((state) => state.error);
  const { createBand, joinBand, leaveBand } = useSocialStore.getState();
  const [input, setInput] = useState("");
  const userId = useAuthStore((state) => state.userId);
  const userName = useAuthStore((state) => state.userName);
  const progress = usePlayerStore((state) => state.progress);

  // Ta ligne vient de ce téléphone, pas du cloud : elle est toujours à jour.
  const me: BandMember | undefined = userId
    ? {
        uid: userId,
        displayName: userName ?? "Traqué",
        lap: progress.lap,
        totalDistanceKm: progress.totalDistanceKm,
        streakDays: progress.streakDays,
        updatedAtISO: new Date().toISOString(),
      }
    : undefined;

  return (
    <Screen scroll>
      <Text style={styles.label}>Bande</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {code ? "Ta bande" : "Marcher à plusieurs"}
      </Text>

      {code ? (
        <BandView
          code={code}
          ranking={rankMembers(members, me)}
          myId={userId}
          isLoading={isLoading}
          isBusy={isBusy}
          onLeave={() => void leaveBand()}
        />
      ) : (
        <View style={styles.block}>
          <Text style={styles.body}>
            Une bande, c'est tes amis sur la même carte : tu vois jusqu'où chacun est arrivé, et eux te voient. Seuls ton
            nom, ta distance, ton tour et ta série sont partagés.
          </Text>
          <Button label="Créer une bande" onPress={() => void createBand()} loading={isBusy} />
          <InkCard style={styles.joinCard}>
            <Text style={styles.bodyStrong}>Rejoindre une bande</Text>
            <Text style={styles.small}>Demande le code à l'ami qui l'a créée.</Text>
            <TextInput
              accessibilityLabel="Code de la bande"
              value={input}
              onChangeText={setInput}
              placeholder="FAUCON-XXXXXX"
              placeholderTextColor={theme.colors.iron}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />
            <Button label="Rejoindre" variant="secondary" onPress={() => void joinBand(input)} disabled={isBusy || !input.trim()} />
          </InkCard>
        </View>
      )}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {ERROR_TEXT[error]}
        </Text>
      ) : null}
    </Screen>
  );
}

type BandViewProps = {
  code: string;
  ranking: BandMember[];
  myId: string | null;
  isLoading: boolean;
  isBusy: boolean;
  onLeave: () => void;
};

function BandView({ code, ranking, myId, isLoading, isBusy, onLeave }: BandViewProps) {
  const now = new Date();
  const shownCode = formatGroupCode(code);

  function share(): void {
    Share.share({ message: `Rejoins ma bande dans Marche du Faucon ! Code : ${shownCode}` }).catch((error) =>
      console.log("[Band] share unavailable", error),
    );
  }

  return (
    <View style={styles.block}>
      <InkCard style={styles.codeCard}>
        <Text style={styles.label}>Code à donner à tes amis</Text>
        <Text selectable {...theme.fitDisplayText} style={styles.code}>
          {shownCode}
        </Text>
        <Button label="Envoyer le code" variant="secondary" onPress={share} />
      </InkCard>

      <Text accessibilityRole="header" style={styles.label}>
        Classement
      </Text>
      {isLoading && ranking.length <= 1 ? <Text style={styles.small}>Chargement de la bande…</Text> : null}
      {ranking.map((member, index) => {
        const isMe = member.uid === myId;
        const detail = `${reachedTitle(member.totalDistanceKm)} · série ${member.streakDays} ${member.streakDays > 1 ? "jours" : "jour"}`;
        const lapText = member.lap > 1 ? `Tour ${member.lap} · ` : "";
        return (
          <InkCard
            key={member.uid}
            accessible
            accessibilityLabel={`${index + 1}. ${member.displayName}${isMe ? " (toi)" : ""}, ${lapText}${formatDecimal(member.totalDistanceKm)} kilomètres. ${detail}`}
            style={[styles.memberCard, isMe && styles.me]}
          >
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={styles.memberText}>
              <Text numberOfLines={1} style={styles.bodyStrong}>
                {isMe ? `${member.displayName} (toi)` : member.displayName}
              </Text>
              <Text style={styles.small}>{detail}</Text>
              {isMe ? null : <Text style={styles.small}>{`Vu ${freshnessLabel(member.updatedAtISO, now)}`}</Text>}
            </View>
            <View style={styles.km}>
              <Text {...theme.fitDisplayText} style={styles.kmValue}>{`${formatDecimal(member.totalDistanceKm)} km`}</Text>
              {member.lap > 1 ? <Text style={styles.small}>{`tour ${member.lap}`}</Text> : null}
            </View>
          </InkCard>
        );
      })}
      {ranking.length <= 1 && !isLoading ? (
        <Text style={styles.small}>Tu es seul pour l'instant : envoie le code à tes amis pour qu'ils te rejoignent.</Text>
      ) : null}
      <Text style={styles.small}>
        La position des amis se met à jour quand ils ouvrent l'app ou marchent avec elle ouverte : elle peut avoir un peu de retard.
      </Text>

      <View style={styles.leave}>
        <Button label="Quitter la bande" variant="danger" onPress={onLeave} loading={isBusy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...theme.text.label, color: theme.colors.boneDim },
  title: { ...theme.text.displayL, color: theme.colors.bone },
  block: { marginTop: theme.space[16], gap: theme.space[16] },
  body: { ...theme.text.body, color: theme.colors.boneDim },
  bodyStrong: { ...theme.text.bodyStrong, color: theme.colors.bone },
  small: { ...theme.text.small, color: theme.colors.boneDim },
  error: { ...theme.text.body, color: theme.colors.bloodEmber, marginTop: theme.space[16] },
  joinCard: { gap: theme.space[8] },
  input: {
    ...theme.text.bodyStrong,
    minHeight: 48,
    paddingHorizontal: theme.space[16],
    color: theme.colors.bone,
    borderWidth: 1,
    borderColor: theme.colors.iron,
    borderRadius: theme.radius[4],
  },
  codeCard: { gap: theme.space[8] },
  code: { ...theme.text.displayM, color: theme.colors.bone },
  memberCard: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  me: { borderColor: theme.colors.bloodGlow },
  rank: { ...theme.text.displayM, color: theme.colors.boneDim, width: 28, textAlign: "center" },
  memberText: { flex: 1 },
  km: { alignItems: "flex-end", maxWidth: 110 },
  kmValue: { ...theme.text.displayS, color: theme.colors.bone },
  leave: { marginTop: theme.space[16] },
});
