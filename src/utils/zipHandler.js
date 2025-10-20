import JSZip from 'jszip';

/**
 * Extract XML content from ZIP file
 * @param {File} file - The ZIP file
 * @returns {Promise<{content: string, fileName: string}>} XML content and filename
 */
export async function extractXMLFromZip(file) {
  try {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);

    // Find all XML files in the ZIP
    const allFiles = Object.keys(zipContent.files);
    console.log('Archivos encontrados en ZIP:', allFiles);

    const xmlFiles = allFiles.filter(
      fileName => fileName.toLowerCase().endsWith('.xml') && !zipContent.files[fileName].dir
    );

    if (xmlFiles.length === 0) {
      throw new Error(`No se encontró ningún archivo XML dentro del ZIP. Archivos disponibles: ${allFiles.join(', ')}`);
    }

    // If multiple XML files, prioritize by name patterns
    let selectedFile = xmlFiles[0];

    // Look for common bank statement patterns
    const patterns = ['estado', 'cuenta', 'extracto', 'movimiento', 'transacc'];
    for (const pattern of patterns) {
      const found = xmlFiles.find(f => f.toLowerCase().includes(pattern));
      if (found) {
        selectedFile = found;
        break;
      }
    }

    // Read the selected XML file
    const xmlContent = await zipContent.file(selectedFile).async('text');

    return {
      content: xmlContent,
      fileName: selectedFile,
      totalFiles: xmlFiles.length,
      allFiles: xmlFiles
    };
  } catch (error) {
    console.error('Error al extraer XML del ZIP:', error);
    throw new Error(`Error al extraer el XML del archivo ZIP: ${error.message}`);
  }
}

/**
 * Check if a file is a ZIP file based on its magic number
 * @param {File} file - The file to check
 * @returns {Promise<boolean>} True if the file is a ZIP
 */
export async function isZipFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result);
      // ZIP files start with PK (0x50 0x4B)
      if (arr.length >= 2 && arr[0] === 0x50 && arr[1] === 0x4B) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    reader.onerror = () => resolve(false);

    // Read only the first 2 bytes
    reader.readAsArrayBuffer(file.slice(0, 2));
  });
}
