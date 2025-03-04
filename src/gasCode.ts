// // このファイルを利用
// const calendars = getCalendarIds();
// const calendar = calendars[2][1];
// const _startDay = getTargetDate()!.startDate;
// const _endDay = getTargetDate()!.endDate;
// const _startTime = getTargetTime()!.start;
// const _endTime = getTargetTime()!.end;
// const dayOfStart = new Date(_startDay.year, _startDay.month, _startDay.day, parseInt(_startTime._hour), parseInt(_startTime._minute));
// const dayOfEnd = new Date(_startDay.year, _startDay.month, _startDay.day, parseInt(_endTime._hour), parseInt(_endTime._minute));


// function testCode(){
//   // console.log(getTargetDate())
//   // console.log(getTargetTime())
//   // console.log(dayOfStart);
//   // console.log(dayOfEnd)
//   // console.log(`ID: ${calendar}の予定を取得`);
//   // console.log(getCalendarEvents(calendar, startDay, endDay));
//   // console.log(oneCalendarLists(calendar, dayOfStart, dayOfEnd))
//   // console.log("あきわくかくにん");
//   // console.log(calcEventDiff(calendar, dayOfStart, dayOfEnd))
//   // console.log(multiCalendarEventDiff(calendars, dayOfStart, dayOfEnd))
//   // calendars.forEach( (cal) => {
//     console.log(allDayFreeSlots(calendars))
//   // })

// }

// // カレンダーのプロパティ名とIDを返す
// function getCalendarIds() : Array<string>{
//   const keys = PropertiesService.getScriptProperties().getKeys();
//   if(!keys) throw new Error("キーを取得できませんでした");
//   const targetCalendars = keys.map((key) => {
//     const calId = PropertiesService.getScriptProperties().getProperty(key);
//     if (!calId) throw new Error(`Calendar ID not found for key: ${key}`);
//     return calId;
//   });
//   return targetCalendars;
// } 


// // 開始時刻と終了時刻を返す
// interface CustomTime{
//   start: {
//     _hour: string,
//     _minute: string,
//   }
//   end: {
//     _hour: string,
//     _minute: string,
//   }
// }
// function getTargetTime(): CustomTime{
//   const values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("空き枠")!.getRange(4,2,2,1).getDisplayValues();
//   console.log("getTargetTime関数実行中：valuesの値")
//   console.log(values);

//   return ({
//     start:{
//       _hour: values[0].toString().split(":")[0],
//       _minute: values[0].toString().split(":")[1],
//     },
//     end: {
//       _hour: values[1].toString().split(":")[0],
//       _minute: values[1].toString().split(":")[1],
//     }
//   })
// }


// // 開始日と終了日を返す
// interface CustomDate {
//   startDate: {
//     raw: Date,
//     year: number,
//     month: number,
//     day: number,
//     unix: number,
//   },
//   endDate: {
//     raw: Date,
//     year: number,
//     month: number,
//     day: number,
//     unix: number,
//   }
// }

// function getTargetDate(): CustomDate | null{
//   const values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("空き枠")!.getRange(1,2,2,1).getValues();
//   console.log("getTargetDate関数実行中：valuesの値")
//   console.log(values);
//   if(values && values.length > 0) {
//     return ({
//       startDate: {
//         raw: values[0][0],
//         year: new Date(values[0][0]).getFullYear(),
//         month: new Date(values[0][0]).getMonth(),
//         day: new Date(values[0][0]).getDate(),
//         unix: Date.parse(values[0][0])/1000,
//       },
//       endDate: {
//         raw: values[1][0],
//         year: new Date(values[1][0]).getFullYear(),
//         month : new Date(values[1][0]).getMonth(),
//         day: new Date(values[1][0]).getDate(),
//         unix: Date.parse(values[1][0])/1000
//       }
//     })
//   }
//   return null;
// }


// // カレンダーに予定されているイベントをタイトル・開始時刻・開始UNIXTIME・終了時刻・終了UNIXTIMEの配列で返す関数
// function getCalendarEvents(calendarId: string, startDay: Date, endDay: Date) {
//   const targetCalendar = CalendarApp.getCalendarById(calendarId);
  
