const LINE_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty("LINE_ACCESS_TOKEN");
const LINE_ENDPOINT = 'https://api.line.me/v2/bot/message/reply';

function replyToLine(replyToken: string, messageBody: {}[]) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN
    };

    const requestBody = {
        replyToken: replyToken,
        messages: messageBody
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions= {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(requestBody)
    };

    UrlFetchApp.fetch(LINE_ENDPOINT, options);
}

function doPost(e) {
    try {
        const webhookEvents = JSON.parse(e.postData.contents);
        if (!webhookEvents.events || webhookEvents.events.length === 0) {
            return ContentService.createTextOutput(JSON.stringify({ status: "No events" })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const replyToken = webhookEvents.events[0].replyToken;
        const receivedMessage = webhookEvents.events[0].message.text;
        const userId = webhookEvents.events[0].source.userId;  // ユーザーIDの取得
        
        const cache = CacheService.getScriptCache();
        let userState = cache.get(userId);
        
        const dateInfoObject = getDateobject()
        const dateInfoString = dateInfoObject.map((item) => `${item.num}：${item.date}`).join("\n");

        // 予約データ
        let dateData = "";
        let timeData = "";
        let reserveCount = null;
        let reserveName = "";
        let reserveTEL = null;

        // 初回メッセージ処理: "予約"を受け取った場合
        if (receivedMessage === "予約" && !userState) {
            const messageBody = [
                {
                    "type": "text",
                    "text": "予約を開始します。質問が全部で⚫︎個ありますのでお答えください。\nまずはじめに次の日付から希望日を1~8の数字で教えてください。\n"
                },
                {
                    "type": "text",
                    "text": dateInfoString
                }
            ];
            replyToLine(replyToken, messageBody);
            
            // ユーザーの状態を"予約開始"にセット
            cache.put(userId, "waiting_for_date", 300);  // 5分間保持
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }

        // 状態が"waiting_for_date"のとき、日付の選択を待つ
        if (userState === "waiting_for_date") {
            if (receivedMessage.match(/^[1-8１-８]$/u)) {
                dateData = dateInfoObject[parseInt(receivedMessage)-1].date
                replyToLine(replyToken, [{ "type": "text", "text": `${dateData}ですね。空き時間を確認します。` }]);
                
                // 次のステップのために状態を更新
                cache.put(userId, "waiting_for_time", 300);
            } else {
                // 無効な入力を受け取った場合、最初からやり直し
                replyToLine(replyToken, [{ "type": "text", "text": "無効な入力です。\n1~8の数字で回答してください。\nあらためて予約ボタンをタップしてください。" }]);
                cache.remove(userId);  // 状態リセット
            }
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }

        if (userState === "waiting_for_time"){
            if (receivedMessage.match(/^[1-8１-８]$/u)) {
                timeData = dateInfoObject[parseInt(receivedMessage)-1].date
                replyToLine(replyToken, [{ "type": "text", "text": `${dateData}ですね。空き時間を確認します。` }]);
                
                // 次のステップのために状態を更新
                cache.put(userId, "waiting_for_time", 300);
            } else {
                // 無効な入力を受け取った場合、最初からやり直し
                replyToLine(replyToken, [{ "type": "text", "text": "無効な入力です。\n1~8の数字で回答してください。\nあらためて予約ボタンをタップしてください。" }]);
                cache.remove(userId);  // 状態リセット
            }
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }


        // 予約が完了していない場合、リセットメッセージを送信
        replyToLine(replyToken, [{ "type": "text", "text": "『予約』と送信して予約を開始してください。" }]);
        cache.remove(userId);

        return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        Logger.log("Error: " + error.toString());
        return ContentService.createTextOutput(JSON.stringify({ status: "500", error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

    
// 日付情報をまとめた文字列として返す関数
function getDateobject(): {num: number, date: string}[] {
    const today = new Date();
    const dateSelections: {num: number, date: string}[] = [];

    // 今日から7日分の日付を生成
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i+1);

        // 日付を「1月31日」の形式にフォーマット
        const formattedDate = `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
        dateSelections.push({num: i + 1, date: `${formattedDate}`});
    }

    // 「翌週から選ぶ」のオプションを追加
    dateSelections.push({num: 8, date: "翌週から選ぶ"});

    // すべての選択肢を改行で連結
    return dateSelections
}


function getTimeObject(dateInfo: string): [index: string, time: string, slot: number][] | Response{
    dateInfo = "1月27日";
    
    // 予約状況の全データを確認
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const listSheet = ss.getSheetByName(listSheetName);
    const listSheetLastRow = listSheet?.getRange(1,1).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
    if(!listSheetLastRow || listSheetLastRow === 0) return new Response("どの時間でも空いています")
    const listAllData = listSheet?.getRange(2,1,listSheetLastRow, 5).getDisplayValues();

    // 該当日の予約可能数を用意
    const targetDateAllSlots = getAllSlots(dateInfo);
    // 予約リストの中で、該当日に絞ったデータ
    const filterdListData: [string, string, number, string, string][] = listAllData?.filter((item) => item[0].match(dateInfo)) as [string, string, number, string, string][];
    console.log("filterdListData");
    console.log(filterdListData);

    let reservedCounts = {};
    filterdListData.forEach( (reservation) => {
        const time = reservation[1];
        const reservedSeats = reservation[2].toString();
        if(reservedCounts[time]){
            reservedCounts[time] += parseInt(reservedSeats);
        } else {
            reservedCounts[time] = parseInt(reservedSeats)
        }
    });

    // 時間ごとの空き枠slots
    let slots: [time:string, seats: number][] = targetDateAllSlots.map((slot) => {
        const time = slot[0];
        const maxCapacity = slot[1];

        const bookedseats = reservedCounts[time] || 0;
        const remainingSeats = maxCapacity - bookedseats;
        return [time, remainingSeats]
    })

    let outputData: [label: string, time: string, slot: number][]= [];
    for( let i = 0; i < slots.length; i ++){
        outputData.push([`${i + 1}：`, slots[i][0], slots[i][1]]);
    }

    if(!outputData || outputData.length < 1) return new Response("この日に空き時間はありません。再度予約からやり直してください");
    return outputData
}

// 任意の日付の予約可能数リストを返す
function getAllSlots(dateInfo: string): [time: string, slots: number][] {
    dateInfo = "1月27日"
    
    // 予約可能最大数を取得
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const baseSheet = ss.getSheetByName(baseSheetName);
    const maxSlots = baseSheet?.getRange(13,3).getValue() as number;

    // 営業開始時間、終了時間、休憩開始時間、終了時間を取得する
    const startTimeCell: string = `${baseSheet?.getRange(6,3).getValue()}:${baseSheet?.getRange(6,6).getValue()}`;
    const endTimeCell: string = `${baseSheet?.getRange(7,3).getValue()}:${baseSheet?.getRange(7,6).getValue()}`;
    const intervalCell: number = baseSheet?.getRange(15,3).getValue();   // 例: 30（数値）

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

    // 除外する休憩時間
    const excludeStart = `${baseSheet?.getRange(8,3).getValue()}:${baseSheet?.getRange(8,6).getValue()}`;
    const excludeEnd = `${baseSheet?.getRange(9,3).getValue()}:${baseSheet?.getRange(9,6).getValue()}`;
    // 営業時間を分単位で計算
    const diff = (endTimeUnix - startTimeUnix ) / 60;

      // 時間間隔に応じて予約枠を出力
    const steps = diff / intervalCell;  //繰り返す回数
    const reserveSlots: [time: string, slots: number][] = [];
    for (let i = 0; i < steps; i++) {
        let newHours = startHours + Math.floor(intervalCell * i / 60);
        let newMinutes = startMinutes + Math.floor(intervalCell * i % 60);
        // 時刻を "hh:mm" 形式に整える（ゼロ埋め）
        let formattedTime = ('0' + newHours).slice(-2) + ":" + ('0' + newMinutes).slice(-2);
        reserveSlots.push([formattedTime, maxSlots]);
    }

    const filterdSlots = reserveSlots.filter((time) => time[0] < excludeStart || time[0] >= excludeEnd)

    console.log(filterdSlots);
    return filterdSlots;
}