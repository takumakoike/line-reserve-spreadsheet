const calendars = getCalendarIds();
const calendar = calendars[2].CalID;
const _startDay = getTargetDate()!.startDate;
const _startTime = getTargetTime()!.start;
const _endTime = getTargetTime()!.end;
const dayOfStart = new Date(_startDay.year, _startDay.month, _startDay.day, parseInt(_startTime._hour), parseInt(_startTime._minute));
const dayOfEnd = new Date(_startDay.year, _startDay.month, _startDay.day, parseInt(_endTime._hour), parseInt(_endTime._minute));


function testCode(){
  // console.log(getTargetDate())
  // console.log(getTargetTime())
  
  // console.log(`ID: ${calendar}の予定を取得`);
  // console.log(getCalendarEvents(calendar, startDay, endDay));
  // console.log(oneCalendarLists(calendar, dayOfStart, dayOfEnd))
  // console.log("あきわくかくにん");
  console.log(calcEventDiff(calendar, dayOfStart, dayOfEnd))

}

// カレンダーのプロパティ名とIDを返す
function getCalendarIds(): {} {
  const keys = PropertiesService.getScriptProperties().getKeys();
  const targetCalendars = keys?.map((key) => ({
    Key: key,
    CalID: PropertiesService.getScriptProperties().getProperty(key)
  }))

  console.log(`getCalendarIds関すによって取得されたID：${targetCalendars}`)
  return targetCalendars;
} 


// 開始時刻と終了時刻を返す
interface CustomTime{
  start: {
    _hour: string,
    _minute: string,
  }
  end: {
    _hour: string,
    _minute: string,
  }
}
function getTargetTime(): CustomTime{
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
interface CustomDate {
  startDate: {
    raw: Date,
    year: number,
    month: number,
    day: number
  },
  endDate: {
    raw: Date,
    year: number,
    month: number,
    day: number
  }
}
function getTargetDate(): CustomDate | null{
  const values: Array<Date | any> = SpreadsheetApp.getActiveSheet().getRange(1,2,2,1).getValues();
  if(values && values.length > 0) {
    return ({
      startDate: {
        raw: values[0],
        year: new Date(values[0]).getFullYear(),
        month: new Date(values[0]).getMonth(),
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
  return null;
}


// カレンダーに予定されているイベントをタイトル・開始時刻・開始UNIXTIME・終了時刻・終了UNIXTIMEの配列で返す関数
function getCalendarEvents(calendarId: string, startDay: Date, endDay: Date) {
  const targetCalendar = CalendarApp.getCalendarById(calendarId);
  
  return targetCalendar.getEvents(startDay, endDay).map((event) => ({
    title: event.getTitle(),
    start: event.getStartTime(),
    startUNIX:  event.getStartTime().getTime()/1000,
    end: event.getEndTime(),
    endUNIX: event.getEndTime().getTime()/1000
  }))
}
// カレンダーリストを配列形式で返す：タイトル・開始/終了・Index・時刻・UNIX時刻
function oneCalendarLists(calendarId: string, startDay: Date, endDay: Date) {
  const firstUNIX: number = Date.parse(startDay.toString())/1000;
  const lastUNIX: number = Date.parse(endDay.toString())/1000;
  const startDayString = Utilities.formatDate(startDay, "JST", "MM/dd(E) HH:mm")
    .replace("Mon", "月")
    .replace("Tue", "火")
    .replace("Wed", "水")
    .replace("Thu", "木")
    .replace("Fri", "金")
    .replace("Sat", "土")
    .replace("Sun", "日");
  const endDayString = Utilities.formatDate(endDay, "JST", "MM/dd(E) HH:mm")
    .replace("Mon", "月")
    .replace("Tue", "火")
    .replace("Wed", "水")
    .replace("Thu", "木")
    .replace("Fri", "金")
    .replace("Sat", "土")
    .replace("Sun", "日");
  const scheduleLists = [[
    "取得開始", 
    "開始", 
    9999,
    startDayString,
    firstUNIX]];
  const events = getCalendarEvents(calendarId, startDay, endDay)

  // カレンダー一つに対してイベントを一個ずつチェック
  for( let i = 0; i < events.length ; i++){
      const eventStart: string = Utilities.formatDate(events[i].start, "JST", "MM/dd(E) HH:mm")
        .replace("Mon", "月")
        .replace("Tue", "火")
        .replace("Wed", "水")
        .replace("Thu", "木")
        .replace("Fri", "金")
        .replace("Sat", "土")
        .replace("Sun", "日");
      const eventEnd: string = Utilities.formatDate(events[i].end, "JST", "MM/dd(E) HH:mm")
        .replace("Mon", "月")
        .replace("Tue", "火")
        .replace("Wed", "水")
        .replace("Thu", "木")
        .replace("Fri", "金")
        .replace("Sat", "土")
        .replace("Sun", "日");
      const startDayInfo: string = events[i].startUNIX < firstUNIX ? startDayString : eventStart;
      const startDayUNIX: number = events[i].startUNIX < firstUNIX ? firstUNIX : events[i].startUNIX;

      const endDayInfo: string = events[i].endUNIX > lastUNIX ? endDayString : eventEnd;
      const endDayUNIX: number = events[i].endUNIX >= lastUNIX ? lastUNIX :events[i].endUNIX;

      scheduleLists.push([events[i].title, `開始`, i , startDayInfo, startDayUNIX])
      scheduleLists.push([events[i].title,`終了`, i, endDayInfo, endDayUNIX])
    }

  // イベントをUNIXタイムごとに並べ替えたうえで、最後に取得終了の配列データを加える
  scheduleLists.sort((a,b) => {return (a[4] as number) - (b[4] as number)}).push(["取得終了", "", 9999, endDayString, lastUNIX]);
  return scheduleLists
}
// 次のイベントとの差時間をみて空き時間を計算する
function calcEventDiff(calendarId, startDay, endDay){
  const freeTimeSlots = [];
  const data = oneCalendarLists(calendarId, startDay, endDay);

  for( let i = 0; i < data.length; i++){
    // イベントタイトルが取得開始だったとき、次の予定の時刻と差分を計算
    if(data[i][0] === "取得開始"){
      const diff = data[i+1][3] - data[i][3]; //UNIXTIMEの差分
      if(diff !== 0){
        freeTimeSlots.push([calendarId, data[i][3], data[i+1][3]])
      }
    } else if((data[i][1] === `終了` && data[i+1][1] === `開始`) && data[i+1][2] - data[i][2] === 1){
    // イベント種別が終了、次のイベント種別が開始だった時に時刻の差分を計算
      const diff = data[i+1][3] - data[i][3]; //UNIXTIMEの差分
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
function multiCalcEventDiff(){
  
}
