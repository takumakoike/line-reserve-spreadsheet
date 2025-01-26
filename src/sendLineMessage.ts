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


function getTimeObject(dateInfo: string): {time: string, slot: string}[] | Response{
    dateInfo = "1月27日";
    
    // 予約状況の全データを確認
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const listSheet = ss.getSheetByName(listSheetName);
    const listSheetLastRow = listSheet?.getRange(1,1).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
    if(!listSheetLastRow || listSheetLastRow === 0) return new Response("どの時間でも空いています")
    const listAllData = listSheet?.getRange(2,1,listSheetLastRow, 5).getDisplayValues();

    // 該当日の予約可能数を用意
    const baseSheet = ss.getSheetByName(baseSheetName);
    const shopOpen = getTimeData() as{
        shopStart: {hours: string, minutes: string},
        shopEnd: {hours: string, minutes: string},
    };



    let slots = baseSheet?.getRange(13,3).getValue() as number;






console.log(slots);
const dateFilterdData: number[]= listAllData?.filter((item) => item[0].match(dateInfo)) ? listAllData?.filter((item) => item[0].match(dateInfo)): [];
console.log(dateFilterdData);
for( let i = 0; i < dateFilterdData?.length; i++){
    console.log(dateFilterdData[i][2])

    slots -= dateFilterdData[i][2]
}
console.log(slots);



    const timeObject: {time: string, slot: string}[] = [];

    if(!timeObject || timeObject.length < 1) return new Response("この日に空き時間はありません。再度予約からやり直してください");

    
    return timeObject
}






// 任意の日付の予約可能数リストを返す