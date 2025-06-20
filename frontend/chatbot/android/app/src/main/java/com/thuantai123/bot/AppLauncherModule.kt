package com.thuantai123.bot

import android.content.Intent
import android.content.pm.PackageManager
import com.facebook.react.bridge.*

class AppLauncherModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AppLauncher"
    }

    @ReactMethod
    fun openAppByName(appName: String, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)

            for (app in apps) {
                val label = pm.getApplicationLabel(app).toString().lowercase()
                if (label.contains(appName.lowercase())) {
                    val launchIntent = pm.getLaunchIntentForPackage(app.packageName)
                    if (launchIntent != null) {
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        reactApplicationContext.startActivity(launchIntent)
                        promise.resolve("Opened app: ${label}")
                        return
                    }
                }
            }

            promise.reject("APP_NOT_FOUND", "Không tìm thấy ứng dụng nào khớp với: $appName")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
