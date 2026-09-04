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
 * 8. Klik Deploy, lalu Salin Web App URL yang dihasilkan.
 * ============================================================================
 */

function doGet(e) {
  e = e || { parameter: {} };
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getTeachers";
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
      case "getMasterBadges":
        return jsonResponse(getTableData("masterBadges"));
      case "getActivityLogs":
        return jsonResponse(getTableData("activityLogs"));
      case "getTeacherRanks":
        return jsonResponse(getTableData("teacherRanks"));
      case "getXpConfig":
        return jsonResponse(getTableData("xpConfig"));
      case "migrateTeacherIds":
        return jsonResponse(migrateAndCleanAllTeacherIds());
      case "getPresence":
        var cache = CacheService.getScriptCache();
        var rawCache = cache.get("ACTIVE_PRESENCE") || "{}";
        var mapData = {};
        try { mapData = JSON.parse(rawCache); } catch(err) {}
        var nowTime = new Date().getTime();
        for (var pk in mapData) {
          if (nowTime - mapData[pk].lastSeenAt > 45000) { delete mapData[pk]; }
        }
        return jsonResponse({ ok: true, presenceMap: mapData });
      default:
        return jsonResponse({ ok: false, error: "Action tidak dikenal: " + action });
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function doPost(e) {
  e = e || { postData: { contents: "{}" } };
  try {
    var rawContents = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var contents = JSON.parse(rawContents);
    var action = contents.action;
    var data = contents.data || contents;
    var id = contents.id || (data ? data.ID : null);

    if (!action) {
      return jsonResponse({ ok: false, error: "Action wajib diisi pada payload POST." });
    }

    if (action === "updatePresence") {
      var cache = CacheService.getScriptCache();
      var rawCache = cache.get("ACTIVE_PRESENCE") || "{}";
      var mapData = {};
      try { mapData = JSON.parse(rawCache); } catch(e) {}
      var nowTime = new Date().getTime();
      if (data && data.userId) {
        mapData[data.userId] = {
          tabId: data.userId,
          userId: data.userId,
          userName: data.userName || "",
          userRole: data.userRole || "teacher",
          gender: data.gender || "",
          position: data.position || "",
          currentPath: data.currentPath || "/",
          deviceInfo: data.deviceInfo || "HP / Tablet",
          lastSeenAt: nowTime,
          status: data.status || "online"
        };
      }
      for (var pk in mapData) {
        if (nowTime - mapData[pk].lastSeenAt > 45000) { delete mapData[pk]; }
      }
      cache.put("ACTIVE_PRESENCE", JSON.stringify(mapData), 60);
      return jsonResponse({ ok: true, presenceMap: mapData });
    }

    if (action === "requestPasswordReset") {
      return jsonResponse(requestPasswordReset(data));
    }

    if (action === "login") {
      var username = (data.username || contents.username || "").toString().trim().toLowerCase();
      var password = (data.password || contents.password || "").toString().trim();

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = findSheetSafely(ss, "teachers");
      if (!sheet) return jsonResponse({ ok: false, error: "Username atau password salah." });

      var values = sheet.getDataRange().getValues();
      if (values.length < 2) return jsonResponse({ ok: false, error: "Username atau password salah." });

      var headers = values[0];
      var unameCol = headers.indexOf("Username");
      if (unameCol === -1) unameCol = headers.indexOf("username");

      var passCol = headers.indexOf("Password");
      if (passCol === -1) passCol = headers.indexOf("password");

      var statusCol = headers.indexOf("Status");

      if (unameCol === -1) return jsonResponse({ ok: false, error: "Username atau password salah." });

      for (var r = 1; r < values.length; r++) {
        var rowUname = String(values[r][unameCol]).trim().toLowerCase();
        if (rowUname === username) {
          var rowPass = passCol !== -1 ? String(values[r][passCol]).trim() : "griya123";
          if (!rowPass) rowPass = "griya123";

          if (password !== rowPass) {
            return jsonResponse({ ok: false, error: "Username atau password salah." });
          }

          if (statusCol !== -1 && String(values[r][statusCol]).trim().toLowerCase() === "nonaktif") {
            return jsonResponse({ ok: false, error: "Akun Anda saat ini dinonaktifkan." });
          }

          var userObj = {};
          for (var j = 0; j < headers.length; j++) {
            if (headers[j]) userObj[headers[j]] = values[r][j];
          }
          return jsonResponse({ ok: true, user: userObj });
        }
      }
      return jsonResponse({ ok: false, error: "Username atau password salah." });
    }

    if (action === "updateXpConfig") {
      var xpData = {
        ID: "cfg_1",
        "XP Per Setoran": data.xpPerSetoran || 30,
        "Bonus Grade A": data.bonusGradeA || 20,
        "XP Per Mustami": data.xpPerMustami || 25,
        "XP Per Target": data.xpPerTarget || 100,
        "Updated At": new Date().toLocaleDateString("id-ID")
      };
      return jsonResponse(updateRowById("xpConfig", "cfg_1", xpData));
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

function findSheetSafely(ss, sheetName) {
  if (!ss) return null;
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) return sheet;

  if (sheetName === "achievements") {
    return ss.getSheetByName("chievements") || ss.getSheetByName("Achievement") || ss.getSheetByName("Achievements");
  }
  if (sheetName === "masterBadges") {
    return ss.getSheetByName("masterBadges") || ss.getSheetByName("master_badges") || ss.getSheetByName("MasterBadges");
  }
  if (sheetName === "teacherRanks") {
    return ss.getSheetByName("teacherRanks") || ss.getSheetByName("teacher_ranks") || ss.getSheetByName("ranks") || ss.getSheetByName("Ranks");
  }
  if (sheetName === "xpConfig") {
    return ss.getSheetByName("xpConfig") || ss.getSheetByName("xp_config") || ss.getSheetByName("XpConfig");
  }
  return null;
}

function getTableData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetSafely(ss, sheetName);
  if (!sheet) {
    if (sheetName === "teacherRanks" || sheetName === "xpConfig") {
      setupAllRequiredSheets();
      sheet = findSheetSafely(ss, sheetName);
    }
    if (!sheet) return { ok: true, data: [] };
  }

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
    if (hasValue && (obj.ID || obj.id || obj["ID Guru"] || obj["Nama Gelar"] || obj.Level || obj["Kode Lencana"])) {
      result.push(obj);
    }
  }

  return { ok: true, data: result };
}

function addRowPreventDuplicates(sheetName, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetSafely(ss, sheetName);

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

  // Ensure "Status Dihapus" is present in headers
  if (headers.indexOf("Status Dihapus") === -1) {
    headers.push("Status Dihapus");
    sheet.getRange(1, headers.length).setValue("Status Dihapus");
  }

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
          return updateRowById(sheetName, targetId, data);
        }
      }
    }
  }

  // Prevent Duplicates for achievements by ID Guru + Kode Lencana
  if ((sheetName === "achievements" || sheetName === "chievements") && values.length > 1) {
    var guruColIdx = headers.indexOf("ID Guru");
    if (guruColIdx === -1) guruColIdx = headers.indexOf("teacherId");
    var kodeColIdx = headers.indexOf("Kode Lencana");
    if (kodeColIdx === -1) kodeColIdx = headers.indexOf("code");

    if (guruColIdx !== -1 && kodeColIdx !== -1) {
      var newGuru = String(data["ID Guru"] || data.teacherId || "").trim();
      var newKode = String(data["Kode Lencana"] || data.code || "").trim();
      if (newGuru && newKode) {
        for (var r = 1; r < values.length; r++) {
          var rowGuru = String(values[r][guruColIdx]).trim();
          var rowKode = String(values[r][kodeColIdx]).trim();
          if (rowGuru === newGuru && rowKode === newKode) {
            var existingRowId = values[r][headers.indexOf("ID")];
            if (existingRowId) return updateRowById(sheetName, existingRowId, data);
          }
        }
      }
    }
  }

  var rowData = headers.map(function (h) {
    if (h === "Status Dihapus") {
      return data[h] !== undefined ? data[h] : "TIDAK";
    }
    return data[h] !== undefined ? data[h] : "";
  });

  sheet.appendRow(rowData);
  return { ok: true, message: "Row added to " + sheetName + " successfully." };
}

