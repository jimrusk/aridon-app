plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
 namespace="com.aridon.sentinel"; compileSdk=35
 defaultConfig { applicationId="com.aridon.sentinel"; minSdk=26; targetSdk=35; versionCode=1; versionName="0.1.0" }
 buildFeatures { compose=true }
 composeOptions { kotlinCompilerExtensionVersion="1.5.15" }
}
dependencies {
 implementation("androidx.activity:activity-compose:1.9.3"); implementation("androidx.compose.ui:ui:1.7.5")
 implementation("androidx.compose.material3:material3:1.3.1"); implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
 implementation("androidx.core:core-ktx:1.15.0"); debugImplementation("androidx.compose.ui:ui-tooling:1.7.5")
 testImplementation("junit:junit:4.13.2")
}