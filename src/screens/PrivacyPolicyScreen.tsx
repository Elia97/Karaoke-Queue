import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, textStyles, layout, radius } from "../theme";

export function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Informativa sulla Privacy</Text>
          <Text style={styles.lastUpdated}>
            Ultimo aggiornamento: 30 gennaio 2026
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduzione</Text>
            <Text style={styles.text}>
              Questa Informativa sulla Privacy descrive come vengono gestiti i
              dati personali all'interno dell'applicazione "Karaoke Queue" (l'
              "App"), disponibile come applicazione Android e versione Web.
              L'App è sviluppata e gestita da Elia Zarantonello ("lo
              Sviluppatore").
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Raccolta dei Dati</Text>
            <Text style={styles.text}>
              Ad oggi, Karaoke Queue è un'applicazione in fase di test che non
              richiede la creazione di un account permanente.
            </Text>
            <Text style={styles.bullet}>
              • Nickname: Viene richiesto un nickname temporaneo per
              identificare l'utente all'interno della sessione di karaoke.
              Questo nome non è collegato a un'identità reale.
            </Text>
            <Text style={styles.bullet}>
              • Dati Tecnici: Potrebbero essere raccolti dati tecnici minimi
              necessari per la connessione socket (ad esempio l'indirizzo IP
              temporaneo per la durata della sessione) per permettere il
              funzionamento in tempo reale delle code.
            </Text>
            <Text style={styles.text}>
              Non raccogliamo email, numeri di telefono o dati di localizzazione
              precisa.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Servizi di Terze Parti</Text>
            <Text style={styles.text}>
              L'App è sviluppata utilizzando il framework Expo. Expo e i servizi
              ad esso collegati (come i servizi di aggiornamento OTA) potrebbero
              raccogliere dati tecnici in conformità con la loro Informativa
              sulla Privacy. L'App non utilizza tracker pubblicitari di terze
              parti.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Conservazione dei Dati</Text>
            <Text style={styles.text}>
              I dati delle sessioni (nickname e coda canzoni) sono temporanei e
              vengono eliminati o resi inattivi al termine della sessione
              stessa. Non conserviamo archivi storici delle attività degli
              utenti oltre quanto necessario per il corretto funzionamento
              tecnico immediato dell'App.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Validità Cross-Platform</Text>
            <Text style={styles.text}>
              Questa policy si applica integralmente sia all'utilizzo
              dell'applicazione mobile (Android) sia alla versione web dell'App.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Contatti</Text>
            <Text style={styles.text}>
              Per qualsiasi domanda o richiesta relativa a questa Informativa
              sulla Privacy, puoi contattare lo sviluppatore all'indirizzo:
            </Text>
            <Text style={styles.email}>elia.zarantonello97@gmail.com</Text>
          </View>

          {Platform.OS !== "web" && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Torna all'App</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: layout.maxWidth,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.xl,
  },
  title: {
    ...textStyles.headingLg,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  lastUpdated: {
    ...textStyles.bodySm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    fontStyle: "italic",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.headingMd,
    color: colors.primaryLight,
    marginBottom: spacing.sm,
  },
  text: {
    ...textStyles.bodyMd,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  bullet: {
    ...textStyles.bodyMd,
    color: colors.textSecondary,
    lineHeight: 24,
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  email: {
    ...textStyles.bodyMd,
    color: colors.primaryLight,
    fontWeight: "bold",
    marginTop: spacing.xs,
  },
  backButton: {
    marginTop: spacing["2xl"],
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  backButtonText: {
    ...textStyles.bodyMd,
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
