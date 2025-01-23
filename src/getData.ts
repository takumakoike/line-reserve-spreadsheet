const baseSheetName = "店舗基本情報";

// スプレッドシートで時間（分）の値にゼロをつける関数
function codeEdit(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = SpreadsheetApp.getActiveSheet();
  const baseSheet = ss.getSheetByName(baseSheetName);
  // console.log(activeSheet.getName());
  // 店舗基本情報シート以外の編集の時には処理を終了
  if(activeSheet.getName() !== baseSheetName) return;

  // アクティブなセルがF・G列以外の時には処理終了
  const activeCell = baseSheet?.getActiveCell();
  if( activeCell!.getColumn() !== 6) return;

  // F・G列で起きたアクティブセルの値を取得
  const activeValue = activeCell!.getValue();
  // console.log(activeValue)
  // console.log(Math.abs(activeValue).toString().length)

  // アクティブバリューが一桁の数字の時、十の位に0を付ける
  if(activeValue !== "" && Math.abs(activeValue).toString().length === 1){
    console.log("hoge")
    activeCell!.setValue(`\'0${activeValue.toString()}`);
  }
}

type customTime = {
  hours: number | null,
  minutes: number | null,
}


function getTimeData(): {} {
  const baseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseSheetName);
  if(!baseSheet) return {};

  const shopStart: customTime = {
    hours: baseSheet.getRange(5,3).getValue(),
    minutes: parseInt(baseSheet.getRange(5,6).getValue()),
  };
  const shopEnd: customTime = {
    hours: baseSheet.getRange(6,3).getValue(),
    minutes: parseInt(baseSheet.getRange(6,6).getValue()),
  }
  const breakStart: customTime = {
    hours: baseSheet.getRange(7,3).getValue(),
    minutes: parseInt(baseSheet.getRange(7,6).getValue()),
  };
  const breakEnd: customTime = {
    hours: baseSheet.getRange(8,3).getValue(),
    minutes: parseInt(baseSheet.getRange(8,6).getValue()),
  }
  const reserveStart: customTime = {
    hours: baseSheet.getRange(9,3).getValue(),
    minutes: parseInt(baseSheet.getRange(9,6).getValue()),
  };
  const reserveEnd: customTime = {
    hours: baseSheet.getRange(10,3).getValue(),
    minutes: parseInt(baseSheet.getRange(10,6).getValue()),
  }

  console.log(shopStart)
  console.log(shopEnd)
  console.log(breakStart)
  console.log(breakEnd)
  console.log(reserveStart)
  console.log(reserveEnd)

  return {shopStart, shopEnd, breakStart, breakEnd, reserveStart, reserveEnd}
}



function fillTimeSlots() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  // 時間の開始セルと間隔のセル
  const startTimeCell = sheet.getRange("A1").getValue();  // 例: "11:00"（文字列）
  const intervalCell = sheet.getRange("B1").getValue();   // 例: 30（数値）

  // "hh:mm" の文字列を Date オブジェクトに変換する
  const timeParts = startTimeCell.split(":");  
  let hours = parseInt(timeParts[0]);
  let minutes = parseInt(timeParts[1]);

  // 30分間隔で 10 回分の時間を記入する
  for (let i = 0; i < 10; i++) {
    let totalMinutes = hours * 60 + minutes + (intervalCell * i);
    let newHours = Math.floor(totalMinutes / 60);
    let newMinutes = totalMinutes % 60;

    // 時刻を "hh:mm" 形式に整える（ゼロ埋め）
    let formattedTime = ('0' + newHours).slice(-2) + ":" + ('0' + newMinutes).slice(-2);
    
    // 結果を A列に書き込む
    sheet.getRange(i + 2, 1).setValue(formattedTime);
  }
}
