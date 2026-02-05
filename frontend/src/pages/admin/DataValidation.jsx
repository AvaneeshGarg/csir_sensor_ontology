import React, { useState, useRef } from 'react';
import API_BASE_URL from '../../config';

const DataValidation = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [verificationResult, setVerificationResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0] || null;
    processSelectedFile(file);
  };

  const processSelectedFile = (file) => {
    if (file) {
      setSelectedFile(file);
      setVerificationResult('');
      setTimeout(() => {
        handleVerifyFile(file);
      }, 500);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        processSelectedFile(file);
      } else {
        setVerificationResult('❌ Please select only XLSX or XLS files.');
      }
    }
  };

  const handleVerifyFile = async (file = selectedFile) => {
    if (!file) {
      setVerificationResult('❌ Please select a file first.');
      return;
    }

    setLoading(true);
    setVerificationResult('🔄 Uploading and verifying file...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/hashing/verify_uploaded_file.php`, {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      const fileSize = (file.size / (1024 * 1024)).toFixed(2);
      const timestamp = new Date().toLocaleString();

      let message = '';
      if (result.status === 'success') {
        message = `✅ VERIFICATION SUCCESSFUL

File: "${file.name}"
Size: ${fileSize} MB
Status: SECURE & VALID
File ID: ${result.file_id}
Hash: ${result.hash}
Verified: ${timestamp}

✓ File integrity confirmed
✓ Hash match with Supabase
✓ No tampering detected`;
      } else if (result.status === 'tampered') {
        message = `❌ VERIFICATION FAILED

File: "${file.name}"
Size: ${fileSize} MB
Status: TAMPERED
Checked: ${timestamp}

⚠ File hash mismatch
⚠ Expected: ${result.details.expected}
⚠ Embedded: ${result.details.embedded}
⚠ Actual: ${result.details.actual}`;
      } else {
        message = `❌ VERIFICATION FAILED

File: "${file.name}"
Size: ${fileSize} MB
Status: INVALID
Reason: ${result.reason || 'Unknown'}
Checked: ${timestamp}`;
      }

      setVerificationResult(message);

      setVerificationHistory(prev => [
        {
          fileName: file.name,
          timestamp: new Date().toLocaleTimeString(),
          status: result.status === 'success' ? 'PASSED' : 'FAILED',
          size: `${fileSize} MB`
        },
        ...prev.slice(0, 4)
      ]);
    } catch (err) {
      setVerificationResult(`❌ VERIFICATION FAILED\n\nError: ${err.message}`);
    }

    setLoading(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setVerificationResult('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const styles = {
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#dae2f7',
      minHeight: '100vh',
      opacity: 0,
      transform: 'translateY(10px)',
      animation: 'fadeInUp 0.5s ease-out forwards'
    },
    header: {
      backgroundColor: '#1e3a8a',
      padding: '20px',
      textAlign: 'center'
    },
    headerTitle: {
      color: 'white',
      margin: '0',
      fontSize: '24px',
      fontWeight: 'bold'
    },
    sectionContainer: {
      backgroundColor: '#ffffff',
      margin: '20px',
      padding: '30px 20px',
      borderRadius: '8px'
    },
    sectionTitle: {
      color: '#374151',
      margin: '0 0 20px 0',
      fontSize: '18px',
      fontWeight: 'bold'
    },
    buttonSecondary: {
      backgroundColor: '#6b7280',
      color: 'white',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      marginLeft: '10px'
    },
    dropZone: {
      border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
      borderRadius: '8px',
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: dragActive ? '#eff6ff' : '#f9fafb',
      cursor: 'pointer',
      marginBottom: '20px',
      transition: 'all 0.3s ease'
    },
    fileInput: {
      display: 'none'
    },
    selectedFileInfo: {
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '6px',
      padding: '15px',
      marginBottom: '15px'
    },
    resultContainer: {
      marginTop: '20px',
      padding: '20px',
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '1.6',
      fontFamily: 'monospace',
      whiteSpace: 'pre-line'
    },
    resultSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #a7f3d0'
    },
    resultError: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    },
    resultProcessing: {
      backgroundColor: '#ddd6fe',
      color: '#5b21b6',
      border: '1px solid #c4b5fd'
    },
    resultDefault: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db'
    },
    historyContainer: {
      marginTop: '20px'
    },
    historyItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 15px',
      backgroundColor: '#f9fafb',
      margin: '5px 0',
      borderRadius: '4px',
      fontSize: '13px'
    }
  };

  const getResultStyle = () => {
    if (verificationResult.includes('🔄')) return { ...styles.resultContainer, ...styles.resultProcessing };
    if (verificationResult.includes('✅')) return { ...styles.resultContainer, ...styles.resultSuccess };
    if (verificationResult.includes('❌')) return { ...styles.resultContainer, ...styles.resultError };
    return { ...styles.resultContainer, ...styles.resultDefault };
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Data Validation</h1>
      </div>

      <div style={styles.sectionContainer}>
        <h3 style={styles.sectionTitle}>Verify Secure XLSX File</h3>

        <div
          style={styles.dropZone}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ marginBottom: '10px', fontSize: '18px' }}>
            {dragActive ? '📁 Drop file here!' : '📤 Drag & Drop XLSX file here'}
          </div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            or click to browse files
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            style={styles.fileInput}
          />
        </div>

        {selectedFile && (
          <div style={styles.selectedFileInfo}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                  📄 {selectedFile.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Size: {formatFileSize(selectedFile.size)} • Type: {selectedFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
                </div>
              </div>
              <button style={styles.buttonSecondary} onClick={clearFile}>Clear</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <strong style={{ color: '#374151', fontSize: '16px' }}>Verification Result:</strong>
          {verificationResult ? (
            <div style={getResultStyle()}>{verificationResult}</div>
          ) : (
            <div style={styles.resultContainer}>
              {loading ? (
                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  🔄 Processing verification...
                </span>
              ) : (
                'No verification performed yet. Select a file to begin automatic verification.'
              )}
            </div>
          )}
        </div>

        {verificationHistory.length > 0 && (
          <div style={styles.historyContainer}>
            <strong style={{ color: '#374151', fontSize: '14px', display: 'block', marginBottom: '10px' }}>
              Recent Verifications:
            </strong>
            {verificationHistory.map((entry, index) => (
              <div key={index} style={styles.historyItem}>
                <span>{entry.fileName} ({entry.size})</span>
                <span style={{
                  color: entry.status === 'PASSED' ? '#065f46' : '#991b1b',
                  fontWeight: '500'
                }}>
                  {entry.status} • {entry.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataValidation;
