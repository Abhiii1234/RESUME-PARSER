/**
 * pdfParser.js
 * Pure Node.js PDF text extractor — no external dependencies.
 * Extracts readable text from PDF binary streams.
 */

'use strict';

const fs = require('fs');

/**
 * Decode PDF-encoded string (handles hex strings and escape sequences)
 */
function decodePdfString(raw) {
  if (!raw) return '';

  // Hex string: <hex data>
  if (raw.startsWith('<') && raw.endsWith('>')) {
    const hex = raw.slice(1, -1).replace(/\s/g, '');
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  }

  // Literal string: (string)
  if (raw.startsWith('(') && raw.endsWith(')')) {
    raw = raw.slice(1, -1);
  }

  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

/**
 * Extract text from a single content stream
 */
function extractTextFromStream(stream) {
  const tokens = [];
  // Match Tj, TJ, Td, TD, T*, Tf, Tm operators and their operands
  const tjRegex = /\((?:[^\\)]|\\.)*\)\s*Tj/g;
  const tjArrayRegex = /\[((?:[^[\]])*)\]\s*TJ/g;

  let match;

  // Extract Tj strings
  while ((match = tjRegex.exec(stream)) !== null) {
    const str = match[0].replace(/\s*Tj$/, '').trim();
    tokens.push(decodePdfString(str));
  }

  // Extract TJ arrays
  while ((match = tjArrayRegex.exec(stream)) !== null) {
    const arrayContent = match[1];
    const strRegex = /\((?:[^\\)]|\\.)*\)/g;
    let strMatch;
    const parts = [];
    while ((strMatch = strRegex.exec(arrayContent)) !== null) {
      const decoded = decodePdfString(strMatch[0]);
      if (decoded.trim()) parts.push(decoded);
    }
    if (parts.length) tokens.push(parts.join(''));
  }

  return tokens.join(' ');
}

/**
 * Decompress zlib/deflate streams (handles FlateDecode)
 * Returns null if not deflate compressed
 */
function tryDeflate(buffer) {
  try {
    const zlib = require('zlib');
    // Try zlib decompress
    return zlib.inflateSync(buffer).toString('latin1');
  } catch (e) {
    try {
      const zlib = require('zlib');
      return zlib.inflateRawSync(buffer).toString('latin1');
    } catch (e2) {
      return null;
    }
  }
}

/**
 * Main PDF parser — extracts all text content
 * @param {string} filePath - Path to the PDF file
 * @returns {string} - Extracted plain text
 */
function parsePdf(filePath) {
  const buf = fs.readFileSync(filePath);
  const content = buf.toString('latin1');

  const textParts = [];

  // Find all stream ... endstream blocks
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;

  while ((match = streamRegex.exec(content)) !== null) {
    const streamStart = match.index + match[0].indexOf('\n') + 1;
    const streamEnd = content.indexOf('endstream', streamStart);
    if (streamEnd === -1) continue;

    // Get the raw stream bytes
    const streamContent = match[1];

    // Check if preceding object has FlateDecode filter
    const objStart = content.lastIndexOf('<<', match.index);
    const dictPart = objStart !== -1 ? content.slice(objStart, match.index) : '';
    const isFlate = /FlateDecode|Fl\b/.test(dictPart);

    let text = '';

    if (isFlate) {
      // Try to decompress
      const startByte = buf.indexOf('stream', match.index) + 'stream'.length;
      // Skip \r\n or \n after stream keyword
      let actualStart = startByte;
      if (buf[actualStart] === 0x0d) actualStart++;
      if (buf[actualStart] === 0x0a) actualStart++;

      const endByte = buf.indexOf(Buffer.from('endstream'), actualStart);
      if (endByte !== -1) {
        const streamBuf = buf.slice(actualStart, endByte);
        const decompressed = tryDeflate(streamBuf);
        if (decompressed) {
          text = extractTextFromStream(decompressed);
        }
      }
    } else {
      text = extractTextFromStream(streamContent);
    }

    if (text.trim()) {
      textParts.push(text);
    }
  }

  // Fallback: direct text extraction from raw content (for unencrypted PDFs)
  if (textParts.length === 0 || textParts.join(' ').trim().length < 100) {
    // Try extracting raw readable ASCII text
    const readable = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Pull out anything that looks like words (sequences of printable chars)
    const wordBlocks = readable.match(/[A-Za-z][A-Za-z0-9@.,\-_\+\/ ]{3,}/g) || [];
    if (wordBlocks.length > 10) {
      textParts.push(wordBlocks.join(' '));
    }
  }

  return textParts.join('\n').replace(/\s+/g, ' ').trim();
}

/**
 * Parse PDF from a Buffer (for API multipart uploads)
 */
function parsePdfBuffer(buffer) {
  const tmpFile = `/tmp/resume_${Date.now()}.pdf`;
  fs.writeFileSync(tmpFile, buffer);
  try {
    return parsePdf(tmpFile);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

module.exports = { parsePdf, parsePdfBuffer };
