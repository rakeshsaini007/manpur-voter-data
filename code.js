
/**
 * GOOGLE APPS SCRIPT BACKEND
 * Column Order: A:Booth, B:Ward, C:VoterNo, D:HouseNo, E:Name, F:Relation, G:Gender, H:Age, I:Aadhar, J:DOB, K:CalcAge, L:Photo
 */

const SHEET_NAME = 'Sheet1'; 
const DELETED_SHEET_NAME = 'Deleted';
const NEW_VOTERS_SHEET_NAME = 'NewVoters';

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'search') return handleSearch(e.parameter.booth, e.parameter.ward, e.parameter.house);
  if (action === 'searchByName') return handleSearchByName(e.parameter.query);
  if (action === 'checkAadhar') return handleCheckAadhar(e.parameter.aadhar, e.parameter.voterNo);
  if (action === 'getMetadata') return handleGetMetadata();
  return createJsonResponse({ success: false, error: 'Invalid Action' });
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    if (requestData.action === 'save') return handleSave(requestData.data);
    if (requestData.action === 'delete') return handleDelete(requestData.booth, requestData.voterNo, requestData.reason);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function handleGetMetadata() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return createJsonResponse({ success: false, error: 'Sheet1 not found' });
  const data = sheet.getDataRange().getValues();
  
  const boothSet = new Set();
  const wardMap = {}; // booth -> Set(wards)
  const houseMap = {}; // booth_ward -> Set(houses)

  for (let i = 1; i < data.length; i++) {
    const booth = String(data[i][0]).trim();
    const ward = String(data[i][1]).trim();
    const house = String(data[i][3]).trim();
    
    if (booth) {
      boothSet.add(booth);
      if (!wardMap[booth]) wardMap[booth] = new Set();
      if (ward) wardMap[booth].add(ward);
      
      const key = booth + "_" + (ward || "default");
      if (!houseMap[key]) houseMap[key] = new Set();
      if (house) houseMap[key].add(house);
    }
  }

  const formattedWardMap = {};
  const formattedHouseMap = {};
  
  Object.keys(wardMap).forEach(b => {
    formattedWardMap[b] = Array.from(wardMap[b]).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
  });
  
  Object.keys(houseMap).forEach(key => {
    formattedHouseMap[key] = Array.from(houseMap[key]).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
  });

  return createJsonResponse({ 
    success: true, 
    booths: Array.from(boothSet).sort((a,b) => a.localeCompare(b, undefined, {numeric: true})), 
    wardMap: formattedWardMap,
    houseMap: formattedHouseMap 
  });
}

function handleSearch(booth, ward, house) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const matchBooth = String(row[0]).trim() === String(booth).trim();
    const matchWard = String(row[1]).trim() === String(ward).trim();
    const matchHouse = String(row[3]).trim() === String(house).trim();
    
    if (matchBooth && matchWard && matchHouse) {
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
    const name = String(row[4]).toLowerCase();
    const rel = String(row[5]).toLowerCase();
    if (name.indexOf(q) !== -1 || rel.indexOf(q) !== -1) results.push(mapRowToVoter(row, i + 1));
  }
  return createJsonResponse({ success: true, data: results });
}

function mapRowToVoter(row, rowIdx) {
  return {
    booth: String(row[0] || ''),
    ward: String(row[1] || ''),
    voterNo: String(row[2] || ''),
    houseNo: String(row[3] || ''),
    name: String(row[4] || ''),
    relationName: String(row[5] || ''),
    gender: String(row[6] || ''),
    originalAge: String(row[7] || ''),
    aadhar: String(row[8] || ''),
    dob: String(row[9] ? Utilities.formatDate(new Date(row[9]), "GMT+5:30", "yyyy-MM-dd") : ''),
    calculatedAge: String(row[10] || ''),
    aadharPhoto: String(row[11] || ''),
    rowIdx: rowIdx
  };
}

function handleCheckAadhar(aadhar, currentVoterNo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][8]) === String(aadhar) && String(data[i][2]) !== String(currentVoterNo)) {
      return createJsonResponse({ isDuplicate: true, member: mapRowToVoter(data[i], i + 1) });
    }
  }
  return createJsonResponse({ isDuplicate: false });
}

function handleSave(voters) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const dataRows = sheet.getDataRange().getValues();
  
  if (sheet.getLastColumn() < 12) {
    sheet.getRange(1, 1).setValue('Booth');
    sheet.getRange(1, 2).setValue('Ward');
    sheet.getRange(1, 12).setValue('Photo');
  }

  let newVotersSheet = ss.getSheetByName(NEW_VOTERS_SHEET_NAME);
  if (!newVotersSheet) {
    newVotersSheet = ss.insertSheet(NEW_VOTERS_SHEET_NAME);
    const headers = ["Booth", "Ward", "VoterNo", "HouseNo", "Name", "Relation", "Gender", "Age", "Aadhar", "DOB", "CalcAge", "Photo", "AddedOn"];
    newVotersSheet.appendRow(headers);
  }
  
  voters.forEach(v => {
    let rowIndex = -1;
    for (let i = 1; i < dataRows.length; i++) {
      if (String(dataRows[i][0]) === String(v.booth) && String(dataRows[i][2]) === String(v.voterNo)) {
        rowIndex = i + 1;
        break;
      }
    }
    
    let photoData = v.aadharPhoto || '';
    if (photoData.length > 50000) photoData = photoData.substring(0, 49990); 

    const rowValues = [
      v.booth, v.ward, v.voterNo, v.houseNo, v.name, v.relationName, v.gender, v.originalAge, v.aadhar, v.dob, v.calculatedAge, photoData
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, 12).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      const logRow = [...rowValues];
      logRow[12] = new Date(); 
      newVotersSheet.appendRow(logRow);
    }
  });
  
  return createJsonResponse({ success: true, message: 'सफलतापूर्वक सहेजा गया' });
}

function handleDelete(booth, voterNo, reason) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const dataRows = sheet.getDataRange().getValues();
  let deletedSheet = ss.getSheetByName(DELETED_SHEET_NAME);
  if (!deletedSheet) {
    deletedSheet = ss.insertSheet(DELETED_SHEET_NAME);
    const headers = ["Booth", "Ward", "VoterNo", "HouseNo", "Name", "Relation", "Gender", "Age", "Aadhar", "DOB", "CalcAge", "Photo", "Reason", "Time"];
    deletedSheet.appendRow(headers);
  }
  let rowIndex = -1;
  for (let i = 1; i < dataRows.length; i++) {
    if (String(dataRows[i][0]) === String(booth) && String(dataRows[i][2]) === String(voterNo)) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex > 0) {
    const rowValues = [...dataRows[rowIndex - 1]];
    while(rowValues.length < 12) rowValues.push('');
    rowValues[12] = reason || 'N/A';
    rowValues[13] = new Date();
    deletedSheet.appendRow(rowValues);
    sheet.deleteRow(rowIndex);
    return createJsonResponse({ success: true, message: 'हटाया गया' });
  }
  return createJsonResponse({ success: false, message: 'नहीं मिला' });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
