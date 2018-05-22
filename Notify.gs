//その日の朝に通知
function NotifyOnDate() {
  
  var date = new Date();
  var day = date.getDay();
  
  var message = "本日";
  var flag = false; //該当するものがあるかどうか
  
  //ラジオのデータをDBから取得
  var radioTable = PropertiesService.getScriptProperties().getProperty("RadioTable");
  var getRadioQuery = "SELECT ActualHour,Minute,Name,ROWID FROM "+radioTable+" WHERE ActualDay="+day;
  var radiodata = FusionTables.Query.sqlGet(getRadioQuery).rows;
      
  if (!radiodata) return; //データが得られない場合
  
  for (var i = 0; i < radiodata.length; i++) {
    message = message + radiodata[i][0]+"時"+radiodata[i][1]+"分より「"+radiodata[i][2]+"」,";
  }
  
  message = message.substr(0, message.length-1) + "が放送されます";
  
  //通知するユーザのデータをDBから取得
  var userTable = PropertiesService.getScriptProperties().getProperty("UserTable");
  var getUsersQuery = 'SELECT UserID FROM ' + userTable;
  var userdata = FusionTables.Query.sqlGet(getUsersQuery).rows;
  
  //ツイート
  for (var i = 0; i < userdata.length; i++) {
    var target_user = '@'+userdata[i][0];
    var tweet = { "status" : target_user+"\n"+message };
    var res = Twitter.api("statuses/update", tweet);
    //Logger.log(res);
  }
}


//十分前に通知
function NotifyBefore10min() {
  
  var date = new Date();
  var day = date.getDay();
  var hour = date.getHours();
  var minute = date.getMinutes();
  
  var actualHour = hour<4 ? 24+hour : hour;
  var actualDay = hour<4 ? (7+(day-1))%7 : day;
  
  //API制限のため時間を絞る
  if (actualHour < 6) return;
    
  //ラジオのデータを取得
  var radioTable = PropertiesService.getScriptProperties().getProperty("RadioTable");
  var getRadioQuery = "SELECT Name,HasNotified,IsRegular,ROWID FROM "+radioTable+" WHERE ActualDay="+actualDay+" AND Time<="+(actualHour*60+minute+10);
  var radiodata = FusionTables.Query.sqlGet(getRadioQuery).rows;
  
  if (!radiodata) {
    Logger.log("放送直前のものはありません。");
    return;
  }
  
  var shouldNotify = false;
  var message = "まもなく";
  
  for (var i = 0; i < radiodata.length; i++) {
    if (radiodata[i][1]==0) {
      
      shouldNotify = true;
      var updateFlagQuery = "UPDATE "+radioTable+" SET HasNotified=1 WHERE ROWID=\'"+radiodata[i][3]+"\'";
      FusionTables.Query.sql(updateFlagQuery);
      
      message = message + "「"+radiodata[i][0]+"」,";
      
      //単発のやつを消す
      if (radiodata[i][2] == 0) {
        var deleteRadioQuery = 'DELETE FROM '+radioTable+' WHERE Name=\''+radiodata[i][0]+"\'";
        var res_del = FusionTables.Query.sql(deleteRadioQuery);
      }
    }
  }
  message = message.substr(0, message.length-1) + "が放送開始します";
  
  if (!shouldNotify) return;
  
  //ユーザのデータを取得
  var userTable = PropertiesService.getScriptProperties().getProperty("UserTable");
  var getUsersQuery = 'SELECT UserID FROM ' + userTable;
  var userdata = FusionTables.Query.sqlGet(getUsersQuery).rows;
  
  //ツイート
  for (var i = 0; i < userdata.length; i++) {
    var target_user = '@'+userdata[i][0];
    var tweet = { "status" : target_user+"\n"+message };
    var res = Twitter.api("statuses/update", tweet);
    //Logger.log(res);
  }
}

//通知済みフラグをリセット
function ResetFlag() {
  var radioTable = PropertiesService.getScriptProperties().getProperty("RadioTable");
  var getRadioQuery = "SELECT ROWID FROM "+radioTable;
  var rowIDs = FusionTables.Query.sql(getRadioQuery).rows;
  for (var i = 0; i < rowIDs.length; i++) {
    var updateFlagQuery = "UPDATE "+radioTable+" SET HasNotified=0 WHERE ROWID=\'"+rowIDs[i][0]+"\'";
    FusionTables.Query.sql(updateFlagQuery).rows;
  }
}