function updateRowById(sheetName, id, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetSafely(ss, sheetName);
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

  return addRowPreventDuplicates(sheetName, data);
}

/** Soft-delete row by setting 'Status Dihapus' = 'YA' without deleting row physically */
function deleteRowById(sheetName, id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetSafely(ss, sheetName);
  if (!sheet) return { ok: false, error: "Sheet " + sheetName + " tidak ditemukan." };

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return { ok: true, message: "Sheet kosong." };

  var headers = values[0];
  var idColIdx = headers.indexOf("ID");
  if (idColIdx === -1) idColIdx = headers.indexOf("id");
  if (idColIdx === -1) return { ok: false, error: "Kolom ID tidak ditemukan." };

  var deletedColIdx = headers.indexOf("Status Dihapus");
  if (deletedColIdx === -1) {
    headers.push("Status Dihapus");
    sheet.getRange(1, headers.length).setValue("Status Dihapus");
    deletedColIdx = headers.length - 1;
  }

  var targetId = String(id).trim();

  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idColIdx]).trim() === targetId) {
      sheet.getRange(r + 1, deletedColIdx + 1).setValue("YA");

      if (sheetName === "teachers") {
        var statusColIdx = headers.indexOf("Status");
        if (statusColIdx !== -1) {
          sheet.getRange(r + 1, statusColIdx + 1).setValue("nonaktif");
        }
      }

      return { ok: true, message: "Row " + targetId + " ditandai sebagai dihapus (soft delete)." };
    }
  }

  return { ok: true, message: "Row " + targetId + " ditandai sebagai dihapus." };
}