//   return targetCalendar.getEvents(startDay, endDay).map((event) => ({
//     title: event.getTitle(),
//     start: event.getStartTime(),
//     startUNIX:  event.getStartTime().getTime()/1000,
//     end: event.getEndTime(),
//     endUNIX: event.getEndTime().getTime()/1000
//   }))
// }


// // カレンダーリストを配列形式で返す：タイトル・開始/終了・Index・時刻・UNIX時刻
// function oneCalendarLists(calendarId: string, startDay: Date, endDay: Date): [title: string, type: string, eventIndex: number, dateInfo: string, unixTime:number][] {
//   const firstUNIX: number = Date.parse(startDay.toString())/1000;
//   const lastUNIX: number = Date.parse(endDay.toString())/1000;
//   const startDayString = Utilities.formatDate(startDay, "JST", "MM/dd(E) HH:mm")
//     .replace("Mon", "月")
//     .replace("Tue", "火")
//     .replace("Wed", "水")
//     .replace("Thu", "木")
//     .replace("Fri", "金")
//     .replace("Sat", "土")
//     .replace("Sun", "日");
//   const endDayString = Utilities.formatDate(endDay, "JST", "MM/dd(E) HH:mm")
//     .replace("Mon", "月")
//     .replace("Tue", "火")
//     .replace("Wed", "水")
//     .replace("Thu", "木")
//     .replace("Fri", "金")
//     .replace("Sat", "土")
//     .replace("Sun", "日");
//   const scheduleLists: [string, string, number, string, number][] = [
//     [
//     "取得開始", 
//     "終了", 
//     9999,
//     startDayString,
//     firstUNIX
//     ]
//   ];
//   const events = getCalendarEvents(calendarId, startDay, endDay)

//   // カレンダー一つに対してイベントを一個ずつチェック
//   for( let i = 0; i < events.length ; i++){
//       const eventStart: string = Utilities.formatDate(events[i].start, "JST", "MM/dd(E) HH:mm")
//         .replace("Mon", "月")
//         .replace("Tue", "火")
//         .replace("Wed", "水")
//         .replace("Thu", "木")
//         .replace("Fri", "金")
//         .replace("Sat", "土")
//         .replace("Sun", "日");
//       const eventEnd: string = Utilities.formatDate(events[i].end, "JST", "MM/dd(E) HH:mm")
//         .replace("Mon", "月")
//         .replace("Tue", "火")
//         .replace("Wed", "水")
//         .replace("Thu", "木")
//         .replace("Fri", "金")
//         .replace("Sat", "土")
//         .replace("Sun", "日");
//       const startDayInfo: string = events[i].startUNIX < firstUNIX ? startDayString : eventStart;
//       const startDayUNIX: number = events[i].startUNIX < firstUNIX ? firstUNIX : events[i].startUNIX;

//       const endDayInfo: string = events[i].endUNIX > lastUNIX ? endDayString : eventEnd;
//       const endDayUNIX: number = events[i].endUNIX >= lastUNIX ? lastUNIX :events[i].endUNIX;

//       scheduleLists.push([events[i].title, `開始`, i , startDayInfo, startDayUNIX],[events[i].title,`終了`, i, endDayInfo, endDayUNIX])
//       // scheduleLists.push()
//     }

//   // イベントをUNIXタイムごとに並べ替えたうえで、最後に取得終了の配列データを加える
//   scheduleLists.sort((a,b) => {return (a[4] as number) - (b[4] as number)}).push(["取得終了", "開始", 9999, endDayString, lastUNIX]);
//   return scheduleLists
// }


// // 複数カレンダーで空き時間をチェック
// function multiCalendarEventDiff(
//   calendarIdList: Array<string>, 
//   startDay: Date, 
//   endDay: Date
// ): [freeStart: string, freeEnd: string, duration: number][]{

//   const slots: [title: string, type: string, eventIndex: number, dateInfo: string, unixTime: number, calendarIndex:number][] = [];
//   for (let i = 0; i < calendarIdList.length; i++){
//     const calId = calendarIdList[i];
//     console.log("multiCalendarEventDiff実行中、oneCalendarListsの第一引数に渡すcalId：");
//     console.log(calId)
//     console.log("multiCalendarEventDiff実行中、oneCalendarListsの第二引数に渡すstartDay：");
//     console.log(startDay)
//     console.log("multiCalendarEventDiff実行中、oneCalendarListsの第三引数に渡すendDay：");
//     console.log(endDay)


