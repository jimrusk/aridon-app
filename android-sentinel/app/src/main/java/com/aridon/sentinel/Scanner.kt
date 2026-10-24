package com.aridon.sentinel
import android.app.AppOpsManager
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.os.Build
import android.provider.Settings
data class ScanFinding(val kind:String,val name:String,val detail:String,val risk:Int)
data class ScanReport(val findings:List<ScanFinding>,val blocked:List<String>,val scannedAt:Long=System.currentTimeMillis())
class Scanner(private val context:Context) {
 fun scan():ScanReport {
  val f=mutableListOf<ScanFinding>(); val blocked=mutableListOf<String>(); val pm=context.packageManager
  pm.getInstalledApplications(0).forEach { app ->
   val installer=if(Build.VERSION.SDK_INT>=30) runCatching{pm.getInstallSourceInfo(app.packageName).installingPackageName}.getOrNull() else @Suppress("DEPRECATION") pm.getInstallerPackageName(app.packageName)
   val system=(app.flags and ApplicationInfo.FLAG_SYSTEM)!=0
   if(!system && installer.isNullOrBlank()) f+=ScanFinding("unknown_source",app.loadLabel(pm).toString(),app.packageName+" installer unavailable",55)
   if(!system && (app.flags and ApplicationInfo.FLAG_DEBUGGABLE)!=0) f+=ScanFinding("debuggable_app",app.loadLabel(pm).toString(),app.packageName,35)
  }
  val acc=Settings.Secure.getString(context.contentResolver,Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES).orEmpty()
  if(acc.isNotBlank()) f+=ScanFinding("accessibility_service","Enabled accessibility services",acc,65)
  val dpm=context.getSystemService(DevicePolicyManager::class.java)
  @Suppress("DEPRECATION") dpm.activeAdmins?.forEach{f+=ScanFinding("device_admin","Device administrator",it.flattenToShortString(),60)}
  if(Settings.Global.getInt(context.contentResolver,Settings.Global.ADB_ENABLED,0)==1) f+=ScanFinding("security_setting","USB debugging enabled","ADB is enabled",35)
  if(Settings.Global.getInt(context.contentResolver,Settings.Global.DEVELOPMENT_SETTINGS_ENABLED,0)==1) f+=ScanFinding("security_setting","Developer options enabled","Developer settings are enabled",20)
  if(!hasUsageAccess()) blocked+="Usage access not granted. Owner can enable it in Android Settings."
  blocked+="Other apps' private storage, passwords, MFA secrets and protected system logs remain Android-restricted by design."
  return ScanReport(f.sortedByDescending{it.risk},blocked)
 }
 private fun hasUsageAccess():Boolean { val ops=context.getSystemService(AppOpsManager::class.java); return ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,android.os.Process.myUid(),context.packageName)==AppOpsManager.MODE_ALLOWED }
 fun openUsageAccess()=context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
 fun openNotificationAccess()=context.startActivity(Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
 fun openAccessibility()=context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
}