function requestPasswordReset(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("passwordResets");
  if (!sheet) {
    sheet = ss.insertSheet("passwordResets");
    sheet.appendRow(["ID", "Username", "Nama Guru", "No HP", "Tanggal Pengajuan", "Status"]);
  }

  var id = "reset_" + new Date().getTime();
  var rowData = [
    id,
    data.username || "",
    data.name || "",
    data.phone || "",
    data.requestedAt || new Date().toISOString(),
    data.status || "Pending"
  ];
  sheet.appendRow(rowData);
  return { ok: true, message: "Permintaan reset password berhasil dicatat." };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Custom UI Menu in Google Sheets
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("🚀 Upgrading Engine")
      .addItem("Inisialisasi Sheet Terbaru (Gelar & XP)", "setupAllRequiredSheets")
      .addItem("🔔 Evaluasi Notifikasi Otomatis", "processDailyInactivityNotifications")
      .addItem("Migrasi & Bersihkan ID Guru", "migrateAndCleanAllTeacherIds")
      .addToUi();
  } catch (e) {
    // ignore if running in web app execution context
  }
}

/**
 * Automatically creates any missing sheets (teacherRanks, xpConfig) safely
 */
function setupAllRequiredSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. teacherRanks sheet
  var ranksSheet = ss.getSheetByName("teacherRanks");
  if (!ranksSheet) {
    ranksSheet = ss.insertSheet("teacherRanks");
    ranksSheet.appendRow(["ID", "Level", "Nama Gelar", "Syarat Min XP", "Badge Icon/Emoji", "Warna Class", "Status Dihapus", "Created At", "Updated At"]);
    ranksSheet.appendRow(["rnk_1", 1, "Tholibul 'Ilm", 0, "🌱", "text-slate-500", "TIDAK", new Date().toLocaleDateString("id-ID"), new Date().toLocaleDateString("id-ID")]);
    ranksSheet.appendRow(["rnk_2", 2, "Al-Mujtahid", 200, "⚡", "text-blue-500", "TIDAK", new Date().toLocaleDateString("id-ID"), new Date().toLocaleDateString("id-ID")]);
    ranksSheet.appendRow(["rnk_3", 3, "Al-Hafizh Al-Mutqin", 500, "⭐", "text-amber-500", "TIDAK", new Date().toLocaleDateString("id-ID"), new Date().toLocaleDateString("id-ID")]);
    ranksSheet.appendRow(["rnk_4", 4, "Al-Muqri' Al-Kabiir", 1000, "👑", "text-indigo-500", "TIDAK", new Date().toLocaleDateString("id-ID"), new Date().toLocaleDateString("id-ID")]);
    ranksSheet.appendRow(["rnk_5", 5, "Ustazh Al-Upgrading", 2000, "🏆", "text-emerald-500", "TIDAK", new Date().toLocaleDateString("id-ID"), new Date().toLocaleDateString("id-ID")]);
  }

  // 2. xpConfig sheet
  var xpSheet = ss.getSheetByName("xpConfig");
  if (!xpSheet) {
    xpSheet = ss.insertSheet("xpConfig");
    xpSheet.appendRow(["ID", "XP Per Setoran", "Bonus Grade A", "XP Per Mustami", "XP Per Target", "Updated At"]);
    xpSheet.appendRow(["cfg_1", 30, 20, 25, 100, new Date().toLocaleDateString("id-ID")]);
  }

  return { ok: true, message: "Sheet teacherRanks dan xpConfig berhasil disiapkan." };
}

