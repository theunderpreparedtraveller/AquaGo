// webviewcomponent.tsx
import React from 'react';
import { WebView } from 'react-native-webview';

export default function PaymentWebView({ url }: { url: string }) {
  return (
    <WebView
      source={{ uri: url }}
      startInLoadingState
      javaScriptEnabled
      domStorageEnabled
    />
  );
}
