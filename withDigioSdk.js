/**
 * Expo Config Plugin: withDigioSdk
 *
 * Automatically injects the required Android native configuration for @digiotech/react-native SDK:
 * 1. buildFeatures { viewBinding true, dataBinding true }
 * 2. implementation 'com.github.digio-tech:protean-esign:v3.12'
 * 3. ProGuard keep rules for release builds
 *
 * This ensures the Digio eSign/eStamp gateway Activity can inflate its layouts
 * and the protean-esign classes are available at runtime.
 */
const { withAppBuildGradle, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Add viewBinding + dataBinding buildFeatures and protean-esign dependency
 * to android/app/build.gradle
 */
function withDigioBuildGradle(config) {
  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    // 1. Add buildFeatures { viewBinding true, dataBinding true }
    //    Only add if not already present
    if (!contents.includes('viewBinding true')) {
      const buildFeaturesBlock = `
    buildFeatures {
        viewBinding true
        dataBinding true
    }`;

      // Insert before androidResources if it exists
      if (contents.includes('androidResources {')) {
        contents = contents.replace(
          '    androidResources {',
          `${buildFeaturesBlock}\n    androidResources {`
        );
      } else {
        // Fallback: insert before the closing brace of android {} before dependencies
        const depIdx = contents.indexOf('dependencies {');
        if (depIdx !== -1) {
          const lastBrace = contents.lastIndexOf('}', depIdx);
          if (lastBrace !== -1) {
            contents =
              contents.slice(0, lastBrace) +
              buildFeaturesBlock +
              '\n' +
              contents.slice(lastBrace);
          }
        }
      }
    }

    // 2. Add protean-esign implementation dependency
    //    Only add if not already present
    if (!contents.includes('protean-esign')) {
      const depMarker = 'implementation("com.facebook.react:react-android")';
      if (contents.includes(depMarker)) {
        contents = contents.replace(
          depMarker,
          `${depMarker}\n\n    // Digio eSign SDK - Required native dependency for eSign/eStamp flows\n    implementation 'com.github.digio-tech:protean-esign:v3.12'`
        );
      }
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

// ProGuard rules content for Digio SDK
const DIGIO_PROGUARD_RULES = `
# ─── Digio eSign SDK ProGuard Rules ───────────────────────────
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-keepattributes Signature
-optimizations !method/inlining/*
-keeppackagenames
-keepnames class androidx.navigation.fragment.NavHostFragment
-keep class * extends androidx.fragment.app.Fragment{}
-keepnames class * extends android.os.Parcelable
-keepnames class * extends java.io.Serializable
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
-dontwarn androidx.databinding.**
-keep class androidx.databinding.** { *; }
-keepclassmembers class * extends androidx.databinding.** { *; }
-dontwarn org.json.**
-keep class org.json** { *; }
-keep public class org.simpleframework.**{ *; }
-keep class org.simpleframework.xml.**{ *; }
-keep class org.simpleframework.xml.core.**{ *; }
-keep class org.simpleframework.xml.util.**{ *; }
-dontwarn com.google.android.gms.**
-keep class com.google.android.gms.** { *; }
-keep class com.google.android.material.** { *; }
-dontwarn org.simpleframework.**
-keepattributes ElementList, Root
-keepclassmembers class * {
    @org.simpleframework.xml.* *;
}
-keep class org.spongycastle.** { *; }
-keep class com.ecs.rdlibrary.request.** { *; }
-keep class com.ecs.rdlibrary.response.** { *; }
-keep class com.ecs.rdlibrary.utils.** { *; }
-keep class com.ecs.rdlibrary.ECSBioCaptureActivity { *; }
-keep class org.simpleframework.xml.** { *; }
-keepattributes Exceptions, InnerClasses
-keep class com.google.android.gms.location.LocationSettingsRequest$Builder { *; }
-keepnames class ** { *; }
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepattributes AnnotationDefault
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn javax.annotation.**
-dontwarn kotlin.Unit
-dontwarn retrofit2.KotlinExtensions
-dontwarn retrofit2.KotlinExtensions$*
-if interface * { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface <1>
-if interface * { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface * extends <1>
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-if interface * { @retrofit2.http.* public *** *(...); }
-keep,allowoptimization,allowshrinking,allowobfuscation class <3>
-keep,allowobfuscation,allowshrinking class retrofit2.Response
-adaptresourcefilenames okhttp3/internal/publicsuffix/PublicSuffixDatabase.gz
-dontwarn org.codehaus.mojo.animal_sniffer.*
-dontwarn okhttp3.internal.platform.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
-keep class * extends androidx.databinding.DataBinderMapper
-dontwarn kotlin.jvm.internal.SourceDebugExtension
-dontwarn org.xmlpull.v1.**
-keep class org.xmlpull.v1.** { *; }
-keep class in.digio.sdk.gateway.interfaces.FeatureRegistrationInterface$DefaultImpls { *; }
-keep class javax.xml.bind.annotation.** { *; }
-dontwarn javax.xml.bind.annotation.**
-keep class com.ecs.cdslxsds.ESignProcessorResponse { *; }
-dontwarn org.xmlpull.v1.XmlPullParser
-dontwarn android.content.res.XmlResourceParser
-keep class in.digio.sdk.gateway.interfaces.FeatureRegistrationInterface$DefaultImpls { *; }
-dontwarn java.lang.invoke.StringConcatFactory
-keep public class com.digio.two_way_sdk.** { public *; }
-keep class com.digio.two_way_sdk.** { *; }
-keep class androidx.databinding.** { *; }
-keep class androidx.viewbinding.** { *; }
-keep public class * extends androidx.**
-keep public class com.google.android.material.** { *; }
-keep public class androidx.** { public *; }
# ─── End Digio ProGuard Rules ─────────────────────────────────
`;

/**
 * Append Digio ProGuard rules to android/app/proguard-rules.pro
 * Uses withDangerousMod since withProguardRules is not available in this Expo SDK version
 */
function withDigioProguard(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const proguardPath = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );

      if (fs.existsSync(proguardPath)) {
        let contents = fs.readFileSync(proguardPath, 'utf8');

        // Only add if not already present
        if (!contents.includes('Digio eSign SDK ProGuard Rules')) {
          contents += DIGIO_PROGUARD_RULES;
          fs.writeFileSync(proguardPath, contents, 'utf8');
        }
      }

      return mod;
    },
  ]);
}

/**
 * Main config plugin entry point
 */
module.exports = function withDigioSdk(config) {
  config = withDigioBuildGradle(config);
  config = withDigioProguard(config);
  return config;
};