/**
 * Evaluates inactivity and triggers automatic notifications (13.00 WIB daily, 2d, 4d, 6d educative).
 */
function processDailyInactivityNotifications() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var teachersSheet = findSheetSafely(ss, "teachers");
  var reportsSheet = findSheetSafely(ss, "reports");
  var notifsSheet = findSheetSafely(ss, "notifications");

  if (!teachersSheet || !reportsSheet || !notifsSheet) return { ok: false, error: "Sheet tidak lengkap." };

  var teachersData = getTableData("teachers").data;
  var reportsData = getTableData("reports").data;
  var notifsData = getTableData("notifications").data;

  var now = new Date();
  var currentHour = now.getHours();
  var todayYmd = now.toLocaleDateString("id-ID");
  var nowMs = now.getTime();
  var createdCount = 0;

  for (var i = 0; i < teachersData.length; i++) {
    var teacher = teachersData[i];
    if (!teacher || !teacher.ID || String(teacher["Status Dihapus"]).toUpperCase() === "YA") continue;

    var teacherId = teacher.ID;
    var rawTeacherName = String(teacher["Nama Guru"] || teacher.Nama || teacher.name || "").trim();
    var nameCall = rawTeacherName ? (" " + rawTeacherName) : "";

    var latestActivityMs = 0;
    var submittedToday = false;

    for (var j = 0; j < reportsData.length; j++) {
      var r = reportsData[j];
      if (!r || String(r["Status Dihapus"]).toUpperCase() === "YA") continue;
      if (r["ID Guru"] === teacherId || r["Mustami ID"] === teacherId || r.teacherId === teacherId || r.mustamiId === teacherId) {
        var rawDate = r["Tanggal Setoran"] || r.date || r["Created At"];
        var d = new Date(rawDate);
        var timeMs = d.getTime();
        if (!isNaN(timeMs) && timeMs > latestActivityMs) {
          latestActivityMs = timeMs;
        }
        if (!isNaN(timeMs) && d.toLocaleDateString("id-ID") === todayYmd) {
          if (r["ID Guru"] === teacherId || r.teacherId === teacherId) submittedToday = true;
        }
      }
    }

    var daysInactive = latestActivityMs > 0
      ? Math.floor((nowMs - latestActivityMs) / (1000 * 60 * 60 * 24))
      : 7;

    var hasNotifToday = function(targetTitle) {
      for (var k = 0; k < notifsData.length; k++) {
        var n = notifsData[k];
        if ((n["User ID Target"] === teacherId || n.userId === teacherId) && (n.Judul === targetTitle || n.title === targetTitle)) {
          return true;
        }
      }
      return false;
    };

    // Rule 1: Daily 13.00 WIB
    if (currentHour >= 13 && !submittedToday) {
      var title1 = "⏰ Pengingat Setoran Hari Ini (13.00 WIB)";
      if (!hasNotifToday(title1)) {
        addRowPreventDuplicates("notifications", {
          ID: "ntf_" + new Date().getTime() + "_" + Math.floor(Math.random()*1000),
          "User ID Target": teacherId,
          Judul: title1,
          "Pesan/Body": "Assalamu'alaikum Ustaz/Ustazah" + nameCall + ". Pengingat harian jam 13.00 WIB: Anda belum melakukan setoran upgrading hari ini. Yuk sempatkan waktu sejenak untuk menyetorkan hafalan/materi ke penguji!",
          Level: "warning",
          "Tipe Notifikasi": "reminder",
          "Status Dibaca": "TIDAK",
          "Status Dihapus": "TIDAK",
          "Created At": new Date().toLocaleString("id-ID")
        });
        createdCount++;
      }
    }

    // Rule 2: 2 Days Inactive
    if (daysInactive === 2) {
      var title2 = "📌 Pengingat Keistiqomahan (2 Hari)";
      if (!hasNotifToday(title2)) {
        addRowPreventDuplicates("notifications", {
          ID: "ntf_" + new Date().getTime() + "_" + Math.floor(Math.random()*1000),
          "User ID Target": teacherId,
          Judul: title2,
          "Pesan/Body": "Assalamu'alaikum Ustaz/Ustazah" + nameCall + ". Sudah 2 hari belum ada aktivitas setoran maupun menyimak (mustami'). Mari jaga keistiqomahan harian upgrading Anda!",
          Level: "info",
          "Tipe Notifikasi": "reminder",
          "Status Dibaca": "TIDAK",
          "Status Dihapus": "TIDAK",
          "Created At": new Date().toLocaleString("id-ID")
        });
        createdCount++;
      }
    }

    // Rule 3: 4 Days Inactive
    if (daysInactive === 4) {
      var title3 = "⚠️ Evaluasi Keistiqomahan (4 Hari)";
      if (!hasNotifToday(title3)) {
        addRowPreventDuplicates("notifications", {
          ID: "ntf_" + new Date().getTime() + "_" + Math.floor(Math.random()*1000),
          "User ID Target": teacherId,
          Judul: title3,
          "Pesan/Body": "Assalamu'alaikum Ustaz/Ustazah" + nameCall + ". Sudah 4 hari tidak ada catatan setoran atau menyimak. Mari luangkan waktu sejenak untuk murojaah dan menyetor hafalan.",
          Level: "warning",
          "Tipe Notifikasi": "reminder",
          "Status Dibaca": "TIDAK",
          "Status Dihapus": "TIDAK",
          "Created At": new Date().toLocaleString("id-ID")
        });
        createdCount++;
      }
    }

    // Rule 4: 6+ Days Inactive (Educative, Motivational & Open Discussion)
    if (daysInactive >= 6) {
      var title4 = "💬 Pendampingan & Motivasi Upgrading (6 Hari)";
      if (!hasNotifToday(title4)) {
        addRowPreventDuplicates("notifications", {
          ID: "ntf_" + new Date().getTime() + "_" + Math.floor(Math.random()*1000),
          "User ID Target": teacherId,
          Judul: title4,
          "Pesan/Body": "Assalamu'alaikum Warahmatullahi Wabarakatuh, Ustaz/Ustazah" + nameCall + " yang dirahmati Allah Subhanahu wa Ta'ala.\n\nSudah " + daysInactive + " hari tidak ada aktivitas setoran hafalan maupun menyimak. Kami sangat memahami bahwa kesibukan mengajar, keluarga, dan amanah lainnya bisa menjadi tantangan tersendiri.\n\nRasulullah shallallahu 'alaihi wa sallam bersabda bahwa amalan yang paling dicintai Allah adalah amalan yang kontinyu (istiqomah) walaupun sedikit. Apabila Ustaz/Ustazah mengalami kendala (kesulitan waktu, kesehatan, materi, atau hal lainnya), pintu diskusi selalu terbuka lebar bersama pengurus/upgrader. Mari saling menguatkan dan melanjutkan kembali kebaikan ini!",
          Level: "warning",
          "Tipe Notifikasi": "reminder",
          "Status Dibaca": "TIDAK",
          "Status Dihapus": "TIDAK",
          "Created At": new Date().toLocaleString("id-ID")
        });
        createdCount++;
      }
    }
  }

  return { ok: true, message: "Evaluasi notifikasi otomatis selesai.", createdCount: createdCount };
}

