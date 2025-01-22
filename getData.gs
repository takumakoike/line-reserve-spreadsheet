function codeEdit(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = SpreadsheetApp.getActiveSheet();
  const baseSheet = ss.getSheetByName(baseSheetName);
  console.log(activeSheet.getName());
  // 店舗基本情報シート以外の編集の時には処理を終了
  if(activeSheet.getName() !== baseSheetName) return;

  // アクティブなセルがF・G列以外の時には処理終了
  const activeCell = baseSheet.getActiveCell();
  if( activeCell.getColumn() !== 6) return;

  // F・G列で起きたアクティブセルの値を取得
  const activeValue = activeCell.getValue();
  console.log(activeValue)
  console.log(Math.abs(activeValue).toString().length)

  // アクティブバリューが一桁の数字の時、十の位に0を付ける
  if(activeValue !== "" && Math.abs(activeValue).toString().length === 1){
    console.log("hoge")
    activeCell.setValue(`\'0${activeValue.toString()}`);
  }

}
