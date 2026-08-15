package com.ssatv.live;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Prevent screen sleep while streaming on Android TV
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        configureWebView();
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebView();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebView();
    }

    private void configureWebView() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            
            // Enable Hardware Acceleration for 60fps rendering
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
            settings.setLoadWithOverviewMode(true);
            settings.setUseWideViewPort(true);
            
            // Performance Tweaks for Android TV
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
            
            // Accept all cookies & CORS streaming
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
            
            webView.setFocusable(true);
            webView.setFocusableInTouchMode(true);
            webView.requestFocus();
        }
    }
}


