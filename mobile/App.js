// Mirzə — mobil tətbiq (Expo). Saytı tam ekran WebView-də açır: AI, layihələr, Akademiya, Kitabxana — hamısı saytdan gəlir.
// SITE_URL-i öz saytınızın ünvanı ilə əvəz edin (Netlify və ya Cloudflare linki, sonunda / olmadan).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const SITE_URL = 'https://SAYTINIZ.netlify.app';

const C = { ink: '#0A0F14', deep: '#0F3D3E', teal: '#2E6F73', mist: '#7FB3B8', paper: '#EADCC8', copper: '#C6601F' };

// göl — the stepped carpet diamond from the site logo, drawn with plain Views
function Gol({ size = 56 }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: s * 0.7, height: s * 0.7, backgroundColor: C.copper, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: s * 0.36, height: s * 0.36, backgroundColor: C.paper, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: s * 0.17, height: s * 0.17, backgroundColor: C.teal, transform: [{ rotate: '45deg' }] }} />
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
        <StatusBar barStyle="light-content" backgroundColor={C.ink} />
        <Gol />
        <Text style={styles.title}>Mirzə</Text>
        <Text style={styles.text}>App.js faylında SITE_URL sətrinə saytınızın ünvanını yazın.</Text>
      </View>
    );
  }

  return (
    <View style={styles.full}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />
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
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: C.ink }]}>
            <Gol />
            <Text style={styles.title}>Mirzə</Text>
            <ActivityIndicator color={C.mist} style={{ marginTop: 18 }} />
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
  full: { flex: 1, backgroundColor: C.ink, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 },
  web: { flex: 1, backgroundColor: C.ink },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { color: C.paper, fontSize: 22, fontWeight: '700', marginTop: 16, letterSpacing: -0.2 },
  text: { color: C.mist, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  btn: { marginTop: 22, backgroundColor: C.copper, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10 },
  btnText: { color: C.ink, fontSize: 15, fontWeight: '700' },
});
