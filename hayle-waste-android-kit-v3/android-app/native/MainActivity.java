package uk.co.hayle.wastecounter;

import android.content.ContentValues;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
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

    private void savePdfDirect(byte[] bytes, String filename) {
        if (bytes == null || bytes.length == 0) {
            notifyPdfResult(false, "The PDF was empty.");
            return;
        }
        if (bytes.length > 10 * 1024 * 1024) {
            notifyPdfResult(false, "The PDF was too large to save.");
            return;
        }

        final String safeName = safePdfFilename(filename);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                android.net.Uri uri = getContentResolver().insert(
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                        values
                );
                if (uri == null) throw new IllegalStateException("Could not create download file.");

                try (OutputStream output = getContentResolver().openOutputStream(uri, "w")) {
                    if (output == null) throw new IllegalStateException("Could not open download file.");
                    output.write(bytes);
                    output.flush();
                } catch (Exception error) {
                    getContentResolver().delete(uri, null, null);
                    throw error;
                }

                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(uri, values, null, null);
            } else {
                File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloads.exists() && !downloads.mkdirs()) {
                    throw new IllegalStateException("Could not open Downloads folder.");
                }

                File target = uniqueFile(downloads, safeName);
                try (FileOutputStream output = new FileOutputStream(target)) {
                    output.write(bytes);
                    output.flush();
                }
            }

            notifyPdfResult(true, safeName + " downloaded to Downloads.");
        } catch (Exception error) {
            notifyPdfResult(false, "Could not download the PDF.");
        }
    }

    private File uniqueFile(File directory, String filename) {
        File first = new File(directory, filename);
        if (!first.exists()) return first;

        int dot = filename.toLowerCase(Locale.UK).endsWith(".pdf") ? filename.length() - 4 : filename.length();
        String stem = filename.substring(0, dot);
        String extension = dot < filename.length() ? filename.substring(dot) : ".pdf";

        for (int i = 2; i < 1000; i++) {
            File candidate = new File(directory, stem + " (" + i + ")" + extension);
            if (!candidate.exists()) return candidate;
        }
        return new File(directory, stem + "-" + System.currentTimeMillis() + extension);
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
                activity.runOnUiThread(() -> activity.savePdfDirect(bytes, filename));
            } catch (Exception error) {
                activity.notifyPdfResult(false, "Could not prepare the PDF.");
            }
        }
    }
}
