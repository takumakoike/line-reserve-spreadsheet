// このファイルを利用
const calendars = getCalendarIds();
const calendar = calendars[2].CalID;
const _startDay = getTargetDate()!.startDate;
const _endDay = getTargetDate()!.endDate;
const _startTime = getTargetTime()!.start;
const _endTime = getTargetTime()!.end;
const dayOfStart = new Date(_startDay.year, _startDay.month, _startDay.day, parseInt(_startTime._hour), parseInt(_startTime._minute));
const dayOfEnd = new Date(_startDay.year, _startDay.month, _startDay.day, parseInt(_endTime._hour), parseInt(_endTime._minute));


function testCode(){
  // console.log(getTargetDate())
  // console.log(getTargetTime())
  // console.log(dayOfStart);
  // console.log(dayOfEnd)
  // console.log(`ID: ${calendar}の予定を取得`);
  // console.log(getCalendarEvents(calendar, startDay, endDay));
  // console.log(oneCalendarLists(calendar, dayOfStart, dayOfEnd))
  // console.log("あきわくかくにん");
  // console.log(calcEventDiff(calendar, dayOfStart, dayOfEnd))
  console.log(multiCalendarEventDiff(calendars, dayOfStart, dayOfEnd))
  // calendars.forEach( (calendar) => {
  //   console.log(allDayFreeSlots([calendar]))
  // })

}

// カレンダーのプロパティ名とIDを返す
function getCalendarIds(): Array<{Key: string, CalID: string}> {
  const keys = PropertiesService.getScriptProperties().getKeys();
  const targetCalendars = keys?.map((key) => {
    const calId = PropertiesService.getScriptProperties().getProperty(key);
    if (!calId) throw new Error(`Calendar ID not found for key: ${key}`);
    return {
      Key: key,
      CalID: calId
    };
  });

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
  const values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("空き枠")!.getRange(4,2,2,1).getDisplayValues();
  console.log("getTargetTime関数実行中：valuesの値")
  console.log(values);

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
    day: number,
    unix: number,
  },
  endDate: {
    raw: Date,
    year: number,
    month: number,
    day: number,
    unix: number,
  }
}

