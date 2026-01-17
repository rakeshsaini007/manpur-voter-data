
/**
 * GOOGLE APPS SCRIPT BACKEND
 */

const SHEET_NAME = 'Sheet1'; 
const DELETED_SHEET_NAME = 'Deleted';
const NEW_VOTERS_SHEET_NAME = 'NewVoters';

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'search') {
    return handleSearch(e.parameter.booth, e.parameter.house);
  } else if (action === 'searchByName') {
    return handleSearchByName(e.parameter.query);
  } else if (action === 'checkAadhar') {
    return handleCheckAadhar(e.parameter.aadhar, e.parameter.voterNo);
  } else if (action === 'getMetadata') {
    return handleGetMetadata();
  }
  
  return createJsonResponse({ success: false, error: 'Invalid Action' });
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    if (requestData.action === 'save') {
      return handleSave(requestData.data);
    } else if (requestData.action === 'delete') {
      return handleDelete(requestData.booth, requestData.voterNo, requestData.reason);
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function handleGetMetadata() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return createJsonResponse({ success: false, error: 'Sheet1 not found' });
  
  const data = sheet.getDataRange().getValues();
  const boothMap = {};
  
  for (let i = 1; i < data.length; i++) {
    const booth = String(data[i][0]).trim();
    const house = String(data[i][2]).trim();
    if (booth && house) {
      if (!boothMap[booth]) boothMap[booth] = new Set();
      boothMap[booth].add(house);
    }
  }
  
  const formattedMap = {};
  const booths = Object.keys(boothMap).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
  booths.forEach(b => {
    formattedMap[b] = Array.from(boothMap[b]).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
  });
  
  return createJsonResponse({ success: true, booths, houseMap: formattedMap });
}

function handleSearch(booth, house) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0]).trim() === String(booth).trim() && String(row[2]).trim() === String(house).trim()) {
      results.push(mapRowToVoter(row, i + 1));
    }
  }
  
  return createJsonResponse({ success: true, data: results });
}

function handleSearchByName(query) {
  if (!query) return createJsonResponse({ success: true, data: [] });
  const q = String(query).toLowerCase().trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = String(row[3]).toLowerCase();
    const relationName = String(row[4]).toLowerCase();
    
    if (name.indexOf(q) !== -1 || relationName.indexOf(q) !== -1) {
      results.push(mapRowToVoter(row, i + 1));
    }
  }
  
  return createJsonResponse({ success: true, data: results });
}

function mapRowToVoter(row, rowIdx) {
  return {
    booth: String(row[0]),
    voterNo: String(row[1]),
    houseNo: String(row[2]),
    name: String(row[3]),
    relationName: String(row[4]),
    gender: String(row[5]),
    originalAge: String(row[6]),
    aadhar: String(row[7] || ''),
    dob: String(row[8] ? Utilities.formatDate(new Date(row[8]), "GMT+5:30", "yyyy-MM-dd") : ''),
    calculatedAge: String(row[9] || ''),
    rowIdx: rowIdx
  };
}

function handleCheckAadhar(aadhar, currentVoterNo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[7]) === String(aadhar) && String(row[1]) !== String(currentVoterNo)) {
      return createJsonResponse({
        isDuplicate: true,
        member: mapRowToVoter(row, i + 1)
      });
    }
  }
  return createJsonResponse({ isDuplicate: false });
}

function handleSave(voters) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const dataRows = sheet.getDataRange().getValues();
  
  // Ensure NewVoters sheet exists
  let newVotersSheet = ss.getSheetByName(NEW_VOTERS_SHEET_NAME);
  if (!newVotersSheet) {
    newVotersSheet = ss.insertSheet(NEW_VOTERS_SHEET_NAME);
    const headers = [...dataRows[0]];
    headers[10] = 'Added On'; // 11th column for timestamp
    newVotersSheet.appendRow(headers);
  }
  
  voters.forEach(v => {
    let rowIndex = -1;
    // Check if voter already exists in Sheet1
    for (let i = 1; i < dataRows.length; i++) {
      if (String(dataRows[i][0]) === String(v.booth) && String(dataRows[i][1]) === String(v.voterNo)) {
        rowIndex = i + 1;
        break;
      }
    }
    
    const rowValues = [
      v.booth, v.voterNo, v.houseNo, v.name, v.relationName, v.gender, v.originalAge, v.aadhar, v.dob, v.calculatedAge
    ];

    if (rowIndex > 0) {
      // Member exists: Update in Sheet1
      sheet.getRange(rowIndex, 1, 1, 10).setValues([rowValues]);
    } else {
      // New Member: Add to both Sheet1 and NewVoters
      sheet.appendRow(rowValues);
      
      const newVoterRow = [...rowValues];
      newVoterRow[10] = new Date(); // Add timestamp
      newVotersSheet.appendRow(newVoterRow);
    }
  });
  
  return createJsonResponse({ success: true, message: 'डेटा सफलतापूर्वक सहेजा गया' });
}

function handleDelete(booth, voterNo, reason) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const dataRows = sheet.getDataRange().getValues();
  
  let deletedSheet = ss.getSheetByName(DELETED_SHEET_NAME);
  if (!deletedSheet) {
    deletedSheet = ss.insertSheet(DELETED_SHEET_NAME);
    const headers = [...dataRows[0]];
    headers[10] = 'Deletion Reason';
    headers[11] = 'Deletion Time';
    deletedSheet.appendRow(headers);
  }
  
  let rowIndex = -1;
  for (let i = 1; i < dataRows.length; i++) {
    if (String(dataRows[i][0]) === String(booth) && String(dataRows[i][1]) === String(voterNo)) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex > 0) {
    const rowValues = [...dataRows[rowIndex - 1]];
    rowValues[10] = reason || 'N/A';
    rowValues[11] = new Date();
    deletedSheet.appendRow(rowValues);
    sheet.deleteRow(rowIndex);
    return createJsonResponse({ success: true, message: 'सदस्य को सफलतापूर्वक हटाया गया' });
  }
  
  return createJsonResponse({ success: false, message: 'सदस्य नहीं मिला' });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
