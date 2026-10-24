package com.aridon.sentinel
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
class SentinelNotificationListener:NotificationListenerService(){override fun onNotificationPosted(sbn:StatusBarNotification?){ /* No notification body is retained in v0.1. */ }}