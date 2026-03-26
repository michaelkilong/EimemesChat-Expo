// MathView.tsx — v1.0 (Expo)
// KaTeX math rendering via WebView. Matches web app's renderMarkdown math output.
// Display mode: full-width block ($$...$$). Inline mode: text-flow height ($...$).
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useApp } from '../context/AppContext';

interface Props {
  eq: string;
  displayMode?: boolean;
}

function buildHtml(eq: string, displayMode: boolean, bgColor: string, textColor: string): string {
  // KaTeX loaded from CDN — app requires internet anyway
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    background: transparent;
    color: ${textColor};
    font-size: 16px;
    overflow: hidden;
  }
  .math-wrap {
    padding: ${displayMode ? '8px 0' : '0 2px'};
    display: ${displayMode ? 'block' : 'inline-block'};
    text-align: ${displayMode ? 'center' : 'left'};
    width: 100%;
  }
  .katex { color: ${textColor}; }
</style>
</head>
<body>
<div class="math-wrap" id="math"></div>
<script>
  try {
    katex.render(${JSON.stringify(eq)}, document.getElementById('math'), {
      displayMode: ${displayMode},
      throwOnError: false,
      output: 'html'
    });
  } catch(e) {
    document.getElementById('math').textContent = ${JSON.stringify(eq)};
  }
  // Send rendered height back to RN
  setTimeout(function() {
    var h = document.body.scrollHeight;
    window.ReactNativeWebView.postMessage(String(h));
  }, 100);
</script>
</body>
</html>`;
}

export default function MathView({ eq, displayMode = false }: Props) {
  const { theme } = useApp();
  const [height, setHeight] = useState(displayMode ? 60 : 28);

  const html = buildHtml(eq, displayMode, 'transparent', theme.text1);

  return (
    <View style={[
      styles.container,
      displayMode ? styles.display : styles.inline,
      { height },
    ]}>
      <WebView
        source={{ html }}
        style={StyleSheet.absoluteFillObject}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onMessage={(e) => {
          const h = parseFloat(e.nativeEvent.data);
          if (!isNaN(h) && h > 0) setHeight(h + 4);
        }}
        backgroundColor="transparent"
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden' },
  display:   { marginVertical: 8 },
  inline:    { marginHorizontal: 2 },
});
