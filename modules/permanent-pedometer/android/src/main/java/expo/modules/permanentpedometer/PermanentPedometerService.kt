package expo.modules.permanentpedometer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import kotlin.math.max

class PermanentPedometerService : Service(), SensorEventListener {
  private var sensorManager: SensorManager? = null
  private var stepCounterSensor: Sensor? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var notificationTitle = DEFAULT_TITLE
  private var notificationText = DEFAULT_TEXT

  private val prefs by lazy {
    getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    acquireWakeLock()
    sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
    stepCounterSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopSelf()
        return START_NOT_STICKY
      }
      ACTION_UPDATE_NOTIFICATION -> {
        notificationTitle = intent.getStringExtra(EXTRA_TITLE) ?: notificationTitle
        notificationText = intent.getStringExtra(EXTRA_TEXT) ?: notificationText
        updateNotification()
        return START_STICKY
      }
      else -> {
        notificationTitle = intent?.getStringExtra(EXTRA_TITLE) ?: notificationTitle
        notificationText = intent?.getStringExtra(EXTRA_TEXT) ?: notificationText
        startForeground(NOTIFICATION_ID, buildNotification())
        startStepCounter()
        return START_STICKY
      }
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onDestroy() {
    sensorManager?.unregisterListener(this)
    releaseWakeLock()
    super.onDestroy()
  }

  override fun onSensorChanged(event: SensorEvent?) {
    if (event?.sensor?.type != Sensor.TYPE_STEP_COUNTER) {
      return
    }

    val counterSinceBoot = event.values.firstOrNull()?.toDouble() ?: return
    val existingSavedSteps = prefs.getFloat(KEY_SAVED_STEPS, 0f).toDouble()
    val baseline = if (prefs.contains(KEY_STEP_COUNTER_BASELINE)) {
      prefs.getFloat(KEY_STEP_COUNTER_BASELINE, 0f).toDouble()
    } else {
      val initialBaseline = counterSinceBoot - existingSavedSteps
      prefs.edit().putFloat(KEY_STEP_COUNTER_BASELINE, initialBaseline.toFloat()).apply()
      initialBaseline
    }

    val savedSteps = max(0.0, counterSinceBoot - baseline)
    prefs.edit().putFloat(KEY_SAVED_STEPS, savedSteps.toFloat()).apply()
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

  private fun startStepCounter() {
    val sensor = stepCounterSensor ?: return
    sensorManager?.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val channel = NotificationChannel(
      CHANNEL_ID,
      CHANNEL_NAME,
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Suivi permanent des pas de La Marche du Faucon"
      setShowBadge(false)
      enableVibration(false)
    }

    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(channel)
  }

  private fun buildNotification(): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
      ?: Intent().setPackage(packageName)
    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(resolveSmallIcon())
      .setContentTitle(notificationTitle)
      .setContentText(notificationText)
      .setStyle(NotificationCompat.BigTextStyle().bigText(notificationText))
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .build()
  }

  private fun updateNotification() {
    try {
      NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, buildNotification())
    } catch (error: SecurityException) {
      error.printStackTrace()
    }
  }

  private fun resolveSmallIcon(): Int {
    return applicationInfo.icon.takeIf { it != 0 } ?: android.R.drawable.ic_dialog_info
  }

  private fun acquireWakeLock() {
    val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock = powerManager.newWakeLock(
      PowerManager.PARTIAL_WAKE_LOCK,
      "$packageName:PermanentPedometerWakeLock"
    ).apply {
      setReferenceCounted(false)
      acquire()
    }
  }

  private fun releaseWakeLock() {
    wakeLock?.takeIf { it.isHeld }?.release()
    wakeLock = null
  }

  companion object {
    const val ACTION_UPDATE_NOTIFICATION = "expo.modules.permanentpedometer.UPDATE_NOTIFICATION"
    const val ACTION_STOP = "expo.modules.permanentpedometer.STOP"
    const val EXTRA_TITLE = "title"
    const val EXTRA_TEXT = "text"

    const val PREFS_NAME = "permanent_pedometer"
    const val KEY_SAVED_STEPS = "saved_steps"
    private const val KEY_STEP_COUNTER_BASELINE = "step_counter_baseline"

    private const val CHANNEL_ID = "permanent-pedometer"
    private const val CHANNEL_NAME = "Marche du Faucon"
    private const val NOTIFICATION_ID = 747
    private const val DEFAULT_TITLE = "🌑 Arc de l'Âge d'Or"
    private const val DEFAULT_TEXT = "Aujourd'hui : 0.00 km | Total : 0.00 km"
  }
}
