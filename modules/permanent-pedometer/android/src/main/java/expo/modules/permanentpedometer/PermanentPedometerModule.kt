package expo.modules.permanentpedometer

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PermanentPedometerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PermanentPedometer")

    Function("startTracking") { title: String, text: String ->
      val context = requireContext()
      val intent = Intent(context, PermanentPedometerService::class.java).apply {
        putExtra(PermanentPedometerService.EXTRA_TITLE, title)
        putExtra(PermanentPedometerService.EXTRA_TEXT, text)
      }

      ContextCompat.startForegroundService(context, intent)
    }

    Function("stopTracking") {
      val context = requireContext()
      context.stopService(Intent(context, PermanentPedometerService::class.java))
    }

    Function("updateNotification") { title: String, text: String ->
      val context = requireContext()
      val intent = Intent(context, PermanentPedometerService::class.java).apply {
        action = PermanentPedometerService.ACTION_UPDATE_NOTIFICATION
        putExtra(PermanentPedometerService.EXTRA_TITLE, title)
        putExtra(PermanentPedometerService.EXTRA_TEXT, text)
      }

      context.startService(intent)
    }

    Function("getSteps") {
      val prefs = requireContext().getSharedPreferences(
        PermanentPedometerService.PREFS_NAME,
        Context.MODE_PRIVATE
      )

      prefs.getFloat(PermanentPedometerService.KEY_SAVED_STEPS, 0f).toDouble()
    }
  }

  private fun requireContext(): Context {
    return appContext.reactContext
      ?: throw IllegalStateException("React context is not available yet.")
  }
}
