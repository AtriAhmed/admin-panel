import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DocumentScanner, {
  ResponseType,
  ScanDocumentResponseStatus,
} from 'react-native-document-scanner-plugin';

const INITIAL_MESSAGE = 'Scan your ID or document.';

export default function App() {
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState(INITIAL_MESSAGE);

  const scanDocument = async () => {
    if (isScanning) {
      return;
    }

    try {
      setIsScanning(true);
      setMessage('Opening document scanner...');

      const result = await DocumentScanner.scanDocument({
        croppedImageQuality: 100,
        maxNumDocuments: 1,
        responseType: ResponseType.ImageFilePath,
      });

      if (result.status === ScanDocumentResponseStatus.Success && result.scannedImages?.[0]) {
        setScannedImageUri(result.scannedImages[0]);
        setMessage('Document scanned successfully.');
        return;
      }

      setMessage('Scan cancelled. You can try again.');
    } catch (error) {
      console.warn('Failed to scan document:', error);
      setMessage('Document scanner is unavailable. Use a development build, not Expo Go.');
    } finally {
      setIsScanning(false);
    }
  };

  const retake = () => {
    setScannedImageUri(null);
    setMessage(INITIAL_MESSAGE);
    scanDocument();
  };

  const usePhoto = () => {
    if (scannedImageUri) {
      console.log('Scanned document URI:', scannedImageUri);
    }
  };

  if (scannedImageUri) {
    return (
      <SafeAreaView style={styles.previewContainer}>
        <StatusBar style="light" />

        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Review your ID</Text>
          <Text style={styles.previewSubtitle}>The document scanner cropped the detected document.</Text>
        </View>

        <Image source={{ uri: scannedImageUri }} style={styles.previewImage} />

        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={retake}>
            <Text style={styles.secondaryButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={usePhoto}>
            <Text style={styles.primaryButtonText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Text style={styles.title}>Scan your ID</Text>
        <Text style={styles.subtitle}>
          Hold the phone in portrait or landscape. The scanner will detect the document edges automatically.
        </Text>

        <View style={styles.statusBox}>
          {isScanning ? <ActivityIndicator color="#2563eb" /> : null}
          <Text style={styles.statusText}>{message}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={isScanning}
          style={[styles.primaryButton, isScanning && styles.disabledButton]}
          onPress={scanDocument}
        >
          <Text style={styles.primaryButtonText}>{isScanning ? 'Opening...' : 'Scan ID'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 14,
    textAlign: 'center',
  },
  statusBox: {
    alignItems: 'center',
    gap: 12,
    marginTop: 34,
    minHeight: 64,
  },
  statusText: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewHeader: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 12,
  },
  previewTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewSubtitle: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.65,
  },
});
