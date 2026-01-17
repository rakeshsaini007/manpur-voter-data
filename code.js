
/**
 * GOOGLE APPS SCRIPT BACKEND
 * 
 * Instructions:
 * 1. Open Google Sheets.
 * 2. Extensions -> Apps Script.
 * 3. Copy-paste this code into the editor.
 * 4. Deploy as Web App -> Execute as me -> Access 'Anyone'.
 * 5. Update GAS_DEPLOY_URL in constants.ts with the generated URL.
 */

const SHEET_NAME = 'Sheet1'; 

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'search') {
    return handleSearch(e.parameter.booth, e.parameter.house);
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
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function handleGetMetadata() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const boothMap = {}; // { booth: [house1, house2] }
  
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0]).trim() === String(booth).trim() && String(row[2]).trim() === String(house).trim()) {
      results.push({
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
        rowIdx: i + 1
      });
    }
  }
  
  return createJsonResponse({ success: true, data: results });
}

function handleCheckAadhar(aadhar, currentVoterNo) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[7]) === String(aadhar) && String(row[1]) !== String(currentVoterNo)) {
      return createJsonResponse({
        isDuplicate: true,
        member: {
          name: row[3],
          voterNo: row[1],
          houseNo: row[2],
          booth: row[0]
        }
      });
    }
  }
  return createJsonResponse({ isDuplicate: false });
}

function handleSave(voters) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const dataRows = sheet.getDataRange().getValues();
  
  voters.forEach(v => {
    let rowIndex = -1;
    for (let i = 1; i < dataRows.length; i++) {
      if (String(dataRows[i][0]) === String(v.booth) && String(dataRows[i][1]) === String(v.voterNo)) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex > 0) {
      // Update existing - Added Name, Relation, Gender, Age
      sheet.getRange(rowIndex, 4).setValue(v.name);
      sheet.getRange(rowIndex, 5).setValue(v.relationName);
      sheet.getRange(rowIndex, 6).setValue(v.gender);
      sheet.getRange(rowIndex, 7).setValue(v.originalAge);
      sheet.getRange(rowIndex, 8).setValue(v.aadhar);
      sheet.getRange(rowIndex, 9).setValue(v.dob);
      sheet.getRange(rowIndex, 10).setValue(v.calculatedAge);
    } else {
      // Add new
      sheet.appendRow([
        v.booth, v.voterNo, v.houseNo, v.name, v.relationName, v.gender, v.originalAge, v.aadhar, v.dob, v.calculatedAge
      ]);
    }
  });
  
  return createJsonResponse({ success: true, message: 'Saved successfully' });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
