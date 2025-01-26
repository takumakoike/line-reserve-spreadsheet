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

        if(receivedMessage === "予約"){
            const dateInfoObject = dateInformation();   //今日から一週間
            
            const messageBody = [
                {
                    "type": "text",
                    "text": "予約を開始します。次の日付から希望日を1~8の数字で教えてください。\n"
                },
                {
                    "type": "text",
                    "text": dateInfoObject
                }
            ];
            replyToLine(replyToken, messageBody);
        }

        
        return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        Logger.log("Error: " + error.toString());
        return ContentService.createTextOutput(JSON.stringify({ status: "500", error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// 日付情報を配列で返す関数
function dateInformation(): { num: number; date: string }[] {
    const today = new Date();
    const dateObject: { num: number; date: string }[] = [];

    // 今日から7日分の日付を生成
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);

        // 日付を「1月31日」の形式にフォーマット
        const formattedDate = `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;

        dateObject.push({
            num: i + 1,
            date: formattedDate
        });
    }

    // 「翌週から選ぶ」のオプションを追加
    dateObject.push({
        num: 8,
        date: "翌週から選ぶ"
    });

    return dateObject;
}

// 関数の実行例
const dates = dateInformation();
dates.forEach(item => {
    console.log(`${item.num}. ${item.date}`);
});
