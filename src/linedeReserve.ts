const baseSheetName = "店舗基本情報";
const reserveBaseSheetName = "【原本】7日間予定";

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
// スプレッドシートの基本情報シートから営業・休憩・予約の開始時間・終了時間を取得して返す関数
function getTimeData(): 
{shopStart: {hours: string, minute: number}, shopEnd: {hours: string, minute: number}, braekStart: {hours: string, minute: number}, breakEnd: {hours: string, minute: number}, reserveStart: {hours: string, minute: number}, reserveEnd: {hours: string, minute: number}}  | {}
{
  const baseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseSheetName);
  if(!baseSheet) return {};

  const shopStart: customTime = {
    hours: baseSheet.getRange(6,3).getValue(),
    minutes: parseInt(baseSheet.getRange(6,6).getValue()),
  };
  const shopEnd: customTime = {
    hours: baseSheet.getRange(7,3).getValue(),
    minutes: parseInt(baseSheet.getRange(7,6).getValue()),
  }
  const breakStart: customTime = {
    hours: baseSheet.getRange(8,3).getValue(),
    minutes: parseInt(baseSheet.getRange(8,6).getValue()),
  };
  const breakEnd: customTime = {
    hours: baseSheet.getRange(9,3).getValue(),
    minutes: parseInt(baseSheet.getRange(9,6).getValue()),
  }
  const reserveStart: customTime = {
    hours: baseSheet.getRange(10,3).getValue(),
    minutes: parseInt(baseSheet.getRange(10,6).getValue()),
  };
  const reserveEnd: customTime = {
    hours: baseSheet.getRange(11,3).getValue(),
    minutes: parseInt(baseSheet.getRange(11,6).getValue()),
  }

  console.log(shopStart)
  console.log(shopEnd)
  console.log(breakStart)
  console.log(breakEnd)
  console.log(reserveStart)
  console.log(reserveEnd)

  return {shopStart, shopEnd, breakStart, breakEnd, reserveStart, reserveEnd}
}


// 初期設定用：7日間予定のシートに、予約開始時間と終了時間に応じてA列に値をセットする関数
function _fillTimeSlots() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(reserveBaseSheetName);
  if(!sheet) return new Error (`${reserveBaseSheetName}のシートが見つかりませんでした`);

  // 営業開始時間、営業終了時間、予約枠間隔
  const startTimeCell: string = sheet.getRange("G1").getValue();  // 例: "11:00"（文字列）
  const endTimeCell: string = sheet.getRange("I1").getValue();
  const intervalCell: number = sheet.getRange("K1").getValue();   // 例: 30（数値）

  // 開始時間について"hh:mm" の文字列を Date オブジェクトに変換する
  const startTimeParts: string[] = startTimeCell.split(":");  
  let startHours = parseInt(startTimeParts[0]);
  let startMinutes = parseInt(startTimeParts[1]);
  const startInfo = Utilities.formatDate( new Date(2025, 0, 1, startHours, startMinutes), "GMT", "dd MMM yyyy HH:mm:ss z");
  const startTimeUnix = Date.parse(startInfo)/1000;
  
  // 終了時間について"hh:mm" の文字列を Date オブジェクトに変換する
  const endTimeParts: string[] = endTimeCell.split(":");  
  let endHours = parseInt(endTimeParts[0]);
  let endMinutes = parseInt(endTimeParts[1]);
  const endInfo = Utilities.formatDate( new Date(2025, 0, 1, endHours, endMinutes), "GMT", "dd MMM yyyy HH:mm:ss z")
  const endTimeUnix = Date.parse(endInfo)/1000;

  // 営業時間を分単位で計算
  const diff = (endTimeUnix - startTimeUnix ) / 60;
  // console.log(diff);
  
  // 時間間隔に応じて予約枠を出力
  const steps = diff / intervalCell;  //繰り返す回数
  const reserveSlots: string[] = [];
  for (let i = 0; i <= steps; i++) {
    let newHours = startHours + Math.floor(intervalCell * i / 60);
    let newMinutes = startMinutes + Math.floor(intervalCell * i % 60);

    // 時刻を "hh:mm" 形式に整える（ゼロ埋め）
    let formattedTime = ('0' + newHours).slice(-2) + ":" + ('0' + newMinutes).slice(-2);
    reserveSlots.push(formattedTime);
  }

  // 開始位置（4行目からスタート、3行間隔で貼り付け）
  let startRow = 4;  // 最初の貼り付け位置
  let rowInterval = 3;  // 3行おき

  // 配列の要素をスプレッドシートに書き込む
  for (let i = 0; i < reserveSlots.length; i++) {
    sheet.getRange(startRow + (i * rowInterval), 1).setValue(reserveSlots[i]);
  }
}

// GoogleカレンダーIDをスクリプトエディタに紐づける
function setCalendarId(){

  
  return 
}

