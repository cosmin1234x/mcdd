package uk.co.hayle.wastecounter;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.OutputStream;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private static final int REQUEST_SAVE_PDF = 8412;
    private byte[] pendingPdfBytes;
    private String pendingPdfFilename;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.addJavascriptInterface(new AndroidPdfBridge(this), "AndroidPdf");

            if (savedInstanceState == null) {
                webView.post(() -> {
                    String freshUrl = "https://haylewaster.vercel.app/?native=1&native_start=" + System.currentTimeMillis();
                    webView.loadUrl(freshUrl);
                });
            }
        }
    }

    private void requestPdfSave(byte[] bytes, String filename) {
        if (bytes == null || bytes.length == 0) {
            notifyPdfResult(false, "The PDF was empty.");
            return;
        }
        if (bytes.length > 10 * 1024 * 1024) {
            notifyPdfResult(false, "The PDF was too large to save.");
            return;
        }

        pendingPdfBytes = bytes;
        pendingPdfFilename = safePdfFilename(filename);

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/pdf");
        intent.putExtra(Intent.EXTRA_TITLE, pendingPdfFilename);
        startActivityForResult(intent, REQUEST_SAVE_PDF);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_SAVE_PDF) return;

        if (resultCode != Activity.RESULT_OK || data == null || data.getData() == null) {
            pendingPdfBytes = null;
            pendingPdfFilename = null;
            notifyPdfResult(false, "PDF save cancelled.");
            return;
        }

        try (OutputStream output = getContentResolver().openOutputStream(data.getData(), "w")) {
            if (output == null) throw new IllegalStateException("Could not open the selected file.");
            output.write(pendingPdfBytes);
            output.flush();
            String savedName = pendingPdfFilename;
            pendingPdfBytes = null;
            pendingPdfFilename = null;
            notifyPdfResult(true, savedName + " saved.");
        } catch (Exception error) {
            pendingPdfBytes = null;
            pendingPdfFilename = null;
            notifyPdfResult(false, "Could not save the PDF.");
        }
    }

    private String safePdfFilename(String filename) {
        String clean = filename == null ? "Hayle-Waste-Paper.pdf" : filename.trim();
        clean = clean.replaceAll("[^A-Za-z0-9._ -]", "-");
        if (clean.isEmpty()) clean = "Hayle-Waste-Paper.pdf";
        if (!clean.toLowerCase(Locale.UK).endsWith(".pdf")) clean += ".pdf";
        return clean;
    }

    private void notifyPdfResult(boolean ok, String message) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        String javascript = "window.dispatchEvent(new CustomEvent('hayle-pdf-saved',{detail:{ok:"
                + (ok ? "true" : "false")
                + ",message:" + JSONObject.quote(message) + "}}));";
        runOnUiThread(() -> getBridge().getWebView().evaluateJavascript(javascript, null));
    }

    public static class AndroidPdfBridge {
        private final MainActivity activity;

        AndroidPdfBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void saveBase64(String base64Pdf, String filename) {
            try {
                byte[] bytes = Base64.decode(base64Pdf, Base64.DEFAULT);
                activity.runOnUiThread(() -> activity.requestPdfSave(bytes, filename));
            } catch (Exception error) {
                activity.notifyPdfResult(false, "Could not prepare the PDF.");
            }
        }
    }
}
