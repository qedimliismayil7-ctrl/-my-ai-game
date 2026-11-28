// Mirzə — mobil tətbiq (Expo). Saytı tam ekran WebView-də açır: AI, layihələr, Akademiya, Kitabxana — hamısı saytdan gəlir.
// SITE_URL — Cloudflare-dəki saytın ünvanı (sonunda / olmadan). Öz domeniniz olanda onu yazın.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const SITE_URL = 'https://nuanza-d7c7.ismayilqedimli03.workers.dev';

// Mirzə workstation palette: ivory canvas, charcoal text, one olive/green-blue accent
const C = { bg: '#F7F5F0', text: '#1D1F21', text2: '#62676C', accent: '#2F5A55', white: '#FFFFFF' };

// göl — the stepped carpet diamond from the site logo, drawn with plain Views
function Gol({ size = 56 }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: s * 0.7, height: s * 0.7, backgroundColor: C.accent, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: s * 0.36, height: s * 0.36, backgroundColor: C.white, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: s * 0.17, height: s * 0.17, backgroundColor: C.text, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

export default function App() {
  const web = useRef(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const notSet = SITE_URL.indexOf('SAYTINIZ') >= 0;

  // Android «geri» düyməsi tətbiqi bağlamasın — saytda bir addım geri getsin
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && web.current) { web.current.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const retry = useCallback(() => { setFailed(false); setLoading(true); if (web.current) web.current.reload(); }, []);

  // Telegram, Vikimənbə və digər kənar linklər sistem brauzerində açılsın
  const onShouldStart = useCallback((req) => {
    const url = req.url || '';
    if (url.startsWith(SITE_URL) || url.startsWith('about:') || url.startsWith('blob:') || url.startsWith('data:')) return true;
    if (/^https?:/i.test(url) && req.isTopFrame === false) return true;
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  if (notSet) {
    return (
      <View style={[styles.full, styles.center]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <Gol />
        <Text style={styles.title}>Mirzə</Text>
        <Text style={styles.text}>App.js faylında SITE_URL sətrinə saytınızın ünvanını yazın.</Text>
      </View>
    );
  }

  return (
    <View style={styles.full}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={styles.full}>
        {!failed && (
          <WebView
            ref={web}
            source={{ uri: SITE_URL + '/' }}
            style={styles.web}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            allowsBackForwardNavigationGestures
            pullToRefreshEnabled
            allowsInlineMediaPlayback
            setSupportMultipleWindows={false}
            applicationNameForUserAgent="MirzeApp/3.0"
            onShouldStartLoadWithRequest={onShouldStart}
            onNavigationStateChange={(s) => setCanGoBack(!!s.canGoBack)}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setFailed(true); }}
            onHttpError={(e) => { if (e.nativeEvent && e.nativeEvent.statusCode >= 500) { setLoading(false); setFailed(true); } }}
          />
        )}
        {loading && !failed && (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: C.bg }]}>
            <Gol />
            <Text style={styles.title}>Mirzə</Text>
            <ActivityIndicator color={C.accent} style={{ marginTop: 18 }} />
          </View>
        )}
        {failed && (
          <View style={[styles.full, styles.center]}>
            <Gol size={48} />
            <Text style={styles.title}>Bağlantı alınmadı</Text>
            <Text style={styles.text}>İnternet bağlantısını yoxlayın və yenidən cəhd edin.</Text>
            <Pressable onPress={retry} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.btnText}>Yenidən cəhd et</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 },
  web: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { color: C.text, fontSize: 20, fontWeight: '600', marginTop: 16, letterSpacing: -0.2 },
  text: { color: C.text2, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  btn: { marginTop: 20, backgroundColor: C.accent, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 6 },
  btnText: { color: C.white, fontSize: 14, fontWeight: '600' },
});
