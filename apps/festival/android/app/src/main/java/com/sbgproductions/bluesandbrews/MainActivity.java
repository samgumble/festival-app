package com.sbgproductions.bluesandbrews;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Edge-to-edge shell (D-029). The web layout paints under the status and navigation bars and pads
 * itself with `.safe-t` / `.safe-b`. iOS fills those from env(safe-area-inset-*), but Android's
 * WebView only reports display cutouts there, so the real system-bar insets are pushed into the page
 * as the CSS custom properties --inset-t / --inset-b (in CSS px). Re-applied on every inset change,
 * on resume, and shortly after launch in case the first pass ran before the page existed.
 */
public class MainActivity extends BridgeActivity {
  private String lastInsetJs = "";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Draw under both system bars; the page pads itself from --inset-t/--inset-b below.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    WebView webView = getBridge().getWebView();
    ViewCompat.setOnApplyWindowInsetsListener(webView, (view, insets) -> {
      Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
      float density = getResources().getDisplayMetrics().density;
      lastInsetJs = "document.documentElement.style.setProperty('--inset-t','" + (bars.top / density) + "px');"
        + "document.documentElement.style.setProperty('--inset-b','" + (bars.bottom / density) + "px');";
      webView.evaluateJavascript(lastInsetJs, null);
      return insets;
    });
    webView.postDelayed(this::reapplyInsets, 800);
    webView.postDelayed(this::reapplyInsets, 2500);
  }

  @Override
  public void onResume() {
    super.onResume();
    reapplyInsets();
  }

  private void reapplyInsets() {
    WebView webView = getBridge().getWebView();
    if (webView == null) return;
    if (lastInsetJs.isEmpty()) ViewCompat.requestApplyInsets(webView);
    else webView.evaluateJavascript(lastInsetJs, null);
  }
}
