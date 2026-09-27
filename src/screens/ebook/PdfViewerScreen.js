import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:5000/api';

// แปลง Path สัมพัทธ์ให้เป็น Full URL
function resolvePdfUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;

  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url.trim();
    }
    const apiOrigin = new URL(API_BASE_URL).origin;
    const resolvedUrl = new URL(url.trim(), `${apiOrigin}/`);
    return ['http:', 'https:'].includes(resolvedUrl.protocol) ? resolvedUrl.href : null;
  } catch (error) {
    console.error('Invalid ebook PDF URL:', error);
    return null;
  }
}

// สร้างโครงสร้าง HTML สำหรับ PDF.js รันบน WebView (มือถือ)
function createPdfHtml(pdfUrl) {
  const safePdfUrl = JSON.stringify(pdfUrl).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3">
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 12px; background: #e5e7eb; font-family: sans-serif; }
      #pages { display: flex; flex-direction: column; align-items: center; gap: 12px; }
      .page { position: relative; width: 100%; max-width: 900px; background: white; box-shadow: 0 1px 5px #777; }
      canvas { display: block; width: 100%; height: 100%; }
      #status { padding: 24px; color: #374151; text-align: center; }
    </style>
  </head>
  <body>
    <div id="status">กำลังโหลดเอกสาร...</div>
    <main id="pages"></main>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
      (() => {
        const pdfUrl = ${safePdfUrl};
        const status = document.getElementById('status');
        const pagesElement = document.getElementById('pages');
        const notify = (message) => window.ReactNativeWebView?.postMessage(JSON.stringify(message));

        if (!window.pdfjsLib) {
          status.textContent = 'โหลดตัวแสดง PDF ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
          notify({ type: 'error', message: 'โหลดตัวแสดง PDF ไม่สำเร็จ' });
          return;
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        pdfjsLib.getDocument(pdfUrl).promise.then(async (pdf) => {
          status.remove();
          notify({ type: 'loaded', totalPages: pdf.numPages });
          const pageElements = [];
          const renderingPages = new Set();

          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1 });
            const element = document.createElement('section');
            element.className = 'page';
            element.dataset.page = pageNumber;
            element.style.aspectRatio = viewport.width + ' / ' + viewport.height;
            const canvas = document.createElement('canvas');
            element.appendChild(canvas);
            pagesElement.appendChild(element);
            pageElements.push({ element, page, canvas });
          }

          const observer = new IntersectionObserver((entries) => {
            entries.forEach(({ target, isIntersecting }) => {
              const pageNumber = Number(target.dataset.page);
              const entry = pageElements[pageNumber - 1];
              if (!isIntersecting) {
                if (!renderingPages.has(pageNumber)) {
                  entry.canvas.width = 0;
                  entry.canvas.height = 0;
                }
                return;
              }

              notify({ type: 'page', currentPage: pageNumber });
              if (renderingPages.has(pageNumber)) return;

              renderingPages.add(pageNumber);
              const scale = Math.min(target.clientWidth / entry.page.view[2], 2);
              const viewport = entry.page.getViewport({ scale });
              const pixelRatio = window.devicePixelRatio || 1;
              entry.canvas.width = Math.floor(viewport.width * pixelRatio);
              entry.canvas.height = Math.floor(viewport.height * pixelRatio);
              entry.canvas.style.width = viewport.width + 'px';
              entry.canvas.style.height = viewport.height + 'px';
              entry.page.render({
                canvasContext: entry.canvas.getContext('2d'),
                viewport,
                transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0],
              }).promise.catch(() => {
                notify({ type: 'error', message: 'แสดงหน้า PDF ไม่สำเร็จ' });
              }).finally(() => renderingPages.delete(pageNumber));
            });
          }, { threshold: 0.5 });

          pageElements.forEach(({ element }) => observer.observe(element));
        }).catch((error) => {
          status.textContent = 'เปิดไฟล์ PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
          notify({ type: 'error', message: error.message || 'เปิดไฟล์ PDF ไม่สำเร็จ' });
        });
      })();
    </script>
  </body>
</html>`;
}

export default function PdfViewerScreen({ navigation, route }) {
  // ดึงค่า parameter รองรับทั้งแบบส่ง ebook หรือส่ง pdfUrl ตรงๆ
  const ebook = route.params?.ebook;
  const rawPdfUrl = route.params?.pdfUrl || ebook?.pdfUrl || ebook?.fileUrl;
  const title = route.params?.title || ebook?.title || 'อ่าน E-Book';

  const pdfUrl = resolvePdfUrl(rawPdfUrl);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(pdfUrl));
  const [error, setError] = useState(
    pdfUrl ? '' : 'ไม่พบไฟล์ PDF สำหรับหนังสือเล่มนี้',
  );

  const html = useMemo(() => (pdfUrl ? createPdfHtml(pdfUrl) : ''), [pdfUrl]);

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'loaded') {
        setTotalPages(message.totalPages);
        setIsLoading(false);
      } else if (message.type === 'page') {
        setCurrentPage(message.currentPage);
      } else if (message.type === 'error') {
        setError(message.message || 'เปิดไฟล์ PDF ไม่สำเร็จ');
        setIsLoading(false);
      }
    } catch (parseError) {
      console.error('Invalid PDF viewer message:', parseError);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#1E2B58" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {Platform.OS !== 'web' && (
          <Text style={styles.pageCount}>
            หน้า {currentPage}/{totalPages || '–'}
          </Text>
        )}
      </View>

      {/* Content Area */}
      {error ? (
        <View style={styles.center}>
          <Feather name="file-text" size={40} color="#9ca3af" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : Platform.OS === 'web' ? (
        <View style={styles.viewer}>
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title={title}
          />
        </View>
      ) : (
        <View style={styles.viewer}>
          {isLoading && (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#1E3A8A" />
              <Text style={styles.loadingText}>กำลังโหลด PDF...</Text>
            </View>
          )}
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: pdfUrl }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            onMessage={handleMessage}
            onError={(event) => {
              setError(event.nativeEvent.description || 'โหลด PDF ไม่สำเร็จ');
              setIsLoading(false);
            }}
            onHttpError={(event) => {
              setError(`โหลด PDF ไม่สำเร็จ (HTTP ${event.nativeEvent.statusCode})`);
              setIsLoading(false);
            }}
            style={styles.webView}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1d5db',
  },
  backButton: { padding: 6, marginRight: 8 },
  title: { flex: 1, color: '#1E2B58', fontSize: 16, fontWeight: '600' },
  pageCount: { color: '#4b5563', fontSize: 13, marginLeft: 8 },
  viewer: { flex: 1 },
  webView: { flex: 1, backgroundColor: '#e5e7eb' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: { marginTop: 12, color: '#4b5563' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#4b5563', fontSize: 15, textAlign: 'center', marginTop: 12 },
});