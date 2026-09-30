package expo.modules.permanentpedometer

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PermanentPedometerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PermanentPedometer")

    Function("startTracking") { title: String, text: String, baseTotalSteps: Double, baseStepsToday: Double, metersPerStep: Double ->
      try {
        val context = requireContext()
        val intent = Intent(context, PermanentPedometerService::class.java).apply {
          putExtra(PermanentPedometerService.EXTRA_TITLE, title)
          putExtra(PermanentPedometerService.EXTRA_TEXT, text)
          putExtra(PermanentPedometerService.EXTRA_BASE_TOTAL_STEPS, baseTotalSteps)
          putExtra(PermanentPedometerService.EXTRA_BASE_STEPS_TODAY, baseStepsToday)
          putExtra(PermanentPedometerService.EXTRA_METERS_PER_STEP, metersPerStep)
        }

        ContextCompat.startForegroundService(context, intent)
        Log.i(LOG_TAG, "startTracking requested")
        true
      } catch (error: Exception) {
        Log.e(LOG_TAG, "startTracking failed", error)
        error.printStackTrace()
        false
      }
    }

    Function("stopTracking") {
      try {
        val context = requireContext()
        context.stopService(Intent(context, PermanentPedometerService::class.java))
        Log.i(LOG_TAG, "stopTracking requested")
        true
      } catch (error: Exception) {
        Log.e(LOG_TAG, "stopTracking failed", error)
        error.printStackTrace()
        false
      }
    }

    Function("updateNotification") { title: String, text: String, baseTotalSteps: Double, baseStepsToday: Double, metersPerStep: Double ->
      try {
        val context = requireContext()
        val intent = Intent(context, PermanentPedometerService::class.java).apply {
          action = PermanentPedometerService.ACTION_UPDATE_NOTIFICATION
          putExtra(PermanentPedometerService.EXTRA_TITLE, title)
          putExtra(PermanentPedometerService.EXTRA_TEXT, text)
          putExtra(PermanentPedometerService.EXTRA_BASE_TOTAL_STEPS, baseTotalSteps)
          putExtra(PermanentPedometerService.EXTRA_BASE_STEPS_TODAY, baseStepsToday)
          putExtra(PermanentPedometerService.EXTRA_METERS_PER_STEP, metersPerStep)
        }

        context.startService(intent)
        Log.i(LOG_TAG, "updateNotification requested")
        true
      } catch (error: Exception) {
        Log.e(LOG_TAG, "updateNotification failed", error)
        error.printStackTrace()
        false
      }
    }

    Function("getSteps") {
      val prefs = requireContext().getSharedPreferences(
        PermanentPedometerService.PREFS_NAME,
        Context.MODE_PRIVATE
      )

      prefs.getFloat(PermanentPedometerService.KEY_SAVED_STEPS, 0f).toDouble()
    }

    Function("getDailySteps") {
      val prefs = requireContext().getSharedPreferences(
        PermanentPedometerService.PREFS_NAME,
        Context.MODE_PRIVATE
      )

      prefs.getString(PermanentPedometerService.KEY_DAILY_STEPS, "{}") ?: "{}"
    }

    Function("acknowledgeSteps") {
      val prefs = requireContext().getSharedPreferences(
        PermanentPedometerService.PREFS_NAME,
        Context.MODE_PRIVATE
      )
      val lastCounter = prefs.getFloat(PermanentPedometerService.KEY_LAST_COUNTER, -1f)
      val editor = prefs.edit()
        .putFloat(PermanentPedometerService.KEY_SAVED_STEPS, 0f)
        .putString(PermanentPedometerService.KEY_DAILY_STEPS, "{}")

      if (lastCounter >= 0f) {
        editor.putFloat(PermanentPedometerService.KEY_STEP_COUNTER_BASELINE, lastCounter)
      }

      editor.apply()
    }
  }

  private fun requireContext(): Context {
    return appContext.reactContext
      ?: throw IllegalStateException("React context is not available yet.")
  }

  companion object {
    private const val LOG_TAG = "PermanentPedometer"
  }
}
