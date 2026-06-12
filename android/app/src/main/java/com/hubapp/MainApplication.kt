package com.hubapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.hubapp.StoragePermissionPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    val packages = PackageList(this).packages.apply {
      add(StoragePermissionPackage())
    }
    getDefaultReactHost(applicationContext, packages)
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
