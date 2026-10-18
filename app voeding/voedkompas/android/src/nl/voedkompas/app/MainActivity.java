package nl.voedkompas.app;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/** Remote pages never enter the bridge-enabled WebView. */
public class MainActivity extends Activity {
 private static final String HOST="appassets.androidplatform.net";
 private static final int OPEN_FILE=41,SAVE_FILE=42;
 private WebView web;
 private ValueCallback<Uri[]> fileCallback;
 private byte[] pendingExport;
 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  FrameLayout root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(246,247,242));
  web=new WebView(this);root.addView(web,new FrameLayout.LayoutParams(-1,-1));setContentView(root);
  if(Build.VERSION.SDK_INT>=30){getWindow().setDecorFitsSystemWindows(false);root.setOnApplyWindowInsetsListener((v,insets)->{android.graphics.Insets b=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.ime());v.setPadding(b.left,b.top,b.right,b.bottom);return insets;});}
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSupportMultipleWindows(false);settings.setJavaScriptCanOpenWindowsAutomatically(false);settings.setUserAgentString(settings.getUserAgentString()+" VoedKompas/1.0 (personal nutrition tracker)");
  web.setBackgroundColor(Color.rgb(246,247,242));web.addJavascriptInterface(new LocalBridge(),"AndroidBridge");
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if(isLocal(uri))return false;if(request.isForMainFrame())openExternal(uri);return true;}
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
    Uri uri=request.getUrl();
    if(isLocal(uri)){
     String name=uri.getPath().substring("/assets/".length());if(name.isEmpty())name="index.html";
     if(!name.matches("[a-zA-Z0-9_.-]+"))return missing();
     try{InputStream data=getAssets().open(name);String mime=name.endsWith(".html")?"text/html":name.endsWith(".js")?"text/javascript":name.endsWith(".css")?"text/css":name.endsWith(".svg")?"image/svg+xml":name.endsWith(".png")?"image/png":name.endsWith(".webmanifest")?"application/manifest+json":"application/json";return new WebResourceResponse(mime,"UTF-8",200,"OK",Collections.singletonMap("Cache-Control","no-store"),data);}catch(Exception e){return missing();}
    }
    if("https".equals(uri.getScheme())&&"world.openfoodfacts.org".equals(uri.getHost())&&uri.getPath().startsWith("/api/v2/product/"))return null;
    return missing();
   }
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
    if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;
    Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");intent.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/json","text/plain","application/octet-stream"});
    try{startActivityForResult(intent,OPEN_FILE);}catch(Exception e){fileCallback.onReceiveValue(null);fileCallback=null;}return true;
   }
  });
  web.loadUrl("https://"+HOST+"/assets/index.html");
  if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0,this::handleBack);
 }
 private boolean isLocal(Uri u){return "https".equals(u.getScheme())&&HOST.equals(u.getHost())&&u.getPath()!=null&&u.getPath().startsWith("/assets/");}
 private WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 private void openExternal(Uri uri){if(!"https".equals(uri.getScheme()))return;try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception e){Toast.makeText(this,"Geen browser beschikbaar.",Toast.LENGTH_SHORT).show();}}
 private final class LocalBridge {
  @JavascriptInterface public void openUrl(String url){if(url==null||url.length()>4000)return;runOnUiThread(()->{if(web.getUrl()!=null&&isLocal(Uri.parse(web.getUrl())))openExternal(Uri.parse(url));});}
  @JavascriptInterface public void saveFile(String name,String mime,String text){
   if(name==null||text==null||text.length()>25_000_000)return;
   final String safeName=name.replaceAll("[^a-zA-Z0-9_.-]","_");final String safeMime=mime!=null&&mime.startsWith("text/csv")?"text/csv":"application/json";
   runOnUiThread(()->{if(web.getUrl()==null||!isLocal(Uri.parse(web.getUrl()))||pendingExport!=null)return;pendingExport=text.getBytes(StandardCharsets.UTF_8);Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType(safeMime);intent.putExtra(Intent.EXTRA_TITLE,safeName);try{startActivityForResult(intent,SAVE_FILE);}catch(Exception e){pendingExport=null;reportSave(false);}});
  }
 }
 @Override protected void onActivityResult(int request,int result,Intent data){
  super.onActivityResult(request,result,data);
  if(request==OPEN_FILE&&fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);fileCallback=null;}
  if(request==SAVE_FILE){byte[] bytes=pendingExport;pendingExport=null;if(result!=RESULT_OK||data==null||data.getData()==null||bytes==null){reportSave(false);return;}final Uri destination=data.getData();new Thread(()->{boolean ok=false;try(OutputStream stream=getContentResolver().openOutputStream(destination,"wt")){if(stream!=null){stream.write(bytes);ok=true;}}catch(Exception ignored){}final boolean success=ok;runOnUiThread(()->reportSave(success));}).start();}
 }
 private void reportSave(boolean ok){web.evaluateJavascript("window.onNativeSaveResult&&window.onNativeSaveResult("+ok+")",null);}
 private void handleBack(){web.evaluateJavascript("window.appBack?window.appBack():false",result->{if(!"true".equals(result))finish();});}
 @Override public void onBackPressed(){handleBack();}
 @Override protected void onDestroy(){if(fileCallback!=null)fileCallback.onReceiveValue(null);web.removeJavascriptInterface("AndroidBridge");web.destroy();super.onDestroy();}
}
