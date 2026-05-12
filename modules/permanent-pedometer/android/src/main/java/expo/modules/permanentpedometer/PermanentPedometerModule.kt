package expo.modules.permanentpedometer

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PermanentPedometerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PermanentPedometer")

    Function("startTracking") { title: String, text: String, baseTotalSteps: Double, baseStepsToday: Double, metersPerStep: Double ->
      val context = requireContext()
      val intent = Intent(context, PermanentPedometerService::class.java).apply {
        putExtra(PermanentPedometerService.EXTRA_TITLE, title)
        putExtra(PermanentPedometerService.EXTRA_TEXT, text)
        putExtra(PermanentPedometerService.EXTRA_BASE_TOTAL_STEPS, baseTotalSteps)
        putExtra(PermanentPedometerService.EXTRA_BASE_STEPS_TODAY, baseStepsToday)
        putExtra(PermanentPedometerService.EXTRA_METERS_PER_STEP, metersPerStep)
      }

      try {
        ContextCompat.startForegroundService(context, intent)
      } catch (error: Exception) {
        error.printStackTrace()
      }
    }

    Function("stopTracking") {
      val context = requireContext()
      try {
        context.stopService(Intent(context, PermanentPedometerService::class.java))
      } catch (error: Exception) {
        error.printStackTrace()
      }
    }

    Function("updateNotification") { title: String, text: String, baseTotalSteps: Double, baseStepsToday: Double, metersPerStep: Double ->
      val context = requireContext()
      val intent = Intent(context, PermanentPedometerService::class.java).apply {
        action = PermanentPedometerService.ACTION_UPDATE_NOTIFICATION
        putExtra(PermanentPedometerService.EXTRA_TITLE, title)
        putExtra(PermanentPedometerService.EXTRA_TEXT, text)
        putExtra(PermanentPedometerService.EXTRA_BASE_TOTAL_STEPS, baseTotalSteps)
        putExtra(PermanentPedometerService.EXTRA_BASE_STEPS_TODAY, baseStepsToday)
        putExtra(PermanentPedometerService.EXTRA_METERS_PER_STEP, metersPerStep)
      }

      try {
        context.startService(intent)
      } catch (error: Exception) {
        error.printStackTrace()
      }
    }

    Function("getSteps") {
      val prefs = requireContext().getSharedPreferences(
        PermanentPedometerService.PREFS_NAME,
        Context.MODE_PRIVATE
      )

      prefs.getFloat(PermanentPedometerService.KEY_SAVED_STEPS, 0f).toDouble()
    }

    Function("acknowledgeSteps") {
      val prefs = requireContext().getSharedPreferences(
        PermanentPedometerService.PREFS_NAME,
        Context.MODE_PRIVATE
      )
      val lastCounter = prefs.getFloat(PermanentPedometerService.KEY_LAST_COUNTER, -1f)
      val editor = prefs.edit().putFloat(PermanentPedometerService.KEY_SAVED_STEPS, 0f)

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
}