//     const data = oneCalendarLists(calId, startDay, endDay);
//     console.log("multiCalc関数実行中、oneCalendarListの実行結果data：");
//     console.log(data);
//     // const data = calcEventDiff(calId, startDay, endDay);
//     slots.push(...data.map(slot => [...slot, i] as [title: string, type: string, eventIndex: number, dateInfo: string, unixTime: number, calendarIndex: number]));
//   };
//   // return
//   const modifiedSlots = slots.sort((a,b) => {return (a[4] as number) - (b[4] as number)});
//   console.log("modifiedSlots")
//   console.log(modifiedSlots)
//   const uniqueData: [title: string, type: string, eventIndex: number, dateInfo: string, unixTime: number, calendarIndex:number][] = Array.from(
//     modifiedSlots.reduce((map, item) => {
//       const key = `${item[0]}_${item[1]}`;
//       map.set(key, item);
//       return map;
//     }, new Map()).values()
//   ).sort((a,b) => a[4] - b[4]);

//   let startCount = 1;
//   let endCount = 1;

//   const updateUniqueData: [string, string, number, string, number, number, number][] = uniqueData.map( (row) => {
//     if(row[1] === "開始"){
//       startCount++;
//       return[...row, startCount] as [string, string, number, string, number, number, number];
//     } else if(row[1] === "終了"){
//       endCount ++;
//       return[...row, endCount] as [string, string, number, string, number, number, number];
//     } else {
//       return[...row, 0] as [string, string, number, string, number, number, number];
//     }
//   })
  
//   console.log("updateUniqueData");
//   console.log(updateUniqueData);
  
//   const gap: [slotstartdate: string, slotenddate: string, diff: number][] = [];
//   for( let i = 0; i < uniqueData.length - 1; i++){
//     const currentType = updateUniqueData[i][1];
//     const nextType = updateUniqueData[i+1][1];
//     const slotStart = updateUniqueData[i][3];
//     const slotEnd = updateUniqueData[i+1][3];
//     const currentEnd = updateUniqueData[i][4];
//     const nextStart = updateUniqueData[i+1][4];
//     const diff = nextStart - currentEnd; //UNIXTIMEの差分

//     // イベントタイトルが取得開始だったとき、次の予定の時刻と差分を計算
//     if(uniqueData[i][0] === "取得開始"){
//       if(diff === 0){
//         gap.push([slotStart.slice(0,-6),"終日空きがありません", diff])
//       }
//       gap.push([slotStart, slotEnd, diff/(60 * 60)])
//       continue;
//     } 
//     if(currentType === '終了' && nextType === '開始' && currentEnd < nextStart && updateUniqueData[i][6] === updateUniqueData[i+1][6]) {
//       if(diff === 0){
//         gap.push([slotStart.slice(0,-6),"終日空きがありません", diff])
//       }
//       gap.push([slotStart, slotEnd, diff/(60 *60)]);
//       continue;
//     }
//   }
//   return gap;
// }


// // 日付分複数カレンダーの空き枠を確認する関数
// function allDayFreeSlots(calendarId:Array<string>){
//   console.log("allDayFreeSlots関数を実行開始")
//   // 実施するのは開始日と終了日の差分
//   const dateDiff = (_endDay.unix - _startDay.unix) / (60 * 60 * 24);
//   const allDaySlots: [freeStart: string, freeEnd: string, duration:number][] = [];
//   for (let i = 0; i <= dateDiff; i++){
//     const targetDay = _startDay.day + i
//     const start = new Date(_startDay.year, _startDay.month, targetDay, parseInt(_startTime._hour), parseInt(_startTime._minute));
//     const end = new Date(_startDay.year, _startDay.month, targetDay, parseInt(_endTime._hour), parseInt(_endTime._minute));
//     console.log(`multiCalendarEventDiffの第一引数に渡すcalendars：`)
//     console.log(calendarId)
//     console.log("multiCalendarEventDiffの第二引数に渡すstart：");
//     console.log(start);
//     console.log("multiCalendarEventDiffの第三引数に渡すend：");
//     console.log(end);

//     const oneDaySlots = multiCalendarEventDiff(calendarId, start, end);  //単一日時での取得
//     allDaySlots.push(...oneDaySlots);
//   }

//   // console.log(allDaySlots)
//   return allDaySlots;
// }