/**
 * Migrates all teacher IDs to clean unique IDs (e.g. tea_001, tea_002)
 * and updates all references across all sheets in the spreadsheet automatically.
 */
function migrateAndCleanAllTeacherIds() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetSafely(ss, "teachers");
  if (!sheet) return { ok: false, error: "Sheet teachers tidak ditemukan." };

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return { ok: false, error: "Sheet teachers kosong." };

  var headers = values[0];
  var idColIdx = headers.indexOf("ID");
  if (idColIdx === -1) idColIdx = headers.indexOf("id");
  if (idColIdx === -1) return { ok: false, error: "Kolom ID tidak ditemukan di sheet teachers." };

  var idMap = {};
  var teacherCount = 0;

  // Build clean ID mapping (tea_001, tea_002, ...)
  for (var r = 1; r < values.length; r++) {
    var oldId = String(values[r][idColIdx]).trim();
    if (!oldId) continue;

    teacherCount++;
    var numStr = ("000" + teacherCount).slice(-3);
    var newId = "tea_" + numStr;

    idMap[oldId] = newId;

    // Update ID cell in teachers sheet
    sheet.getRange(r + 1, idColIdx + 1).setValue(newId);
  }

  // Cascading replacement across all sheets in spreadsheet
  var allSheets = ss.getSheets();
  var updatedCellsCount = 0;

  for (var s = 0; s < allSheets.length; s++) {
    var curSheet = allSheets[s];
    var dataRange = curSheet.getDataRange();
    var sheetValues = dataRange.getValues();
    if (sheetValues.length < 2) continue;

    var curHeaders = sheetValues[0];
    var targetCols = [];

    // Find all columns that store teacher IDs across all sheets
    for (var c = 0; c < curHeaders.length; c++) {
      var h = String(curHeaders[c]).trim();
      if (
        h === "ID Guru" ||
        h === "teacherId" ||
        h === "ID Mustami" ||
        h === "ID Mustami'" ||
        h === "mustamiId" ||
        h === "ID Guru Dinilai" ||
        h === "ID Aktor" ||
        h === "actorId" ||
        h === "ID Entitas Target" ||
        h === "entityId"
      ) {
        targetCols.push(c);
      }
    }

    if (targetCols.length === 0) continue;

    // Replace values in matching columns with new clean IDs
    for (var rowIdx = 1; rowIdx < sheetValues.length; rowIdx++) {
      for (var k = 0; k < targetCols.length; k++) {
        var colIdx = targetCols[k];
        var cellVal = String(sheetValues[rowIdx][colIdx]).trim();
        if (idMap[cellVal]) {
          curSheet.getRange(rowIdx + 1, colIdx + 1).setValue(idMap[cellVal]);
          updatedCellsCount++;
        }
      }
    }
  }

  return {
    ok: true,
    message: "Migrasi ID Guru berhasil! " + teacherCount + " ID guru diperbarui menjadi format rapi (tea_001, tea_002...) dan " + updatedCellsCount + " sel referensi di sheet lain telah disesuaikan.",
    idMap: idMap
  };
}
