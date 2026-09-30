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
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
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
    Log.i(LOG_TAG, "Service created")
    createNotificationChannel()
    acquireWakeLock()
    notificationTitle = prefs.getString(KEY_TITLE, DEFAULT_TITLE) ?: DEFAULT_TITLE
    notificationText = prefs.getString(KEY_TEXT, DEFAULT_TEXT) ?: DEFAULT_TEXT
    sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
    stepCounterSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    Log.i(LOG_TAG, "Service start command: ${intent?.action ?: "START"}")
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
    Log.i(LOG_TAG, "Service destroyed")
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
    val deltaSteps = max(0.0, savedSteps - existingSavedSteps)

    if (deltaSteps > 0.0) {
      recordDailySteps(deltaSteps)
    }

    prefs.edit().putFloat(KEY_SAVED_STEPS, savedSteps.toFloat()).apply()
    updateNotificationFromSteps(savedSteps)
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

  private fun startStepCounter() {
    val sensor = stepCounterSensor
    if (sensor == null) {
      Log.e(LOG_TAG, "TYPE_STEP_COUNTER sensor is not available")
      return
    }

    sensorManager?.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
    Log.i(LOG_TAG, "TYPE_STEP_COUNTER listener registered")
  }

  private fun applyTrackingIntent(intent: Intent?) {
    val title = intent?.getStringExtra(EXTRA_TITLE)
    val text = intent?.getStringExtra(EXTRA_TEXT)
    val baseTotalSteps = intent?.getDoubleExtra(EXTRA_BASE_TOTAL_STEPS, 0.0)
    val metersPerStep = intent?.getDoubleExtra(EXTRA_METERS_PER_STEP, DEFAULT_METERS_PER_STEP)
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
      editor.putFloat(KEY_BASE_TOTAL_STEPS, baseTotalSteps?.toFloat() ?: 0f)
    }

    if (intent?.hasExtra(EXTRA_BASE_STEPS_TODAY) == true) {
      editor.putFloat(KEY_BASE_STEPS_TODAY, intent.getDoubleExtra(EXTRA_BASE_STEPS_TODAY, 0.0).toFloat())
      editor.putString(KEY_BASE_STEPS_TODAY_DAY, currentDayKey())
    }

    if (intent?.hasExtra(EXTRA_METERS_PER_STEP) == true) {
      editor.putFloat(KEY_METERS_PER_STEP, metersPerStep?.toFloat() ?: DEFAULT_METERS_PER_STEP.toFloat())
    }

    if (intent?.hasExtra(EXTRA_BASE_TOTAL_STEPS) == true || intent?.hasExtra(EXTRA_METERS_PER_STEP) == true) {
      val resolvedBaseTotalSteps = baseTotalSteps ?: prefs.getFloat(KEY_BASE_TOTAL_STEPS, 0f).toDouble()
      val resolvedMetersPerStep = metersPerStep ?: prefs.getFloat(KEY_METERS_PER_STEP, DEFAULT_METERS_PER_STEP.toFloat()).toDouble()
      val baselineCheckpointIndex = resolveCheckpointIndex(resolvedBaseTotalSteps * resolvedMetersPerStep / 1000.0)
      editor.putInt(KEY_LAST_CHECKPOINT_NOTIFICATION_INDEX, baselineCheckpointIndex)
    }

    editor.apply()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val trackingChannel = NotificationChannel(
      CHANNEL_ID,
      CHANNEL_NAME,
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Suivi permanent des pas de La Marche du Faucon"
      setShowBadge(false)
      enableVibration(false)
    }

    val checkpointChannel = NotificationChannel(
      CHECKPOINT_CHANNEL_ID,
      CHECKPOINT_CHANNEL_NAME,
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Souvenirs debloques pendant la marche"
      setShowBadge(true)
      enableVibration(true)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }

    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(trackingChannel)
    manager.createNotificationChannel(checkpointChannel)
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
      Log.e(LOG_TAG, "Notification update failed", error)
      error.printStackTrace()
    }
  }

  private fun updateNotificationFromSteps(savedSteps: Double) {
    val metersPerStep = prefs.getFloat(KEY_METERS_PER_STEP, DEFAULT_METERS_PER_STEP.toFloat()).toDouble()
    val baseTotalSteps = prefs.getFloat(KEY_BASE_TOTAL_STEPS, 0f).toDouble()
    val todayKey = currentDayKey()
    val baseStepsTodayDay = prefs.getString(KEY_BASE_STEPS_TODAY_DAY, todayKey) ?: todayKey
    val baseStepsToday = if (baseStepsTodayDay == todayKey) {
      prefs.getFloat(KEY_BASE_STEPS_TODAY, 0f).toDouble()
    } else {
      0.0
    }
    val savedStepsToday = readDailyStepsFor(todayKey)
    val totalSteps = baseTotalSteps + savedSteps
    val stepsToday = baseStepsToday + savedStepsToday
    val totalKm = totalSteps * metersPerStep / 1000.0
    val todayKm = stepsToday * metersPerStep / 1000.0
    val distanceBucket = floor(totalKm * 100).toInt()
    val previousBucket = prefs.getInt(KEY_LAST_NOTIFICATION_BUCKET, Int.MIN_VALUE)

    if (distanceBucket == previousBucket) {
      return
    }

    notificationTitle = resolveNotificationTitle(totalKm)
    notificationText = String.format(Locale.US, "Aujourd'hui : %.2f km | Total : %.2f km", todayKm, totalKm)
    notifyUnlockedCheckpoints(totalKm)
    prefs.edit()
      .putInt(KEY_LAST_NOTIFICATION_BUCKET, distanceBucket)
      .putString(KEY_TITLE, notificationTitle)
      .putString(KEY_TEXT, notificationText)
      .apply()
    updateNotification()
  }

  private fun recordDailySteps(deltaSteps: Double) {
    try {
      val dayKey = currentDayKey()
      val dailySteps = JSONObject(prefs.getString(KEY_DAILY_STEPS, "{}") ?: "{}")
      val updatedSteps = dailySteps.optDouble(dayKey, 0.0) + deltaSteps
      dailySteps.put(dayKey, updatedSteps)
      pruneDailySteps(dailySteps)
      prefs.edit().putString(KEY_DAILY_STEPS, dailySteps.toString()).apply()
    } catch (error: Exception) {
      Log.e(LOG_TAG, "Daily step recording failed", error)
      error.printStackTrace()
    }
  }

  private fun readDailyStepsFor(dayKey: String): Double {
    return try {
      JSONObject(prefs.getString(KEY_DAILY_STEPS, "{}") ?: "{}").optDouble(dayKey, 0.0)
    } catch (error: Exception) {
      Log.e(LOG_TAG, "Daily step read failed", error)
      0.0
    }
  }

  private fun pruneDailySteps(dailySteps: JSONObject) {
    val keys = dailySteps.keys().asSequence().toList().sorted()
    if (keys.size <= MAX_DAILY_HISTORY_DAYS) {
      return
    }

    keys.take(keys.size - MAX_DAILY_HISTORY_DAYS).forEach { key ->
      dailySteps.remove(key)
    }
  }

  private fun currentDayKey(): String {
    return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
  }

  private fun notifyUnlockedCheckpoints(totalKm: Double) {
    val checkpointIndex = resolveCheckpointIndex(totalKm)
    val previousCheckpointIndex = prefs.getInt(KEY_LAST_CHECKPOINT_NOTIFICATION_INDEX, checkpointIndex)

    if (checkpointIndex <= previousCheckpointIndex) {
      if (!prefs.contains(KEY_LAST_CHECKPOINT_NOTIFICATION_INDEX)) {
        prefs.edit().putInt(KEY_LAST_CHECKPOINT_NOTIFICATION_INDEX, checkpointIndex).apply()
      }
      return
    }

    for (index in (previousCheckpointIndex + 1)..checkpointIndex) {
      val checkpoint = CHECKPOINTS.getOrNull(index) ?: continue
      showCheckpointNotification(checkpoint, index)
    }

    prefs.edit().putInt(KEY_LAST_CHECKPOINT_NOTIFICATION_INDEX, checkpointIndex).apply()
  }

  private fun showCheckpointNotification(checkpoint: CheckpointNotification, index: Int) {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
      ?: Intent().setPackage(packageName)
    val pendingIntent = PendingIntent.getActivity(
      this,
      index + 1,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val contentText = String.format(Locale.US, "%.0f km - %s", checkpoint.kmThreshold, checkpoint.arc)
    val notification = NotificationCompat.Builder(this, CHECKPOINT_CHANNEL_ID)
      .setSmallIcon(resolveSmallIcon())
      .setContentTitle("Souvenir debloque : ${checkpoint.title}")
      .setContentText(contentText)
      .setStyle(NotificationCompat.BigTextStyle().bigText(contentText))
      .setContentIntent(pendingIntent)
      .setAutoCancel(true)
      .setOnlyAlertOnce(false)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_STATUS)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .build()

    try {
      NotificationManagerCompat.from(this).notify(CHECKPOINT_NOTIFICATION_ID_BASE + index, notification)
      Log.i(LOG_TAG, "Checkpoint notification sent: ${checkpoint.id}")
    } catch (error: SecurityException) {
      Log.e(LOG_TAG, "Checkpoint notification failed", error)
      error.printStackTrace()
    }
  }

  private fun resolveCheckpointIndex(totalKm: Double): Int {
    return CHECKPOINTS.indexOfLast { checkpoint -> checkpoint.kmThreshold <= totalKm + 0.0001 }
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
      Log.e(LOG_TAG, "startForeground failed", error)
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
      Log.e(LOG_TAG, "WakeLock acquire failed", error)
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
    const val KEY_DAILY_STEPS = "daily_steps"
    const val KEY_STEP_COUNTER_BASELINE = "step_counter_baseline"
    const val KEY_LAST_COUNTER = "last_counter"
    private const val KEY_BASE_TOTAL_STEPS = "base_total_steps"
    private const val KEY_BASE_STEPS_TODAY = "base_steps_today"
    private const val KEY_BASE_STEPS_TODAY_DAY = "base_steps_today_day"
    private const val KEY_METERS_PER_STEP = "meters_per_step"
    private const val KEY_LAST_NOTIFICATION_BUCKET = "last_notification_bucket"
    private const val KEY_LAST_CHECKPOINT_NOTIFICATION_INDEX = "last_checkpoint_notification_index"
    private const val KEY_TITLE = "title"
    private const val KEY_TEXT = "text"

    private const val CHANNEL_ID = "permanent-pedometer"
    private const val CHANNEL_NAME = "Marche du Faucon"
    private const val CHECKPOINT_CHANNEL_ID = "marche-du-faucon-checkpoints"
    private const val CHECKPOINT_CHANNEL_NAME = "Souvenirs debloques"
    private const val LOG_TAG = "PermanentPedometer"
    private const val NOTIFICATION_ID = 747
    private const val CHECKPOINT_NOTIFICATION_ID_BASE = 9000
    private const val MAX_DAILY_HISTORY_DAYS = 30
    private const val DEFAULT_METERS_PER_STEP = 0.75
    private const val DEFAULT_TITLE = "Arc de l'Age d'Or"
    private const val DEFAULT_TEXT = "Aujourd'hui : 0.00 km | Total : 0.00 km"

    private data class CheckpointNotification(
      val id: String,
      val kmThreshold: Double,
      val arc: String,
      val title: String
    )

    private val CHECKPOINTS = listOf(
      CheckpointNotification("cp-001", 0.0, "Age d'Or", "L'Arbre des Pendus"),
      CheckpointNotification("cp-002", 18.0, "Age d'Or", "L'Ombre de Gambino"),
      CheckpointNotification("cp-003", 52.0, "Age d'Or", "Le Briseur d'Ours"),
      CheckpointNotification("cp-004", 85.0, "Age d'Or", "La Rencontre avec le Faucon"),
      CheckpointNotification("cp-004-5", 115.0, "Age d'Or", "Nosferatu Zodd"),
      CheckpointNotification("cp-005", 142.0, "Age d'Or", "La Chute de Doldrey"),
      CheckpointNotification("cp-006", 190.0, "Age d'Or", "Le Depart sous la Neige"),
      CheckpointNotification("cp-007", 250.0, "Age d'Or", "La Tour des Renaissances"),
      CheckpointNotification("cp-008", 315.0, "Age d'Or", "L'Eclipse"),
      CheckpointNotification("cp-008-5", 350.0, "Guerrier Noir", "Le Comte"),
      CheckpointNotification("cp-009", 384.0, "Guerrier Noir", "La Forge de Godo"),
      CheckpointNotification("cp-010", 460.0, "Chatiments", "La Vallee des Brumes"),
      CheckpointNotification("cp-011", 545.0, "Chatiments", "La Tour d'Albion"),
      CheckpointNotification("cp-011-5", 590.0, "Faucon Millenaire", "La Colline aux Epees"),
      CheckpointNotification("cp-012", 638.0, "Faucon Millenaire", "La Demeure de Flora"),
      CheckpointNotification("cp-013", 770.0, "Faucon Millenaire", "Le Port de Vritannis"),
      CheckpointNotification("cp-014", 890.0, "Fantasia", "L'Antre du Dieu des Mers"),
      CheckpointNotification("cp-015", 1000.0, "Fantasia", "Elfhelm, l'Ile de Skellig")
    )
  }
}