function getTargetDate(): CustomDate | null{
  const values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("空き枠")!.getRange(1,2,2,1).getValues();
  console.log("getTargetDate関数実行中：valuesの値")
  console.log(values);
  if(values && values.length > 0) {
    return ({
      startDate: {
        raw: values[0][0],
        year: new Date(values[0][0]).getFullYear(),
        month: new Date(values[0][0]).getMonth(),
        day: new Date(values[0][0]).getDate(),
        unix: Date.parse(values[0][0])/1000,
      },
      endDate: {
        raw: values[1][0],
        year: new Date(values[1][0]).getFullYear(),
        month : new Date(values[1][0]).getMonth(),
        day: new Date(values[1][0]).getDate(),
        unix: Date.parse(values[1][0])/1000
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
function oneCalendarLists(calendarId: string, startDay: Date, endDay: Date): [title: string, type: string, eventIndex: number, dateInfo: string, unixTime:number][] {
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
  const scheduleLists: [string, string, number, string, number][] = [
    [
    "取得開始", 
    "開始", 
    9999,
    startDayString,
    firstUNIX
    ]
  ];
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

      scheduleLists.push([events[i].title, `開始`, i , startDayInfo, startDayUNIX],[events[i].title,`終了`, i, endDayInfo, endDayUNIX])
      // scheduleLists.push()
    }

  // イベントをUNIXタイムごとに並べ替えたうえで、最後に取得終了の配列データを加える
  scheduleLists.sort((a,b) => {return (a[4] as number) - (b[4] as number)}).push(["取得終了", "", 9999, endDayString, lastUNIX]);
  return scheduleLists
}

// 次のイベントとの差時間をみて空き時間を計算する
// function calcEventDiff(calendarId, startDay, endDay){
//   const freeTimeSlots: [calendarid:string, slotStartTime: string, slotEndTime: string, slotStartUNIXTime:number, slotDiff: number][] = [];
//   const data = oneCalendarLists(calendarId, startDay, endDay);  //[タイトル：string, 開始or終了：string, Index:number, 日付情報：string, UnixTime：number]
//   console.log("calcEventDiff関数実行中、oneCalendarLists関数の実行結果")
//   console.log(data);

//   for( let i = 0; i < data.length; i++){
//     if(data.length === 0) return;
//     // イベントタイトルが取得開始だったとき、次の予定の時刻と差分を計算
//     if(data[i][0] === "取得開始"){
//       const diff = data[i+1][4] - data[i][4]; //UNIXTIMEの差分
//       if(diff !== 0){
//         freeTimeSlots.push([calendarId, data[i][3], data[i+1][3], data[i][4], data[i+1][4]-data[i][4]])  
//       }
//     } else if((data[i][1] === `終了` && data[i+1][1] === `開始`) && data[i+1][2] - data[i][2] === 1 && data[i+2][2] >= data[i+1][2]){
//     // イベント種別が終了、次のイベント種別が開始だった時に時刻の差分を計算
//       const diff = data[i+1][4] - data[i][4]; //UNIXTIMEの差分
//       if(diff !== 0){
//         freeTimeSlots.push([calendarId, data[i][3], data[i+1][3], data[i][4], data[i+1][4]-data[i][4]])
//       }
//       continue;
//     }
//   }
//   // console.log(freeTimeSlots);
//   return freeTimeSlots;
// }
// 複数カレンダーで空き時間をチェック
function multiCalendarEventDiff(
  calendars: Array<{Key: string, CalID: string}>, 
  startDay: Date, 
  endDay: Date
): [calendarId: string, freeStart: string, freeEnd: string, freeStartUnix: number, diffUnix: number, index: number][] {

  const slots: [title: string, type: string, eventIndex: number, dateInfo: string, unixTime: number, calendarIndex:number][] = [];
  for (let i = 0; i < calendars.length; i++){
    const calId = calendars[i].CalID;
    const data = oneCalendarLists(calId, startDay, endDay);
    console.log("multiCalc関数実行中、oneCalendarListの結果です");
    console.log(data);
    // const data = calcEventDiff(calId, startDay, endDay);
    slots.push(...data.map(slot => [...slot, i] as [title: string, type: string, eventIndex: number, dateInfo: string, unixTime: number, calendarIndex: number]));
  };
  // return
  const modifiedSlots = slots.sort((a,b) => {return (a[4] as number) - (b[4] as number)});
  console.log(modifiedSlots)

  const uniqueData = Array.from(
    modifiedSlots.reduce((map, item) => {
      const key = `${item[0]}_${item[1]}`;
      map.set(key, item);
      return map;
    }, new Map()).values()
  );
  // 開始日時ごとにグループ化し、最小の差分を持つものだけを残す
  // const startTimeFilterdSlots = Object.values(
  //   modifiedSlots.reduce((acc: { [key: string]: [string, string, number, string, number, number] }, slot, index) => {
  //     const [title, type, eventIndex, dateInfo, unixTime, calendarIndex] = slot;
  //     // console.log(`Slot: ${slot}`)
  //     if (!acc[unixTime] || acc[unixTime][index][4] >= [unixTime][index+1][4]) {
  //       acc[unixTime] = slot;
  //     }
  //     return acc;
  //   }, {})
  // );
  // const endTimeFilterdSlots = Object.values(
  //   startTimeFilterdSlots.reduce((acc: {[key: string]: [string, string, string, number, number, number]}, slot) => {
  //     const [calendarId, startTime, endTime, unixStart, timeDiff, indexNumber] = slot;
  //     // console.log(`Slot: ${slot}`)
  //     if (!acc[endTime] || acc[endTime][4] > timeDiff) {
  //       acc[endTime] = slot;
  //     }
  //     return acc;
  //   }, {})
  // );

  // return endTimeFilterdSlots;
  return uniqueData;
}


// // 日付分複数カレンダーの空き枠を確認する関数
// function allDayFreeSlots(calendarArray: Array<{Key: string, CalID: string}>){
//   // 実施するのは開始日と終了日の差分
//   const dateDiff = (_endDay.unix - _startDay.unix) / (60 * 60 * 24);
//   const allDaySlots: [string, string, string, number, number, number][][] = [];
//   for (let i = 0; i <= dateDiff; i++){
//     const targetDay = _startDay.day + i
//     const start = new Date(_startDay.year, _startDay.month, targetDay, parseInt(_startTime._hour), parseInt(_startTime._minute));
//     const end = new Date(_startDay.year, _startDay.month, targetDay, parseInt(_startTime._hour), parseInt(_startTime._minute));
//     console.log(`start: ${start}`);
//     console.log(`calendars: ${calendarArray[0]}`)
//     const oneDaySlots = multiCalendarEventDiff(calendarArray[i], start, end);  //単一日時での取得
//     allDaySlots.push(oneDaySlots);
//   }

//   // console.log(allDaySlots)
//   return allDaySlots;
// }