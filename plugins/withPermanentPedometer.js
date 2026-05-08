const { withAndroidManifest } = require("@expo/config-plugins");

const PERMISSIONS = [
  "android.permission.ACTIVITY_RECOGNITION",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_HEALTH",
  "android.permission.WAKE_LOCK",
];

const SERVICE_NAME = "expo.modules.permanentpedometer.PermanentPedometerService";

function addPermission(androidManifest, permissionName) {
  const permissions = androidManifest.manifest["uses-permission"] ?? [];
  const exists = permissions.some((permission) => permission?.$?.["android:name"] === permissionName);

  if (!exists) {
    permissions.push({
      $: {
        "android:name": permissionName,
      },
    });
  }

  androidManifest.manifest["uses-permission"] = permissions;
}

function addForegroundService(androidManifest) {
  const application = androidManifest.manifest.application?.[0];
  if (!application) {
    return;
  }

  const services = application.service ?? [];
  const existingService = services.find((service) => service?.$?.["android:name"] === SERVICE_NAME);
  const serviceConfig = {
    "android:name": SERVICE_NAME,
    "android:enabled": "true",
    "android:exported": "false",
    "android:foregroundServiceType": "health",
  };

  if (existingService) {
    existingService.$ = {
      ...existingService.$,
      ...serviceConfig,
    };
  } else {
    services.push({
      $: serviceConfig,
    });
  }

  application.service = services;
}

function withPermanentPedometer(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    PERMISSIONS.forEach((permission) => addPermission(androidManifest, permission));
    addForegroundService(androidManifest);

    return config;
  });
}

module.exports = withPermanentPedometer;
