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

        const userCache = CacheService.getUserCache();
        let cacheData = userCache.get(userId);
        let objectData; 

        if(!cacheData){
            const cacheDataDetail = {
                userID: userId,
                reservationStep:"",
                date:"",
                time:"",
                count:"",
                name:"",
                tel:"",
            }
            objectData = cacheDataDetail;
        } else {
            objectData = JSON.parse(cacheData);
        }

        // 日付選択に必要
        const dateInfoObject = getDateobject();


        // 初回メッセージ処理: "予約"を受け取った場合
        if (receivedMessage === "予約") {
            const dateInfoString = dateInfoObject.map((item) => `${item.num}：${item.date}`).join("\n");
            const messageBody = [
                {
                    "type": "text",
                    "text": `ご予約ですね、ご希望を承ります。\n\n質問が全部で5個ありますのでお答えください。`
                },
                {
                    "type": "text",
                    "text": `【質問①】\nまずはじめに次の日付から希望日を1~8の数字で教えてください。\n\n${dateInfoString}`
                },
            ];
            replyToLine(replyToken, messageBody);
            
            // キャッシュの更新処理
            objectData.reservationStep = "waitingDate";
            userCache.put(userId, JSON.stringify(objectData), 90)
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        } 

        // 日付選択
        if (objectData.reservationStep === "waitingDate") {
            if (receivedMessage.match(/^[1-7１-７]$/)) {
                let dateData = dateInfoObject[parseInt(receivedMessage)-1].date //入力された値から日付データをCacheに保存
                replyToLine(replyToken, [
                    { 
                        "type": "text", 
                        "text": `${dateData}ですね。かしこまりました。\n続いて空き時間を確認します。\n宜しければ　時間　と入力してください。\n最初からやり直す場合には改めて　予約　と入力してください。` 
                    },
                ]);
                objectData.date = dateData
                objectData.reservationStep = "checkTime"
                userCache.put(userId, JSON.stringify(objectData), 90);

            } else if(receivedMessage.match(/^[8８]$/)){
                // 翌週を希望した時

            } else{
                // 無効な入力を受け取った場合、最初からやり直し
                replyToLine(replyToken, [{ "type": "text", "text": `①${objectData.reservationStep}無効な入力です。\n半角数字で回答してください。\nあらためて予約ボタンをタップしてください。`}]);
                userCache.remove("user");
            }
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }

        // 時間選択
        const timeRegex = /(時間)|(じかん)|(jikan)|(dikan)|(zikan)/
        if(objectData.reservationStep === "checkTime"){
            if(receivedMessage.toString().match(timeRegex) ){

                const dateData = objectData.date;
                const timeOptionData = getTimeObject(dateData).map((item) => `${item.index}　${item.time}　空席：${item.slot}`).join("\n");
                
                replyToLine(replyToken, [
                    { 
                        "type": "text", 
                        "text": `【質問②】\n${dateData}の予約希望時間を以下の数字からお選びください\n${timeOptionData}\n\n回答は半角数字でお答えください。`
                    },
                ]);
                
                objectData.reservationStep = "waitingTime";
                userCache.put(userId, JSON.stringify(objectData), 90);
            } else {
                // 無効な入力を受け取った場合、最初からやり直し
                replyToLine(replyToken, [{ "type": "text", "text": `②${receivedMessage.toString().match(timeRegex)}、${objectData.date}、${objectData.reservationStep}無効な入力です。\n半角数字で回答してください。\nあらためて予約ボタンをタップしてください。`}]);
                userCache.remove("user");
            }
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }
        
        if(objectData.reservationStep === "waitingTime"){
            if (receivedMessage.match(/^[0-9０-９]{0,2}$/)) {
                const dateData = objectData.date;
                let timeData = getTimeObject(dateData)[parseInt(receivedMessage)-1].time;
                
                replyToLine(replyToken, [
                    { 
                        "type": "text", 
                        "text": `日付：${dateData}、時間：${timeData}ですね。\n続いて人数を確認します。\n宜しければ　人数　と入力してください。\n最初からやり直す場合には改めて　予約　と入力してください。` 
                    },
                ]);

                // キャッシュの更新
                objectData.reservationStep = "checkCount";
                objectData.time = timeData;
                objectData.maxSlot = getTimeObject(dateData)[parseInt(receivedMessage)-1].slot;
                userCache.put(userId, JSON.stringify(objectData), 90);
            } else {
                // 無効な入力を受け取った場合、最初からやり直し
                replyToLine(replyToken, [{ "type": "text", "text": `③${objectData.reservationStep}無効な入力です。\n半角数字で回答してください。\nあらためて予約ボタンをタップしてください。`}]);
                userCache.remove("user");

            }
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }

        const countRegex = /(人数)|(にんずう)|(ninzu)|(ニンズウ)/
        if(objectData.reservationStep === "checkCount"){
            if(receivedMessage.toString().match(countRegex)){
                const dateData = objectData.date;
                const timeData = objectData.time;
                const maxSlot = objectData.maxSlot;
                
                replyToLine(replyToken, [
                    { 
                        "type": "text", 
                        "text": `【質問③】\n${dateData}　${timeData}の予約希望人数を1〜${maxSlot}の間でお答えください。\n回答は半角数字でお答えください。`
                    },
                ]);
                
                objectData.reservationStep = "waitingCount";
                userCache.put(userId, JSON.stringify(objectData), 90);
            } else {
                // 無効な入力を受け取った場合、最初からやり直し
                replyToLine(replyToken, [{ "type": "text", "text": `無効な入力です。\n半角数字で回答してください。\nあらためて予約ボタンをタップしてください。`}]);
                userCache.remove("user");
            }
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }

        if(objectData.reservationStep === "waitingCount"){
            if (receivedMessage.match(/^[0-9０-９]{0,2}$/)) {
                const countData = receivedMessage;
                
                replyToLine(replyToken, [
                    { 
                        "type": "text", 
                        "text": `ご予約人数：${countData}名で承りました。\n\n【質問④】\n続いてご予約代表者のお名前をひらがなでお答えください。\n最初からやり直す場合には改めて　予約　と入力してください。`
                    },
                ]);
                
                objectData.reservationStep = "checkName";
                objectData.count = countData;
                userCache.put(userId, JSON.stringify(objectData), 90);
            } else {
                // 無効な入力を受け取った場合、最初からやり直し
                replyToLine(replyToken, [{ "type": "text", "text": `無効な入力です。\n半角数字で回答してください。\nあらためて予約ボタンをタップしてください。`}]);
                userCache.remove("user");
            }
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }

        const nameExcludeRegex = /(予約)|(よやく)|(yoyaku)|(ヨヤク)/
        if(objectData.reservationStep === "checkName"){
            if(!receivedMessage.toString().match(nameExcludeRegex)){
                
                const dateData = objectData.date;
                const timeData = objectData.time;
                const countData = objectData.count;
            
                const nameData = receivedMessage;

                replyToLine(replyToken, [
                    { 
                        "type": "text", 
                        "text": `${nameData}さまですね。\n\nここまでのご予約情報\n\n日時：${dateData}　${timeData}\nご予約人数：${countData}名\n代表者氏名：${nameData}\nとなります。\n問題なければ最後に連絡のつくお電話番号をご記入ください。\n電話番号はハイフンなしの半角数字でお答えください。`
                    },
                ]);

                objectData.name = nameData;
                objectData.reservationStep = "waitingTel";
                userCache.put(userId, JSON.stringify(objectData), 90);
            } else {
                // 無効な入力を受け取った場合、最初からやり直し
                replyToLine(replyToken, [{ "type": "text", "text": `無効な入力です。\n半角数字で回答してください。\nあらためて予約ボタンをタップしてください。`}]);
                userCache.remove("user");
            }
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }

        const telRegex = /^0\d{1,4}-?\d{1,4}-?\d{4}$/;
        if(objectData.reservationStep === "waitingTel"){
            if(receivedMessage.toString().match(telRegex)){
                const telData = receivedMessage;

                const dateData = objectData.date;
                const timeData = objectData.time;
                const countData = objectData.count;
                const nameData = objectData.name;

                replyToLine(replyToken, [
                    { 
                        "type": "text", 
                        "text": `ここまでのご予約を確認いたします。\n\n●ご予約日：${dateData}\n●ご予約時間：${timeData}\n●ご予約人数：${countData}\n●代表者名：${nameData}\n●代表者連絡先：${telData}\n\n問題なければご予約確定となります。よろしければ　確定　と入力ください。\n初めからやり直す場合には　予約　と入力ください。`
                    },
                ]);
                
                objectData.reservationStep = "submitReserve";
                objectData.tel = telData;
                userCache.put(userId, JSON.stringify(objectData), 90);
            } else {
                // 無効な入力を受け取った場合、最初からやり直し
                replyToLine(replyToken, [{ "type": "text", "text": `無効な入力です。\n半角数字で回答してください。\nあらためて予約ボタンをタップしてください。`}]);
                userCache.remove("user");
            }
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }

        if(objectData.reservationStep === "submitReserve"){
            if(receivedMessage === "確定"){
                const setData: string[] = [objectData.date, objectData.time, objectData.count, objectData.name, `'${objectData.tel}`];
                setReservationData(setData);

                replyToLine(replyToken, [
                    { 
                        "type": "text", 
                        "text": `ご予約が確定しました。当日のご利用をお待ちしております。急な変更等の場合にはお電話いただきますようお願いいたします。`
                    },
                ]);

            } else {
                // 無効な入力を受け取った場合、最初からやり直し
                replyToLine(replyToken, [{ "type": "text", "text": `無効な入力です。\n半角数字で回答してください。\nあらためて予約ボタンをタップしてください。`}]);
                userCache.remove("user");
            }
            return ContentService.createTextOutput(JSON.stringify({ status: "200" })).setMimeType(ContentService.MimeType.JSON);
        }
    } catch (error) {
        Logger.log("Error: " + error.toString());
        return ContentService.createTextOutput(JSON.stringify({ status: "500", error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

    
// 日付情報をまとめた文字列として返す関数
function getDateobject(): {num: number, date: string}[] {
    let today = new Date();
    
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


function getTimeObject(dateInfo: string): {index: number, time: string, slot: number}[]{
    // dateInfo = "1月27日";
    // 該当日の予約可能数を用意
    const targetDateAllSlots = getAllSlots(dateInfo);
    let allFree: {index: number, time:string, slot: number}[] = [];
    for( let i = 0; i < targetDateAllSlots.length; i ++){
        allFree.push({index: i + 1, time: targetDateAllSlots[i][0], slot: targetDateAllSlots[i][1]});
    }
    
    // 予約状況の全データを確認
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const listSheet = ss.getSheetByName(listSheetName);
    const listSheetLastRow = listSheet?.getRange(1,1).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
    if(!listSheetLastRow || listSheetLastRow === 0) return allFree;
    const listAllData = listSheet?.getRange(2,1,listSheetLastRow, 5).getDisplayValues();

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

    let outputData: {index: number, time: string, slot: number}[]= [];
    for( let i = 0; i < slots.length; i ++){
        outputData.push({index: i + 1, time: slots[i][0], slot: slots[i][1]});
    }
    return outputData
}

// 任意の日付の予約可能数リストを返す
function getAllSlots(dateInfo: string): [time: string, slots: number][] {    
    // dateInfo = "1月28日"
    // 予約可能最大数を取得
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const baseSheet = ss.getSheetByName(baseSheetName);
    if(!baseSheet){
        console.error(`${baseSheetName}が見つかりませんでした`);
        return [];
    }
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

// スプレッドシートに予約情報をセット
function setReservationData(data: string[]){
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    if(!spreadsheetId) return;
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const listSheet = ss.getSheetByName(listSheetName);

    if(!listSheet) return ;
    const lastRow: number = listSheet?.getLastRow() || listSheet?.getRange(1,1).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();

    listSheet?.getRange(lastRow + 1, 1, 1, 5).setValues([data]);
}