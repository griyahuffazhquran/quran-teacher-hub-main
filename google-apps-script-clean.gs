/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - GRIYA HUFFAZH QURAN HUB BACKEND ENGINE
 * ============================================================================
 *
 * INSTRUKSI DEPLOYMENT:
 * 1. Buka Spreadsheet Google Anda.
 * 2. Klik Extensions (Ekstensi) > Apps Script.
 * 3. Hapus semua kode di editor, lalu Salin & Tempel seluruh kode di bawah ini.
 * 4. Klik Deploy > New deployment.
 * 5. Pilih Select type: Web App.
 * 6. Execute as: Me (Email Anda).
 * 7. Who has access: Anyone (Siapa Saja). -> WAJIB 'Anyone' agar tidak kena CORS / HTML Error!
 * 8. Klik Deploy, lalu Salin Web App URL yang dihasilkan dan simpan di Pengaturan Aplikasi.
 * ============================================================================
 */

function doGet(e) {
  var action = e.parameter.action;
  try {
    switch (action) {
      case "getTeachers":
        return jsonResponse(getTableData("teachers"));
      case "getReports":
        return jsonResponse(getTableData("reports"));
      case "getTargets":
        return jsonResponse(getTableData("targets"));
      case "getReminders":
        return jsonResponse(getTableData("reminders"));
      case "getFeedbacks":
        return jsonResponse(getTableData("feedbacks"));
      case "getComments":
        return jsonResponse(getTableData("comments"));
      case "getAnnouncements":
        return jsonResponse(getTableData("announcements"));
      case "getNotifications":
        return jsonResponse(getTableData("notifications"));
      case "getAchievements":
        return jsonResponse(getTableData("achievements"));
      case "getActivityLogs":
        return jsonResponse(getTableData("activityLogs"));
      default:
        return jsonResponse({ ok: false, error: "Action tidak dikenal: " + action });
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var data = contents.data || contents;
    var id = contents.id || (data ? data.ID : null);

    if (!action) {
      return jsonResponse({ ok: false, error: "Action wajib diisi pada payload POST." });
    }

    // Single item mutations
    if (action.startsWith("add") || action.startsWith("create")) {
      var sheetName = getSheetNameFromAction(action);
      return jsonResponse(addRowPreventDuplicates(sheetName, data));
    } else if (action.startsWith("update")) {
      var sheetName = getSheetNameFromAction(action);
      return jsonResponse(updateRowById(sheetName, id, data));
    } else if (action.startsWith("delete")) {
      var sheetName = getSheetNameFromAction(action);
      return jsonResponse(deleteRowById(sheetName, id));
    }

    return jsonResponse({ ok: false, error: "Action POST tidak dikenal: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

function getSheetNameFromAction(action) {
  var name = action.replace(/^(add|create|update|delete)/, "");
  name = name.charAt(0).toLowerCase() + name.slice(1);
  if (!name.endsWith("s")) name += "s";
  return name;
}

function getTableData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { ok: true, data: [] };

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return { ok: true, data: [] };

  var headers = values[0];
  var result = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    var hasValue = false;
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      if (header) {
        obj[header] = row[j];
        if (row[j] !== "" && row[j] !== null) hasValue = true;
      }
    }
    if (hasValue && obj.ID) {
      result.push(obj);
    }
  }

  return { ok: true, data: result };
}

function addRowPreventDuplicates(sheetName, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  // Auto create sheet if missing
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  var values = sheet.getDataRange().getValues();
  var headers = [];

  if (values.length > 0 && values[0].length > 0 && values[0][0] !== "") {
    headers = values[0];
  } else {
    headers = Object.keys(data);
    sheet.appendRow(headers);
  }

  // Check if any key in data is not in headers -> add new column to headers
  for (var k in data) {
    if (headers.indexOf(k) === -1) {
      headers.push(k);
      sheet.getRange(1, headers.length).setValue(k);
    }
  }

  var targetId = String(data.ID || data.id || "").trim();

  // Prevent Duplicates: Search if ID already exists
  if (targetId && values.length > 1) {
    var idColIdx = headers.indexOf("ID");
    if (idColIdx !== -1) {
      for (var r = 1; r < values.length; r++) {
        if (String(values[r][idColIdx]).trim() === targetId) {
          // Row already exists! Update row instead of appending duplicate!
          return updateRowById(sheetName, targetId, data);
        }
      }
    }
  }

  // Construct row in header order
  var rowData = headers.map(function (h) {
    return data[h] !== undefined ? data[h] : "";
  });

  sheet.appendRow(rowData);
  return { ok: true, message: "Row added to " + sheetName + " successfully." };
}

function updateRowById(sheetName, id, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: "Sheet " + sheetName + " tidak ditemukan." };

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return { ok: false, error: "Sheet kosong." };

  var headers = values[0];
  var idColIdx = headers.indexOf("ID");
  if (idColIdx === -1) idColIdx = headers.indexOf("id");
  if (idColIdx === -1) return { ok: false, error: "Kolom ID tidak ditemukan." };

  var targetId = String(id).trim();

  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idColIdx]).trim() === targetId) {
      for (var k in data) {
        var colIdx = headers.indexOf(k);
        if (colIdx === -1) {
          headers.push(k);
          sheet.getRange(1, headers.length).setValue(k);
          colIdx = headers.length - 1;
        }
        sheet.getRange(r + 1, colIdx + 1).setValue(data[k]);
      }
      return { ok: true, message: "Row " + targetId + " updated successfully." };
    }
  }

  // If not found, fall back to add
  return addRowPreventDuplicates(sheetName, data);
}

function deleteRowById(sheetName, id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: "Sheet " + sheetName + " tidak ditemukan." };

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return { ok: true, message: "Sheet kosong." };

  var headers = values[0];
  var idColIdx = headers.indexOf("ID");
  if (idColIdx === -1) idColIdx = headers.indexOf("id");
  if (idColIdx === -1) return { ok: false, error: "Kolom ID tidak ditemukan." };

  var targetId = String(id).trim();

  for (var r = values.length - 1; r >= 1; r--) {
    if (String(values[r][idColIdx]).trim() === targetId) {
      sheet.deleteRow(r + 1);
    }
  }

  return { ok: true, message: "Row " + targetId + " deleted successfully." };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
