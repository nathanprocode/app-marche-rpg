package expo.modules.permanentpedometer

import android.content.SharedPreferences
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max
import kotlin.math.min

/**
 * Pas en attente (mesurés par le service, pas encore pris en compte par l'app) et leur répartition par jour.
 *
 * En attente = dernier compteur - référence. Au changement de jour, on retient combien de ces pas datent
 * d'avant minuit (KEY_PENDING_BEFORE_TODAY) : l'app les ajoute au total, mais pas aux pas du jour.
 * Partagé par le service et le module : tout passe par les mêmes SharedPreferences.
 */
internal object PendingSteps {
  const val PREFS_NAME = "permanent_pedometer"
  const val KEY_STEP_COUNTER_BASELINE = "step_counter_baseline"
  const val KEY_LAST_COUNTER = "last_counter"
  const val KEY_BASE_STEPS_TODAY = "base_steps_today"
  const val KEY_PENDING_BEFORE_TODAY = "pending_before_today"
  /** Jour (AAAA-MM-JJ, heure locale) auquel se rapportent KEY_BASE_STEPS_TODAY et KEY_PENDING_BEFORE_TODAY. */
  const val KEY_DAY = "day"
  const val KEY_LAST_NOTIFICATION_BUCKET = "last_notification_bucket"

  fun todayKey(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

  fun pending(prefs: SharedPreferences): Double {
    if (!prefs.contains(KEY_LAST_COUNTER) || !prefs.contains(KEY_STEP_COUNTER_BASELINE)) {
      return 0.0
    }
    val last = prefs.getFloat(KEY_LAST_COUNTER, 0f).toDouble()
    val baseline = prefs.getFloat(KEY_STEP_COUNTER_BASELINE, 0f).toDouble()
    return max(0.0, last - baseline)
  }

  /**
   * Passe au jour courant si minuit est passé : tous les pas en attente datent alors d'hier.
   * Renvoie true si le jour a changé (la notification doit être rafraîchie).
   */
  fun rollOverDayIfNeeded(prefs: SharedPreferences): Boolean {
    val today = todayKey()
    val savedDay = prefs.getString(KEY_DAY, null)
    if (savedDay == today) {
      return false
    }

    val editor = prefs.edit().putString(KEY_DAY, today)
    // Première exécution de cette version : on ne sait pas de quel jour datent les pas, on les laisse à aujourd'hui.
    if (savedDay != null) {
      editor
        .putFloat(KEY_BASE_STEPS_TODAY, 0f)
        .putFloat(KEY_PENDING_BEFORE_TODAY, pending(prefs).toFloat())
        .remove(KEY_LAST_NOTIFICATION_BUCKET)
    }
    editor.apply()
    return savedDay != null
  }

  /** Pas en attente qui datent d'avant aujourd'hui. */
  fun beforeToday(prefs: SharedPreferences): Double {
    rollOverDayIfNeeded(prefs)
    return min(pending(prefs), prefs.getFloat(KEY_PENDING_BEFORE_TODAY, 0f).toDouble())
  }

  /** Pas du jour à afficher : ceux connus de l'app plus ceux en attente depuis minuit. */
  fun stepsToday(prefs: SharedPreferences): Double {
    val baseStepsToday = prefs.getFloat(KEY_BASE_STEPS_TODAY, 0f).toDouble()
    return max(0.0, baseStepsToday + pending(prefs) - beforeToday(prefs))
  }

  /** L'app a pris en compte `consumedSteps` pas : on avance la référence d'autant. */
  fun acknowledge(prefs: SharedPreferences, consumedSteps: Double) {
    if (!prefs.contains(KEY_STEP_COUNTER_BASELINE)) {
      return
    }
    val baseline = prefs.getFloat(KEY_STEP_COUNTER_BASELINE, 0f).toDouble()
    // Les pas confirmés partent d'abord dans ceux d'avant minuit, les plus anciens.
    val before = prefs.getFloat(KEY_PENDING_BEFORE_TODAY, 0f).toDouble()
    prefs.edit()
      .putFloat(KEY_STEP_COUNTER_BASELINE, (baseline + consumedSteps).toFloat())
      .putFloat(KEY_PENDING_BEFORE_TODAY, max(0.0, before - consumedSteps).toFloat())
      .apply()
  }
}
