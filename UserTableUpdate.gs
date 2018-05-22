//twitterの時間は九時間遅れ

function RegisterUser() {
  
  //DBのuserTableを取得
  var userTable = PropertiesService.getScriptProperties().getProperty("UserTable");
  var getUserQuery = "SELECT UserID FROM "+userTable;
  var users = [];
  FusionTables.Query.sql(getUserQuery).rows.forEach(function(userid) {
    users.push(userid[0]);
  });
  
  //フィルターする基準のDate
  var date  = new Date();
  date.setHours(date.getHours()-24);
  
  //登録要求ツイートを取得して日時でフィルタリング
  var data = { "q" : "@iRis_radio_bot 登録", "result_type" : "recent" };
  var statuses = Twitter.api("search/tweets", data)["statuses"].filter(function(status) {
    var created_at = new Date(status["created_at"]);
    return created_at > this;
  }, date);
  
  //登録要求のあったユーザidをデータベースに格納してユーザに通知ツイートをする
  statuses.forEach(function(status) {
    var id = status["user"]["screen_name"]; 
    if (!contain(users, id)) {
      var registerUserQuery = "INSERT INTO "+userTable+" (UserID)VALUES(\'"+id+"\')";
      FusionTables.Query.sql(registerUserQuery);
      users.push(id);
      var tweet = { "status" : "@"+id+"\nこんにちわかい" };
      var res = Twitter.api("statuses/update", tweet);
    }
  });
  //*/
}


function DeleteUser() {
  
  var userTable = PropertiesService.getScriptProperties().getProperty("UserTable");
  var getUserQuery = "SELECT UserID FROM "+userTable;
  var users = [];
  FusionTables.Query.sql(getUserQuery).rows.forEach(function(userid) {
    users.push(userid[0]);
  });
  
  //フィルターする基準のDate
  var date  = new Date();
  date.setHours(date.getHours()-24);
  
  var data = { "q" : "@iRis_radio_bot 解除", "result_type" : "recent" };
  var statuses = Twitter.api("search/tweets", data)["statuses"].filter(function(status) {
    var created_at = new Date(status["created_at"]);
    return created_at > this;
  }, date);
  
  statuses.forEach(function(status) {
    var id = status["user"]["screen_name"];    
    if (contain(users, id)) {
      var deleteUserQuery = "DELETE FROM "+userTable+" WHERE UserID=\'"+id+"\'";
      try {
        if (FusionTables.Query.sql(deleteUserQuery)) {
          var tweet = { "status" : "@"+id+"\nお疲れさきさま" };
          var res = Twitter.api("statuses/update", tweet);
        }
      }
      catch(e) {}
    }
  });
 
}

//arrにelmが含まれているかどうか
function contain(arr, elm) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === elm) return true;
  }
  return false;
}
