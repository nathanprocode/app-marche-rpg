package expo.modules.permanentpedometer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.Locale
import kotlin.math.floor
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
    notificationTitle = prefs.getString(KEY_TITLE, DEFAULT_TITLE) ?: DEFAULT_TITLE
    notificationText = prefs.getString(KEY_TEXT, DEFAULT_TEXT) ?: DEFAULT_TEXT
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
        applyTrackingIntent(intent)
        updateNotification()
        return START_STICKY
      }
      else -> {
        applyTrackingIntent(intent)
        if (!startSafelyInForeground()) {
          stopSelf()
          return START_NOT_STICKY
        }
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
    prefs.edit().putFloat(KEY_LAST_COUNTER, counterSinceBoot.toFloat()).apply()

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
    updateNotificationFromSteps(savedSteps)
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

  private fun startStepCounter() {
    val sensor = stepCounterSensor ?: return
    sensorManager?.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
  }

  private fun applyTrackingIntent(intent: Intent?) {
    val title = intent?.getStringExtra(EXTRA_TITLE)
    val text = intent?.getStringExtra(EXTRA_TEXT)
    val editor = prefs.edit()

    if (title != null) {
      notificationTitle = title
      editor.putString(KEY_TITLE, title)
    }

    if (text != null) {
      notificationText = text
      editor.putString(KEY_TEXT, text)
    }

    if (intent?.hasExtra(EXTRA_BASE_TOTAL_STEPS) == true) {
      editor.putFloat(KEY_BASE_TOTAL_STEPS, intent.getDoubleExtra(EXTRA_BASE_TOTAL_STEPS, 0.0).toFloat())
    }

    if (intent?.hasExtra(EXTRA_BASE_STEPS_TODAY) == true) {
      editor.putFloat(KEY_BASE_STEPS_TODAY, intent.getDoubleExtra(EXTRA_BASE_STEPS_TODAY, 0.0).toFloat())
    }

    if (intent?.hasExtra(EXTRA_METERS_PER_STEP) == true) {
      editor.putFloat(KEY_METERS_PER_STEP, intent.getDoubleExtra(EXTRA_METERS_PER_STEP, DEFAULT_METERS_PER_STEP).toFloat())
    }

    editor.apply()
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

  private fun updateNotificationFromSteps(savedSteps: Double) {
    val metersPerStep = prefs.getFloat(KEY_METERS_PER_STEP, DEFAULT_METERS_PER_STEP.toFloat()).toDouble()
    val baseTotalSteps = prefs.getFloat(KEY_BASE_TOTAL_STEPS, 0f).toDouble()
    val baseStepsToday = prefs.getFloat(KEY_BASE_STEPS_TODAY, 0f).toDouble()
    val totalSteps = baseTotalSteps + savedSteps
    val stepsToday = baseStepsToday + savedSteps
    val totalKm = totalSteps * metersPerStep / 1000.0
    val todayKm = stepsToday * metersPerStep / 1000.0
    val distanceBucket = floor(totalKm * 100).toInt()
    val previousBucket = prefs.getInt(KEY_LAST_NOTIFICATION_BUCKET, Int.MIN_VALUE)

    if (distanceBucket == previousBucket) {
      return
    }

    notificationTitle = resolveNotificationTitle(totalKm)
    notificationText = String.format(Locale.US, "Aujourd'hui : %.2f km | Total : %.2f km", todayKm, totalKm)
    prefs.edit()
      .putInt(KEY_LAST_NOTIFICATION_BUCKET, distanceBucket)
      .putString(KEY_TITLE, notificationTitle)
      .putString(KEY_TEXT, notificationText)
      .apply()
    updateNotification()
  }

  private fun resolveNotificationTitle(totalKm: Double): String {
    return when {
      totalKm >= 890.0 -> "\uD83C\uDF11 Arc Fantasia"
      totalKm >= 590.0 -> "\uD83C\uDF11 Arc du Faucon Millenaire"
      totalKm >= 460.0 -> "\uD83C\uDF11 Arc des Chatiments"
      totalKm >= 350.0 -> "\uD83C\uDF11 Arc du Guerrier Noir"
      else -> "\uD83C\uDF11 Arc de l'Age d'Or"
    }
  }

  private fun startSafelyInForeground(): Boolean {
    return try {
      val notification = buildNotification()
      if (Build.VERSION.SDK_INT >= 34) {
        startForeground(
          NOTIFICATION_ID,
          notification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
        )
      } else {
        startForeground(NOTIFICATION_ID, notification)
      }
      true
    } catch (error: Exception) {
      error.printStackTrace()
      false
    }
  }

  private fun resolveSmallIcon(): Int {
    return android.R.drawable.ic_dialog_info
  }

  private fun acquireWakeLock() {
    try {
      val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
      wakeLock = powerManager.newWakeLock(
        PowerManager.PARTIAL_WAKE_LOCK,
        "$packageName:PermanentPedometerWakeLock"
      ).apply {
        setReferenceCounted(false)
        acquire()
      }
    } catch (error: Exception) {
      error.printStackTrace()
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
    const val EXTRA_BASE_TOTAL_STEPS = "base_total_steps"
    const val EXTRA_BASE_STEPS_TODAY = "base_steps_today"
    const val EXTRA_METERS_PER_STEP = "meters_per_step"

    const val PREFS_NAME = "permanent_pedometer"
    const val KEY_SAVED_STEPS = "saved_steps"
    const val KEY_STEP_COUNTER_BASELINE = "step_counter_baseline"
    const val KEY_LAST_COUNTER = "last_counter"
    private const val KEY_BASE_TOTAL_STEPS = "base_total_steps"
    private const val KEY_BASE_STEPS_TODAY = "base_steps_today"
    private const val KEY_METERS_PER_STEP = "meters_per_step"
    private const val KEY_LAST_NOTIFICATION_BUCKET = "last_notification_bucket"
    private const val KEY_TITLE = "title"
    private const val KEY_TEXT = "text"

    private const val CHANNEL_ID = "permanent-pedometer"
    private const val CHANNEL_NAME = "Marche du Faucon"
    private const val NOTIFICATION_ID = 747
    private const val DEFAULT_METERS_PER_STEP = 0.75
    private const val DEFAULT_TITLE = "Arc de l'Age d'Or"
    private const val DEFAULT_TEXT = "Aujourd'hui : 0.00 km | Total : 0.00 km"
  }
}
