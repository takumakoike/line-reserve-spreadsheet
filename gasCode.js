// ひとつのカレンダーで一日分予定を確認する
// 同日で別のカレンダー予定を確認する
// 複数のカレンダーで取得できた仮空き時間を一つのリストにまとめ、共通できる空き時間を抽出する
const calendars = getCalendarIds();
const calendar = calendars[2].CalID;
const _startDay = getTargetDate().startDate;
const _startTime = getTargetTime().start;
const _endTime = getTargetTime().end;
const dayOfStart = new Date(_startDay.year, _startDay.month, _startDay.day, _startTime._hour, _startTime._minute);
const dayOfEnd = new Date(_startDay.year, _startDay.month, _startDay.day, _endTime._hour, _endTime._minute);


function testCode(){
  // console.log(getTargetDate())
  // console.log(getTargetTime())
  
  // console.log(`ID: ${calendar}の予定を取得`);
  // console.log(getCalendarEvents(calendar, startDay, endDay));
  // console.log(oneCalendarLists(calendar, dayOfStart, dayOfEnd))
  // console.log("あきわくかくにん");
  // console.log(calcEventDiff(calendar, dayOfStart, dayOfEnd))
  console.log(multiCalcEventDiff(calendars));

}

// カレンダーのプロパティ名とIDを返す
function getCalendarIds() {
  const keys = PropertiesService.getScriptProperties().getKeys();
  const targetCalendars = keys.map((key) => ({
    Key: key,
    CalID: PropertiesService.getScriptProperties().getProperty(key)
  }))

  // console.log(targetCalendars)
  return targetCalendars;
} 
// 開始時刻と終了時刻を返す
function getTargetTime(){
  const values = SpreadsheetApp.getActiveSheet().getRange(4,2,2,1).getDisplayValues();

  return ({
    start:{
      _hour: values[0].toString().split(":")[0],
      _minute: values[0].toString().split(":")[1],
    },
    end: {
      _hour: values[1].toString().split(":")[0],
      _minute: values[1].toString().split(":")[1],
    }
  })
}
// 開始日と終了日を返す
function getTargetDate(){
  const values = SpreadsheetApp.getActiveSheet().getRange(1,2,2,1).getValues();
  return ({
    startDate: {
      raw: values[0],
      year: new Date(values[0]).getFullYear(),
      month : new Date(values[0]).getMonth(),
      day: new Date(values[0]).getDate(),
    },
    endDate: {
      raw: values[1],
      year: new Date(values[1]).getFullYear(),
      month : new Date(values[1]).getMonth(),
      day: new Date(values[1]).getDate(),

    }
  })
}
// カレンダーに予定されているイベントをタイトル・開始時刻・開始UNIXTIME・終了時刻・終了UNIXTIMEの配列で返す関数
function getCalendarEvents(calendarId, startDay, endDay){
  const targetCalendar = CalendarApp.getCalendarById(calendarId);
  
  return events = targetCalendar.getEvents(startDay, endDay).map((event) => ({
    title: event.getTitle(),
    start: event.getStartTime(),
    startUNIX:  Date.parse(event.getStartTime())/1000,
    end: event.getEndTime(),
    endUNIX: Date.parse(event.getEndTime())/1000
  }))
}
// カレンダーリストを配列形式で返す：タイトル・開始/終了・Index・時刻・UNIX時刻
function oneCalendarLists(calendarId, startDay, endDay){
  const startUNIX =  Date.parse(startDay)/1000;
  const endUNIX = Date.parse(endDay)/1000;
  const scheduleLists = [[
    "取得開始", 
    "開始", 
    9999,
    Utilities.formatDate(startDay, "JST", "MM/dd(E) HH:mm")
      .replace("Mon", "月")
      .replace("Tue", "火")
      .replace("Wed", "水")
      .replace("Thu", "木")
      .replace("Fri", "金")
      .replace("Sat", "土")
      .replace("Sun", "日"),
    startUNIX]];
  const events = getCalendarEvents(calendarId, startDay, endDay)

  // カレンダー一つに対してイベントを一個ずつチェック
  for( let i = 0; i < events.length ; i++){
      const eventStart = Utilities.formatDate(events[i].start, "JST", "MM/dd(E) HH:mm")
        .replace("Mon", "月")
        .replace("Tue", "火")
        .replace("Wed", "水")
        .replace("Thu", "木")
        .replace("Fri", "金")
        .replace("Sat", "土")
        .replace("Sun", "日");
      const eventEnd = Utilities.formatDate(events[i].end, "JST", "MM/dd(E) HH:mm")
        .replace("Mon", "月")
        .replace("Tue", "火")
        .replace("Wed", "水")
        .replace("Thu", "木")
        .replace("Fri", "金")
        .replace("Sat", "土")
        .replace("Sun", "日");

      scheduleLists.push([events[i].title,`開始`, i ,(events[i].startUNIX < startUNIX ? startDay : eventStart ), (events[i].startUNIX >= startUNIX ? events[i].startUNIX : eventStart )])
      scheduleLists.push([events[i].title,`終了`, i, (events[i].endUNIX > endUNIX ? Utilities.formatDate(endDay, "JST", "MM/dd(E) HH:mm") :eventEnd),  (events[i].endUNIX >= endUNIX ? endUNIX :events[i].endUNIX)])
    }

  // イベントをUNIXタイムごとに並べ替えたうえで、最後に取得終了の配列データを加える
  scheduleLists.sort((a,b) => {return a[3] - b[3]}).push(["取得終了", "終了",9999, Utilities.formatDate(endDay, "JST", "MM/dd(E) HH:mm"), endUNIX],);
  
  console.log(`CalendarId: ${calendarId}`)
  console.log(scheduleLists)
  console.log("oneCalendarLists実行結果")
  return scheduleLists
}
// 次のイベントとの差時間をみて空き時間を計算する
function calcEventDiff(calendarId, startDay, endDay){
  const freeTimeSlots = [];
  const data = oneCalendarLists(calendarId, startDay, endDay);

  for( let i = 0; i < data.length; i++){
    console.log("hoge",data[i][1])
    console.log("fuga",data[i+1][2]-data[i][2])
    // イベントタイトルが取得開始だったとき、次の予定の時刻と差分を計算
    if(data[i][0] === "取得開始"){
      if(data.length === 2 && data[i][2] === 9999 && data[i+1][2] === 9999){
        freeTimeSlots.push([calendarId, data[i][3], "終日空いています"])
      }
      const diff = data[i+1][4] - data[i][4]; //UNIXTIMEの差分
      if(diff !== 0){
        freeTimeSlots.push([calendarId, data[i][3], data[i+1][3]])
      }
    } else if((data[i][1] === `終了` && data[i+1][1] === `開始`) && data[i+1][2] - data[i][2] === 1){
    // イベント種別が終了、次のイベント種別が開始だった時に時刻の差分を計算
      const diff = data[i+1][4] - data[i][4]; //UNIXTIMEの差分
      if(diff !== 0){
        freeTimeSlots.push([calendarId, data[i][3], data[i+1][3]])
      }
      continue;
    }
  }
  // console.log(freeTimeSlots);
  return freeTimeSlots;
}
// 複数カレンダーで空き時間をチェック
function multiCalcEventDiff(calendars){
  const slot = [];
  calendars.forEach( calendar => {
    console.log(`${calendar.CalID}の予定を確認します`)
    const oneFreeEvents = calcEventDiff(calendar.CalID, dayOfStart, dayOfEnd);
    slot.push(oneFreeEvents);
  })
  return slot
}


