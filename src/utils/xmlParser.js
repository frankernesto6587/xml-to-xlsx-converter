import { xml2js } from 'xml-js';

/**
 * Parse XML bank statement and extract transaction data
 * @param {string} xmlContent - The XML content as string
 * @returns {Object} Structured data with initial balance, transactions, and final balances
 */
export function parseXML(xmlContent) {
  try {
    // Convert XML to JSON
    const result = xml2js(xmlContent, { compact: true, spaces: 2 });

    // Navigate to the transaction elements
    const dataset = result.NewDataSet;
    if (!dataset) {
      throw new Error('Formato XML inválido: No se encontró NewDataSet');
    }

    // Get all Estado_x0020_de_x0020_Cuenta elements
    let records = dataset['Estado_x0020_de_x0020_Cuenta'];

    if (!records) {
      throw new Error('No se encontraron registros en el archivo');
    }

    // Ensure it's an array
    if (!Array.isArray(records)) {
      records = [records];
    }

    // Separate records into categories
    let saldoInicial = null;
    const transactions = [];
    const saldosFinales = {};

    records.forEach(record => {
      const observ = getElementText(record.observ);
      const importe = getElementText(record.importe);
      const tipo = getElementText(record.tipo);

      // Detect balance records
      if (observ.includes('Saldo Contable Anterior')) {
        saldoInicial = { importe, tipo };
      } else if (observ.includes('Saldo Contable Final')) {
        saldosFinales.contable = { importe, tipo };
      } else if (observ.includes('Saldo Reservado')) {
        saldosFinales.reservado = { importe, tipo };
      } else if (observ.includes('Saldo Sobre Giro')) {
        saldosFinales.sobreGiro = { importe, tipo };
      } else if (observ.includes('Saldo Disponible Final')) {
        saldosFinales.disponible = { importe, tipo };
      } else {
        // Regular transaction - parse details
        const parsedTransaction = parseTransactionDetails(record);
        transactions.push(parsedTransaction);
      }
    });

    return {
      saldoInicial,
      transactions,
      saldosFinales,
    };
  } catch (error) {
    console.error('Error parsing XML:', error);
    throw new Error(`Error al procesar el archivo XML: ${error.message}`);
  }
}

/**
 * Parse transaction details from a record
 */
function parseTransactionDetails(record) {
  const observ = getElementText(record.observ);
  const decodedObserv = decodeHTMLEntities(observ);

  // Extract structured data from observation
  const extractedData = extractObservationData(decodedObserv);

  return {
    fecha: getElementText(record.fecha),
    referencia_corriente: getElementText(record.ref_corrie),
    referencia_origen: getElementText(record.ref_origin),
    importe: getElementText(record.importe),
    tipo: getElementText(record.tipo),
    ...extractedData,
    observacion_completa: decodedObserv,
  };
}

/**
 * Extract structured data from observation field
 */
function extractObservationData(observ) {
  const data = {
    ordenante_nombre: '',
    ordenante_cuenta: '',
    ordenante_ci: '',
    ordenante_tarjeta: '',
    beneficiario_cuenta: '',
    concepto: '',
    canal: '',
  };

  // Extract ordenante name
  const ordenanteMatch = observ.match(/ORDENANTE NOMBRE:([^|]+)/i) ||
                        observ.match(/ORDENADA POR:\s*([^P]+?)(?:PAN:|$)/i);
  if (ordenanteMatch) {
    data.ordenante_nombre = ordenanteMatch[1].trim();
  }

  // Extract CI
  const ciMatch = observ.match(/CI:(\d+)/i);
  if (ciMatch) {
    data.ordenante_ci = ciMatch[1].trim();
  }

  // Extract card/PAN
  const panMatch = observ.match(/(?:PAN|Tarjeta)(?:#|RED)?:\s*(\d+X+\d+)/i);
  if (panMatch) {
    data.ordenante_tarjeta = panMatch[1].trim();
  }

  // Extract account numbers
  const cuentaOrdenMatch = observ.match(/NUM_CUENTA="(\d+)"/);
  if (cuentaOrdenMatch) {
    data.ordenante_cuenta = cuentaOrdenMatch[1].trim();
  }

  const cuentaBenefMatch = observ.match(/BENEFICIARIO:\s*(\d+)/i);
  if (cuentaBenefMatch) {
    data.beneficiario_cuenta = cuentaBenefMatch[1].trim();
  }

  // Extract channel/method
  if (observ.includes('BANCAMOVIL') || observ.includes('BANCA MOVIL')) {
    data.canal = 'Banca Móvil';
  } else if (observ.includes('CORREO ELECTRONICO')) {
    data.canal = 'Transferencia Electrónica';
  } else if (observ.includes('TRANSFERENCIA')) {
    data.canal = 'Transferencia';
  }

  // Extract concept
  const conceptMatch = observ.match(/DET_PAGO>([^<]+)</i);
  if (conceptMatch) {
    data.concepto = conceptMatch[1].trim().substring(0, 100);
  } else {
    // Use first part of observation as concept
    data.concepto = observ.split('\n')[0].substring(0, 100);
  }

  return data;
}

/**
 * Helper function to extract text from XML element
 * @param {Object} element - XML element
 * @returns {string} Text content or empty string
 */
function getElementText(element) {
  if (!element) return '';
  if (typeof element === 'string') return element;
  if (element._text) return element._text;
  if (element._cdata) return element._cdata;
  return '';
}

/**
 * Decode HTML entities in a string
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
export function decodeHTMLEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}
